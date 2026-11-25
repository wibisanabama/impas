"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Link2Off,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import { formatDate, formatDateTime, formatRupiah } from "@/lib/format";
import type { PublicLoanPayload } from "@/types/database";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { DueDateBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { Lightbox } from "@/components/ui/Lightbox";
import { SkeletonBox } from "@/components/ui/Skeleton";

export default function PublicConfirmationPage() {
  const params = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<PublicLoanPayload | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState("Pratinjau bukti");

  const fetchLoan = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_loan_by_token", {
      p_token: params.token,
    });

    if (error || !data) {
      setPayload(null);
      setLoading(false);
      return;
    }

    setPayload(data as PublicLoanPayload);
    setLoading(false);
  }, [params.token]);

  useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);

  // Auto-refresh public view when returning to tab or while loan is not yet settled
  const loanStatus = payload?.loan.status;
  useEffect(() => {
    const handleVisibleOrFocus = () => {
      if (document.visibilityState === "visible") {
        void fetchLoan();
      }
    };

    window.addEventListener("focus", handleVisibleOrFocus);
    document.addEventListener("visibilitychange", handleVisibleOrFocus);

    let interval: ReturnType<typeof setInterval> | undefined;
    if (loanStatus && loanStatus !== "SETTLED") {
      interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          void fetchLoan();
        }
      }, 4000);
    }

    return () => {
      window.removeEventListener("focus", handleVisibleOrFocus);
      document.removeEventListener("visibilitychange", handleVisibleOrFocus);
      if (interval) clearInterval(interval);
    };
  }, [loanStatus, fetchLoan]);

  const handleConfirm = async () => {
    setErrorMsg(null);
    setConfirming(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("confirm_loan_by_token", {
        p_token: params.token,
      });

      if (error) {
        if (error.message.includes("LINK_NOT_FOUND")) {
          setPayload(null);
        } else {
          setErrorMsg(
            translateSupabaseError(
              error,
              "Gagal mengonfirmasi pinjaman. Silakan coba lagi."
            )
          );
        }
        return;
      }

      if (data) {
        setPayload(data as PublicLoanPayload);
      } else {
        await fetchLoan();
      }
    } catch {
      setErrorMsg("Gagal mengonfirmasi pinjaman. Silakan coba lagi.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F8F7] flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-white border border-[#DDE4E2] rounded-2xl p-6 space-y-5">
          <SkeletonBox className="h-8 w-32 mx-auto" />
          <SkeletonBox className="h-24 w-full rounded-xl" />
          <SkeletonBox className="h-12 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="min-h-screen bg-[#F6F8F7] flex flex-col items-center justify-center px-4 py-12 text-[#0B1312]">
        <div className="w-full max-w-md bg-white border border-[#DDE4E2] rounded-2xl p-8 text-center shadow-[0_1px_3px_rgba(11,19,18,0.04)] space-y-5">
          <div className="flex justify-center">
            <BrandLogo href="/" size="md" />
          </div>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFF1F2] text-[#9F1239] flex items-center justify-center">
            <Link2Off className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-[20px] font-bold text-[#0B1312]">
              Link tidak ditemukan
            </h1>
            <p className="text-[14px] text-[#475569] leading-relaxed">
              Tautan konfirmasi ini tidak valid, sudah kedaluwarsa, atau catatan
              pinjaman telah dihapus oleh pembuatnya.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full min-h-[48px] rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-semibold transition-[background-color] duration-150"
          >
            Kembali ke beranda Impas
          </Link>
        </div>
      </main>
    );
  }

  const { loan, payments } = payload;
  const isSettled = loan.status === "SETTLED";
  const isPending = !isSettled && !loan.confirmed_at;
  const totalAmount = Number(loan.amount ?? 0);
  const remainingAmount = Number(loan.remaining_amount ?? 0);
  const paidAmount = Math.max(0, totalAmount - remainingAmount);

  return (
    <main className="min-h-screen bg-[#F6F8F7] text-[#0B1312] px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg space-y-5">
        {/* Clean Brand Header without Decorative Pill */}
        <div className="flex items-center justify-between px-1">
          <BrandLogo href="/" size="md" />
          <span className="text-[13px] font-semibold text-[#475569]">
            Konfirmasi dua pihak
          </span>
        </div>

        {/* Main Confirmation Document */}
        <article className="bg-white border border-[#DDE4E2] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(11,19,18,0.04)] divide-y divide-[#DDE4E2]">
          {/* Status Banner */}
          <div className="p-5 sm:px-7">
            {isSettled ? (
              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-start gap-3">
                <CheckCircle2
                  className="w-5 h-5 text-[#059669] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h1 className="text-[15px] font-bold text-[#065F46]">
                    Pinjaman telah Impas
                  </h1>
                  <p className="text-[13px] text-[#065F46]/90 mt-0.5">
                    {loan.type === "MONEY"
                      ? "Seluruh tagihan sudah dilunasi."
                      : "Barang telah ditandai sudah dikembalikan."}{" "}
                    {loan.settled_at
                      ? `(${formatDateTime(loan.settled_at)})`
                      : ""}
                  </p>
                </div>
              </div>
            ) : isPending ? (
              <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3">
                <Clock
                  className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h1 className="text-[15px] font-bold text-[#92400E]">
                    Menunggu konfirmasi kamu
                  </h1>
                  <p className="text-[13px] text-[#92400E]/90 mt-0.5">
                    Periksa detail pinjaman dari{" "}
                    <strong>{loan.lender_name}</strong> di bawah ini, lalu tekan
                    tombol konfirmasi.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-start gap-3">
                <CheckCircle2
                  className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h1 className="text-[15px] font-bold text-[#1E40AF]">
                    Pinjaman terkonfirmasi
                  </h1>
                  <p className="text-[13px] text-[#1E40AF]/90 mt-0.5">
                    Sudah dikonfirmasi pada{" "}
                    {formatDateTime(loan.confirmed_at)}.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Core Summary */}
          <div className="p-5 sm:px-7 bg-[#F6F8F7]/60 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[#475569]">
                {loan.type === "MONEY" ? "Pinjaman uang" : "Pinjaman barang"}
              </span>
              <StatusBadge status={loan.status} dueDate={loan.due_date} />
            </div>

            {loan.type === "MONEY" ? (
              <div>
                <p className="text-[13px] text-[#475569]">
                  {loan.status === "PARTIAL"
                    ? "Sisa tagihan"
                    : "Nominal pinjaman"}
                </p>
                <p className="text-3xl font-extrabold text-[#0B1312] tabular-nums mt-0.5">
                  {formatRupiah(
                    isSettled ? loan.amount : loan.remaining_amount
                  )}
                </p>
                {loan.status === "PARTIAL" && (
                  <p className="text-[13px] text-[#475569] mt-1 tabular-nums">
                    Sudah dibayar {formatRupiah(paidAmount)} dari total{" "}
                    {formatRupiah(totalAmount)}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-[13px] text-[#475569]">Nama barang</p>
                <p className="text-xl font-extrabold text-[#0B1312] mt-0.5">
                  {loan.item_name}
                </p>
              </div>
            )}
          </div>

          {/* Details & Attachments */}
          <div className="p-5 sm:px-7 space-y-5">
            <dl className="grid grid-cols-2 gap-4 text-[14px]">
              <div>
                <dt className="text-[13px] text-[#475569]">
                  Pemberi pinjaman
                </dt>
                <dd className="font-semibold text-[#0B1312] mt-0.5">
                  {loan.lender_name}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-[#475569]">Peminjam</dt>
                <dd className="font-semibold text-[#0B1312] mt-0.5">
                  {loan.borrower_name}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-[#475569]">Jatuh tempo</dt>
                <dd className="mt-1">
                  <DueDateBadge dueDate={loan.due_date} status={loan.status} />
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-[#475569]">Dicatat pada</dt>
                <dd className="font-semibold text-[#0B1312] mt-0.5 tabular-nums">
                  {formatDate(loan.created_at)}
                </dd>
              </div>
            </dl>

            {loan.note && (
              <div className="p-3.5 rounded-xl bg-[#F6F8F7]">
                <p className="text-[13px] font-semibold text-[#475569] mb-1">
                  Catatan
                </p>
                <p className="text-[14px] text-[#0B1312] whitespace-pre-line">
                  {loan.note}
                </p>
              </div>
            )}

            {(loan.photo_url || loan.return_photo_url) && (
              <div className="flex flex-wrap gap-2.5">
                {loan.photo_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxTitle(
                        loan.type === "MONEY"
                          ? "Bukti transfer atau struk"
                          : "Foto kondisi barang"
                      );
                      setLightboxUrl(loan.photo_url);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DDE4E2] hover:bg-[#F6F8F7] text-[13px] font-semibold text-[#0F766E] transition-[background-color] duration-150"
                  >
                    <ImageIcon className="w-4 h-4" aria-hidden="true" />
                    Lihat foto bukti awal
                  </button>
                )}
                {loan.return_photo_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxTitle("Foto kondisi barang kembali");
                      setLightboxUrl(loan.return_photo_url);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DDE4E2] hover:bg-[#F6F8F7] text-[13px] font-semibold text-[#0F766E] transition-[background-color] duration-150"
                  >
                    <ImageIcon className="w-4 h-4" aria-hidden="true" />
                    Lihat foto pengembalian
                  </button>
                )}
              </div>
            )}

            {loan.type === "MONEY" && payments.length > 0 && (
              <div className="pt-3 border-t border-[#DDE4E2] space-y-2.5">
                <h2 className="text-[13px] font-semibold text-[#475569]">
                  Riwayat cicilan ({payments.length})
                </h2>
                <div className="divide-y divide-[#DDE4E2]">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="py-2.5 flex items-center justify-between gap-2 text-[14px]"
                    >
                      <div>
                        <p className="font-bold text-[#0B1312] tabular-nums">
                          {formatRupiah(p.amount)}
                        </p>
                        <p className="text-[13px] text-[#475569] tabular-nums">
                          {formatDate(p.paid_at)}
                          {p.note ? ` · ${p.note}` : ""}
                        </p>
                      </div>
                      {p.proof_url && (
                        <button
                          type="button"
                          onClick={() => {
                            setLightboxTitle(
                              `Bukti cicilan (${formatRupiah(p.amount)})`
                            );
                            setLightboxUrl(p.proof_url);
                          }}
                          className="text-[13px] font-semibold text-[#0F766E] hover:underline"
                        >
                          Lihat bukti
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] font-medium text-[#9F1239]"
              >
                {errorMsg}
              </div>
            )}

            {isPending && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full min-h-[50px] rounded-xl bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-60 text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
              >
                {confirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                )}
                Ya, saya konfirmasi pinjaman ini
              </button>
            )}
          </div>
        </article>
      </div>

      <Lightbox
        open={Boolean(lightboxUrl)}
        imageUrl={lightboxUrl}
        title={lightboxTitle}
        onClose={() => setLightboxUrl(null)}
      />
    </main>
  );
}
