"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface LogoutConfirmModalProps {
  open: boolean;
  onClose: () => void;
}

export function LogoutConfirmModal({ open, onClose }: LogoutConfirmModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogout = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onClose();
      router.push("/login");
      router.refresh();
    } catch (err) {
      setErrorMsg(translateSupabaseError(err, "Gagal keluar dari akun."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Keluar dari akun?"
      maxWidthClass="md:max-w-md"
    >
      <div className="space-y-4">
        <p className="text-[14px] text-[#475569] leading-relaxed">
          Sesi kamu di perangkat ini akan diakhiri. Kamu dapat masuk kembali kapan
          saja menggunakan email dan kata sandi.
        </p>
        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] font-medium text-[#9F1239]"
          >
            {errorMsg}
          </div>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={loading}
            className="min-h-[48px] px-4 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[14px] font-semibold text-[#0B1312] transition-[background-color] duration-150"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="min-h-[48px] px-5 rounded-xl bg-[#BE123C] hover:bg-[#9F1239] disabled:opacity-60 text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="w-4 h-4" aria-hidden="true" />
            )}
            Ya, keluar akun
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
