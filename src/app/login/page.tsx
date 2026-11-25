"use client";

import React, { Suspense, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import { loginSchema } from "@/lib/validations";
import { BrandLogo } from "@/components/ui/BrandLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const baseId = useId();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [dismissedUrlError, setDismissedUrlError] = useState(false);

  const errorParam = searchParams.get("error");
  const urlError =
    !dismissedUrlError && errorParam
      ? errorParam === "auth_callback_failed"
        ? "Tautan verifikasi tidak valid atau sudah kedaluwarsa. Silakan masuk atau daftar kembali."
        : translateSupabaseError(
            errorParam,
            "Terjadi kesalahan autentikasi. Silakan coba lagi."
          )
      : "";
  const formError = errors.form || urlError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setDismissedUrlError(true);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      if (fieldErrors.email) emailRef.current?.focus();
      else if (fieldErrors.password) passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        setErrors({
          form: translateSupabaseError(error, "Email atau kata sandi salah."),
        });
        return;
      }

      const next = searchParams.get("next");
      const safeNext = next && next.startsWith("/") ? next : "/dashboard";
      router.push(safeNext);
      router.refresh();
    } catch {
      setErrors({ form: "Terjadi kesalahan saat masuk. Coba lagi." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 bg-[#F6F8F7]">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <article className="w-full bg-white border border-[#DDE4E2] rounded-2xl p-6 sm:p-9 shadow-[0_1px_3px_rgba(11,19,18,0.04)] flex flex-col gap-6">
          <header className="flex flex-col items-center text-center gap-2">
            <BrandLogo href="/" size="lg" />
            <h1 className="text-[20px] font-bold text-[#0B1312] mt-1">
              Masuk ke akun Impas
            </h1>
            <p className="text-[14px] text-[#475569] max-w-xs">
              Kelola catatan pinjaman uang dan barang dengan tenang.
            </p>
          </header>

          {formError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] font-medium text-[#9F1239]"
            >
              {formError}
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
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={`${baseId}-password`}
                  className="text-[14px] font-semibold text-[#0B1312]"
                >
                  Kata sandi
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-semibold text-[#0F766E] hover:text-[#0D655E] hover:underline"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id={`${baseId}-password`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  enterKeyHint="done"
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
                    errors.password ? `${baseId}-password-err` : undefined
                  }
                  placeholder="Masukkan kata sandi"
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

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 min-h-[48px] w-full rounded-xl bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-60 text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
            >
              {submitting && (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              )}
              Masuk
            </button>
          </form>

          <p className="text-center text-[14px] text-[#475569]">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#0F766E] hover:text-[#0D655E] hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </article>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F8F7]" />}>
      <LoginForm />
    </Suspense>
  );
}
