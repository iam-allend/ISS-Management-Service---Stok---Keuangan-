import { createClient } from '@/lib/supabase/server'
import ServiceBaruClient from './ServiceBaruClient'

export default async function ServiceBaruPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [
    { data: teknisiList },
    { data: barangList, error: barangError },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, nama, kode_teknisi')
      .eq('role', 'teknisi')
      .eq('aktif', true)
      .order('nama'),

    // DEBUG BARANG
    supabase
      .from('v_barang_lengkap')
      .select('*')
      .limit(50),

    supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user?.id)
      .single(),
  ])

  console.log('BARANG ERROR:', barangError)
  console.log('BARANG COUNT:', barangList?.length)
  console.log('BARANG SAMPLE:', barangList?.[0])

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'super_admin'

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