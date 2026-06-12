"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Beranda", href: "/" },
    { name: "Cek Status Nota", href: "/track" },
  ];

  return (
    <div className="fixed top-4 inset-x-0 z-50 max-w-4xl mx-auto px-4">
      <nav className="flex items-center justify-between px-6 py-3 rounded-2xl bg-slate-900/60 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-white/20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Wrench className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          </div>
          <span className="text-sm font-black tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">iSS LAB</span>
        </Link>

        {/* Navigation Links dengan Indikator Aktif */}
        <div className="flex items-center gap-1 sm:gap-2 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 relative", isActive ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" : "text-slate-400 hover:text-slate-200")}
              >
                {item.name}
                {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-[1px]" />}
              </Link>
            );
          })}
        </div>

        {/* Portal Teknisi */}
        <div>
          <Link
            href="/login"
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 block",
              pathname === "/login" ? "bg-white text-slate-950 shadow-lg" : "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/20 hover:opacity-90 active:scale-[0.98]",
            )}
          >
            Portal Lab
          </Link>
        </div>
      </nav>
    </div>
  );
}
