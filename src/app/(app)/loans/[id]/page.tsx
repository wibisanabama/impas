"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatDateTime, formatRupiah } from "@/lib/format";
import type {
  ActivityLog,
  LoanPayment,
  LoanWithRelations,
} from "@/types/database";
import { DueDateBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { Lightbox } from "@/components/ui/Lightbox";
import { RecordPaymentModal } from "@/components/modals/RecordPaymentModal";
import { MarkItemReturnedModal } from "@/components/modals/MarkItemReturnedModal";
import { WhatsAppReminderModal } from "@/components/modals/WhatsAppReminderModal";
import { SkeletonBox } from "@/components/ui/Skeleton";

export default function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [ownerName, setOwnerName] = useState<string>("Saya");
  const [loan, setLoan] = useState<LoanWithRelations | null>(null);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>("Pratinjau foto");

  const fetchDetail = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }
    setUserId(user.id);

    const { data: loanData, error: loanError } = await supabase
      .from("loans")
      .select(
        "*, contact:contacts(id, name, whatsapp_number, note), lender:profiles!loans_user_id_fkey(id, full_name, email)"
      )
      .eq("id", params.id)
      .single();

    if (loanError || !loanData) {
      setLoan(null);
      setLoading(false);
      return;
    }

    const typedLoan = loanData as LoanWithRelations;
    setLoan(typedLoan);

    if (typedLoan.user_id === user.id) {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (myProfile?.full_name) setOwnerName(myProfile.full_name);
    } else if (typedLoan.lender?.full_name) {
      setOwnerName(typedLoan.lender.full_name);
    }

    const [{ data: paymentsData }, { data: logsData }] = await Promise.all([
      supabase
        .from("loan_payments")
        .select("*")
        .eq("loan_id", typedLoan.id)
        .order("paid_at", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_logs")
        .select("*")
        .eq("loan_id", typedLoan.id)
        .order("created_at", { ascending: false }),
    ]);

    setPayments((paymentsData ?? []) as LoanPayment[]);
    setLogs((logsData ?? []) as ActivityLog[]);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Auto-sync when borrower confirms via /c/[token] in another tab/device
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`loan-detail-${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "loans",
          filter: `id=eq.${params.id}`,
        },
        () => {
          void fetchDetail();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
          filter: `loan_id=eq.${params.id}`,
        },
        () => {
          void fetchDetail();
        }
      )
      .subscribe();

    const handleVisibleOrFocus = () => {
      if (document.visibilityState === "visible") {
        void fetchDetail();
      }
    };

    window.addEventListener("focus", handleVisibleOrFocus);
    document.addEventListener("visibilitychange", handleVisibleOrFocus);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", handleVisibleOrFocus);
      document.removeEventListener("visibilitychange", handleVisibleOrFocus);
    };
  }, [params.id, fetchDetail]);

  // Lightweight fallback poll only while waiting for public link confirmation
  useEffect(() => {
    if (loan?.status !== "PENDING_CONFIRMATION") return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchDetail();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [loan?.status, fetchDetail]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonBox className="h-8 w-52" />
        <SkeletonBox className="h-48 w-full rounded-2xl" />
        <SkeletonBox className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="bg-white border border-[#DDE4E2] rounded-2xl p-8 text-center space-y-4">
        <h1 className="text-[20px] font-bold text-[#0B1312]">
          Catatan pinjaman tidak ditemukan
        </h1>
        <p className="text-[14px] text-[#475569]">
          Catatan ini tidak tersedia atau kamu tidak memiliki akses.
        </p>
        <Link
          href="/loans"
          className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-xl bg-[#0F766E] text-white text-[14px] font-semibold"
        >
          Kembali ke daftar pinjaman
        </Link>
      </div>
    );
  }

  const isOwner = loan.user_id === userId;
  const isSettled = loan.status === "SETTLED";
  const counterpartyName = isOwner
    ? loan.contact?.name ?? "Teman"
    : loan.lender?.full_name ?? "Pemberi pinjaman";

  const confirmUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/c/${loan.confirmation_token}`
      : `/c/${loan.confirmation_token}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(confirmUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const totalAmount = Number(loan.amount ?? 0);
  const remainingAmount = Number(loan.remaining_amount ?? 0);
  const paidAmount = Math.max(0, totalAmount - remainingAmount);
  const progressPct =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/loans"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[#475569] transition-[background-color] duration-150"
            aria-label="Kembali ke daftar pinjaman"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-[#0B1312] tracking-[-0.03em]">
                {loan.type === "MONEY" ? "Pinjaman uang" : "Pinjaman barang"}
              </h1>
              <StatusBadge status={loan.status} dueDate={loan.due_date} />
            </div>
            <p className="text-[14px] text-[#475569] mt-0.5">
              {isOwner ? "Peminjam: " : "Pemberi pinjaman: "}
              <strong className="font-semibold text-[#0B1312]">
                {counterpartyName}
              </strong>
              {!isOwner && " (Mode lihat saja)"}
            </p>
          </div>
        </div>

        {/* Owner Quick Actions */}
        {isOwner && (
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="min-h-[44px] px-3.5 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[13px] font-semibold text-[#0B1312] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-[background-color] duration-150"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4 text-[#475569]" aria-hidden="true" />
              )}
              {copiedLink ? "Tersalin" : "Salin link"}
            </button>

            {!isSettled && loan.contact?.whatsapp_number && (
              <button
                type="button"
                onClick={() => setWaModalOpen(true)}
                className="min-h-[44px] px-3.5 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#E6F4F1] text-[13px] font-semibold text-[#0F766E] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-[background-color] duration-150"
              >
                <WhatsAppIcon className="w-4 h-4" />
                WhatsApp
              </button>
            )}

            {!isSettled && loan.type === "MONEY" && (
              <button
                type="button"
                onClick={() => setPaymentModalOpen(true)}
                className="min-h-[44px] px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-[background-color] duration-150"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Catat cicilan
              </button>
            )}

            {!isSettled && loan.type === "ITEM" && (
              <button
                type="button"
                onClick={() => setReturnModalOpen(true)}
                className="min-h-[44px] px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-[background-color] duration-150"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                Tandai kembali
              </button>
            )}
          </div>
        )}
      </div>

      {isOwner && !isSettled && !loan.confirmed_at && (
        <div className="px-4 py-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[13px] text-[#92400E] flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong className="font-semibold">{counterpartyName}</strong> belum
            mengonfirmasi catatan ini. Kamu tetap bisa mencatat{" "}
            {loan.type === "MONEY" ? "cicilan atau pelunasan" : "pengembalian"}{" "}
            kapan saja, atau bagikan link konfirmasi agar disepakati bersama.
          </p>
        </div>
      )}

      {/* Unified Architectural Two-Column Ledger */}
      <div className="bg-white border border-[#DDE4E2] rounded-2xl grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#DDE4E2] overflow-hidden">
        {/* Left Main Ledger */}
        <div className="lg:col-span-7 divide-y divide-[#DDE4E2]">
          <section className="p-5 sm:p-6 space-y-5">
            {loan.type === "MONEY" ? (
              <>
                <div>
                  <p className="text-[13px] font-semibold text-[#475569]">
                    Sisa tagihan
                  </p>
                  <p className="text-3xl font-extrabold text-[#0B1312] tabular-nums mt-1">
                    {formatRupiah(remainingAmount)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-full h-2.5 rounded-full bg-[#F6F8F7] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0F766E] transition-[width] duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[13px] text-[#475569] tabular-nums">
                    <span>
                      Sudah dibayar:{" "}
                      <strong className="text-[#0B1312]">
                        {formatRupiah(paidAmount)}
                      </strong>{" "}
                      ({progressPct}%)
                    </span>
                    <span>
                      Total:{" "}
                      <strong className="text-[#0B1312]">
                        {formatRupiah(totalAmount)}
                      </strong>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <p className="text-[13px] font-semibold text-[#475569]">
                  Barang yang dipinjam
                </p>
                <h2 className="text-2xl font-extrabold text-[#0B1312] mt-1">
                  {loan.item_name}
                </h2>
              </div>
            )}

            <dl className="grid grid-cols-2 gap-4 pt-4 border-t border-[#DDE4E2] text-[14px]">
              <div>
                <dt className="text-[13px] text-[#475569]">Jatuh tempo</dt>
                <dd className="mt-1">
                  <DueDateBadge dueDate={loan.due_date} status={loan.status} />
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-[#475569]">Dicatat pada</dt>
                <dd className="mt-1 font-semibold text-[#0B1312] tabular-nums">
                  {formatDate(loan.created_at)}
                </dd>
              </div>
              {loan.confirmed_at && (
                <div>
                  <dt className="text-[13px] text-[#475569]">
                    Dikonfirmasi pada
                  </dt>
                  <dd className="mt-1 font-semibold text-[#0B1312] tabular-nums">
                    {formatDateTime(loan.confirmed_at)}
                  </dd>
                </div>
              )}
              {loan.settled_at && (
                <div>
                  <dt className="text-[13px] text-[#475569]">Tanggal Impas</dt>
                  <dd className="mt-1 font-semibold text-[#065F46] tabular-nums">
                    {formatDateTime(loan.settled_at)}
                  </dd>
                </div>
              )}
            </dl>

            {loan.note && (
              <div className="p-4 rounded-xl bg-[#F6F8F7]">
                <p className="text-[13px] font-semibold text-[#475569] mb-1">
                  Catatan pinjaman
                </p>
                <p className="text-[14px] text-[#0B1312] whitespace-pre-line">
                  {loan.note}
                </p>
              </div>
            )}

            {loan.return_note && (
              <div className="p-4 rounded-xl bg-[#ECFDF5]">
                <p className="text-[13px] font-semibold text-[#065F46] mb-1">
                  Catatan pengembalian
                </p>
                <p className="text-[14px] text-[#065F46] whitespace-pre-line">
                  {loan.return_note}
                </p>
              </div>
            )}

            {(loan.photo_url || loan.return_photo_url) && (
              <div className="space-y-2.5 pt-2">
                <p className="text-[13px] font-semibold text-[#475569]">
                  Lampiran foto
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {loan.photo_url && (
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxTitle(
                          loan.type === "MONEY"
                            ? "Bukti transfer atau struk"
                            : "Foto kondisi awal barang"
                        );
                        setLightboxUrl(loan.photo_url);
                      }}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-[#DDE4E2] bg-[#F6F8F7]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={loan.photo_url}
                        alt="Lampiran awal"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded bg-black/70 text-white text-[13px] font-medium">
                        {loan.type === "MONEY" ? "Bukti awal" : "Kondisi awal"}
                      </span>
                    </button>
                  )}

                  {loan.return_photo_url && (
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxTitle("Foto kondisi barang kembali");
                        setLightboxUrl(loan.return_photo_url);
                      }}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-[#DDE4E2] bg-[#F6F8F7]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={loan.return_photo_url}
                        alt="Lampiran pengembalian"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded bg-[#0F766E]/90 text-white text-[13px] font-medium">
                        Kondisi kembali
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Riwayat Cicilan (MONEY only) */}
          {loan.type === "MONEY" && (
            <section className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-[#0B1312]">
                  Riwayat cicilan ({payments.length})
                </h2>
                {isOwner && !isSettled && (
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(true)}
                    className="text-[13px] font-semibold text-[#0F766E] hover:text-[#0D655E] inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Tambah cicilan
                  </button>
                )}
              </div>

              {payments.length === 0 ? (
                <p className="text-[14px] text-[#475569] py-4 text-center bg-[#F6F8F7] rounded-xl">
                  Belum ada cicilan yang dicatat.
                </p>
              ) : (
                <div className="divide-y divide-[#DDE4E2]">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-[#0B1312] tabular-nums">
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DDE4E2] hover:bg-[#F6F8F7] text-[13px] font-semibold text-[#0F766E] shrink-0"
                        >
                          <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          Bukti
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column: Activity Timeline */}
        <aside className="lg:col-span-5 p-5 sm:p-6 bg-[#F6F8F7]/45 space-y-4">
          <h2 className="text-[16px] font-bold text-[#0B1312]">
            Riwayat aktivitas
          </h2>

          {logs.length === 0 ? (
            <p className="text-[14px] text-[#475569]">Belum ada aktivitas.</p>
          ) : (
            <ol className="relative border-l border-[#DDE4E2] ml-2.5 space-y-5">
              {logs.map((log) => (
                <li key={log.id} className="pl-5 relative">
                  <span
                    className="absolute -left-[6.5px] top-1.5 w-3 h-3 rounded-full bg-[#0F766E] ring-4 ring-white"
                    aria-hidden="true"
                  />
                  <p className="text-[14px] font-medium text-[#0B1312] leading-snug">
                    {log.description.replace(
                      /Rp (\d+(?:,\d{3})+)/g,
                      (_, n: string) => `Rp ${n.replace(/,/g, ".")}`
                    )}
                  </p>
                  <p className="text-[13px] text-[#475569] mt-1 inline-flex items-center gap-1 tabular-nums">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {formatDateTime(log.created_at)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>

      {/* Modals */}
      {isOwner && loan.type === "MONEY" && !isSettled && (
        <RecordPaymentModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          loanId={loan.id}
          userId={userId}
          remainingAmount={remainingAmount}
          borrowerName={counterpartyName}
          onSuccess={fetchDetail}
        />
      )}

      {isOwner && loan.type === "ITEM" && !isSettled && (
        <MarkItemReturnedModal
          open={returnModalOpen}
          onClose={() => setReturnModalOpen(false)}
          loanId={loan.id}
          userId={userId}
          itemName={loan.item_name ?? "Barang"}
          borrowerName={counterpartyName}
          onSuccess={fetchDetail}
        />
      )}

      {isOwner && loan.contact?.whatsapp_number && (
        <WhatsAppReminderModal
          open={waModalOpen}
          onClose={() => setWaModalOpen(false)}
          borrowerName={counterpartyName}
          borrowerPhone={loan.contact.whatsapp_number}
          lenderName={ownerName}
          type={loan.type}
          remainingAmount={loan.remaining_amount}
          itemName={loan.item_name}
          dueDate={loan.due_date}
          confirmUrl={confirmUrl}
          status={loan.status}
        />
      )}

      <Lightbox
        open={Boolean(lightboxUrl)}
        imageUrl={lightboxUrl}
        title={lightboxTitle}
        onClose={() => setLightboxUrl(null)}
      />
    </div>
  );
}
