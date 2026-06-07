'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, X, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'
interface Props { initialData: any[] }

export default function GradeClient({ initialData }: Props) {
  const supabase = createClient()

  const [data, setData] = useState(initialData)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [nama, setNama] = useState('')
  const [garansiHari, setGaransiHari] = useState(30)
  const [deskripsi, setDeskripsi] = useState('')

  const refresh = useCallback(async () => {
    const { data: fresh } = await supabase.from('grade').select('*').order('garansi_hari')
    if (fresh) setData(fresh)
  }, [supabase])

  const openForm = (item?: any) => {
    if (item) {
      setEditItem(item)
      setNama(item.nama)
      setGaransiHari(item.garansi_hari)
      setDeskripsi(item.deskripsi || '')
    } else {
      setEditItem(null)
      setNama('')
      setGaransiHari(30)
      setDeskripsi('')
    }
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!nama.trim()) { toast.error('Nama wajib diisi'); return }
    if (garansiHari < 1) { toast.error('Garansi minimal 1 hari'); return }

    setLoading(true)
    try {
      if (editItem) {
        const { error } = await supabase.from('grade').update({ nama, garansi_hari: garansiHari, deskripsi }).eq('id', editItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('grade').insert({ nama, garansi_hari: garansiHari, deskripsi })
        if (error) throw error
      }
      toast.success(editItem ? 'Grade diperbarui.' : 'Grade ditambahkan.')
      setShowForm(false)
      refresh()
    } catch (e: any) {
      toast.error('Gagal', { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('grade').delete().eq('id', id)
    if (error) {
      toast.error('Gagal', { description: 'Grade masih digunakan.' })
    } else {
      toast.success('Berhasil')
      refresh()
    }
    setDeleteConfirm(null)
  }

  const garansiLabel = (hari: number) => {
    if (hari < 30) return `${hari} hari`
    if (hari < 365) return `${Math.round(hari / 30)} bulan`
    return `${(hari / 365).toFixed(1)} tahun`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola Grade</h1>
          <p className="text-sm text-gray-500">{data.length} grade terdaftar</p>
        </div>
        <button onClick={() => openForm()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition">
          <Plus className="w-4 h-4" /> Tambah Grade
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.nama}</h3>
                  <p className="text-xs text-green-600 font-medium">Garansi {garansiLabel(item.garansi_hari)}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openForm(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {item.deskripsi && <p className="text-xs text-gray-400">{item.deskripsi}</p>}
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">{item.garansi_hari} hari garansi</p>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editItem ? 'Edit Grade' : 'Tambah Grade'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Grade *</label>
                <input value={nama} onChange={e => setNama(e.target.value)} placeholder="misal: ORI, Standar, ORI++"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Garansi (hari) *</label>
                <input type="number" min="1" value={garansiHari} onChange={e => setGaransiHari(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <p className="text-xs text-gray-400 mt-1">= {garansiLabel(garansiHari)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Batal</button>
                <button onClick={handleSave} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold mb-2">Hapus Grade?</h3>
            <p className="text-sm text-gray-500 mb-5">Grade yang masih digunakan barang tidak bisa dihapus.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg border text-sm hover:bg-gray-50">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm!)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}