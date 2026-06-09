import { createClient } from '@/lib/supabase/server'
import ServiceBaruClient from './ServiceBaruClient'

export default async function ServiceBaruPage() {
  const supabase = await createClient()

  const [{ data: teknisiList }, { data: barangList }, { data: profile }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, nama, kode_teknisi')
      .eq('role', 'teknisi')
      .eq('aktif', true)
      .order('nama'),
    supabase
      .from('v_barang_lengkap')
      .select('id, kode, nama, merk, kategori_id, kategori_nama, grade_id, grade_nama, garansi_hari, harga_jual, stok')
      .eq('aktif', true)
      .gt('stok', 0)
      .order('nama'),
    supabase.from('profiles').select('id, role').single(),
  ])

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Tidak ada akses</p>
      </div>
    )
  }

  return (
    <ServiceBaruClient
      teknisiList={teknisiList ?? []}
      barangList={barangList ?? []}
      userId={profile?.id ?? ''}
    />
  )
}