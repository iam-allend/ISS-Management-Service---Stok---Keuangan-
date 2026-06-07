'use client'

import { useState, useCallback } from 'react'
import { Plus, Edit2, UserX, UserCheck, X, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Profile, UserRole } from '@/types'

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  teknisi: 'Teknisi',
}
const ROLE_COLOR: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  teknisi: 'bg-green-100 text-green-800 border-green-200',
}

interface Props { initialData: Profile[] }

export default function UsersClient({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nama, setNama] = useState('')
  const [kodeTeknisi, setKodeTeknisi] = useState('')
  const [role, setRole] = useState<UserRole>('teknisi')
  const [noWA, setNoWA] = useState('')

  const refresh = useCallback(async () => {
    const res = await fetch('/api/users')
    if (res.ok) {
      const json = await res.json()
      setData(json)
    }
  }, [])

  const openForm = (item?: Profile) => {
    if (item) {
      setEditItem(item)
      setNama(item.nama)
      setKodeTeknisi(item.kode_teknisi || '')
      setRole(item.role)
      setNoWA(item.no_wa || '')
      setEmail('')
      setPassword('')
    } else {
      setEditItem(null)
      setNama('')
      setKodeTeknisi('')
      setRole('teknisi')
      setNoWA('')
      setEmail('')
      setPassword('')
    }
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!nama.trim()) { toast.error('Nama wajib diisi'); return }
    if (!editItem && (!email.trim() || !password.trim())) {
      toast.error('Email dan password wajib diisi'); return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: editItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editItem?.id,
          email,
          password,
          nama,
          kode_teknisi: kodeTeknisi || null,
          role,
          no_wa: noWA || null,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      toast.success(editItem ? 'User diperbarui.' : 'User ditambahkan.')
      setShowForm(false)
      // Refresh data
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: fresh } = await supabase.from('profiles').select('*').order('created_at')
      if (fresh) setData(fresh as Profile[])
    } catch (e: any) {
      toast.error('Gagal', { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const toggleAktif = async (item: Profile) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ aktif: !item.aktif }).eq('id', item.id)
    if (error) { toast.error('Gagal', { description: error.message }); return }
    toast.success(`User ${!item.aktif ? 'diaktifkan' : 'dinonaktifkan'}`)
    setData(prev => prev.map(u => u.id === item.id ? { ...u, aktif: !u.aktif } : u))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola User</h1>
          <p className="text-sm text-gray-500">{data.length} user terdaftar</p>
        </div>
        <button onClick={() => openForm()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition">
          <Plus className="w-4 h-4" /> Tambah User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">No WA</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map(user => (
              <tr key={user.id} className={cn('hover:bg-gray-50 transition', !user.aktif && 'opacity-50')}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-800">{user.nama}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{user.kode_teknisi || '—'}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', ROLE_COLOR[user.role])}>
                    {ROLE_LABEL[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{user.no_wa || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', user.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                    {user.aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {user.role !== 'super_admin' && (
                      <>
                        <button onClick={() => openForm(user)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleAktif(user)} className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition" title={user.aktif ? 'Nonaktifkan' : 'Aktifkan'}>
                          {user.aktif ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editItem ? 'Edit User' : 'Tambah User'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {!editItem && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 karakter"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama *</label>
                <input value={nama} onChange={e => setNama(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kode</label>
                  <input value={kodeTeknisi} onChange={e => setKodeTeknisi(e.target.value)}
                    placeholder="TK01, ADM01"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    <option value="teknisi">Teknisi</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">No. WA</label>
                <input value={noWA} onChange={e => setNoWA(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Batal</button>
                <button onClick={handleSave} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editItem ? 'Simpan' : 'Buat User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}