import { createClient } from '@/lib/supabase/server'
import BarangClient from './BarangClient'

export default async function InventoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('USER ID:', user?.id)

  const [{ data: barang }, { data: kategori }, { data: grade }] = await Promise.all([
    supabase.from('v_barang_lengkap').select('*').order('nama'),
    supabase.from('kategori').select('*, grades:kategori_grade(grade:grade(*))').eq('aktif', true).order('nama'),
    supabase.from('grade').select('*').eq('aktif', true).order('nama'),
  ])

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  console.log('PROFILE:', profile)
  console.log('PROFILE ERROR:', profileError)

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'super_admin'

  return (
    <BarangClient
      initialData={barang ?? []}
      kategoriList={kategori ?? []}
      gradeList={grade ?? []}
      canEdit={isAdmin}
    />
  )
}