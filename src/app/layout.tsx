import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Impas: Catat Pinjam-Meminjam Uang & Barang Antar Teman",
    template: "%s | Impas",
  },
  description:
    "Catat jelas, konfirmasi cepat, biar sama-sama Impas. Aplikasi pencatatan pinjam-meminjam uang dan barang antar teman dengan tautan konfirmasi dua pihak.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <body className="bg-[#F6F8F7] text-[#0B1312] font-sans antialiased selection:bg-[#E6F4F1] selection:text-[#0F766E]">
        {children}
      </body>
    </html>
  );
}
