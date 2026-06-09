import { cn, STATUS_LABEL, STATUS_COLOR } from '@/lib/utils'
import type { ServiceStatus } from '@/types'

interface Props {
  status: ServiceStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  return (
    <span className={cn(
      'inline-block rounded-full border font-medium',
      STATUS_COLOR[status],
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
    )}>
      {STATUS_LABEL[status]}
    </span>
  )
}