import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'iPhone Service Solution',
  description: 'Sistem Manajemen Service & Inventory iPhone',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}
      >
        {children}
        <Toaster richColors />
      </body>
    </html>
  )
}