'use client'

import { useState } from 'react'
import { cn, STATUS_LABEL, STATUS_COLOR, STATUS_FLOW } from '@/lib/utils'
import type { ServiceStatus } from '@/types'
import { ChevronDown } from 'lucide-react'

interface Props {
  currentStatus: ServiceStatus
  itemId: string
  onChange: (itemId: string, status: ServiceStatus) => void
  disabled?: boolean
}

export default function StatusToggle({ currentStatus, itemId, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)

  if (disabled || currentStatus === 'diambil' || currentStatus === 'cancel') {
    return (
      <span className={cn(
        'inline-block text-xs px-2 py-1 rounded-full border font-medium',
        STATUS_COLOR[currentStatus]
      )}>
        {STATUS_LABEL[currentStatus]}
      </span>
    )
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium cursor-pointer hover:opacity-80 transition',
          STATUS_COLOR[currentStatus]
        )}
      >
        {STATUS_LABEL[currentStatus]}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px]">
            {STATUS_FLOW.map(status => (
              <button
                key={status}
                onClick={() => {
                  onChange(itemId, status)
                  setOpen(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition flex items-center gap-2',
                  status === currentStatus && 'bg-gray-50 font-medium'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', {
                  'bg-yellow-400': status === 'pengecekan',
                  'bg-blue-400': status === 'proses_service',
                  'bg-green-400': status === 'selesai',
                  'bg-gray-400': status === 'diambil',
                })} />
                {STATUS_LABEL[status]}
              </button>
            ))}
            <div className="border-t border-gray-50 mt-1">
              <button
                onClick={() => {
                  onChange(itemId, 'cancel')
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}