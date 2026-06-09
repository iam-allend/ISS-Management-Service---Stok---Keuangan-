'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, ChevronLeft, Wrench, Package, Search, X } from 'lucide-react'
import { todayISO, formatRupiah, cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ServiceType } from '@/types'

interface SparepartItem {
  barang_id: string
  grade_id: string | null
  jumlah: number
  nama: string
  stok: number
  harga: number
  garansi_hari: number | null
}

interface ServiceItem {
  tipe: ServiceType
  teknisi_id: string
  jenis_kerusakan: string
  keterangan: string
  biaya: number
  spareparts: SparepartItem[]
}

interface Props {
  teknisiList: { id: string; nama: string; kode_teknisi: string | null }[]
  barangList: any[]
  userId: string
}

export default function ServiceBaruClient({ teknisiList, barangList, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()

  // Nota fields
  const [noNota, setNoNota] = useState('')
  const [tanggalMasuk, setTanggalMasuk] = useState(todayISO())
  const [namaCustomer, setNamaCustomer] = useState('')
  const [noWA, setNoWA] = useState('')
  const [tipeHP, setTipeHP] = useState('')
  const [catatanNota, setCatatanNota] = useState('')

  // Service items
  const [items, setItems] = useState<ServiceItem[]>([])
  const [saving, setSaving] = useState(false)

  // Sparepart search state per item
  const [sparepartSearch, setSparepartSearch] = useState<Record<number, string>>({})

  const addItem = (tipe: ServiceType) => {
    setItems(prev => [...prev, {
      tipe,
      teknisi_id: '',
      jenis_kerusakan: '',
      keterangan: '',
      biaya: 0,
      spareparts: [],
    }])
  }

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, key: keyof ServiceItem, value: any) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item))
  }

  const addSparepart = (itemIdx: number, barang: any) => {
    const sp: SparepartItem = {
      barang_id: barang.id,
      grade_id: barang.grade_id || null,
      jumlah: 1,
      nama: barang.nama,
      stok: barang.stok,
      harga: barang.harga_jual,
      garansi_hari: barang.garansi_hari,
    }
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item
      const alreadyExists = item.spareparts.some(s => s.barang_id === barang.id)
      if (alreadyExists) return item
      return { ...item, spareparts: [...item.spareparts, sp] }
    }))
    setSparepartSearch(prev => ({ ...prev, [itemIdx]: '' }))
  }

  const removeSparepart = (itemIdx: number, spIdx: number) => {
    setItems(prev => prev.map((item, i) =>
      i === itemIdx ? { ...item, spareparts: item.spareparts.filter((_, j) => j !== spIdx) } : item
    ))
  }

  const updateSparepart = (itemIdx: number, spIdx: number, key: keyof SparepartItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item
      return {
        ...item,
        spareparts: item.spareparts.map((sp, j) => j === spIdx ? { ...sp, [key]: value } : sp)
      }
    }))
  }

  const filteredBarang = (idx: number) => {
    const q = (sparepartSearch[idx] || '').toLowerCase()
    if (!q) return []
    return barangList.filter(b =>
      (b.nama.toLowerCase().includes(q) || b.kode.toLowerCase().includes(q)) &&
      !items[idx]?.spareparts.some(s => s.barang_id === b.id)
    ).slice(0, 6)
  }

  const handleSubmit = async () => {
    if (!noNota.trim()) { toast.error('No nota wajib diisi'); return }
    if (!namaCustomer.trim()) { toast.error('Nama customer wajib diisi'); return }
    if (!noWA.trim()) { toast.error('No WA wajib diisi'); return }
    if (!tipeHP.trim()) { toast.error('Tipe HP wajib diisi'); return }
    if (items.length === 0) { toast.error('Tambah minimal 1 item service'); return }
    for (const item of items) {
      if (!item.jenis_kerusakan.trim()) { toast.error('Jenis kerusakan wajib diisi'); return }
    }

    setSaving(true)
    try {
      // 1. Insert nota_service
      const { data: nota, error: notaErr } = await supabase
        .from('nota_service')
        .insert({
          no_nota: noNota.trim().toUpperCase(),
          tanggal_masuk: tanggalMasuk,
          nama_customer: namaCustomer,
          no_wa: noWA,
          tipe_hp: tipeHP,
          catatan_nota: catatanNota || null,
          created_by: userId,
        })
        .select()
        .single()

      if (notaErr) throw notaErr

      // 2. Insert tiap item_service + spareparts
      for (const item of items) {
        const garansiHari = item.tipe === 'mesin' ? 30 : null // interface garansi dari grade

        const { data: itemService, error: itemErr } = await supabase
          .from('item_service')
          .insert({
            nota_id: nota.id,
            tipe: item.tipe,
            teknisi_id: item.teknisi_id || null,
            jenis_kerusakan: item.jenis_kerusakan,
            keterangan: item.keterangan || null,
            biaya: item.biaya,
            status: 'pengecekan',
            garansi_hari: garansiHari,
          })
          .select()
          .single()

        if (itemErr) throw itemErr

        // 3. Insert spareparts (kalau ada) via RPC
        for (const sp of item.spareparts) {
          const { error: spErr } = await supabase.rpc('tambah_sparepart_service', {
            p_item_service_id: itemService.id,
            p_barang_id: sp.barang_id,
            p_grade_id: sp.grade_id,
            p_jumlah: sp.jumlah,
            p_created_by: userId,
          })
          if (spErr) throw spErr
        }

        // Update garansi untuk interface berdasarkan sparepart pertama
        if (item.tipe === 'interface' && item.spareparts.length > 0) {
          const maxGaransi = Math.max(...item.spareparts.map(s => s.garansi_hari || 30))
          await supabase.from('item_service').update({ garansi_hari: maxGaransi }).eq('id', itemService.id)
        }
      }

      toast.success('Service berhasil dibuat!', { description: `Nota ${noNota} tersimpan.` })
      router.push(`/service/${nota.id}`)
    } catch (e: any) {
      toast.error('Gagal menyimpan', { description: e.message })
    } finally {
      setSaving(false)
    }
  }

  const totalBiaya = items.reduce((sum, i) => sum + (i.biaya || 0), 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tambah Service Baru</h1>
          <p className="text-sm text-gray-500">Buat nota service untuk unit customer</p>
        </div>
      </div>

      {/* Data Customer */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm">Data Unit & Customer</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">No. Nota *</label>
            <input value={noNota} onChange={e => setNoNota(e.target.value.toUpperCase())}
              placeholder="SVC/2506/001"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tgl Masuk *</label>
            <input type="date" value={tanggalMasuk} onChange={e => setTanggalMasuk(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nama Customer *</label>
            <input value={namaCustomer} onChange={e => setNamaCustomer(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">No. WA *</label>
            <input value={noWA} onChange={e => setNoWA(e.target.value)} type="tel" placeholder="08xxxxxxxxxx"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Tipe HP *</label>
            <input value={tipeHP} onChange={e => setTipeHP(e.target.value)} placeholder="misal: iPhone 14 Pro Max"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Nota</label>
            <textarea value={catatanNota} onChange={e => setCatatanNota(e.target.value)} rows={2}
              placeholder="Catatan umum untuk nota ini..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Item Service */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-sm">Item Service</h2>
          <div className="flex gap-2">
            <button onClick={() => addItem('mesin')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition">
              <Wrench className="w-3.5 h-3.5" /> Service Mesin
            </button>
            <button onClick={() => addItem('interface')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition">
              <Package className="w-3.5 h-3.5" /> Ganti Sparepart
            </button>
          </div>
        </div>

        {items.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-400">Belum ada item service. Tambah service mesin atau ganti sparepart.</p>
          </div>
        )}

        {items.map((item, idx) => (
          <div key={idx} className={cn('bg-white rounded-xl border p-5 space-y-4',
            item.tipe === 'mesin' ? 'border-purple-100' : 'border-blue-100'
          )}>
            {/* Item header */}
            <div className="flex items-center justify-between">
              <span className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                item.tipe === 'mesin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
              )}>
                {item.tipe === 'mesin' ? <Wrench className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                {item.tipe === 'mesin' ? 'Service Mesin' : 'Ganti Sparepart'}
                {item.tipe === 'mesin' && <span className="opacity-60 ml-1">· Garansi 1 bulan</span>}
              </span>
              <button onClick={() => removeItem(idx)} className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Kerusakan *</label>
                <input value={item.jenis_kerusakan} onChange={e => updateItem(idx, 'jenis_kerusakan', e.target.value)}
                  placeholder="misal: LCD pecah, Baterai drop, dll"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teknisi</label>
                <select value={item.teknisi_id} onChange={e => updateItem(idx, 'teknisi_id', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <option value="">— Pilih Teknisi —</option>
                  {teknisiList.map(t => (
                    <option key={t.id} value={t.id}>{t.nama} {t.kode_teknisi ? `(${t.kode_teknisi})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Biaya Service</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                  <input type="number" min="0" value={item.biaya}
                    onChange={e => updateItem(idx, 'biaya', Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan</label>
                <textarea value={item.keterangan} onChange={e => updateItem(idx, 'keterangan', e.target.value)}
                  rows={2} placeholder="Detail kondisi, catatan tambahan..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                />
              </div>
            </div>

            {/* Sparepart (hanya untuk interface) */}
            {item.tipe === 'interface' && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-700">Sparepart yang dipakai</p>

                {item.spareparts.map((sp, spIdx) => (
                  <div key={spIdx} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">{sp.nama}</p>
                      <p className="text-xs text-gray-400">Garansi: {sp.garansi_hari ? `${sp.garansi_hari} hari` : '-'} · Stok: {sp.stok}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="number" min="0.001" step="0.001" value={sp.jumlah}
                        onChange={e => updateSparepart(idx, spIdx, 'jumlah', Number(e.target.value))}
                        className="w-14 px-2 py-1 text-xs rounded border border-gray-200 text-center focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                      <button onClick={() => removeSparepart(idx, spIdx)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Search sparepart */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={sparepartSearch[idx] || ''}
                    onChange={e => setSparepartSearch(prev => ({ ...prev, [idx]: e.target.value }))}
                    placeholder="Cari sparepart untuk ditambahkan..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-dashed border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-solid"
                  />
                  {sparepartSearch[idx] && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg border border-gray-100 shadow-lg z-10 overflow-hidden">
                      {filteredBarang(idx).map(b => (
                        <button key={b.id} type="button"
                          onClick={() => addSparepart(idx, b)}
                          className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition">
                          <p className="text-xs font-medium text-gray-800">{b.nama}</p>
                          <p className="text-xs text-gray-400">{b.grade_nama || '-'} · Stok: {b.stok} · {formatRupiah(b.harga_jual)}</p>
                        </button>
                      ))}
                      {filteredBarang(idx).length === 0 && (
                        <p className="text-center text-xs text-gray-400 py-3">Tidak ditemukan atau stok 0</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary & Submit */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Total Biaya Service</span>
            <span className="text-lg font-bold text-gray-900">{formatRupiah(totalBiaya)}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.back()}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 transition">
              Batal
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan Service'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}