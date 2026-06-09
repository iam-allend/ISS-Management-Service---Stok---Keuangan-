import { createClient } from '@/lib/supabase/server'
import {
  Package, Wrench, Clock, CheckCircle, AlertTriangle, TrendingDown
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { DashboardSummary } from '@/types'
import Link from 'next/link'


export default async function DashboardPage() {

  const supabase = await createClient()

  const { data: summary } = await supabase
    .from('v_dashboard_summary')
    .select('*')
    .single() as { data: DashboardSummary | null }

  const { data: serviceAktif } = await supabase
    .from('v_service_lengkap')
    .select('*')
    .not('status', 'in', '(diambil,cancel)')
    .order('tanggal_masuk', { ascending: true })
    .limit(5)

  const { data: stokRendah } = await supabase
    .from('v_barang_lengkap')
    .select('id, kode, nama, kategori_nama, stok, stok_min')
    .eq('stok_rendah', true)
    .eq('aktif', true)
    .limit(5)

    
  const cards = [
    {
      label: 'Total Barang',
      value: summary?.total_barang ?? 0,
      icon: <Package className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
      href: '/inventory',
    },
    {
      label: 'Service Aktif',
      value: summary?.service_aktif ?? 0,
      icon: <Wrench className="w-5 h-5" />,
      color: 'bg-purple-50 text-purple-600',
      href: '/service',
    },
    {
      label: 'Menunggu Diambil',
      value: summary?.menunggu_diambil ?? 0,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-green-50 text-green-600',
      href: '/service?status=selesai',
    },
    {
      label: 'Service Terlambat',
      value: summary?.service_terlambat ?? 0,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-red-50 text-red-600',
      href: '/service?terlambat=1',
    },
    {
      label: 'Stok Rendah',
      value: summary?.barang_stok_rendah ?? 0,
      icon: <TrendingDown className="w-5 h-5" />,
      color: 'bg-orange-50 text-orange-600',
      href: '/inventory?stok_rendah=1',
    },
    {
      label: 'Masuk Hari Ini',
      value: summary?.service_masuk_hari_ini ?? 0,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-yellow-50 text-yellow-600',
      href: '/service',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{formatDate(new Date().toISOString(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map(card => (
          <Link key={card.label} href={card.href}>
            <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition cursor-pointer">
              <div className={`inline-flex p-2 rounded-lg ${card.color} mb-3`}>
                {card.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Aktif */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Service Aktif Terbaru</h2>
            <Link href="/service" className="text-xs text-blue-600 hover:underline">
              Lihat semua →
            </Link>
          </div>
          {serviceAktif && serviceAktif.length > 0 ? (
            <div className="space-y-3">
              {serviceAktif.map((svc: any) => (
                <div key={svc.item_id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">{svc.no_nota}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        svc.hari_berlalu >= 4 ? 'bg-red-100 text-red-700 border-red-200' :
                        svc.hari_berlalu >= 3 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {svc.hari_berlalu}h
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{svc.nama_customer} · {svc.tipe_hp}</p>
                    <p className="text-xs text-gray-400 truncate">{svc.jenis_kerusakan}</p>
                  </div>
                  <Link
                    href={`/service/${svc.nota_id}`}
                    className="text-xs text-blue-600 hover:underline shrink-0"
                  >
                    Detail
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Tidak ada service aktif</p>
          )}
        </div>

        {/* Stok Rendah */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Stok Rendah</h2>
            <Link href="/inventory?stok_rendah=1" className="text-xs text-blue-600 hover:underline">
              Lihat semua →
            </Link>
          </div>
          {stokRendah && stokRendah.length > 0 ? (
            <div className="space-y-3">
              {stokRendah.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{b.nama}</p>
                    <p className="text-xs text-gray-500">{b.kategori_nama} · {b.kode}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-orange-600">{b.stok}</p>
                    <p className="text-xs text-gray-400">min: {b.stok_min}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Semua stok aman ✓</p>
          )}
        </div>
      </div>
    </div>
  )
}