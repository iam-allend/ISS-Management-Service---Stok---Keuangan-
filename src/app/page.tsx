"use client";

import Image from "next/image";
import { useState } from "react";
import { Smartphone, ShieldCheck, Clock, ShieldAlert, ArrowRight, Cpu, Zap, Activity, ChevronRight, Layers, MapPin } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

const CONTACT_DATA = {
  adminWA: "628883933663",
  mapsUrl: "https://share.google/iIXcDdF6ynMX02ebC",
  alamat: "Jl. Puri Anjasmoro Raya No.24, Karangayu, Kec. Semarang Barat, 50149",
};

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const stats = [
    { value: "7k+", label: "iPhone Diperbaiki", icon: <Smartphone className="w-4 h-4 text-emerald-400" /> },
    { value: "85.7%", label: "Tingkat Keberhasilan", icon: <Activity className="w-4 h-4 text-blue-400" /> },
    { value: "5 Jam", label: "Rata-rata Durasi", icon: <Clock className="w-4 h-4 text-purple-400" /> },
    { value: "548 Hari", label: "Full Garansi Proteksi", icon: <ShieldCheck className="w-4 h-4 text-amber-400" /> },
  ];

  const services = [
    {
      title: "IC & Logic Board Micro-Soldering",
      desc: "Perbaikan mati total, konslet jalur baterai, CPU reballing, dan bypass audio IC tingkat mikroskopis dengan presisi tinggi.",
      tag: "Advanced Hardware",
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
    },
    {
      title: "Pergantian Sparepart Ekspres",
      desc: "Pemasangan komponen esensial seperti LCD, Baterai original bypass warning, dan modul Kamera pengerjaan kilat hanya 15 - 30 menit bisa ditunggu.",
      tag: "15 - 30 Mins Fix",
      icon: <Smartphone className="w-6 h-6 text-blue-400" />,
    },
    {
      title: "Diagnosa Gratis & Cek Mesin",
      desc: "Analisis awal kerusakan gratis. Jika terindikasi masuk ke masalah sirkuit berat, pengecekan penuh logic board selesai dalam waktu 12 - 24 jam.",
      tag: "Free Diagnosis",
      icon: <Activity className="w-6 h-6 text-emerald-400" />,
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* GLOBAL BACKGROUND DESIGN */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none animate-pulse duration-700" />

      {/* RE-USABLE NAVBAR */}
      <Navbar />

      {/* ─── HERO SECTION WITH IMAGE BANNER (SPLIT LAYOUT) ─── */}
      <section className="relative pt-36 pb-20 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Kolom Kiri: Headline & CTA */}
        <div className="lg:col-span-7 space-y-6 text-left transform transition-all duration-700 translate-y-0 opacity-100">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 tracking-wider uppercase shadow-inner">
            <Cpu className="w-3 h-3 animate-spin duration-3000" /> Apple Logic Board Specialist
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Restorasi iPhone Level <br /> Mikroskopis, <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">Bukan Sekadar Ganti Part.</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
            Solusi perbaikan hardware iPhone mutakhir di Kota Anda. Menangani malfungsi sirkuit mesin, rekondisi komponen kaca, hingga pemulihan daya dengan standar laboratorium sirkuit digital.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full">
            <a href="/track" className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-100 text-slate-950 font-bold text-sm shadow-2xl hover:bg-white active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
              <span>Lacak Status Service</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={`https://wa.me/${CONTACT_DATA.adminWA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <FaWhatsapp className="w-4 h-4 text-emerald-400" /> Konsultasi Kerusakan
            </a>
          </div>
        </div>

        {/* Kolom Kanan: PREMIUM ANTI-MAINSTREAM IMAGE BANNER */}
        <div className="lg:col-span-5 relative group">
          {/* Efek Pendaran Belakang Gambar */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

          {/* Frame Kontainer Gambar */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] shadow-2xl">
            <Image
              src="https://img.magnific.com/premium-photo/smartphone-with-cracked-screen-repair-service-desk-phone-repair-process_262708-68485.jpg?semt=ais_hybrid&w=740&q=80"
              alt="iPhone Hardware Micro-Soldering Repair Lab"
              fill
              priority
              className="object-cover object-center grayscale opacity-80 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
            />
            {/* Overlay Gradient Cyber pada Gambar */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />

            {/* Tag Overlay Mengambang di Dalam Banner */}
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-900/80 border border-white/5 backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-500 tracking-widest block uppercase">WORKBENCH LIVE</span>
                <span className="text-xs font-bold text-white">Microsoldering Station 03</span>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS COUNTDOWN COUNTER ─── */}
      <section className="py-8 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 backdrop-blur-sm flex flex-col justify-between hover:border-white/10 transition-all duration-300">
              <div className="p-2 bg-white/5 rounded-xl w-fit mb-4">{s.icon}</div>
              <div>
                <p className="text-2xl font-black text-white tracking-tight">{s.value}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SERVICES GRID SECTION ─── */}
      <section id="services" className="py-20 max-w-7xl mx-auto px-4 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Advanced Matrix Capability</h2>
          <p className="text-3xl font-extrabold tracking-tight text-white">Layanan Spesialisasi iSS Lab</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((srv, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 hover:border-white/10 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-white/5 text-[10px] text-slate-400 font-mono tracking-wider">{srv.tag}</div>
              <div className="mb-6 p-3 rounded-xl bg-slate-900 w-fit border border-white/5 group-hover:scale-105 transition-transform duration-300">{srv.icon}</div>
              <h3 className="text-base font-bold text-white mb-2">{srv.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{srv.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ & KEBIJAKAN INTEGRASI ─── */}
      <section id="rules" className="py-20 max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">F.A.Q System</h2>
            <p className="text-2xl font-black text-white tracking-tight">Pertanyaan Umum Lab</p>
          </div>
          <div className="space-y-2">
            {[
              { q: "Berapa lama proses pengerjaan ganti LCD?", a: "Untuk penggantian LCD biasa memakan waktu 30 hingga 60 menit bisa ditunggu langsung di lab kami." },
              { q: "Apakah data di dalam iPhone saya aman saat diservice?", a: "Ya, privasi data Anda aman 100%. Kami tidak meminta passcode internal kecuali untuk pengujian fungsi hardware esensial pasca perbaikan." },
            ].map((f, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full px-4 py-3.5 flex items-center justify-between font-bold text-xs text-slate-200 text-left hover:bg-white/[0.02]">
                  <span>{f.q}</span>
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${activeFaq === i ? "rotate-90" : ""}`} />
                </button>
                {activeFaq === i && <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/5 bg-black/20 animate-in fade-in duration-200">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Kebijakan Ringkas Toko */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/[0.03] to-transparent border border-amber-500/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-4">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Pemberitahuan Retensi & Perlindungan</h3>
            </div>
            <ul className="space-y-3 text-[11px] text-slate-400 leading-relaxed list-disc list-inside">
              <li>Garansi Void apabila indikator stiker segel internal lab robek atau terkena cairan sekunder.</li>
              <li>Unit yang telah dinyatakan selesai dan tidak diambil melebihi jangka waktu 30 hari kalender berada di luar tanggung jawab penyimpanan kami.</li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {CONTACT_DATA.alamat}
            </span>
            <a href={CONTACT_DATA.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 font-bold hover:underline inline-flex items-center gap-1">
              Buka Maps <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* RE-USABLE FOOTER */}
      <Footer />
    </div>
  );
}
