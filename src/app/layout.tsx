import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "iPhone Service Solution | Professional Cyber Repair Lab",
  description: "Spesialis Perbaikan & Retrospeksi Hardware iPhone Tingkat Komponen. Cepat, Transparan, Bergaransi.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased min-h-screen overflow-x-hidden`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
