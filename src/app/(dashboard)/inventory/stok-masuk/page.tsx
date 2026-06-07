import { createClient } from '@/lib/supabase/server'
import StokMasukClient from './StokMasukClient'

export default async function StokMasukPage() {
  const supabase = await createClient()

  const [{ data: stokMasuk }, { data: barangList }, { data: profile }] =
    await Promise.all([
      supabase
        .from('stok_masuk')
        .select(
          '*, barang:barang_id(kode, nama, merk, stok, kategori:kategori_id(nama), grade:grade_id(nama))'
        )
        .order('created_at', { ascending: false })
        .limit(300),

      supabase
        .from('v_barang_lengkap')
        .select(
          'id, kode, nama, merk, kategori_nama, grade_nama, stok, harga_jual'
        )
        .eq('aktif', true)
        .order('nama'),

      supabase.from('profiles').select('role, id').single(),
    ])

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'super_admin'

  return (
    <StokMasukClient
      initialData={stokMasuk ?? []}
      barangList={barangList ?? []}
      canEdit={isAdmin}
      userId={profile?.id ?? ''}
    />
  )
}