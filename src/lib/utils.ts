import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { ServiceStatus, ServiceType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// FORMAT DATE
// ============================================================

export function formatDate(dateStr: string | null | undefined, fmt = 'dd MMM yyyy'): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), fmt, { locale: localeId })
  } catch {
    return '-'
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  return formatDate(dateStr, 'dd MMM yyyy, HH:mm')
}

export function formatDateRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: localeId })
  } catch {
    return '-'
  }
}

export function hariSejak(dateStr: string): number {
  try {
    return differenceInDays(new Date(), parseISO(dateStr))
  } catch {
    return 0
  }
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// ============================================================
// FORMAT CURRENCY
// ============================================================

export function formatRupiah(amount: number | null | undefined): string {
  if (amount == null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ============================================================
// SERVICE STATUS HELPERS
// ============================================================

export const STATUS_LABEL: Record<ServiceStatus, string> = {
  pengecekan:     'Pengecekan',
  proses_service: 'Proses Service',
  selesai:        'Selesai',
  diambil:        'Diambil',
  cancel:         'Cancel',
}

export const STATUS_COLOR: Record<ServiceStatus, string> = {
  pengecekan:     'bg-yellow-100 text-yellow-800 border-yellow-200',
  proses_service: 'bg-blue-100 text-blue-800 border-blue-200',
  selesai:        'bg-green-100 text-green-800 border-green-200',
  diambil:        'bg-gray-100 text-gray-600 border-gray-200',
  cancel:         'bg-red-100 text-red-700 border-red-200',
}

export const STATUS_FLOW: ServiceStatus[] = [
  'pengecekan',
  'proses_service',
  'selesai',
  'diambil',
]

export const TIPE_LABEL: Record<ServiceType, string> = {
  mesin:     'Service Mesin',
  interface: 'Ganti Sparepart',
}

// ============================================================
// INDIKATOR DURASI (warna berdasarkan lama hari)
// ============================================================

export function getDurasiConfig(hari: number): {
  label: string
  color: string
  bgColor: string
  dotColor: string
} {
  if (hari <= 1) return {
    label: `${hari} hari`,
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    dotColor: 'bg-green-500',
  }
  if (hari === 2) return {
    label: `${hari} hari`,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-200',
    dotColor: 'bg-yellow-500',
  }
  if (hari === 3) return {
    label: `${hari} hari ⚠️`,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    dotColor: 'bg-orange-500',
  }
  return {
    label: `${hari} hari 🔴`,
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    dotColor: 'bg-red-500',
  }
}

// ============================================================
// GARANSI HELPERS
// ============================================================

export function getGaransiStatus(garansiMulai: string | null, garansiHari: number | null): {
  label: string
  expired: boolean
  color: string
} {
  if (!garansiMulai || !garansiHari) {
    return { label: '-', expired: false, color: 'text-gray-400' }
  }

  const mulai = parseISO(garansiMulai)
  const sampai = new Date(mulai)
  sampai.setDate(sampai.getDate() + garansiHari)
  const now = new Date()
  const expired = now > sampai
  const sisaHari = differenceInDays(sampai, now)

  if (expired) {
    return {
      label: `Expired ${format(sampai, 'dd MMM yyyy', { locale: localeId })}`,
      expired: true,
      color: 'text-red-600',
    }
  }

  return {
    label: `s/d ${format(sampai, 'dd MMM yyyy', { locale: localeId })} (${sisaHari} hari lagi)`,
    expired: false,
    color: sisaHari <= 7 ? 'text-orange-600' : 'text-green-600',
  }
}

// ============================================================
// MISC
// ============================================================

export function generateNoNota(prefix = 'SVC'): string {
  const now = new Date()
  const bulan = String(now.getMonth() + 1).padStart(2, '0')
  const tahun = String(now.getFullYear()).slice(2)
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}/${tahun}${bulan}/${rand}`
}

export function truncate(str: string, max = 40): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '...'
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}