"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Smartphone, CheckCircle, Clock, Wrench, Package, Loader2, MessageCircle, MapPin, ShieldCheck, AlertTriangle, ExternalLink, Info } from "lucide-react";
import { formatDate, STATUS_LABEL, STATUS_COLOR, TIPE_LABEL, formatRupiah, getGaransiStatus, cn } from "@/lib/utils";
import type { TrackingData } from "@/types";
import { FaInstagram } from "react-icons/fa";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

// ─── DATA TOKO (TETAP SAMA) ────────────────────────────────
const CONTACT = {
  adminWA: "628883933663", // nomor WA admin
  instagram: "https://www.instagram.com/iphoneservice_solution/",
  tiktok: "https://www.tiktok.com/@iphoneservicesolution",
  mapsUrl: "https://share.google/iIXcDdF6ynMX02ebC",
  alamatSingkat: "Jl. Puri Anjasmoro Raya No.24, Karangayu, Kec. Semarang Barat, 50149",
};

export default function TrackPage() {
  const supabase = createClient();
  const [noNota, setNoNota] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingData | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!noNota.trim()) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);

    const { data, error } = await supabase.rpc("get_tracking_by_nota", {
      p_no_nota: noNota.trim().toUpperCase(),
    });

    setLoading(false);

    if (error || !data || data.length === 0) {
      setNotFound(true);
      return;
    }

    setResult(data[0] as TrackingData);
  }

  const totalBiaya = result?.items.reduce((sum, i) => sum + (i.biaya || 0), 0) ?? 0;

  const getOverallStatus = (data: TrackingData) => {
    if (data.status_ambil) {
      return { label: "Sudah Diambil", icon: <CheckCircle className="w-3.5 h-3.5" />, color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
    }
    const allSelesai = data.items.length > 0 && data.items.every((i) => i.status === "selesai" || i.status === "cancel");
    if (allSelesai) {
      return { label: "Selasai, Siap Diambil", icon: <CheckCircle className="w-3.5 h-3.5" />, color: "bg-green-500/10 text-green-400 border border-green-500/20" };
    }
    const adaProses = data.items.some((i) => i.status === "proses_service");
    if (adaProses) {
      return { label: "Sedang Dikerjakan", icon: <Wrench className="w-3.5 h-3.5" />, color: "bg-blue-500/10 text-blue-400 border border-blue-500/20" };
    }
    return { label: "Menunggu Pengecekan", icon: <Clock className="w-3.5 h-3.5" />, color: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
  };

  const getGaransiCountdown = (garansiMulai: string | null, garansiHari: number | null) => {
    if (!garansiMulai || !garansiHari) return null;
    const mulai = new Date(garansiMulai);
    const sampai = new Date(mulai);
    sampai.setDate(sampai.getDate() + garansiHari);
    const now = new Date();
    const diffMs = sampai.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Garansi berakhir ${formatDate(sampai.toISOString())}`, expired: true, days: diffDays };
    }
    if (diffDays === 0) {
      return { text: "Garansi berakhir hari ini", expired: false, days: 0 };
    }
    return { text: `Garansi berakhir dalam ${diffDays} hari`, expired: false, days: diffDays };
  };

  const waLink = (msg: string) => `https://wa.me/${CONTACT.adminWA}?text=${encodeURIComponent(msg)}`;

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-slate-950 text-slate-100 antialiased bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black selection:bg-white/10">
        {/* Container Utama */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
          {/* Header Section */}
          <header className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-xl backdrop-blur-md">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">iPhone Service Solution</h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Sistem Pelacakan Status Perbaikan Terintegrasi</p>
            </div>
          </header>

          {/* Search Bar Container */}
          <div className="max-w-xl mx-auto mb-12">
            <form onSubmit={handleSearch} className="flex gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl focus-within:border-white/20 transition-all duration-300">
              <input
                type="text"
                value={noNota}
                onChange={(e) => setNoNota(e.target.value)}
                placeholder="Masukkan No. Nota (contoh: SVC/2506/1234)"
                className="flex-1 px-4 py-3 rounded-xl bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
              />
              <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-white text-slate-950 font-semibold text-sm hover:bg-slate-100 active:scale-[0.98] transition disabled:opacity-60 flex items-center gap-2 shadow-lg">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Cek Status
              </button>
            </form>

            {/* Not Found State */}
            {notFound && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center animate-in fade-in-50 duration-200">
                <p className="text-red-400 text-sm font-medium">No. nota tidak ditemukan.</p>
                <p className="text-slate-400 text-xs mt-0.5">Periksa kembali penulisan nomor nota Anda.</p>
                <a
                  href={waLink(`Halo, saya ingin menanyakan status service dengan no nota: ${noNota}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Tanya Admin via WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* ─── DYNAMIC LAYOUT: 70% LEFT | 30% RIGHT ─── */}
          {result ? (
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* 70% KOLOM KIRI: Data Service & Unit Items */}
              <div className="lg:col-span-7 space-y-5">
                {/* Card Ringkasan Info Unit */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-white/40 to-transparent" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">ID TRANSAKSI</span>
                      <p className="text-xl font-bold tracking-tight text-white">{result.no_nota}</p>
                    </div>
                    {(() => {
                      const overall = getOverallStatus(result);
                      return (
                        <span className={cn("inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl font-medium w-fit shadow-inner", overall.color)}>
                          {overall.icon} {overall.label}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Spesifikasi Unit</p>
                      <p className="font-semibold text-slate-200">{result.tipe_hp}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Tanggal Masuk</p>
                      <p className="font-semibold text-slate-200">{formatDate(result.tanggal_masuk)}</p>
                    </div>
                    {result.tanggal_ambil && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-medium">Tanggal Diambil</p>
                        <p className="font-semibold text-emerald-400">{formatDate(result.tanggal_ambil)}</p>
                      </div>
                    )}
                    <div className="space-y-1 col-span-2 md:col-span-1 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                      <p className="text-xs text-slate-500 font-medium">Total Akumulasi Biaya</p>
                      <p className="text-base font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{formatRupiah(totalBiaya)}</p>
                    </div>
                  </div>
                </div>

                {/* List Detail Service Items */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rincian Tindakan / Sparepart</h2>
                  </div>

                  {result.items.map((item, idx) => {
                    const garansi = getGaransiStatus(item.garansi_mulai, item.garansi_hari);
                    const countdown = getGaransiCountdown(item.garansi_mulai, item.garansi_hari);

                    return (
                      <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-xl relative group hover:border-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-4 border-b border-white/5">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("p-2 rounded-xl", item.tipe === "mesin" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400")}>
                              {item.tipe === "mesin" ? <Wrench className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 block">Kategori Tindakan</span>
                              <span className="text-sm font-bold text-slate-200">{TIPE_LABEL[item.tipe]}</span>
                            </div>
                          </div>
                          <span className={cn("text-xs px-2.5 py-1 rounded-lg border font-semibold tracking-wide", STATUS_COLOR[item.status])}>{STATUS_LABEL[item.status]}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-2">
                          <div className="flex justify-between md:flex-col md:justify-center md:gap-1 p-3 rounded-xl bg-white/[0.01]">
                            <span className="text-slate-500 text-xs">Deskripsi Kerusakan</span>
                            <span className="font-medium text-slate-200 text-right md:text-left">{item.jenis_kerusakan}</span>
                          </div>
                          <div className="flex justify-between md:flex-col md:justify-center md:gap-1 p-3 rounded-xl bg-white/[0.01]">
                            <span className="text-slate-500 text-xs">Biaya Perbaikan</span>
                            <span className="font-semibold text-slate-200 text-right md:text-left">{formatRupiah(item.biaya)}</span>
                          </div>
                          {item.kode_teknisi && (
                            <div className="flex justify-between md:flex-col md:justify-center md:gap-1 p-3 rounded-xl bg-white/[0.01]">
                              <span className="text-slate-500 text-xs">Penanggung Jawab Teknisi</span>
                              <span className="font-medium text-slate-300 text-right md:text-left">{item.kode_teknisi}</span>
                            </div>
                          )}
                          {item.tanggal_selesai && (
                            <div className="flex justify-between md:flex-col md:justify-center md:gap-1 p-3 rounded-xl bg-white/[0.01]">
                              <span className="text-slate-500 text-xs">Waktu Penyelesaian</span>
                              <span className="font-medium text-slate-300 text-right md:text-left">{formatDate(item.tanggal_selesai)}</span>
                            </div>
                          )}
                          {item.garansi_hari && (
                            <div className="flex justify-between md:flex-col md:justify-center md:gap-1 p-3 rounded-xl bg-white/[0.01] col-span-1 md:col-span-2">
                              <span className="text-slate-500 text-xs">Masa Berlaku Garansi</span>
                              <span className={cn("font-medium text-sm text-right md:text-left", garansi.color)}>{item.garansi_mulai ? garansi.label : `${item.garansi_hari} hari (aktif setelah unit diambil)`}</span>
                            </div>
                          )}
                        </div>

                        {/* Garansi countdown badge */}
                        {countdown && (
                          <div
                            className={cn(
                              "mt-4 flex items-center gap-2.5 text-xs px-3.5 py-3 rounded-xl border backdrop-blur-sm",
                              countdown.expired ? "bg-red-500/5 text-red-400 border-red-500/10" : countdown.days <= 7 ? "bg-amber-500/5 text-amber-400 border-amber-500/10" : "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
                            )}
                          >
                            <ShieldCheck className="w-4 h-4 shrink-0" />
                            <span className="font-medium">{countdown.text}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 30% KOLOM KANAN: Ketentuan Kebijakan & Hubungi Kami */}
              <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-6">
                {/* Card Hubungi Kami (Pindah Posisi ke Samping) */}
                <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
                  <h3 className="text-sm font-bold text-white tracking-wide mb-3.5 flex items-center gap-2">
                    <span>Hubungi & Support Layanan</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <a
                      href={waLink(`Halo, saya ingin menanyakan tentang nota ${result.no_nota}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 border border-emerald-500/10 transition group"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                      <span>WhatsApp Admin</span>
                    </a>
                    <a
                      href={CONTACT.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-pink-500/10 text-pink-400 text-xs font-semibold hover:bg-pink-500/20 border border-pink-500/10 transition group"
                    >
                      <FaInstagram className="w-4 h-4 text-pink-400 group-hover:scale-110 transition" />
                      <span>Instagram Resmi</span>
                    </a>
                    <a
                      href={CONTACT.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-500/10 text-slate-300 text-xs font-semibold hover:bg-slate-500/20 border border-slate-500/10 transition group"
                    >
                      <svg className="w-4 h-4 text-slate-300 group-hover:scale-110 transition" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                      <span>TikTok Toko</span>
                    </a>
                    <a
                      href={CONTACT.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 border border-blue-500/10 transition group"
                    >
                      <MapPin className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                      <span>Lokasi Google Maps</span>
                    </a>
                  </div>

                  <div className="mt-3.5 pt-3.5 border-t border-white/5">
                    <a href={CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-xs text-slate-500 hover:text-slate-400 transition group">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-600 group-hover:text-slate-400" />
                      <span className="line-clamp-2 leading-relaxed">{CONTACT.alamatSingkat}</span>
                    </a>
                  </div>
                </div>

                {/* Card Ketentuan & Kebijakan Layanan */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ketentuan & Kebijakan</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-400 leading-relaxed list-none pl-0">
                    <li className="relative pl-3.5 before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-slate-600 before:rounded-full">
                      Garansi service tidak berlaku jika unit mengalami kerusakan akibat air/cairan, jatuh/terbentur, dibongkar oleh pihak lain selain teknisi kami, atau penyalahgunaan di luar kewajaran.
                    </li>
                    <li className="relative pl-3.5 before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-slate-600 before:rounded-full">
                      Garansi sparepart berlaku sesuai grade yang dipilih saat transaksi (lihat detail garansi di atas), terhitung mulai dari tanggal unit diambil.
                    </li>
                    <li className="relative pl-3.5 before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-slate-600 before:rounded-full">
                      Unit yang sudah selesai service namun belum diambil dalam <strong className="text-slate-200 font-semibold">30 hari kalender</strong> akan dikenakan biaya penitipan, dan toko tidak bertanggung jawab atas
                      kerusakan/kehilangan data setelah periode tersebut.
                    </li>
                    <li className="relative pl-3.5 before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-slate-600 before:rounded-full">
                      Data pribadi (foto, kontak, dll) pada unit menjadi tanggung jawab pemilik. Disarankan untuk backup data sebelum melakukan service.
                    </li>
                    <li className="relative pl-3.5 before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-slate-600 before:rounded-full">
                      Estimasi biaya dapat berubah jika ditemukan kerusakan tambahan saat pengecekan lebih lanjut, dan akan dikonfirmasi terlebih dahulu kepada customer.
                    </li>
                    <li className="relative pl-3.5 before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-slate-600 before:rounded-full">
                      Dengan menyerahkan unit untuk diservice, customer dianggap telah menyetujui seluruh ketentuan yang berlaku di toko kami.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Tampilan Default Sebelum Ada Hasil Pencarian */
            !notFound && (
              <div className="max-w-xl mx-auto mt-6 animate-in fade-in duration-300">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center shadow-xl backdrop-blur-md">
                  <p className="text-xs text-slate-500 font-medium mb-4">Butuh Layanan Bantuan Cepat?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={waLink("Halo, saya ingin bertanya tentang service iPhone")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 border border-emerald-500/10 transition"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                    <a
                      href={CONTACT.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 border border-blue-500/10 transition"
                    >
                      <MapPin className="w-4 h-4" /> Lokasi Toko
                    </a>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
