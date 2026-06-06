import type { FontePayload, FonteResponse } from '@/types'

const FONTE_API_URL = 'https://api.fonnte.com/send'

/**
 * Kirim pesan WA via Fonte API
 */
export async function sendWA(payload: FontePayload): Promise<FonteResponse> {
  try {
    const res = await fetch(FONTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': process.env.FONTE_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: payload.target,
        message: payload.message,
        countryCode: '62',
      }),
    })

    const data = await res.json()
    return { status: data.status === true, message: data.detail || data.message || 'OK' }
  } catch (err) {
    console.error('[Fonte] Error:', err)
    return { status: false, message: 'Gagal mengirim pesan' }
  }
}

/**
 * Format nomor WA ke format internasional (tanpa +)
 * Contoh: 081234567890 → 6281234567890
 */
export function formatWANumber(nomor: string): string {
  const clean = nomor.replace(/\D/g, '')
  if (clean.startsWith('0')) return '62' + clean.slice(1)
  if (clean.startsWith('62')) return clean
  return '62' + clean
}

/**
 * Buat wa.me link untuk direct chat
 */
export function makeWALink(nomor: string, pesan?: string): string {
  const formatted = formatWANumber(nomor)
  const base = `https://wa.me/${formatted}`
  if (pesan) return `${base}?text=${encodeURIComponent(pesan)}`
  return base
}

// ============================================================
// TEMPLATE PESAN
// ============================================================

export function templateNotifTerlambat(data: {
  no_nota: string
  nama_customer: string
  tipe_hp: string
  jenis_kerusakan: string
  hari_berlalu: number
  nama_teknisi: string
  is_eskalasi: boolean
}): string {
  const emoji = data.is_eskalasi ? '🚨' : '⚠️'
  const level = data.is_eskalasi ? 'ESKALASI' : 'PERINGATAN'

  return `${emoji} *${level} SERVICE TERLAMBAT*

📋 *No. Nota:* ${data.no_nota}
👤 *Customer:* ${data.nama_customer}
📱 *Unit:* ${data.tipe_hp}
🔧 *Kerusakan:* ${data.jenis_kerusakan}
👨‍🔧 *Teknisi:* ${data.nama_teknisi}
⏰ *Sudah ${data.hari_berlalu} hari dalam proses*

${data.is_eskalasi
  ? '❗ Unit ini sudah 4+ hari belum selesai. Segera selesaikan!'
  : '⚡ Unit ini sudah 3 hari belum selesai. Mohon segera ditindaklanjuti.'
}

_iPhone Service Solution_`
}

export function templateKonfirmasiSelesai(data: {
  no_nota: string
  nama_customer: string
  tipe_hp: string
  items: { tipe: string; jenis_kerusakan: string; biaya: number; garansi_hari: number | null }[]
  total_biaya: number
  catatan?: string
}): string {
  const itemLines = data.items.map(item => {
    const garansi = item.garansi_hari
      ? `Garansi ${item.garansi_hari} hari`
      : 'Tanpa garansi'
    const tipeLabel = item.tipe === 'mesin' ? 'Service Mesin' : 'Ganti Sparepart'
    return `• ${tipeLabel}: ${item.jenis_kerusakan}\n  Biaya: Rp ${item.biaya.toLocaleString('id-ID')} | ${garansi}`
  }).join('\n')

  return `✅ *SERVICE SELESAI*

Halo *${data.nama_customer}*, unit Anda sudah selesai diperbaiki!

📋 *No. Nota:* ${data.no_nota}
📱 *Unit:* ${data.tipe_hp}

🔧 *Detail Service:*
${itemLines}

💰 *Total Biaya: Rp ${data.total_biaya.toLocaleString('id-ID')}*
${data.catatan ? `\n📝 *Catatan:* ${data.catatan}` : ''}

Silakan ambil unit Anda di toko kami. Terima kasih! 🙏

_iPhone Service Solution_`
}

export function templatePengingat(data: {
  no_nota: string
  nama_customer: string
  tipe_hp: string
  total_biaya: number
}): string {
  return `📢 *PENGINGAT PENGAMBILAN UNIT*

Halo *${data.nama_customer}*,

Kami ingin mengingatkan bahwa unit Anda:
📱 *${data.tipe_hp}*
📋 No. Nota: *${data.no_nota}*

sudah selesai diperbaiki dan *menunggu untuk diambil*.

💰 *Total Biaya: Rp ${data.total_biaya.toLocaleString('id-ID')}*

Mohon segera diambil. Terima kasih! 🙏

_iPhone Service Solution_`
}