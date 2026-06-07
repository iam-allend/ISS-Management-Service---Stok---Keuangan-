import { createClient } from '@/lib/supabase/server'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at')

  return <UsersClient initialData={users ?? []} />
}