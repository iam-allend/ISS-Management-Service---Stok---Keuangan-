import { createClient } from '@/lib/supabase/server'
import StokOpnameClient from './StokOpnameClient'

export default async function StokOpnamePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: opname }, { data: barangList }, { data: profile }] =
    await Promise.all([
      supabase
        .from('stok_opname')
        .select(
          '*, barang:barang_id(kode, nama, stok, kategori:kategori_id(nama)), petugas:petugas_id(nama, kode_teknisi)'
        )
        .order('created_at', { ascending: false })
        .limit(200),

      supabase
        .from('v_barang_lengkap')
        .select('id, kode, nama, stok, kategori_nama')
        .eq('aktif', true)
        .order('nama'),

      supabase
        .from('profiles')
        .select('role, id, nama')
        .eq('id', user?.id)
        .single(),
    ])

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'super_admin'

  return (
    <StokOpnameClient
      initialData={opname ?? []}
      barangList={barangList ?? []}
      canEdit={isAdmin}
      userId={profile?.id ?? ''}
      userName={profile?.nama ?? ''}
    />
  )
}