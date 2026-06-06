'use client'

import { useState, useEffect } from 'react'
import { X, Send, MessageCircle, Loader2, CheckCircle } from 'lucide-react'
import { makeWALink, templateKonfirmasiSelesai } from '@/lib/fonte'
import { formatRupiah, TIPE_LABEL } from '@/lib/utils'
import type { ServiceLengkap } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Props {
  item: ServiceLengkap
  onClose: () => void
  onSent: () => void
}

export default function KonfirmasiPopup({ item, onClose, onSent }: Props) {
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [catatan, setCatatan] = useState('')

  // Generate preview pesan
  const generatePesan = () => {
    return templateKonfirmasiSelesai({
      no_nota: item.no_nota,
      nama_customer: item.nama_customer,
      tipe_hp: item.tipe_hp,
      items: [{
        tipe: item.tipe_service,
        jenis_kerusakan: item.jenis_kerusakan,
        biaya: item.biaya,
        garansi_hari: item.garansi_hari,
      }],
      total_biaya: item.biaya,
      catatan,
    })
  }

  const [pesan, setPesan] = useState('')

  useEffect(() => {
    setPesan(generatePesan())
  }, [catatan])

  const handleKirimViaFonte = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fonte/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: item.no_wa,
          message: pesan,
          nota_id: item.nota_id,
          item_service_id: item.item_id,
          tipe: 'selesai_konfirmasi',
        }),
      })
      const result = await res.json()
      if (result.status) {
        setSent(true)
        toast({ title: 'Pesan terkirim!', description: `WA dikirim ke ${item.nama_customer}` })
        setTimeout(() => onSent(), 1500)
      } else {
        throw new Error(result.message)
      }
    } catch (e: any) {
      toast({ title: 'Gagal kirim', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleKirimViaWAMe = () => {
    window.open(makeWALink(item.no_wa, pesan), '_blank')
    // Mark as sent via wa.me
    fetch('/api/fonte/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: item.no_wa,
        message: pesan,
        nota_id: item.nota_id,
        item_service_id: item.item_id,
        tipe: 'selesai_konfirmasi',
      }),
    }).then(() => onSent())
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-gray-900">Konfirmasi Selesai ke Customer</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Info Singkat */}
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-400">No. Nota</p>
              <p className="font-medium">{item.no_nota}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Customer</p>
              <p className="font-medium">{item.nama_customer}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">No. WA</p>
              <p className="font-medium">{item.no_wa}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Biaya</p>
              <p className="font-bold text-green-700">{formatRupiah(item.biaya)}</p>
            </div>
          </div>

          {/* Catatan tambahan */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Catatan Tambahan (opsional)
            </label>
            <input
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="misal: Sebelum diambil, harap konfirmasi dulu..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* Preview Pesan */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Preview Pesan (bisa diedit)
            </label>
            <textarea
              value={pesan}
              onChange={e => setPesan(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 font-mono resize-none bg-green-50"
            />
          </div>

          {sent && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl p-3 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Pesan berhasil dikirim!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button onClick={handleKirimViaWAMe}
              className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 transition"
            >
              <MessageCircle className="w-4 h-4" />
              Buka WA
            </button>
            <button onClick={handleKirimViaFonte} disabled={loading}
              className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Kirim API
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            "Buka WA" → buka wa.me langsung · "Kirim API" → kirim via Fonte
          </p>
        </div>
      </div>
    </div>
  )
}