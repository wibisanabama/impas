import Link from "next/link";
import { Home, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default async function NotFound() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 bg-[#F6F8F7] text-[#0B1312]">
      <div className="w-full max-w-md bg-white border border-[#DDE4E2] rounded-2xl p-8 text-center shadow-[0_1px_3px_rgba(11,19,18,0.04)] space-y-5">
        <div className="flex justify-center">
          <BrandLogo href="/" size="md" />
        </div>

        <p className="text-[clamp(3rem,8vw,4.25rem)] font-extrabold leading-none tracking-[-0.04em] text-[#0F766E] tabular-nums">
          404
        </p>

        <div className="space-y-1.5">
          <h1 className="text-[20px] font-bold text-[#0B1312]">
            Halaman tidak ditemukan
          </h1>
          <p className="text-[14px] text-[#475569] leading-relaxed">
            Maaf, halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex-1 min-h-[48px] rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
              >
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                Ke dashboard
              </Link>
              <Link
                href="/"
                className="flex-1 min-h-[48px] rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[14px] font-semibold text-[#0B1312] inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                Beranda
              </Link>
            </>
          ) : (
            <Link
              href="/"
              className="w-full min-h-[48px] rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[14px] font-semibold text-[#0B1312] inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              Beranda
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
