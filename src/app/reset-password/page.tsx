"use client";

import React, { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import { resetPasswordSchema } from "@/lib/validations";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const baseId = useId();

  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      if (fieldErrors.password) passwordRef.current?.focus();
      else if (fieldErrors.confirmPassword) confirmRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (error) {
        setErrors({
          form: translateSupabaseError(
            error,
            "Sesi reset tidak valid atau kedaluwarsa. Minta tautan baru."
          ),
        });
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ form: "Gagal memperbarui kata sandi. Coba lagi." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 bg-[#F6F8F7]">
      <div className="w-full max-w-md">
        <article className="w-full bg-white border border-[#DDE4E2] rounded-2xl p-6 sm:p-9 shadow-[0_1px_3px_rgba(11,19,18,0.04)] flex flex-col gap-6">
          <header className="flex flex-col items-center text-center gap-2">
            <BrandLogo href="/" size="lg" />
            <h1 className="text-[20px] font-bold text-[#0B1312] mt-1">
              Buat kata sandi baru
            </h1>
            <p className="text-[14px] text-[#475569]">
              Masukkan kata sandi baru untuk akun Impas kamu.
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
                htmlFor={`${baseId}-password`}
                className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
              >
                Kata sandi baru
              </label>
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
                    errors.password ? `${baseId}-password-err` : undefined
                  }
                  placeholder="Minimal 6 karakter"
                  className="impas-input w-full pl-3.5 pr-12"
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-[#475569] hover:text-[#0B1312] hover:bg-[#F6F8F7]"
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
                Konfirmasi kata sandi baru
              </label>
              <input
                ref={confirmRef}
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
                placeholder="Ulangi kata sandi baru"
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
              Simpan kata sandi baru
            </button>
          </form>

          <p className="text-center text-[13px] text-[#475569]">
            <Link
              href="/login"
              className="font-semibold text-[#0F766E] hover:underline"
            >
              Kembali ke halaman Masuk
            </Link>
          </p>
        </article>
      </div>
    </main>
  );
}
