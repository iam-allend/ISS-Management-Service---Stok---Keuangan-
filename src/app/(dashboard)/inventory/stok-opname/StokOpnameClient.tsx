"use client";

import { useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, RefreshCw, X, ClipboardCheck } from "lucide-react";
import { formatDate, todayISO, cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  initialData: any[];
  barangList: any[];
  canEdit: boolean;
  userId: string;
  userName: string;
}

export default function StokOpnameClient({ initialData, barangList, canEdit, userId, userName }: Props) {
  const supabase = createClient();

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [tanggal, setTanggal] = useState(todayISO());
  const [selectedBarang, setSelectedBarang] = useState<any>(null);
  const [barangSearch, setBarangSearch] = useState("");
  const [stokFisik, setStokFisik] = useState<number | "">("");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      data.filter((item) => {
        const q = search.toLowerCase();
        return !q || item.barang?.nama?.toLowerCase().includes(q) || item.barang?.kode?.toLowerCase().includes(q);
      }),
    [data, search],
  );

  const filteredBarang = barangList
    .filter((b) => {
      const q = barangSearch.toLowerCase();
      return !q || b.nama.toLowerCase().includes(q) || b.kode.toLowerCase().includes(q);
    })
    .slice(0, 8);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: fresh } = await supabase.from("stok_opname").select("*, barang:barang_id(kode, nama, stok, kategori:kategori_id(nama)), petugas:petugas_id(nama, kode_teknisi)").order("created_at", { ascending: false }).limit(200);
    if (fresh) setData(fresh);
    setLoading(false);
  }, [supabase]);

  const handleSimpan = async () => {
    if (!selectedBarang || stokFisik === "") {
      toast.error("Lengkapi data", { description: "Pilih barang dan masukkan stok fisik" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("stok_opname").insert({
        tanggal,
        barang_id: selectedBarang.id,
        stok_sistem: selectedBarang.stok,
        stok_fisik: Number(stokFisik),
        keterangan,
        petugas_id: userId,
      });
      if (error) throw error;

      // Update stok barang sesuai stok fisik
      await supabase
        .from("barang")
        .update({ stok: Number(stokFisik) })
        .eq("id", selectedBarang.id);

      toast.success("Stok opname disimpan", { description: `Stok ${selectedBarang.nama} diperbarui ke ${stokFisik}` });
      setShowForm(false);
      setSelectedBarang(null);
      setStokFisik("");
      setKeterangan("");
      refresh();
    } catch (e: any) {
      toast.error("Gagal", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Stok Opname</h1>
          <p className="text-sm text-gray-500">{data.length} catatan opname</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition">
            <Plus className="w-4 h-4" /> Tambah Opname
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari barang..." className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </div>
        <button onClick={refresh} disabled={loading} className="text-gray-400 hover:text-gray-600">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Barang</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stok Sistem</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stok Fisik</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Selisih</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Petugas</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                    Tidak ada data opname
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDate(item.tanggal)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.barang?.nama}</p>
                      <p className="text-xs text-gray-400">{item.barang?.kode}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.stok_sistem}</td>
                    <td className="px-4 py-3 text-center font-medium text-gray-500">{item.stok_fisik}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("font-bold px-2 py-0.5 rounded-md text-xs", item.selisih > 0 ? "bg-green-100 text-green-700" : item.selisih < 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500")}>
                        {item.selisih > 0 ? "+" : ""}
                        {item.selisih}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{item.petugas?.nama || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{item.keterangan || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Stok Opname</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-700" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pilih Barang *</label>
                {selectedBarang ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{selectedBarang.nama}</p>
                      <p className="text-xs text-gray-500">
                        Stok sistem saat ini: <strong>{selectedBarang.stok}</strong>
                      </p>
                    </div>
                    <button type="button" onClick={() => setSelectedBarang(null)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={barangSearch}
                        onChange={(e) => setBarangSearch(e.target.value)}
                        placeholder="Cari barang..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-700"
                      />
                    </div>
                    {barangSearch && (
                      <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                        {filteredBarang.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBarang(b);
                              setBarangSearch("");
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                          >
                            <p className=" text-gray-600">{b.nama}</p>
                            <p className="text-xs text-gray-400">
                              {b.kode} · Stok: {b.stok}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedBarang && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stok Fisik (hasil hitung fisik) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={stokFisik}
                    onChange={(e) => setStokFisik(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-600"
                    placeholder="0"
                  />
                  {stokFisik !== "" && (
                    <p className={cn("text-xs mt-1", Number(stokFisik) - selectedBarang.stok > 0 ? "text-green-600" : Number(stokFisik) - selectedBarang.stok < 0 ? "text-red-600" : "text-gray-400")}>
                      Selisih: {Number(stokFisik) - selectedBarang.stok > 0 ? "+" : ""}
                      {Number(stokFisik) - selectedBarang.stok}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none text-gray-800"
                  placeholder="Alasan selisih, catatan opname..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-400 text-sm hover:bg-gray-80 text-gray-700 fontweight-medium">
                  Batal
                </button>
                <button onClick={handleSimpan} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Simpan Opname
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
