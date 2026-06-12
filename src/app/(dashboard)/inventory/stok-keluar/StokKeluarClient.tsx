// src/app/(dashboard)/inventory/stok-keluar/StokKeluarClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, RefreshCw, Trash2, X, Link2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import StokKeluarForm from "@/components/inventory/StokKeluarForm";
import { toast } from "sonner";

interface Props {
  initialData: any[];
  barangList: any[];
  canEdit: boolean;
  userId: string;
}

export default function StokKeluarClient({ initialData, barangList, canEdit, userId }: Props) {
  const supabase = createClient();

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterDateDari, setFilterDateDari] = useState("");
  const [filterDateSampai, setFilterDateSampai] = useState("");

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const q = search.toLowerCase();
      if (q && !item.barang?.nama?.toLowerCase().includes(q) && !item.barang?.kode?.toLowerCase().includes(q) && !item.keterangan?.toLowerCase().includes(q)) return false;
      if (filterDateDari && item.tanggal < filterDateDari) return false;
      if (filterDateSampai && item.tanggal > filterDateSampai) return false;
      return true;
    });
  }, [data, search, filterDateDari, filterDateSampai]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: fresh } = await supabase
      .from("stok_keluar")
      .select("*, barang:barang_id(kode, nama, stok, kategori:kategori_id(nama)), item_service:item_service_id(nota:nota_id(no_nota))")
      .order("created_at", { ascending: false })
      .limit(300);
    if (fresh) setData(fresh);
    setLoading(false);
  }, [supabase]);

  const handleDelete = async (id: string) => {
    const item = data.find((d) => d.id === id);
    if (item?.item_service_id) {
      toast.error("Tidak bisa dihapus", { description: "Stok keluar ini terhubung ke data service." });
      setDeleteConfirm(null);
      return;
    }
    const { error } = await supabase.from("stok_keluar").delete().eq("id", id);
    if (error) {
      toast.error("Gagal", { description: error.message });
      return;
    }
    toast.success("Berhasil", { description: "Data stok keluar dihapus." });
    setDeleteConfirm(null);
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Stok Keluar</h1>
          <p className="text-sm text-gray-500">{filtered.length} transaksi</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition">
            <Plus className="w-4 h-4" /> Tambah Keluar
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari barang, keterangan..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500"
          />
        </div>
        <input type="date" value={filterDateDari} onChange={(e) => setFilterDateDari(e.target.value)} className="px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none text-gray-500" />
        <span className="text-xs text-gray-400">s/d</span>
        <input type="date" value={filterDateSampai} onChange={(e) => setFilterDateSampai(e.target.value)} className="px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none text-gray-500" />
        {(search || filterDateDari || filterDateSampai) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterDateDari("");
              setFilterDateSampai("");
            }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" /> Reset
          </button>
        )}
        <button onClick={refresh} disabled={loading} className="ml-auto text-gray-400 hover:text-gray-600">
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
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ref Service</th>
                {canEdit && <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="text-center py-10 text-gray-400 text-sm">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(item.tanggal)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.barang?.nama}</p>
                      <p className="text-xs text-gray-400">{item.barang?.kode}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md">-{item.jumlah}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[150px]">{item.keterangan || "—"}</td>
                    <td className="px-4 py-3">
                      {item.item_service?.nota?.no_nota ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Link2 className="w-3 h-3" />
                          {item.item_service.nota.no_nota}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          disabled={!!item.item_service_id}
                          title={item.item_service_id ? "Terhubung ke service, tidak bisa dihapus manual" : "Hapus"}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <StokKeluarForm
          barangList={barangList}
          userId={userId}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-2">Hapus data stok keluar?</h3>
            <p className="text-sm text-gray-500 mb-5">Stok barang akan dikembalikan secara otomatis.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteConfirm!)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
