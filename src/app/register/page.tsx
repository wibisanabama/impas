"use client";

import React, { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import { registerSchema } from "@/lib/validations";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function RegisterPage() {
  const router = useRouter();
  const baseId = useId();

  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = registerSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      if (fieldErrors.fullName) fullNameRef.current?.focus();
      else if (fieldErrors.email) emailRef.current?.focus();
      else if (fieldErrors.password) passwordRef.current?.focus();
      else if (fieldErrors.confirmPassword) confirmPasswordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            full_name: parsed.data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setErrors({
          form: translateSupabaseError(
            error,
            "Gagal membuat akun. Silakan coba lagi."
          ),
        });
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setNeedsEmailConfirm(true);
      }
    } catch {
      setErrors({ form: "Terjadi kesalahan saat mendaftar. Coba lagi." });
    } finally {
      setSubmitting(false);
    }
  };

  if (needsEmailConfirm) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 bg-[#F6F8F7]">
        <article className="w-full max-w-md bg-white border border-[#DDE4E2] rounded-2xl p-6 sm:p-9 shadow-[0_1px_3px_rgba(11,19,18,0.04)] text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-[20px] font-bold text-[#0B1312]">
            Cek email kamu
          </h1>
          <p className="text-[14px] text-[#475569] leading-relaxed">
            Kami telah mengirimkan tautan verifikasi ke{" "}
            <strong className="text-[#0B1312]">{email}</strong>. Silakan buka
            email tersebut untuk mengaktifkan akun Impas kamu.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full min-h-[48px] rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-semibold transition-[background-color] duration-150"
          >
            Kembali ke halaman Masuk
          </Link>
        </article>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 bg-[#F6F8F7]">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <article className="w-full bg-white border border-[#DDE4E2] rounded-2xl p-6 sm:p-9 shadow-[0_1px_3px_rgba(11,19,18,0.04)] flex flex-col gap-6">
          <header className="flex flex-col items-center text-center gap-2">
            <BrandLogo href="/" size="lg" />
            <h1 className="text-[20px] font-bold text-[#0B1312] mt-1">
              Buat akun Impas gratis
            </h1>
            <p className="text-[14px] text-[#475569] max-w-xs">
              Mulai catat pinjaman uang dan barang dengan jelas.
            </p>
          </header>

          {errors.form && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] font-medium text-[#9F1239]"
            >
              {errors.form}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            <div>
              <label
                htmlFor={`${baseId}-fullName`}
                className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
              >
                Nama lengkap
              </label>
              <input
                ref={fullNameRef}
                id={`${baseId}-fullName`}
                name="fullName"
                type="text"
                autoComplete="name"
                enterKeyHint="next"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) {
                    setErrors((p) => ({ ...p, fullName: "" }));
                  }
                }}
                aria-invalid={errors.fullName ? "true" : "false"}
                aria-describedby={
                  errors.fullName ? `${baseId}-fullName-err` : undefined
                }
                placeholder="Masukkan nama lengkap"
                className="impas-input w-full px-3.5"
              />
              {errors.fullName && (
                <p
                  id={`${baseId}-fullName-err`}
                  className="mt-1.5 text-[13px] font-medium text-[#BE123C]"
                >
                  {errors.fullName}
                </p>
              )}
            </div>

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
                enterKeyHint="next"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                }}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? `${baseId}-email-err` : undefined}
                placeholder="Masukkan email"
                className="impas-input w-full px-3.5"
              />
              {errors.email && (
                <p
                  id={`${baseId}-email-err`}
                  className="mt-1.5 text-[13px] font-medium text-[#BE123C]"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${baseId}-password`}
                className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
              >
                Kata sandi
              </label>
              <p id={`${baseId}-pw-hint`} className="text-[13px] text-[#475569] mb-1.5">
                Minimal 6 karakter.
              </p>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id={`${baseId}-password`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  enterKeyHint="next"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors((p) => ({ ...p, password: "" }));
                    }
                  }}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={
                    errors.password
                      ? `${baseId}-pw-hint ${baseId}-password-err`
                      : `${baseId}-pw-hint`
                  }
                  placeholder="Minimal 6 karakter"
                  className="impas-input w-full pl-3.5 pr-12"
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-[#475569] hover:text-[#0B1312] hover:bg-[#F6F8F7] transition-[background-color,color] duration-150"
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id={`${baseId}-password-err`}
                  className="mt-1.5 text-[13px] font-medium text-[#BE123C]"
                >
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${baseId}-confirmPassword`}
                className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
              >
                Konfirmasi kata sandi
              </label>
              <input
                ref={confirmPasswordRef}
                id={`${baseId}-confirmPassword`}
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                enterKeyHint="done"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((p) => ({ ...p, confirmPassword: "" }));
                  }
                }}
                aria-invalid={errors.confirmPassword ? "true" : "false"}
                aria-describedby={
                  errors.confirmPassword
                    ? `${baseId}-confirmPassword-err`
                    : undefined
                }
                placeholder="Ulangi kata sandi"
                className="impas-input w-full px-3.5"
              />
              {errors.confirmPassword && (
                <p
                  id={`${baseId}-confirmPassword-err`}
                  className="mt-1.5 text-[13px] font-medium text-[#BE123C]"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 min-h-[48px] w-full rounded-xl bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-60 text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
            >
              {submitting && (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              )}
              Daftar sekarang
            </button>
          </form>

          <p className="text-center text-[14px] text-[#475569]">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#0F766E] hover:text-[#0D655E] hover:underline"
            >
              Masuk
            </Link>
          </p>
        </article>
      </div>
    </main>
  );
}
