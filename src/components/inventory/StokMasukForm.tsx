"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { stokMasukSchema } from "@/lib/validations";
import type { z } from "zod";
type StokMasukSchema = z.infer<typeof stokMasukSchema>;

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import { todayISO, formatRupiah } from "@/lib/utils";
import { toast } from "sonner";
interface Props {
  item: any | null;
  barangList: any[];
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StokMasukForm({ item, barangList, userId, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [barangSearch, setBarangSearch] = useState("");
  const [selectedBarang, setSelectedBarang] = useState<any>(item ? barangList.find((b) => b.id === item.barang_id) || null : null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof stokMasukSchema>, unknown, z.output<typeof stokMasukSchema>>({
    resolver: zodResolver(stokMasukSchema),
    defaultValues: {
      barang_id: item?.barang_id || "",
      tanggal: item?.tanggal || todayISO(),
      jumlah: item?.jumlah || 1,
      harga_beli: item?.harga_beli || 0,
      supplier: item?.supplier || "",
      keterangan: item?.keterangan || "",
    },
  });

  const filteredBarang = barangList
    .filter((b) => {
      const q = barangSearch.toLowerCase();
      return !q || b.nama.toLowerCase().includes(q) || b.kode.toLowerCase().includes(q);
    })
    .slice(0, 8);

  const onSubmit = async (values: StokMasukSchema) => {
    setLoading(true);
    try {
      if (item) {
        const { error } = await supabase
          .from("stok_masuk")
          .update({ ...values, created_by: userId })
          .eq("id", item.id);
        if (error) throw error;
        toast.success("Berhasil", { description: "Data diperbarui." });
      } else {
        const { error } = await supabase.from("stok_masuk").insert({ ...values, created_by: userId });
        if (error) throw error;
        toast.success("Berhasil", { description: "Stok masuk dicatat." });
      }
      onSuccess();
    } catch (e: any) {
      toast.error("Gagal", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{item ? "Edit Stok Masuk" : "Tambah Stok Masuk"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Pilih Barang */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Barang *</label>
            {selectedBarang ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{selectedBarang.nama}</p>
                  <p className="text-xs text-gray-500">
                    {selectedBarang.kode} · Stok: {selectedBarang.stok}
                  </p>
                </div>
                {!item && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBarang(null);
                      setValue("barang_id", "");
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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
                          setValue("barang_id", b.id);
                          setBarangSearch("");
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition text-gray-500"
                      >
                        <p className="text-sm font-medium text-gray-800">{b.nama}</p>
                        <p className="text-xs text-gray-400">
                          {b.kode} · {b.kategori_nama} · Stok: {b.stok}
                        </p>
                      </button>
                    ))}
                    {filteredBarang.length === 0 && <p className="text-center text-sm text-gray-400 py-3">Tidak ditemukan</p>}
                  </div>
                )}
              </div>
            )}
            {errors.barang_id && <p className="text-xs text-red-500 mt-1">{errors.barang_id.message}</p>}
          </div>

          {/* Tanggal & Jumlah */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal *</label>
              <input {...register("tanggal")} type="date" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Jumlah *</label>
              <input {...register("jumlah")} type="number" min="0.001" step="1" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500" />
              {errors.jumlah && <p className="text-xs text-red-500 mt-1">{errors.jumlah.message}</p>}
            </div>
          </div>

          {/* Harga Beli & Supplier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Harga Beli</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                <input {...register("harga_beli")} type="number" min="0" className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
              <input {...register("supplier")} placeholder="Nama supplier" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-500" />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea
              {...register("keterangan")}
              rows={2}
              placeholder="Catatan tambahan..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none text-gray-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm hover:bg-gray-50 transition text-gray-500">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {item ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
