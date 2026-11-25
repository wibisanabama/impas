"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  buildWhatsAppUrl,
  formatRupiah,
  getInitials,
} from "@/lib/format";
import type { Contact, Loan } from "@/types/database";
import { DueDateBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { ContactFormModal } from "@/components/modals/ContactFormModal";
import { DeleteContactModal } from "@/components/modals/DeleteContactModal";
import { SkeletonBox } from "@/components/ui/Skeleton";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const baseId = useId();
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const settledTabRef = useRef<HTMLButtonElement>(null);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [contact, setContact] = useState<Contact | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tab, setTab] = useState<"ACTIVE" | "SETTLED">("ACTIVE");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUserId(user.id);

    const [{ data: cData }, { data: lData }] = await Promise.all([
      supabase
        .from("contacts")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("loans")
        .select("*")
        .eq("contact_id", params.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setContact((cData as Contact) ?? null);
    setLoans((lData ?? []) as Loan[]);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeLoans = useMemo(
    () => loans.filter((l) => l.status !== "SETTLED"),
    [loans]
  );
  const settledLoans = useMemo(
    () => loans.filter((l) => l.status === "SETTLED"),
    [loans]
  );

  const netMoneyBalance = useMemo(
    () =>
      activeLoans
        .filter((l) => l.type === "MONEY")
        .reduce((sum, l) => sum + Number(l.remaining_amount ?? 0), 0),
    [activeLoans]
  );

  const activeItemsCount = useMemo(
    () => activeLoans.filter((l) => l.type === "ITEM").length,
    [activeLoans]
  );

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = tab === "ACTIVE" ? "SETTLED" : "ACTIVE";
      setTab(next);
      if (next === "ACTIVE") activeTabRef.current?.focus();
      else settledTabRef.current?.focus();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonBox className="h-8 w-48" />
        <SkeletonBox className="h-32 w-full rounded-2xl" />
        <SkeletonBox className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="bg-white border border-[#DDE4E2] rounded-2xl p-8 text-center space-y-4">
        <h1 className="text-[20px] font-bold text-[#0B1312]">
          Kontak tidak ditemukan
        </h1>
        <Link
          href="/contacts"
          className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-xl bg-[#0F766E] text-white text-[14px] font-semibold"
        >
          Kembali ke kontak
        </Link>
      </div>
    );
  }

  const displayedLoans = tab === "ACTIVE" ? activeLoans : settledLoans;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/contacts"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[#475569]"
            aria-label="Kembali ke daftar kontak"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <div className="w-11 h-11 rounded-full bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center text-[14px] font-bold shrink-0">
            {getInitials(contact.name)}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-[#0B1312] tracking-[-0.03em] truncate">
              {contact.name}
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#475569] tabular-nums">
              {contact.whatsapp_number}
              {contact.note ? ` · ${contact.note}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={buildWhatsAppUrl(contact.whatsapp_number)}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-4 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#E6F4F1] text-[13px] font-semibold text-[#0F766E] inline-flex items-center gap-1.5 transition-[background-color] duration-150"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Chat WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="min-h-[44px] px-4 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[13px] font-semibold text-[#0B1312] inline-flex items-center gap-1.5 transition-[background-color] duration-150"
          >
            <Edit3 className="w-4 h-4 text-[#475569]" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-[#FECDD3] bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[13px] font-semibold text-[#9F1239] inline-flex items-center justify-center transition-[background-color] duration-150"
            aria-label="Hapus kontak"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
          <Link
            href={`/loans/new?contactId=${contact.id}`}
            className="min-h-[44px] px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-[background-color] duration-150"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Catat pinjaman
          </Link>
        </div>
      </div>

      {/* Unified 2-Column Summary Strip */}
      <div className="bg-white border border-[#DDE4E2] rounded-2xl grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#DDE4E2] overflow-hidden">
        <div className="p-5">
          <p className="text-[13px] font-semibold text-[#475569]">
            Saldo bersih piutang
          </p>
          <p className="text-2xl font-extrabold text-[#0B1312] tabular-nums mt-1">
            {formatRupiah(netMoneyBalance)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-[13px] font-semibold text-[#475569]">
            Barang aktif
          </p>
          <p className="text-2xl font-extrabold text-[#0B1312] tabular-nums mt-1">
            {activeItemsCount} barang
          </p>
        </div>
      </div>

      {/* Tabs Aktif / Impas */}
      <section className="bg-white border border-[#DDE4E2] rounded-2xl overflow-hidden">
        <div
          role="tablist"
          aria-label="Status riwayat pinjaman kontak"
          onKeyDown={handleTabKeyDown}
          className="px-5 flex items-center gap-2 border-b border-[#DDE4E2]"
        >
          <button
            ref={activeTabRef}
            id={`${baseId}-tab-active`}
            type="button"
            role="tab"
            aria-selected={tab === "ACTIVE"}
            tabIndex={tab === "ACTIVE" ? 0 : -1}
            onClick={() => setTab("ACTIVE")}
            className={`min-h-[44px] px-3.5 text-[14px] font-semibold transition-[color] duration-150 ${
              tab === "ACTIVE"
                ? "text-[#0F766E]"
                : "text-[#475569] hover:text-[#0B1312]"
            }`}
          >
            Aktif ({activeLoans.length})
          </button>
          <button
            ref={settledTabRef}
            id={`${baseId}-tab-settled`}
            type="button"
            role="tab"
            aria-selected={tab === "SETTLED"}
            tabIndex={tab === "SETTLED" ? 0 : -1}
            onClick={() => setTab("SETTLED")}
            className={`min-h-[44px] px-3.5 text-[14px] font-semibold transition-[color] duration-150 ${
              tab === "SETTLED"
                ? "text-[#0F766E]"
                : "text-[#475569] hover:text-[#0B1312]"
            }`}
          >
            Impas ({settledLoans.length})
          </button>
        </div>

        <div
          role="tabpanel"
          aria-labelledby={
            tab === "ACTIVE"
              ? `${baseId}-tab-active`
              : `${baseId}-tab-settled`
          }
        >
          {displayedLoans.length === 0 ? (
            <div className="px-6 py-10 text-center text-[14px] text-[#475569]">
              {tab === "ACTIVE"
                ? `Tidak ada pinjaman aktif dengan ${contact.name}.`
                : `Belum ada riwayat pinjaman yang Impas dengan ${contact.name}.`}
            </div>
          ) : (
            <div className="divide-y divide-[#DDE4E2]">
              {displayedLoans.map((loan) => (
                <Link
                  key={loan.id}
                  href={`/loans/${loan.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#F6F8F7] transition-[background-color] duration-150"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-bold text-[#0B1312] tabular-nums">
                        {loan.type === "MONEY"
                          ? formatRupiah(loan.remaining_amount)
                          : loan.item_name}
                      </span>
                      <StatusBadge
                        status={loan.status}
                        dueDate={loan.due_date}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-[#475569]">
                      <span>{loan.type === "MONEY" ? "Uang" : "Barang"}</span>
                      <span>·</span>
                      <DueDateBadge
                        dueDate={loan.due_date}
                        status={loan.status}
                      />
                    </div>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-[#475569] shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <ContactFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        userId={userId}
        contact={contact}
        onSuccess={(saved) => setContact(saved)}
      />

      <DeleteContactModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        contact={contact}
        onSuccess={() => {
          router.push("/contacts");
          router.refresh();
        }}
      />
    </div>
  );
}
