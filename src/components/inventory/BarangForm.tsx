'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { barangSchema } from '@/lib/validations'
import type { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { BarangLengkap, Grade } from '@/types'
import { toast } from 'sonner'


interface Props {
  item: BarangLengkap | null
  kategoriList: any[]
  gradeList: Grade[]
  onClose: () => void
  onSuccess: () => void
}

export default function BarangForm({ item, kategoriList, gradeList, onClose, onSuccess }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [availableGrades, setAvailableGrades] = useState<Grade[]>(gradeList)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    } = useForm<
      z.input<typeof barangSchema>,
      unknown,
      z.output<typeof barangSchema>
    >({
      resolver: zodResolver(barangSchema),
    defaultValues: {
      kode: item?.kode || '',
      nama: item?.nama || '',
      merk: item?.merk || '',
      kategori_id: item?.kategori_id || '',
      grade_id: item?.grade_id || '',
      harga_jual: item?.harga_jual || 0,
      stok: item?.stok || 0,
      stok_min: item?.stok_min || 0,
      deskripsi: item?.deskripsi || '',
    }
  })

  const watchKategori = watch('kategori_id')

  // Filter grade berdasarkan kategori yang dipilih
  useEffect(() => {
    if (!watchKategori) {
      setAvailableGrades(gradeList)
      return
    }
    const kat = kategoriList.find(k => k.id === watchKategori)
    if (kat?.grades && kat.grades.length > 0) {
      const grades = kat.grades.map((kg: any) => kg.grade).filter(Boolean)
      setAvailableGrades(grades)
      // Reset grade jika tidak tersedia di kategori baru
      const current = watch('grade_id')
      if (current && !grades.find((g: Grade) => g.id === current)) {
        setValue('grade_id', '')
      }
    } else {
      setAvailableGrades(gradeList)
    }
  }, [watchKategori, kategoriList, gradeList, setValue, watch])

  const onSubmit = async (
    values: z.output<typeof barangSchema>
  ) => {
    setLoading(true)
    try {
      const payload = {
        ...values,
        kategori_id: values.kategori_id || null,
        grade_id: values.grade_id || null,
      }

      if (item) {
        const { error } = await supabase.from('barang').update(payload).eq('id', item.id)
        if (error) throw error
        toast.success('Berhasil', { description: 'Barang diperbarui.' })
      } else {
        const { error } = await supabase.from('barang').insert(payload)
        if (error) throw error
        toast.success('Berhasil', { description: 'Barang ditambahkan.' })
      }

      onSuccess()
      } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : 'Terjadi kesalahan'

      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {item ? 'Edit Barang' : 'Tambah Barang'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Kode */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Kode Barang *</label>
            <input {...register('kode')}
              placeholder="misal: LCD-IP6-ORI"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 font-mono"
            />
            {errors.kode && <p className="text-xs text-red-500 mt-1">{errors.kode.message}</p>}
          </div>

          {/* Nama */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nama Barang *</label>
            <input {...register('nama')}
              placeholder="misal: LCD iPhone 6"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama.message}</p>}
          </div>

          {/* Merk */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Merk</label>
            <input {...register('merk')}
              placeholder="misal: iPhone / Aftermarket"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* Kategori & Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Kategori</label>
              <select {...register('kategori_id')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              >
                <option value="">— Pilih —</option>
                {kategoriList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Grade</label>
              <select {...register('grade_id')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              >
                <option value="">— Pilih —</option>
                {availableGrades.map(g => (
                  <option key={g.id} value={g.id}>{g.nama} ({g.garansi_hari}h)</option>
                ))}
              </select>
              {errors.grade_id && <p className="text-xs text-red-500 mt-1">{errors.grade_id.message}</p>}
            </div>
          </div>

          {/* Harga */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Harga Jual *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
              <input {...register('harga_jual')} type="number" min="0"
                className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            {errors.harga_jual && <p className="text-xs text-red-500 mt-1">{errors.harga_jual.message}</p>}
          </div>

          {/* Stok */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stok Saat Ini</label>
              <input {...register('stok')} type="number" min="0" step="0.001"
                disabled={!!item}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-50 disabled:text-gray-400"
              />
              {item && <p className="text-xs text-gray-400 mt-1">Ubah stok via Stok Masuk/Keluar</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stok Minimum</label>
              <input {...register('stok_min')} type="number" min="0" step="0.001"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea {...register('deskripsi')} rows={2}
              placeholder="Catatan tambahan..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {item ? 'Simpan Perubahan' : 'Tambah Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}