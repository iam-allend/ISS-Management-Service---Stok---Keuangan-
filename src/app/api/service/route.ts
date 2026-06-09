import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - ambil data service dengan filter
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const tipe = searchParams.get('tipe')
  const notaId = searchParams.get('nota_id')

  let query = supabase.from('v_service_lengkap').select('*').order('tanggal_masuk', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (tipe && tipe !== 'all') query = query.eq('tipe_service', tipe)
  if (notaId) query = query.eq('nota_id', notaId)

  const { data, error } = await query.limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data ?? [])
}