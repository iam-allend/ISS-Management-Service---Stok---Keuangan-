'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Smartphone, CheckCircle, Clock, Wrench, Package, Loader2 } from 'lucide-react'
import { formatDate, STATUS_LABEL, STATUS_COLOR, TIPE_LABEL, formatRupiah, getGaransiStatus } from '@/lib/utils'
import type { TrackingData } from '@/types'
import { cn } from '@/lib/utils'

export default function TrackPage() {
  const supabase = createClient()
  const [noNota, setNoNota] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingData | null>(null)
  const [notFound, setNotFound] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!noNota.trim()) return

    setLoading(true)
    setResult(null)
    setNotFound(false)

    const { data, error } = await supabase.rpc('get_tracking_by_nota', {
      p_no_nota: noNota.trim().toUpperCase()
    })

    setLoading(false)

    if (error || !data || data.length === 0) {
      setNotFound(true)
      return
    }

    setResult(data[0] as TrackingData)
  }

  const totalBiaya = result?.items.reduce((sum, i) => sum + (i.biaya || 0), 0) ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="text-center pt-16 pb-10 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">iPhone Service Solution</h1>
        <p className="text-gray-400 text-sm mt-1">Cek Status Service Unit Anda</p>
      </div>

      {/* Search */}
      <div className="max-w-lg mx-auto px-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={noNota}
            onChange={e => setNoNota(e.target.value)}
            placeholder="Masukkan No. Nota (contoh: SVC/2506/1234)"
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 backdrop-blur text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:border-white/30 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 transition disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Cek
          </button>
        </form>

        {/* Not Found */}
        {notFound && (
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-gray-300 text-sm">No. nota tidak ditemukan.</p>
            <p className="text-gray-500 text-xs mt-1">Periksa kembali nomor nota Anda.</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-4 pb-16">
            {/* Info Unit */}
            <div className="bg-white rounded-2xl p-5 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">No. Nota</p>
                  <p className="text-lg font-bold text-gray-900">{result.no_nota}</p>
                </div>
                {result.status_ambil ? (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                    <CheckCircle className="w-3 h-3" /> Sudah Diambil
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                    <Clock className="w-3 h-3" /> Dalam Proses
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Unit</p>
                  <p className="font-medium text-gray-800">{result.tipe_hp}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tgl Masuk</p>
                  <p className="font-medium text-gray-800">{formatDate(result.tanggal_masuk)}</p>
                </div>
                {result.tanggal_ambil && (
                  <div>
                    <p className="text-xs text-gray-400">Tgl Diambil</p>
                    <p className="font-medium text-gray-800">{formatDate(result.tanggal_ambil)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">Total Biaya</p>
                  <p className="font-bold text-gray-900">{formatRupiah(totalBiaya)}</p>
                </div>
              </div>
            </div>

            {/* Detail Service Items */}
            {result.items.map((item, idx) => {
              const garansi = getGaransiStatus(item.garansi_mulai, item.garansi_hari)
              return (
                <div key={idx} className="bg-white rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    {item.tipe === 'mesin'
                      ? <Wrench className="w-4 h-4 text-purple-500" />
                      : <Package className="w-4 h-4 text-blue-500" />
                    }
                    <span className="text-sm font-semibold text-gray-700">
                      {TIPE_LABEL[item.tipe]}
                    </span>
                    <span className={cn(
                      'ml-auto text-xs px-2 py-1 rounded-full border font-medium',
                      STATUS_COLOR[item.status]
                    )}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Kerusakan</span>
                      <span className="font-medium text-gray-800 text-right max-w-[60%]">
                        {item.jenis_kerusakan}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Biaya</span>
                      <span className="font-medium text-gray-800">{formatRupiah(item.biaya)}</span>
                    </div>
                    {item.kode_teknisi && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Teknisi</span>
                        <span className="font-medium text-gray-800">{item.kode_teknisi}</span>
                      </div>
                    )}
                    {item.tanggal_selesai && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Selesai</span>
                        <span className="font-medium text-gray-800">{formatDate(item.tanggal_selesai)}</span>
                      </div>
                    )}
                    {item.garansi_hari && (
                      <div className="flex justify-between items-start">
                        <span className="text-gray-400">Garansi</span>
                        <span className={cn('font-medium text-right max-w-[60%]', garansi.color)}>
                          {item.garansi_mulai ? garansi.label : `${item.garansi_hari} hari (berlaku setelah diambil)`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}