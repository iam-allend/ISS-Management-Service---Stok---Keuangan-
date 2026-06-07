// src/components/inventory/ImportBarangModal.tsx
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import * as XLSX from 'xlsx'

interface Props {
  kategoriList: any[]
  gradeList: any[]
  onClose: () => void
  onSuccess: () => void
}

interface ImportResult {
  inserted: number
  updated: number
  errors: string[]
}

export default function ImportBarangModal({ kategoriList, gradeList, onClose, onSuccess }: Props) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws) as any[]
      setPreview(rows.slice(0, 5))
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setLoading(true)
    const res: ImportResult = { inserted: 0, updated: 0, errors: [] }

    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws) as any[]

        for (const row of rows) {
          try {
            const kode = String(row['Kode'] || row['kode'] || '').trim()
            const nama = String(row['Nama Barang'] || row['nama'] || row['Nama'] || '').trim()
            if (!kode || !nama) continue

            // Match kategori dan grade berdasarkan nama (case insensitive)
            const kategoriNama = String(row['Kategori'] || row['kategori'] || '').trim()
            const gradeNama = String(row['Grade'] || row['grade'] || '').trim()

            const kategori = kategoriList.find(k => k.nama.toLowerCase() === kategoriNama.toLowerCase())
            const grade = gradeList.find(g => g.nama.toLowerCase() === gradeNama.toLowerCase())

            const payload = {
              kode,
              nama,
              merk: String(row['Merk'] || row['merk'] || '').trim() || null,
              kategori_id: kategori?.id || null,
              grade_id: grade?.id || null,
              harga_jual: Number(String(row['Harga Jual'] || row['harga_jual'] || '0').replace(/[^0-9.]/g, '')) || 0,
              stok: Number(row['Stok'] || row['stok'] || 0) || 0,
              stok_min: Number(row['Stok Min'] || row['stok_min'] || 0) || 0,
              deskripsi: String(row['Deskripsi'] || row['deskripsi'] || '').trim() || null,
              aktif: true,
            }

            // Cek apakah kode sudah ada
            const { data: existing } = await supabase
              .from('barang')
              .select('id')
              .eq('kode', kode)
              .single()

            if (existing) {
              const { error } = await supabase.from('barang').update(payload).eq('id', existing.id)
              if (error) throw error
              res.updated++
            } else {
              const { error } = await supabase.from('barang').insert(payload)
              if (error) throw error
              res.inserted++
            }
          } catch (e: any) {
            res.errors.push(`Baris "${row['Nama Barang'] || row['nama'] || '?'}": ${e.message}`)
          }
        }

        setResult(res)
        setLoading(false)
        if (res.inserted > 0 || res.updated > 0) {
          toast.success(`Import selesai: ${res.inserted} ditambah, ${res.updated} diperbarui`)
        }
      }
      reader.readAsBinaryString(file)
    } catch (e: any) {
      toast.error(`Error: ${e.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Import Master Barang dari Excel</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Format info */}
          <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700 space-y-1">
            <p className="font-medium">Format kolom Excel yang diterima:</p>
            <p>Kode · Nama Barang · Merk · Kategori · Grade · Harga Jual · Stok · Stok Min · Deskripsi</p>
            <p className="text-blue-500">Kategori dan Grade harus sesuai nama yang terdaftar di sistem.</p>
          </div>

          {/* Upload */}
          <div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
              onChange={handleFile} className="hidden" id="import-file"
            />
            <label htmlFor="import-file"
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 cursor-pointer transition">
              <FileSpreadsheet className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">{fileName || 'Pilih file Excel'}</p>
                <p className="text-xs text-gray-400 mt-0.5">.xlsx, .xls, .csv</p>
              </div>
            </label>
          </div>

          {/* Preview */}
          {preview.length > 0 && !result && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Preview 5 baris pertama:</p>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).slice(0, 6).map(key => (
                        <th key={key} className="text-left px-3 py-2 text-gray-500 font-medium">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        {Object.values(row).slice(0, 6).map((val: any, j) => (
                          <td key={j} className="px-3 py-2 text-gray-600 truncate max-w-[100px]">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl p-3">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">Import selesai</p>
                  <p className="text-xs">{result.inserted} barang baru · {result.updated} diperbarui</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-red-700 flex items-center gap-1 mb-2">
                    <AlertCircle className="w-3.5 h-3.5" /> {result.errors.length} error
                  </p>
                  <div className="space-y-1">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-xs text-red-600">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">
              {result ? 'Tutup' : 'Batal'}
            </button>
            {!result && (
              <button onClick={handleImport} disabled={!fileName || loading}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {loading ? 'Mengimport...' : 'Import'}
              </button>
            )}
            {result && (result.inserted > 0 || result.updated > 0) && (
              <button onClick={onSuccess}
                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700">
                Selesai
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}