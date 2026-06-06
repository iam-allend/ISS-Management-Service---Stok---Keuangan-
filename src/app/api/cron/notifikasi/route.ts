import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWA, formatWANumber, templateNotifTerlambat } from '@/lib/fonte'

// Vercel Cron — jalankan setiap hari jam 08.00 WIB (01:00 UTC)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verifikasi request dari Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const adminWA = process.env.ADMIN_WA_NUMBER!

  try {
    // Ambil semua service yang butuh notifikasi
    const { data: services, error } = await supabase
      .rpc('get_service_perlu_notifikasi')

    if (error) throw error
    if (!services || services.length === 0) {
      return NextResponse.json({ message: 'Tidak ada notifikasi yang perlu dikirim', count: 0 })
    }

    let successCount = 0
    let failCount = 0

    for (const svc of services) {
      if (!svc.tipe_notif) continue

      const isEskalasi = svc.tipe_notif === 'eskalasi_4hari'
      const pesan = templateNotifTerlambat({
        no_nota: svc.no_nota,
        nama_customer: svc.nama_customer,
        tipe_hp: svc.tipe_hp,
        jenis_kerusakan: svc.jenis_kerusakan,
        hari_berlalu: svc.hari_berlalu,
        nama_teknisi: svc.no_wa_teknisi ? 'Teknisi' : 'Belum ditentukan',
        is_eskalasi: isEskalasi,
      })

      const targets: { wa: string; label: string }[] = [
        { wa: adminWA, label: 'admin' },
      ]

      if (svc.no_wa_teknisi) {
        targets.push({ wa: formatWANumber(svc.no_wa_teknisi), label: 'teknisi' })
      }

      for (const target of targets) {
        const result = await sendWA({ target: formatWANumber(target.wa), message: pesan })

        // Log notifikasi
        await supabase.from('notifikasi_log').insert({
          item_service_id: svc.item_id,
          nota_id: svc.nota_id,
          tipe: svc.tipe_notif,
          tujuan_wa: target.wa,
          pesan,
          status_kirim: result.status ? 'success' : 'failed',
          response_api: { message: result.message },
        })

        if (result.status) successCount++
        else failCount++
      }

      // Mark notifikasi sudah terkirim
      await supabase.rpc('mark_notif_sent', {
        p_item_id: svc.item_id,
        p_tipe: svc.tipe_notif,
      })
    }

    return NextResponse.json({
      message: 'Cron selesai',
      total_service: services.length,
      notif_success: successCount,
      notif_failed: failCount,
    })

  } catch (err) {
    console.error('[Cron Notifikasi]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}