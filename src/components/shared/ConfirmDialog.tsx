'use client'

import { Loader2 } from 'lucide-react'

interface Props {
  title: string
  message: string
  warning?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  confirmLabel?: string
  confirmVariant?: 'danger' | 'default'
}

export default function ConfirmDialog({
  title, message, warning, onConfirm, onCancel, loading, confirmLabel = 'Hapus', confirmVariant = 'danger'
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-2">{message}</p>
        {warning && (
          <p className="text-xs text-orange-600 bg-orange-50 p-2.5 rounded-lg mb-4">{warning}</p>
        )}
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 py-2 rounded-lg text-sm transition disabled:opacity-60 flex items-center justify-center gap-2 ${
              confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-900 hover:bg-gray-700 text-white'
            }`}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}