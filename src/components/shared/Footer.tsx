"use client";

import Link from "next/link";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";

const CONTACT_DATA = {
  adminWA: "628883933663",
  instagram: "https://www.instagram.com/iphoneservice_solution/",
  tiktok: "https://www.tiktok.com/@iphoneservicesolution",
};

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/60 backdrop-blur-md px-4 py-12 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-black">i</div>
            <span className="font-bold text-sm tracking-wider text-white">iPhone Service Solution</span>
          </div>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Laboratorium independen penyedia solusi mikro-arsitektur hardware iPhone. Kami tidak berafiliasi secara korporat langsung dengan Apple Inc. Semua merek dagang adalah milik pemegang hak masing-masing.
          </p>
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400">Akses Cepat</h5>
          <div className="flex flex-col gap-2 text-xs text-slate-400 font-medium">
            <Link href="/" className="hover:text-white transition w-fit">
              Halaman Utama
            </Link>
            <Link href="/track" className="hover:text-white transition w-fit">
              Pelacakan Nota Digital
            </Link>
            <Link href="/login" className="hover:text-white transition w-fit">
              Autentikasi Internal Karyawan
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sosial & Komunitas</h5>
          <div className="flex gap-2.5">
            <a href={CONTACT_DATA.instagram} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-pink-400 hover:bg-white/10 transition">
              <FaInstagram className="w-4 h-4" />
            </a>
            <a href={CONTACT_DATA.tiktok} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition">
              <FaTiktok className="w-4 h-4" />
            </a>
            <a href={`https://wa.me/${CONTACT_DATA.adminWA}`} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition">
              <FaWhatsapp className="w-4 h-4" />
            </a>
          </div>
          <p className="text-[10px] text-slate-600 font-medium">Jam Operasional: 10:00 - 21:00 WIB</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[10px] font-medium text-slate-600">
        <p>© {new Date().getFullYear()} iPhone Service Solution. All Rights Reserved Matrix Studio.</p>
        <div className="flex gap-4">
          <span>Sistem v2.4.1-Stable</span>
          <span>Secured with Supabase SSL</span>
        </div>
      </div>
    </footer>
  );
}
