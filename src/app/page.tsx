import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LandingInteractiveStage } from "@/components/landing/LandingInteractiveStage";
import { LandingLenis } from "@/components/landing/LandingLenis";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F7] text-[#0B1312]">
      <LandingLenis />
      {/* Borderless Sticky Top Header at y=0 */}
      <header className="sticky top-0 z-30 w-full bg-[#F6F8F7]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <BrandLogo href="/" size="lg" />

          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center min-h-[42px] px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-[14px] font-semibold text-white transition-[background-color] duration-150 shrink-0"
            >
              Ke dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/login"
                className="inline-flex items-center justify-center min-h-[42px] px-4 rounded-xl text-[14px] font-semibold text-[#0B1312]"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center min-h-[42px] px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-[14px] font-semibold text-white transition-[background-color] duration-150"
              >
                Mulai gratis
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Centered Monumental Hero + Wide Interactive Stage */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 pb-16 md:pt-16 md:pb-24 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-[clamp(2.5rem,6.5vw,4.75rem)] font-extrabold text-[#0B1312] leading-[1.03] tracking-[-0.04em] text-balance">
              Catat pinjaman tanpa canggung, biar sama-sama Impas.
            </h1>

            <p className="text-[16px] sm:text-[18px] text-[#475569] leading-relaxed max-w-2xl mx-auto">
              Catat uang atau barang yang dipinjam teman, kirim satu tautan
              WhatsApp, dan konfirmasi tanpa wajib bikin akun.
            </p>

            <div className="pt-1">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="inline-flex items-center justify-center gap-2 min-h-[50px] px-7 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[15px] font-semibold transition-[background-color,transform] duration-150 active:scale-[0.99]"
              >
                {user ? "Buka dashboard" : "Mulai catat gratis"}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="mt-12 md:mt-16">
            <LandingInteractiveStage />
          </div>
        </section>

        {/* Cara Kerja: Full-Bleed White Band with Editorial Rows */}
        <section
          id="cara-kerja"
          className="bg-white border-y border-[#DDE4E2] py-16 md:py-24"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0B1312] tracking-[-0.03em] max-w-2xl mb-12">
              Tiga langkah sederhana agar catatan tetap jelas
            </h2>

            <ol className="divide-y divide-[#DDE4E2] border-y border-[#DDE4E2]">
              <li className="scroll-reveal py-7 sm:py-9 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline">
                <span className="md:col-span-2 text-[14px] font-bold text-[#0F766E] tabular-nums">
                  Langkah 1
                </span>
                <h3 className="md:col-span-4 text-[20px] font-bold text-[#0B1312]">
                  Catat uang atau barang
                </h3>
                <p className="md:col-span-6 text-[15px] text-[#475569] leading-relaxed max-w-[65ch]">
                  Masukkan nominal uang atau nama barang yang dipinjamkan, pilih
                  kontak teman, tentukan tanggal jatuh tempo, dan lampirkan foto
                  bukti bila diperlukan.
                </p>
              </li>

              <li className="scroll-reveal py-7 sm:py-9 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline">
                <span className="md:col-span-2 text-[14px] font-bold text-[#0F766E] tabular-nums">
                  Langkah 2
                </span>
                <h3 className="md:col-span-4 text-[20px] font-bold text-[#0B1312]">
                  Kirim tautan konfirmasi
                </h3>
                <p className="md:col-span-6 text-[15px] text-[#475569] leading-relaxed max-w-[65ch]">
                  Bagikan tautan publik ke WhatsApp temanmu. Teman cukup membaca
                  rincian dan menekan tombol konfirmasi tanpa wajib mendaftar
                  akun.
                </p>
              </li>

              <li className="scroll-reveal py-7 sm:py-9 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline">
                <span className="md:col-span-2 text-[14px] font-bold text-[#0F766E] tabular-nums">
                  Langkah 3
                </span>
                <h3 className="md:col-span-4 text-[20px] font-bold text-[#0B1312]">
                  Pantau cicilan hingga Impas
                </h3>
                <p className="md:col-span-6 text-[15px] text-[#475569] leading-relaxed max-w-[65ch]">
                  Catat cicilan bertahap atau tandai barang sudah kembali.
                  Seluruh riwayat aktivitas tersimpan rapi sampai status
                  berubah menjadi Impas.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* Fitur Utama: 2x2 Hairline-Divided Architectural Grid */}
        <section id="fitur" className="max-w-6xl mx-auto px-4 sm:px-8 py-16 md:py-24">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0B1312] tracking-[-0.03em] max-w-2xl mb-12">
            Dibuat khusus untuk pinjam-meminjam antar teman
          </h2>

          <div className="bg-white border border-[#DDE4E2] rounded-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            <div className="scroll-reveal p-7 sm:p-9 space-y-2.5 border-b md:border-r border-[#DDE4E2]">
              <h3 className="text-[20px] font-bold text-[#0B1312]">
                Cicilan uang selalu terhitung otomatis
              </h3>
              <p className="text-[15px] text-[#475569] leading-relaxed max-w-[65ch]">
                Pantau sisa tagihan setiap kali ada pembayaran sebagian, lengkap
                dengan tanggal bayar dan lampiran bukti transfer.
              </p>
            </div>

            <div className="scroll-reveal p-7 sm:p-9 space-y-2.5 border-b border-[#DDE4E2]">
              <h3 className="text-[20px] font-bold text-[#0B1312]">
                Barang pinjaman tidak mudah terlupa
              </h3>
              <p className="text-[15px] text-[#475569] leading-relaxed max-w-[65ch]">
                Kamera, buku, atau perkakas tercatat jelas siapa peminjamnya,
                lengkap dengan foto kondisi awal dan saat dikembalikan.
              </p>
            </div>

            <div className="scroll-reveal p-7 sm:p-9 space-y-2.5 border-b md:border-b-0 md:border-r border-[#DDE4E2]">
              <h3 className="text-[20px] font-bold text-[#0B1312]">
                Konfirmasi dua pihak tanpa wajib login
              </h3>
              <p className="text-[15px] text-[#475569] leading-relaxed max-w-[65ch]">
                Peminjam cukup membuka tautan publik untuk meninjau rincian dan
                menyetujui catatan pinjaman, tanpa perlu membuat akun.
              </p>
            </div>

            <div className="scroll-reveal p-7 sm:p-9 space-y-2.5">
              <h3 className="text-[20px] font-bold text-[#0B1312]">
                Pengingat WhatsApp dengan bahasa nyaman
              </h3>
              <p className="text-[15px] text-[#475569] leading-relaxed max-w-[65ch]">
                Pilih gaya pesan Santai atau Formal, sesuaikan teks seperlunya,
                lalu kirim langsung ke WhatsApp teman dalam satu klik.
              </p>
            </div>
          </div>
        </section>

        {/* Closing Deep Emerald Stage */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-16 md:pb-24">
          <div className="bg-[#0B4F4A] rounded-2xl p-8 sm:p-12 md:p-14 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em]">
                Rapikan catatan pinjamanmu mulai hari ini
              </h2>
              <p className="text-[15px] text-[#CCFBF1] leading-relaxed">
                Daftar gratis dalam hitungan detik dengan email dan kata sandi.
              </p>
            </div>

            <Link
              href={user ? "/dashboard" : "/register"}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-white text-[#0B4F4A] hover:bg-[#F6F8F7] text-[15px] font-bold transition-[background-color] duration-150 shrink-0"
            >
              {user ? "Buka dashboard" : "Daftar gratis"}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-[#DDE4E2] py-7">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#475569]">
          <BrandLogo href="/" size="sm" />
          <p>
            Catat jelas, konfirmasi cepat, biar sama-sama Impas.
          </p>
        </div>
      </footer>
    </div>
  );
}
