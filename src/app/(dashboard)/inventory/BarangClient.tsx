'use client'

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Search, Filter, Edit2, Trash2, Package,
  AlertTriangle, Upload, RefreshCw, X
} from 'lucide-react'
import { formatRupiah, cn } from '@/lib/utils'
import type { BarangLengkap, Kategori, Grade } from '@/types'
import BarangForm from '@/components/inventory/BarangForm'
import ImportBarangModal from '@/components/inventory/ImportBarangModal'
import { toast } from 'sonner'

interface Props {
  initialData: BarangLengkap[]
  kategoriList: any[]
  gradeList: Grade[]
  canEdit: boolean
}

export default function BarangClient({ initialData, kategoriList, gradeList, canEdit }: Props) {
  const supabase = createClient()
 
  const [data, setData] = useState<BarangLengkap[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editItem, setEditItem] = useState<BarangLengkap | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('all')
  const [filterGrade, setFilterGrade] = useState('all')
  const [filterStokRendah, setFilterStokRendah] = useState(false)

  const filtered = useMemo(() => {
    return data.filter((b) => {
      const q = search.toLowerCase()

      if (
        q &&
        !b.nama?.toLowerCase().includes(q) &&
        !b.kode?.toLowerCase().includes(q) &&
        !b.merk?.toLowerCase().includes(q)
      ) {
        return false
      }

      if (filterKategori !== 'all') {
        const kategori = kategoriList.find(
          (k) => k.id === filterKategori
        )

        if (b.kategori_nama !== kategori?.nama) {
          return false
        }
      }

      if (filterGrade !== 'all') {
        const grade = gradeList.find(
          (g) => g.id === filterGrade
        )

        if (b.grade_nama !== grade?.nama) {
          return false
        }
      }

      if (filterStokRendah && !b.stok_rendah) {
        return false
      }

      return true
    })
  }, [
    data,
    search,
    filterKategori,
    filterGrade,
    filterStokRendah,
    kategoriList,
    gradeList,
  ])

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data: fresh } = await supabase.from('v_barang_lengkap').select('*').order('nama')
    if (fresh) setData(fresh as BarangLengkap[])
    setLoading(false)
  }, [supabase])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('barang').update({ aktif: false }).eq('id', id)
    if (error) {
      toast.error('Gagal', { description: error.message })
      return
    }
    toast.success('Berhasil', { description: 'Barang dinonaktifkan.' })
    setDeleteConfirm(null)
    refresh()
  }

  const resetFilters = () => {
    setSearch('')
    setFilterKategori('all')
    setFilterGrade('all')
    setFilterStokRendah(false)
  }

  const hasFilter = search || filterKategori !== 'all' || filterGrade !== 'all' || filterStokRendah

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Master Barang</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} dari {data.length} barang
            {data.filter(b => b.stok_rendah).length > 0 && (
              <span className="ml-2 text-orange-500 font-medium">
                · {data.filter(b => b.stok_rendah).length} stok rendah
              </span>
            )}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-600"
            >
              <Upload className="w-4 h-4" /> Import Excel
            </button>
            <button
              onClick={() => { setEditItem(null); setShowForm(true) }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition"
            >
              <Plus className="w-4 h-4" /> Tambah Barang
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari kode, nama, merk..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* Kategori */}
          <select
            value={filterKategori}
            onChange={e => setFilterKategori(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
          >
            <option value="all">Semua Kategori</option>
            {kategoriList.map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>

          {/* Grade */}
          <select
            value={filterGrade}
            onChange={e => setFilterGrade(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
          >
            <option value="all">Semua Grade</option>
            {gradeList.map(g => (
              <option key={g.id} value={g.id}>{g.nama}</option>
            ))}
          </select>

          {/* Stok Rendah Toggle */}
          <button
            onClick={() => setFilterStokRendah(!filterStokRendah)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition',
              filterStokRendah
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            Stok Rendah
          </button>

          {hasFilter && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" /> Reset
            </button>
          )}

          <button onClick={refresh} disabled={loading} className="ml-auto text-gray-400 hover:text-gray-600">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Kode</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nama Barang</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Grade</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Harga Jual</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Stok</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Garansi</th>
                {canEdit && <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="text-center py-12 text-gray-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Tidak ada data</p>
                  </td>
                </tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.kode}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{b.nama}</p>
                      {b.merk && <p className="text-xs text-gray-400">{b.merk}</p>}
                      {b.deskripsi && <p className="text-xs text-gray-300 truncate max-w-[200px]">{b.deskripsi}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.kategori_nama || '-'}</td>
                  <td className="px-4 py-3">
                    {b.grade_nama ? (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                        {b.grade_nama}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {formatRupiah(b.harga_jual)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'inline-block px-2 py-0.5 rounded-md text-xs font-bold',
                      b.stok_rendah
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    )}>
                      {b.stok}
                    </span>
                    {b.stok_rendah && (
                      <span className="ml-1 text-orange-500 text-xs">(min: {b.stok_min})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {b.garansi_hari ? `${b.garansi_hari} hari` : '-'}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setEditItem(b); setShowForm(true) }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(b.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <BarangForm
          item={editItem}
          kategoriList={kategoriList}
          gradeList={gradeList}
          onClose={() => { setShowForm(false); setEditItem(null) }}
          onSuccess={() => { setShowForm(false); setEditItem(null); refresh() }}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportBarangModal
          kategoriList={kategoriList}
          gradeList={gradeList}
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); refresh() }}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-2">Hapus Barang?</h3>
            <p className="text-sm text-gray-500 mb-5">Barang akan dinonaktifkan dan tidak muncul di daftar.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}