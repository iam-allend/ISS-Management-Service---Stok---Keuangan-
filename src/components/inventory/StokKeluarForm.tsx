// src/components/inventory/StokKeluarForm.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, Search } from "lucide-react";
import { todayISO } from "@/lib/utils";
import { toast } from "sonner";
interface Props {
  barangList: any[];
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StokKeluarForm({ barangList, userId, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [barangSearch, setBarangSearch] = useState("");
  const [selectedBarang, setSelectedBarang] = useState<any>(null);
  const [tanggal, setTanggal] = useState(todayISO());
  const [jumlah, setJumlah] = useState(1);
  const [keterangan, setKeterangan] = useState("");

  const filteredBarang = barangList
    .filter((b) => {
      const q = barangSearch.toLowerCase();
      return !q || b.nama.toLowerCase().includes(q) || b.kode.toLowerCase().includes(q);
    })
    .slice(0, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarang) {
      toast.error("Pilih barang");
      return;
    }
    if (jumlah <= 0) {
      toast.error("Jumlah harus > 0");
      return;
    }
    if (selectedBarang.stok < jumlah) {
      toast.error("Stok tidak cukup", { description: `Stok tersedia: ${selectedBarang.stok}` });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("stok_keluar").insert({
        barang_id: selectedBarang.id,
        tanggal,
        jumlah,
        keterangan,
        created_by: userId,
      });
      if (error) throw error;
      toast.success("Berhasil", { description: "Stok keluar dicatat." });
      onSuccess();
    } catch (e: any) {
      toast.error("Gagal", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Tambah Stok Keluar</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Barang *</label>
            {selectedBarang ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{selectedBarang.nama}</p>
                  <p className="text-xs text-gray-500">
                    Stok tersedia: <strong>{selectedBarang.stok}</strong>
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
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500"
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
                        <p className="text-sm font-medium text-gray-500">{b.nama}</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal *</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Jumlah *</label>
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={2}
              placeholder="Tujuan pengeluaran stok..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none text-gray-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm hover:bg-gray-50 text-gray-500">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
