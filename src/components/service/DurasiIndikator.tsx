import { cn, getDurasiConfig } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface Props {
  hariMasuk: string // ISO date string
  status: string
  statusAmbil: boolean
}

export default function DurasiIndikator({ hariMasuk, status, statusAmbil }: Props) {
  if (statusAmbil || status === 'diambil' || status === 'cancel') return null

  const hari = Math.floor((Date.now() - new Date(hariMasuk).getTime()) / 86400000)
  const config = getDurasiConfig(hari)

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border font-medium',
      config.bgColor, config.color
    )}>
      <Clock className="w-3 h-3" />
      {config.label}
    </span>
  )
}