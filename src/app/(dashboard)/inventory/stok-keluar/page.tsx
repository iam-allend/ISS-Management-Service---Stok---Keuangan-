
import { createClient } from '@/lib/supabase/server'
import StokKeluarClient from './StokKeluarClient'

export default async function StokKeluarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: stokKeluar }, { data: barangList }, { data: profile }] =
    await Promise.all([
      supabase
        .from('stok_keluar')
        .select(
          '*, barang:barang_id(kode, nama, stok, kategori:kategori_id(nama)), item_service:item_service_id(nota:nota_id(no_nota))'
        )
        .order('created_at', { ascending: false })
        .limit(300),

      supabase
        .from('v_barang_lengkap')
        .select(
          'id, kode, nama, merk, kategori_nama, grade_nama, stok'
        )
        .eq('aktif', true)
        .order('nama'),

      supabase
        .from('profiles')
        .select('role, id')
        .eq('id', user?.id)
        .single(),
    ])

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'super_admin'

  return (
    <StokKeluarClient
      initialData={stokKeluar ?? []}
      barangList={barangList ?? []}
      canEdit={isAdmin}
      userId={profile?.id ?? ''}
    />
  )
}