// src/app/api/users/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET - list all profiles (untuk refresh)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('profiles').select('*').order('created_at')
  return NextResponse.json(data ?? [])
}

// POST - buat user baru
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Cek role super_admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, password, nama, kode_teknisi, role, no_wa } = await request.json()

  if (!email || !password || !nama) {
    return NextResponse.json({ error: 'Email, password, nama wajib diisi' }, { status: 400 })
  }

  const adminClient = createServiceClient()

  // Buat auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

    if (authError) {
    console.error('AUTH CREATE USER ERROR:', authError)

    return NextResponse.json(
        {
        error: authError.message,
        code: authError.code,
        status: authError.status,
        },
        { status: 400 }
    )
    }

  // Buat profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: authData.user.id,
    nama,
    kode_teknisi: kode_teknisi || null,
    role: role || 'teknisi',
    no_wa: no_wa || null,
    aktif: true,
  })

  if (profileError) {
    // Rollback: hapus auth user
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

// PATCH - update profile user
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, nama, kode_teknisi, role, no_wa } = await request.json()

  const { error } = await supabase.from('profiles').update({
    nama,
    kode_teknisi: kode_teknisi || null,
    role,
    no_wa: no_wa || null,
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}