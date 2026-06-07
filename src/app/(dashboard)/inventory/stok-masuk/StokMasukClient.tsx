'use client'

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, RefreshCw, Edit2, Trash2, X } from 'lucide-react'
import { formatDate, formatRupiah, cn } from '@/lib/utils'
import StokMasukForm from '@/components/inventory/StokMasukForm'
import { toast } from 'sonner'

interface Props {
  initialData: any[]
  barangList: any[]
  canEdit: boolean
  userId: string
}

export default function StokMasukClient({ initialData, barangList, canEdit, userId }: Props) {
  const supabase = createClient()

  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterDateDari, setFilterDateDari] = useState('')
  const [filterDateSampai, setFilterDateSampai] = useState('')

  const filtered = useMemo(() => {
    return data.filter(item => {
      const q = search.toLowerCase()
      if (q && !item.barang?.nama?.toLowerCase().includes(q) &&
          !item.barang?.kode?.toLowerCase().includes(q) &&
          !item.supplier?.toLowerCase().includes(q)) return false
      if (filterDateDari && item.tanggal < filterDateDari) return false
      if (filterDateSampai && item.tanggal > filterDateSampai) return false
      return true
    })
  }, [data, search, filterDateDari, filterDateSampai])

  const totalItems = filtered.reduce((sum, i) => sum + (i.jumlah || 0), 0)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data: fresh } = await supabase
      .from('stok_masuk')
      .select('*, barang:barang_id(kode, nama, merk, stok, kategori:kategori_id(nama), grade:grade_id(nama))')
      .order('created_at', { ascending: false })
      .limit(300)
    if (fresh) setData(fresh)
    setLoading(false)
  }, [supabase])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('stok_masuk').delete().eq('id', id)
    if (error) {
      toast.error('Gagal hapus', { description: error.message })
      return
    }
    toast.success('Berhasil', { description: 'Data stok masuk dihapus.' })
    setDeleteConfirm(null)
    refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Stok Masuk</h1>
          <p className="text-sm text-gray-500">{filtered.length} transaksi · Total {totalItems} unit</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditItem(null); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition"
          >
            <Plus className="w-4 h-4" /> Tambah Masuk
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari barang, supplier..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
        <input type="date" value={filterDateDari} onChange={e => setFilterDateDari(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <span className="text-xs text-gray-400">s/d</span>
        <input type="date" value={filterDateSampai} onChange={e => setFilterDateSampai(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        {(search || filterDateDari || filterDateSampai) && (
          <button onClick={() => { setSearch(''); setFilterDateDari(''); setFilterDateSampai('') }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" /> Reset
          </button>
        )}
        <button onClick={refresh} disabled={loading} className="ml-auto text-gray-400 hover:text-gray-600">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Barang</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Harga Beli</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                {canEdit && <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="text-center py-10 text-gray-400 text-sm">Tidak ada data</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(item.tanggal)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{item.barang?.nama}</p>
                    <p className="text-xs text-gray-400">{item.barang?.kode} · {item.barang?.kategori?.nama}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.supplier || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">+{item.jumlah}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.harga_beli ? formatRupiah(item.harga_beli) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[150px]">{item.keterangan || '—'}</td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setEditItem(item); setShowForm(true) }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
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

      {showForm && (
        <StokMasukForm
          item={editItem}
          barangList={barangList}
          userId={userId}
          onClose={() => { setShowForm(false); setEditItem(null) }}
          onSuccess={() => { setShowForm(false); setEditItem(null); refresh() }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-2">Hapus data stok masuk?</h3>
            <p className="text-sm text-gray-500 mb-5">Stok barang akan dikurangi kembali secara otomatis.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}