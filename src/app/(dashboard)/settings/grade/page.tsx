import { createClient } from '@/lib/supabase/server'
import GradeClient from './GradeClient'

export default async function GradePage() {
  const supabase = await createClient()
  const { data: grade } = await supabase.from('grade').select('*').order('garansi_hari')
  return <GradeClient initialData={grade ?? []} />
}