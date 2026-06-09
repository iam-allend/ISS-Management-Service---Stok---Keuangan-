import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ServiceDetailClient from './ServiceDetailClient'

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const [{ data: nota }, { data: items }, { data: teknisiList }, { data: barangList }, { data: profile }] = await Promise.all([
    supabase
      .from('nota_service')
      .select('*')
      .eq('id', params.id)
      .single(),
    supabase
      .from('item_service')
      .select('*, teknisi:teknisi_id(id, nama, kode_teknisi, no_wa), item_sparepart(*, barang:barang_id(kode, nama), grade:grade_id(nama, garansi_hari))')
      .eq('nota_id', params.id)
      .order('created_at'),
    supabase
      .from('profiles')
      .select('id, nama, kode_teknisi')
      .eq('role', 'teknisi')
      .eq('aktif', true)
      .order('nama'),
    supabase
      .from('v_barang_lengkap')
      .select('id, kode, nama, merk, grade_id, grade_nama, garansi_hari, harga_jual, stok')
      .eq('aktif', true)
      .gt('stok', 0)
      .order('nama'),
    supabase.from('profiles').select('id, role').single(),
  ])

  if (!nota) notFound()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  return (
    <ServiceDetailClient
      nota={nota}
      items={items ?? []}
      teknisiList={teknisiList ?? []}
      barangList={barangList ?? []}
      isAdmin={isAdmin}
      userId={profile?.id ?? ''}
    />
  )
}