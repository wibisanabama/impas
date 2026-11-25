"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogOut, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import { resetPasswordSchema, updateProfileSchema } from "@/lib/validations";
import { LogoutConfirmModal } from "@/components/modals/LogoutConfirmModal";
import { SkeletonBox } from "@/components/ui/Skeleton";

export default function SettingsPage() {
  const router = useRouter();
  const baseId = useId();

  const fullNameRef = useRef<HTMLInputElement>(null);
  const newPassRef = useRef<HTMLInputElement>(null);
  const confirmPassRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [passErrors, setPassErrors] = useState<Record<string, string>>({});
  const [passSuccess, setPassSuccess] = useState(false);

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) {
        if (!user) router.push("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (!active) return;
      if (profile) {
        setFullName(profile.full_name);
        setEmail(profile.email);
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    const parsed = updateProfileSchema.safeParse({ full_name: fullName });
    if (!parsed.success) {
      setProfileError(parsed.error.issues[0]?.message ?? "Nama tidak valid");
      fullNameRef.current?.focus();
      return;
    }

    setSavingProfile(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: parsed.data.full_name })
        .eq("id", userId);

      if (error) throw error;
      window.dispatchEvent(
        new CustomEvent("impas:profile-updated", {
          detail: { fullName: parsed.data.full_name },
        })
      );
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      router.refresh();
    } catch (err) {
      setProfileError(
        translateSupabaseError(err, "Gagal memperbarui profil.")
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrors({});
    setPassSuccess(false);

    const parsed = resetPasswordSchema.safeParse({
      password: newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setPassErrors(fieldErrors);
      if (fieldErrors.password) newPassRef.current?.focus();
      else if (fieldErrors.confirmPassword) confirmPassRef.current?.focus();
      return;
    }

    setSavingPass(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setPassSuccess(true);
      setTimeout(() => setPassSuccess(false), 3000);
    } catch (err) {
      setPassErrors({
        form: translateSupabaseError(err, "Gagal memperbarui kata sandi."),
      });
    } finally {
      setSavingPass(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <SkeletonBox className="h-8 w-48" />
        <SkeletonBox className="h-48 w-full rounded-2xl" />
        <SkeletonBox className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1312] tracking-[-0.03em]">
          Pengaturan dan profil
        </h1>
        <p className="text-[14px] text-[#475569] mt-0.5">
          Kelola nama tampilan, kata sandi, dan sesi akun Impas kamu.
        </p>
      </div>

      {/* Unified Hairline-Divided Settings Container */}
      <div className="bg-white border border-[#DDE4E2] rounded-2xl divide-y divide-[#DDE4E2] overflow-hidden">
        {/* Profil */}
        <section className="p-5 sm:p-6 space-y-4">
          <h2 className="text-[16px] font-bold text-[#0B1312]">
            Informasi profil
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor={`${baseId}-full-name`}
                className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
              >
                Nama lengkap
              </label>
              <input
                ref={fullNameRef}
                id={`${baseId}-full-name`}
                name="full_name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                placeholder="Masukkan nama lengkap"
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (profileError) setProfileError(null);
                }}
                aria-invalid={profileError ? "true" : "false"}
                aria-describedby={
                  profileError ? `${baseId}-full-name-err` : undefined
                }
                className="impas-input w-full px-3.5"
              />
              {profileError && (
                <p
                  id={`${baseId}-full-name-err`}
                  className="mt-1.5 text-[13px] font-medium text-[#BE123C]"
                >
                  {profileError}
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
                id={`${baseId}-email`}
                type="email"
                value={email}
                disabled
                className="impas-input w-full px-3.5 bg-[#F6F8F7]! text-[#475569]! cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              {profileSuccess && (
                <span className="text-[13px] font-semibold text-[#065F46]">
                  Profil tersimpan
                </span>
              )}
              <button
                type="submit"
                disabled={savingProfile}
                className="min-h-[44px] px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-60 text-white text-[14px] font-semibold inline-flex items-center gap-2 transition-[background-color] duration-150"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="w-4 h-4" aria-hidden="true" />
                )}
                Simpan profil
              </button>
            </div>
          </form>
        </section>

        {/* Ubah Kata Sandi */}
        <section className="p-5 sm:p-6 space-y-4">
          <h2 className="text-[16px] font-bold text-[#0B1312]">
            Ubah kata sandi
          </h2>

          <form
            onSubmit={handleChangePassword}
            className="space-y-4"
            noValidate
          >
            <div>
              <label
                htmlFor={`${baseId}-new-pw`}
                className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
              >
                Kata sandi baru
              </label>
              <div className="relative">
                <input
                  ref={newPassRef}
                  id={`${baseId}-new-pw`}
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passErrors.password) {
                      setPassErrors((p) => ({ ...p, password: "" }));
                    }
                  }}
                  aria-invalid={passErrors.password ? "true" : "false"}
                  aria-describedby={
                    passErrors.password ? `${baseId}-new-pw-err` : undefined
                  }
                  placeholder="Minimal 6 karakter"
                  className="impas-input w-full pl-3.5 pr-12"
                />
                <button
                  type="button"
                  aria-pressed={showPass}
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-[#475569] hover:text-[#0B1312] hover:bg-[#F6F8F7]"
                  aria-label={
                    showPass
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {passErrors.password && (
                <p
                  id={`${baseId}-new-pw-err`}
                  className="mt-1.5 text-[13px] font-medium text-[#BE123C]"
                >
                  {passErrors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${baseId}-confirm-pw`}
                className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
              >
                Konfirmasi kata sandi baru
              </label>
              <input
                ref={confirmPassRef}
                id={`${baseId}-confirm-pw`}
                name="confirmPassword"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passErrors.confirmPassword) {
                    setPassErrors((p) => ({ ...p, confirmPassword: "" }));
                  }
                }}
                aria-invalid={passErrors.confirmPassword ? "true" : "false"}
                aria-describedby={
                  passErrors.confirmPassword
                    ? `${baseId}-confirm-pw-err`
                    : undefined
                }
                placeholder="Ulangi kata sandi baru"
                className="impas-input w-full px-3.5"
              />
              {passErrors.confirmPassword && (
                <p
                  id={`${baseId}-confirm-pw-err`}
                  className="mt-1.5 text-[13px] font-medium text-[#BE123C]"
                >
                  {passErrors.confirmPassword}
                </p>
              )}
            </div>

            {passErrors.form && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] font-medium text-[#9F1239]"
              >
                {passErrors.form}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              {passSuccess && (
                <span className="text-[13px] font-semibold text-[#065F46]">
                  Kata sandi diperbarui
                </span>
              )}
              <button
                type="submit"
                disabled={savingPass}
                className="min-h-[44px] px-5 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] disabled:opacity-60 text-[14px] font-semibold text-[#0B1312] inline-flex items-center gap-2 transition-[background-color] duration-150"
              >
                {savingPass && (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                )}
                Perbarui kata sandi
              </button>
            </div>
          </form>
        </section>

        {/* Sesi Akun */}
        <section className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#F6F8F7]/45">
          <div>
            <h2 className="text-[16px] font-bold text-[#0B1312]">Sesi akun</h2>
            <p className="text-[13px] sm:text-[14px] text-[#475569] mt-0.5">
              Keluar dari akun Impas kamu di perangkat ini.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            className="min-h-[44px] px-4 rounded-xl bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-[14px] font-semibold text-[#9F1239] inline-flex items-center justify-center gap-2 transition-[background-color] duration-150 shrink-0"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Keluar akun
          </button>
        </section>
      </div>

      <LogoutConfirmModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </div>
  );
}
