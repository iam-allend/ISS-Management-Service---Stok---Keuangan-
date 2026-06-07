'use client'

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Plus, Search, RefreshCw, MessageCircle, Edit2, Trash2,
  ChevronDown, X, Filter, Phone
} from 'lucide-react'
import {
  cn, formatDate, formatRupiah, STATUS_LABEL, STATUS_COLOR,
  TIPE_LABEL, getDurasiConfig
} from '@/lib/utils'
import type { ServiceLengkap, ServiceStatus, ServiceType } from '@/types'
import StatusToggle from '@/components/service/StatusToggle'
import KonfirmasiPopup from '@/components/service/KonfirmasiPopup'
import { makeWALink } from '@/lib/fonte'
import { toast } from 'sonner'

interface Props {
  initialData: ServiceLengkap[]
  teknisiList: { id: string; nama: string; kode_teknisi: string | null }[]
  currentProfile: { role: string; id: string } | null
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pengecekan', label: 'Pengecekan' },
  { value: 'proses_service', label: 'Proses Service' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'diambil', label: 'Diambil' },
  { value: 'cancel', label: 'Cancel' },
]

export default function ServiceClient({ initialData, teknisiList, currentProfile }: Props) {
  const supabase = createClient()

  const isAdmin = currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin'

  const [data, setData] = useState<ServiceLengkap[]>(initialData)
  const [loading, setLoading] = useState(false)

  // Filters — tanggal masuk & keluar mutually exclusive
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTipe, setFilterTipe] = useState<string>('all')
  const [filterTeknisi, setFilterTeknisi] = useState<string>('all')
  const [filterDateMode, setFilterDateMode] = useState<'masuk' | 'keluar' | null>(null)
  const [filterDateDari, setFilterDateDari] = useState('')
  const [filterDateSampai, setFilterDateSampai] = useState('')
  const [filterStatusAmbil, setFilterStatusAmbil] = useState<string>('all')

  // Popup
  const [konfirmasiItem, setKonfirmasiItem] = useState<ServiceLengkap | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return data.filter(s => {
      const q = search.toLowerCase()
      if (q && !s.no_nota.toLowerCase().includes(q) &&
          !s.nama_customer.toLowerCase().includes(q) &&
          !s.tipe_hp.toLowerCase().includes(q) &&
          !s.jenis_kerusakan.toLowerCase().includes(q)) return false
      if (filterStatus !== 'all' && s.status !== filterStatus) return false
      if (filterTipe !== 'all' && s.tipe_service !== filterTipe) return false
      if (filterTeknisi !== 'all' && s.item_id && s.nota_id) {
        if (filterTeknisi === 'unassigned' && s.kode_teknisi) return false
        if (filterTeknisi !== 'unassigned' && s.nama_teknisi !== filterTeknisi) return false
      }
      if (filterStatusAmbil !== 'all') {
        const ambil = filterStatusAmbil === 'true'
        if (s.status_ambil !== ambil) return false
      }
      if (filterDateMode === 'masuk' && filterDateDari && s.tanggal_masuk < filterDateDari) return false
      if (filterDateMode === 'masuk' && filterDateSampai && s.tanggal_masuk > filterDateSampai) return false
      if (filterDateMode === 'keluar' && filterDateDari && (s.tanggal_ambil || '') < filterDateDari) return false
      if (filterDateMode === 'keluar' && filterDateSampai && (s.tanggal_ambil || '') > filterDateSampai) return false
      return true
    })
  }, [data, search, filterStatus, filterTipe, filterTeknisi, filterStatusAmbil, filterDateMode, filterDateDari, filterDateSampai])

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data: fresh } = await supabase
      .from('v_service_lengkap')
      .select('*')
      .order('tanggal_masuk', { ascending: false })
      .limit(200)
    if (fresh) setData(fresh as ServiceLengkap[])
    setLoading(false)
  }, [supabase])

  const handleStatusChange = async (itemId: string, newStatus: ServiceStatus) => {
    const { error } = await supabase.rpc('update_item_service_status', {
      p_item_id: itemId,
      p_status: newStatus,
      p_user_id: currentProfile?.id,
    })
    if (error) {
      toast.error(`Gagal update status: ${error.message}`)
      return
    }
    toast.success('Status diperbarui')
    refresh()
  }

  const handleDelete = async (itemId: string) => {
    const { error } = await supabase.from('item_service').delete().eq('id', itemId)
    if (error) {
      toast.error(`Gagal hapus: ${error.message}`)
      return
    }
    toast.success('Item dihapus')
    setDeleteConfirm(null)
    refresh()
  }

  const resetFilters = () => {
    setSearch(''); setFilterStatus('all'); setFilterTipe('all')
    setFilterTeknisi('all'); setFilterStatusAmbil('all')
    setFilterDateMode(null); setFilterDateDari(''); setFilterDateSampai('')
  }

  const hasFilter = search || filterStatus !== 'all' || filterTipe !== 'all' ||
    filterTeknisi !== 'all' || filterStatusAmbil !== 'all' || filterDateMode

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Data Service</h1>
          <p className="text-sm text-gray-500">{filtered.length} dari {data.length} item service</p>
        </div>
        {isAdmin && (
          <Link href="/service/baru"
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition"
          >
            <Plus className="w-4 h-4" /> Tambah Service
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nota, customer, HP, kerusakan..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          {/* Status */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {/* Tipe */}
          <select value={filterTipe} onChange={e => setFilterTipe(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <option value="all">Semua Tipe</option>
            <option value="mesin">Service Mesin</option>
            <option value="interface">Ganti Sparepart</option>
          </select>
          {/* Teknisi */}
          <select value={filterTeknisi} onChange={e => setFilterTeknisi(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <option value="all">Semua Teknisi</option>
            {teknisiList.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
          </select>
          {/* Status Ambil */}
          <select value={filterStatusAmbil} onChange={e => setFilterStatusAmbil(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <option value="all">Semua</option>
            <option value="false">Belum Diambil</option>
            <option value="true">Sudah Diambil</option>
          </select>
          {hasFilter && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" /> Reset
            </button>
          )}
          <button onClick={refresh} disabled={loading} className="ml-auto text-gray-400 hover:text-gray-600">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>

        {/* Date filters — mutually exclusive */}
        <div className="flex flex-wrap gap-3 items-center text-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterDateMode(filterDateMode === 'masuk' ? null : 'masuk')}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-xs transition',
                filterDateMode === 'masuk' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              )}
            >
              Filter Tgl Masuk
            </button>
            <button
              onClick={() => setFilterDateMode(filterDateMode === 'keluar' ? null : 'keluar')}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-xs transition',
                filterDateMode === 'keluar' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              )}
            >
              Filter Tgl Keluar
            </button>
          </div>
          {filterDateMode && (
            <>
              <input type="date" value={filterDateDari} onChange={e => setFilterDateDari(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <span className="text-gray-400 text-xs">s/d</span>
              <input type="date" value={filterDateSampai} onChange={e => setFilterDateSampai(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nota / Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Teknisi</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Durasi</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Biaya</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada data service
                  </td>
                </tr>
              ) : filtered.map(svc => {
                const durasi = getDurasiConfig(svc.hari_berlalu)
                const showDurasi = !svc.status_ambil && svc.status !== 'diambil' && svc.status !== 'cancel'

                return (
                  <tr key={svc.item_id} className="hover:bg-gray-50 transition">
                    {/* Nota / Customer */}
                    <td className="px-4 py-3">
                      <Link href={`/service/${svc.nota_id}`} className="block">
                        <p className="font-medium text-blue-600 hover:underline">{svc.no_nota}</p>
                        <p className="text-xs text-gray-500">{svc.nama_customer}</p>
                        <p className="text-xs text-gray-400">{formatDate(svc.tanggal_masuk)}</p>
                      </Link>
                    </td>
                    {/* Unit */}
                    <td className="px-4 py-3 text-gray-700">{svc.tipe_hp}</td>
                    {/* Service */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-block text-xs px-2 py-0.5 rounded-md mb-1',
                        svc.tipe_service === 'mesin'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-blue-50 text-blue-700'
                      )}>
                        {TIPE_LABEL[svc.tipe_service]}
                      </span>
                      <p className="text-xs text-gray-600 truncate max-w-[160px]">{svc.jenis_kerusakan}</p>
                    </td>
                    {/* Teknisi */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {svc.kode_teknisi
                        ? <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{svc.kode_teknisi}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    {/* Durasi */}
                    <td className="px-4 py-3 text-center">
                      {showDurasi ? (
                        <span className={cn(
                          'inline-block text-xs px-2 py-1 rounded-lg border font-medium',
                          durasi.bgColor, durasi.color
                        )}>
                          {durasi.label}
                        </span>
                      ) : (
                        svc.tanggal_ambil
                          ? <span className="text-xs text-gray-300">{formatDate(svc.tanggal_ambil)}</span>
                          : <span className="text-gray-200">—</span>
                      )}
                    </td>
                    {/* Status Toggle */}
                    <td className="px-4 py-3">
                      <StatusToggle
                        currentStatus={svc.status}
                        itemId={svc.item_id}
                        onChange={handleStatusChange}
                        disabled={!isAdmin && currentProfile?.id !== svc.item_id}
                      />
                    </td>
                    {/* Biaya */}
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {formatRupiah(svc.biaya)}
                    </td>
                    {/* Aksi */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Direct WA (tanpa format) */}
                        <a
                          href={makeWALink(svc.no_wa)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Chat WA Customer"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        {/* Konfirmasi selesai (terformat) */}
                        {isAdmin && svc.status === 'selesai' && (
                          <button
                            onClick={() => setKonfirmasiItem(svc)}
                            title="Konfirmasi Selesai ke Customer"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Edit — link ke detail */}
                        <Link href={`/service/${svc.nota_id}`}
                          title="Detail & Edit"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        {/* Hapus */}
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteConfirm(svc.item_id)}
                            title="Hapus item"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Konfirmasi Popup */}
      {konfirmasiItem && (
        <KonfirmasiPopup
          item={konfirmasiItem}
          onClose={() => setKonfirmasiItem(null)}
          onSent={() => { setKonfirmasiItem(null); refresh() }}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-2">Hapus Item Service?</h3>
            <p className="text-sm text-gray-500 mb-2">Data service ini akan dihapus permanen.</p>
            <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded-lg mb-5">
              ⚠️ Jika ada sparepart yang dipakai, stok akan dikembalikan otomatis.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
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