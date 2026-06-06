import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWA, formatWANumber } from '@/lib/fonte'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Cek auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { target, message, nota_id, item_service_id, tipe } = await request.json()

  if (!target || !message) {
    return NextResponse.json({ error: 'target dan message wajib diisi' }, { status: 400 })
  }

  const formattedTarget = formatWANumber(target)
  const result = await sendWA({ target: formattedTarget, message })

  // Log ke database
  await supabase.from('notifikasi_log').insert({
    item_service_id: item_service_id || null,
    nota_id: nota_id || null,
    tipe: tipe || 'custom',
    tujuan_wa: formattedTarget,
    pesan: message,
    status_kirim: result.status ? 'success' : 'failed',
    response_api: { message: result.message },
  })

  // Jika tipe selesai_konfirmasi, mark di item_service
  if (tipe === 'selesai_konfirmasi' && item_service_id && result.status) {
    await supabase.rpc('mark_notif_sent', {
      p_item_id: item_service_id,
      p_tipe: 'selesai_konfirmasi',
    })
  }

  return NextResponse.json(result)
}