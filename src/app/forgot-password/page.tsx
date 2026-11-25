"use client";

import React, { useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import { forgotPasswordSchema } from "@/lib/validations";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function ForgotPasswordPage() {
  const baseId = useId();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Email tidak valid");
      emailRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );

      if (resetError) {
        setError(
          translateSupabaseError(
            resetError,
            "Gagal mengirim email reset kata sandi. Coba lagi."
          )
        );
        return;
      }

      setSent(true);
    } catch {
      setError("Gagal mengirim email reset kata sandi. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 bg-[#F6F8F7]">
        <article className="w-full max-w-md bg-white border border-[#DDE4E2] rounded-2xl p-6 sm:p-9 shadow-[0_1px_3px_rgba(11,19,18,0.04)] text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center">
            <MailCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-[20px] font-bold text-[#0B1312]">
            Cek email kamu
          </h1>
          <p className="text-[14px] text-[#475569] leading-relaxed">
            Tautan untuk mengatur ulang kata sandi telah dikirim ke{" "}
            <strong className="text-[#0B1312]">{email}</strong>. Periksa kotak
            masuk atau folder spam kamu.
          </p>
          <div className="pt-2 space-y-2.5">
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full min-h-[48px] rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-semibold transition-[background-color] duration-150"
            >
              Kembali ke halaman Masuk
            </Link>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="w-full min-h-[44px] text-[13px] font-semibold text-[#475569] hover:text-[#0B1312]"
            >
              Kirim ulang dengan email lain
            </button>
          </div>
        </article>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 bg-[#F6F8F7]">
      <div className="w-full max-w-md">
        <article className="w-full bg-white border border-[#DDE4E2] rounded-2xl p-6 sm:p-9 shadow-[0_1px_3px_rgba(11,19,18,0.04)] flex flex-col gap-6">
          <header className="flex flex-col items-center text-center gap-2">
            <BrandLogo href="/" size="lg" />
            <h1 className="text-[20px] font-bold text-[#0B1312] mt-1">
              Lupa kata sandi?
            </h1>
            <p className="text-[14px] text-[#475569]">
              Masukkan email terdaftar dan kami akan mengirimkan tautan untuk
              membuat kata sandi baru.
            </p>
          </header>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] font-medium text-[#9F1239]"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            <div>
              <label
                htmlFor={`${baseId}-email`}
                className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
              >
                Email
              </label>
              <input
                ref={emailRef}
                id={`${baseId}-email`}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                enterKeyHint="done"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                aria-invalid={error ? "true" : "false"}
                placeholder="Masukkan email"
                className="impas-input w-full px-3.5"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] w-full rounded-xl bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-60 text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
            >
              {submitting && (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              )}
              Kirim tautan reset
            </button>
          </form>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#475569] hover:text-[#0F766E]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Kembali ke Masuk
          </Link>
        </article>
      </div>
    </main>
  );
}
