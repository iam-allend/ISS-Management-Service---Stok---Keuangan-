import { createClient } from '@/lib/supabase/server'
import BarangClient from './BarangClient'

export default async function InventoryPage() {
  const supabase = await createClient()

  const [{ data: barang }, { data: kategori }, { data: grade }, { data: profile }] = await Promise.all([
    supabase.from('v_barang_lengkap').select('*').order('nama'),
    supabase.from('kategori').select('*, grades:kategori_grade(grade:grade(*))').eq('aktif', true).order('nama'),
    supabase.from('grade').select('*').eq('aktif', true).order('nama'),
    supabase.from('profiles').select('role').single(),
  ])

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  return (
    <BarangClient
      initialData={barang ?? []}
      kategoriList={kategori ?? []}
      gradeList={grade ?? []}
      canEdit={isAdmin}
    />
  )
}