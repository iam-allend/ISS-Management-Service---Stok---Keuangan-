"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit2, Trash2, X, Loader2, Tag, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Grade {
  id: string;
  nama: string;
  garansi_hari: number;
}

interface KategoriItem {
  id: string;
  nama: string;
  deskripsi: string | null;
  aktif: boolean;
  grades: Grade[];
}

interface Props {
  initialData: KategoriItem[];
  gradeList: Grade[];
}

export default function KategoriClient({ initialData, gradeList }: Props) {
  const supabase = createClient();

  const [data, setData] = useState<KategoriItem[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<KategoriItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Form state
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  // ─── REFRESH ────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: fresh } = await supabase.from("kategori").select("*, kategori_grade(grade:grade_id(id, nama, garansi_hari))").order("nama");
    if (fresh) {
      setData(
        fresh.map((k: any) => ({
          ...k,
          grades: (k.kategori_grade || []).map((kg: any) => kg.grade).filter(Boolean),
        })),
      );
    }
    setLoading(false);
  }, [supabase]);

  // ─── OPEN FORM ──────────────────────────────────────────
  const openForm = (item?: KategoriItem) => {
    if (item) {
      setEditItem(item);
      setNama(item.nama);
      setDeskripsi(item.deskripsi || "");
      setSelectedGrades(item.grades.map((g) => g.id));
    } else {
      setEditItem(null);
      setNama("");
      setDeskripsi("");
      setSelectedGrades([]);
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
    setNama("");
    setDeskripsi("");
    setSelectedGrades([]);
  };

  // ─── TOGGLE GRADE ───────────────────────────────────────
  const toggleGrade = (id: string) => {
    setSelectedGrades((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  // ─── SAVE ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!nama.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }
    if (selectedGrades.length === 0) {
      toast.error("Pilih minimal 1 grade");
      return;
    }

    setSaving(true);
    try {
      let kategoriId: string;

      if (editItem) {
        // UPDATE
        const { error } = await supabase
          .from("kategori")
          .update({ nama: nama.trim(), deskripsi: deskripsi.trim() || null })
          .eq("id", editItem.id);
        if (error) throw error;
        kategoriId = editItem.id;

        // Hapus relasi lama
        const { error: delErr } = await supabase.from("kategori_grade").delete().eq("kategori_id", kategoriId);
        if (delErr) throw delErr;
      } else {
        // INSERT
        const { data: inserted, error } = await supabase
          .from("kategori")
          .insert({ nama: nama.trim(), deskripsi: deskripsi.trim() || null })
          .select()
          .single();
        if (error) throw error;
        kategoriId = inserted.id;
      }

      // Insert relasi grade baru
      const rels = selectedGrades.map((gradeId) => ({
        kategori_id: kategoriId,
        grade_id: gradeId,
      }));
      const { error: relErr } = await supabase.from("kategori_grade").insert(rels);
      if (relErr) throw relErr;

      toast.success(editItem ? "Kategori diperbarui" : "Kategori ditambahkan");
      closeForm();
      refresh();
    } catch (e: any) {
      toast.error("Gagal menyimpan", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── DELETE ─────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      // Cek apakah masih dipakai barang
      const { count } = await supabase.from("barang").select("id", { count: "exact", head: true }).eq("kategori_id", id);

      if ((count ?? 0) > 0) {
        toast.error("Tidak bisa dihapus", {
          description: `Kategori masih digunakan oleh ${count} barang.`,
        });
        setDeleteConfirm(null);
        setDeleting(false);
        return;
      }

      const { error } = await supabase.from("kategori").delete().eq("id", id);
      if (error) throw error;

      toast.success("Kategori dihapus");
      refresh();
    } catch (e: any) {
      toast.error("Gagal menghapus", { description: e.message });
    } finally {
      setDeleteConfirm(null);
      setDeleting(false);
    }
  };

  // ─── HELPERS ────────────────────────────────────────────
  const garansiLabel = (hari: number) => {
    if (hari < 30) return `${hari} hari`;
    if (hari < 365) return `${Math.round(hari / 30)} bln`;
    return `${(hari / 365).toFixed(1)} thn`;
  };

  const filtered = data.filter((k) => !search || k.nama.toLowerCase().includes(search.toLowerCase()));

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola Kategori</h1>
          <p className="text-sm text-gray-500">
            {data.length} kategori · {gradeList.length} grade tersedia
          </p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition">
          <Plus className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      {/* ── Search + Refresh ── */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kategori..." className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </div>
        <button onClick={refresh} disabled={loading} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* ── Grid Kategori ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Tag className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-400">{search ? "Kategori tidak ditemukan" : "Belum ada kategori. Tambah sekarang."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition">
              {/* card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.nama}</h3>
                  {item.deskripsi && <p className="text-xs text-gray-400 mt-0.5 truncate">{item.deskripsi}</p>}
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <button onClick={() => openForm(item)} title="Edit kategori" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(item.id)} title="Hapus kategori" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* grade badges */}
              <div className="flex flex-wrap gap-1.5">
                {item.grades.length > 0 ? (
                  item.grades.map((g) => (
                    <span key={g.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      <Tag className="w-2.5 h-2.5" />
                      {g.nama}
                      <span className="text-blue-400">({garansiLabel(g.garansi_hari)})</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-300 italic">Belum ada grade</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════
          FORM MODAL
      ════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editItem ? "Edit Kategori" : "Tambah Kategori"}</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="misal: LCD, Baterai, Kamera"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  rows={2}
                  placeholder="Keterangan tambahan (opsional)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                />
              </div>

              {/* Grade Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Grade yang tersedia untuk kategori ini <span className="text-red-500">*</span>
                </label>

                {gradeList.length === 0 ? (
                  <div className="text-sm text-orange-600 bg-orange-50 rounded-lg p-3">Belum ada grade terdaftar. Tambah grade dulu di halaman Kelola Grade.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {gradeList.map((g) => {
                      const checked = selectedGrades.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleGrade(g.id)}
                          className={cn("flex items-center gap-3 p-3 rounded-xl border text-left transition", checked ? "bg-blue-50 border-blue-300 text-blue-900" : "border-gray-200 text-gray-600 hover:bg-gray-50")}
                        >
                          {/* checkbox visual */}
                          <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", checked ? "bg-blue-600 border-blue-600" : "border-gray-300")}>
                            {checked && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">{g.nama}</p>
                            <p className="text-xs opacity-60 mt-0.5">
                              Garansi {g.garansi_hari} hari ({garansiLabel(g.garansi_hari)})
                            </p>
                          </div>

                          {checked && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium shrink-0">Dipilih</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedGrades.length > 0 && <p className="text-xs text-blue-600 mt-2">{selectedGrades.length} grade dipilih</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 transition">
                  Batal
                </button>
                <button type="button" onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editItem ? "Simpan Perubahan" : "Tambah Kategori"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          DELETE CONFIRM
      ════════════════════════════════════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-2">Hapus Kategori?</h3>
            <p className="text-sm text-gray-500 mb-5">Kategori yang masih digunakan barang tidak bisa dihapus. Relasi dengan grade akan ikut terhapus.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition disabled:opacity-50">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
