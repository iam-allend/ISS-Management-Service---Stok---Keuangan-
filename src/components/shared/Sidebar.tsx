'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  ClipboardCheck, Wrench, Settings, Users, LogOut,
  ChevronDown, Smartphone, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  children?: { label: string; href: string }[]
  roles?: string[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: 'Inventory',
    icon: <Package className="w-4 h-4" />,
    children: [
      { label: 'Master Barang', href: '/inventory' },
      { label: 'Stok Masuk', href: '/inventory/stok-masuk' },
      { label: 'Stok Keluar', href: '/inventory/stok-keluar' },
      { label: 'Stok Opname', href: '/inventory/stok-opname' },
    ],
    roles: ['super_admin', 'admin'],
  },
  {
    label: 'Service',
    icon: <Wrench className="w-4 h-4" />,
    children: [
      { label: 'Semua Service', href: '/service' },
      { label: 'Tambah Service', href: '/service/baru' },
    ],
  },
  {
    label: 'Kelola User',
    href: '/settings/users',
    icon: <Users className="w-4 h-4" />,
    roles: ['super_admin'],
  },
  {
    label: 'Pengaturan Sistem',
    href: '/settings',
    icon: <Settings className="w-4 h-4" />,
    roles: ['super_admin'],
  },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [openMenus, setOpenMenus] = useState<string[]>(['Inventory', 'Service'])
  const [collapsed, setCollapsed] = useState(false)

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredNav = navItems.filter(item =>
    !item.roles || item.roles.includes(profile.role)
  )

  return (
    <>
      {/* Mobile overlay */}
      <div className={cn(
        'fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity',
        collapsed ? 'opacity-0 pointer-events-none' : 'opacity-0 pointer-events-none'
      )} />

      <aside className={cn(
        'relative flex flex-col bg-gray-900 text-white transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-700">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold leading-tight">ISS</p>
              <p className="text-xs text-gray-400 truncate">iPhone Service</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-gray-400 hover:text-white transition"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {filteredNav.map(item => {
            const isActive = item.href
              ? pathname === item.href
              : item.children?.some(c => pathname.startsWith(c.href))
            const isOpen = openMenus.includes(item.label)

            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition',
                      isActive
                        ? 'text-white bg-white/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {item.icon}
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={cn(
                          'w-3 h-3 transition-transform',
                          isOpen && 'rotate-180'
                        )} />
                      </>
                    )}
                  </button>
                  {!collapsed && isOpen && (
                    <div className="ml-4 border-l border-gray-700">
                      {item.children.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center gap-2 pl-4 pr-4 py-2 text-sm transition',
                            pathname === child.href
                              ? 'text-white bg-white/10 border-l-2 border-white -ml-px'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm transition',
                  isActive
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User info & logout */}
        <div className="border-t border-gray-700 p-4">
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium truncate">{profile.nama}</p>
              <p className="text-xs text-gray-400 capitalize">
                {profile.role.replace('_', ' ')} · {profile.kode_teknisi || '-'}
              </p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  )
}