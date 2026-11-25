"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Package,
  Plus,
  Search,
  SearchX,
  Users,
} from "lucide-react";
import type { Contact, Loan } from "@/types/database";
import { formatRupiah, getInitials } from "@/lib/format";
import { ContactFormModal } from "@/components/modals/ContactFormModal";

interface ContactsClientProps {
  userId: string;
  initialContacts: Contact[];
  loans: Pick<
    Loan,
    "id" | "contact_id" | "type" | "remaining_amount" | "item_name" | "status"
  >[];
}

export function ContactsClient({
  userId,
  initialContacts,
  loans,
}: ContactsClientProps) {
  const router = useRouter();
  const baseId = useId();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  const summaryByContact = useMemo(() => {
    const map = new Map<
      string,
      { activeMoneyTotal: number; activeItems: string[] }
    >();

    for (const loan of loans) {
      if (loan.status === "SETTLED") continue;
      const entry = map.get(loan.contact_id) ?? {
        activeMoneyTotal: 0,
        activeItems: [],
      };
      if (loan.type === "MONEY") {
        entry.activeMoneyTotal += Number(loan.remaining_amount ?? 0);
      } else if (loan.item_name) {
        entry.activeItems.push(loan.item_name);
      }
      map.set(loan.contact_id, entry);
    }

    return map;
  }, [loans]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.whatsapp_number.toLowerCase().includes(q) ||
        (c.note ?? "").toLowerCase().includes(q)
    );
  }, [contacts, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1312] tracking-[-0.03em]">
            Kontak dan rekap per teman
          </h1>
          <p className="text-[14px] text-[#475569] mt-0.5">
            Pantau saldo piutang dan barang yang sedang dipinjam setiap teman.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-semibold transition-[background-color] duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Tambah kontak
        </button>
      </div>

      {/* Search Landmark */}
      <search className="bg-white border border-[#DDE4E2] rounded-2xl p-4">
        <div className="relative">
          <Search
            className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor={`${baseId}-search`} className="visually-hidden">
            Cari kontak teman
          </label>
          <input
            id={`${baseId}-search`}
            type="search"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kontak..."
            className="impas-input w-full pl-10 pr-3.5"
          />
        </div>
      </search>

      {/* Content */}
      {contacts.length === 0 ? (
        <div className="bg-white border border-[#DDE4E2] rounded-2xl px-6 py-14 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F6F8F7] text-[#475569] flex items-center justify-center">
            <Users className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h2 className="text-[16px] font-bold text-[#0B1312]">
              Belum ada kontak teman
            </h2>
            <p className="text-[14px] text-[#475569]">
              Tambahkan teman kamu untuk mulai mencatat pinjaman uang atau
              barang dengan lebih cepat.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 min-h-[48px] px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-semibold transition-[background-color] duration-150"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Tambah kontak pertama
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#DDE4E2] rounded-2xl px-6 py-14 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F6F8F7] text-[#475569] flex items-center justify-center">
            <SearchX className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h2 className="text-[16px] font-bold text-[#0B1312]">
              Kontak tidak ditemukan
            </h2>
            <p className="text-[14px] text-[#475569]">
              Tidak ada kontak yang cocok dengan pencarian &ldquo;{search}&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="min-h-[44px] px-4 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[14px] font-semibold text-[#0B1312] transition-[background-color] duration-150"
          >
            Reset pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((contact) => {
            const summary = summaryByContact.get(contact.id) ?? {
              activeMoneyTotal: 0,
              activeItems: [],
            };

            return (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="group bg-white border border-[#DDE4E2] hover:border-[#0F766E] rounded-2xl p-5 flex flex-col justify-between gap-4 transition-[border-color] duration-150"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center text-[13px] font-bold shrink-0">
                      {getInitials(contact.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-[#0B1312] truncate group-hover:text-[#0F766E] transition-[color] duration-150">
                        {contact.name}
                      </p>
                      <p className="text-[13px] text-[#475569] tabular-nums truncate">
                        {contact.whatsapp_number}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-[#475569] group-hover:text-[#0F766E] shrink-0 mt-1 transition-[color] duration-150"
                    aria-hidden="true"
                  />
                </div>

                <div className="pt-3 border-t border-[#DDE4E2] space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] text-[#475569]">
                      Saldo piutang aktif
                    </span>
                    <span
                      className={`text-[15px] font-bold tabular-nums ${
                        summary.activeMoneyTotal > 0
                          ? "text-[#0F766E]"
                          : "text-[#0B1312]"
                      }`}
                    >
                      {formatRupiah(summary.activeMoneyTotal)}
                    </span>
                  </div>

                  {summary.activeItems.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[13px] text-[#1E40AF] bg-[#EFF6FF] px-2.5 py-1.5 rounded-lg">
                      <Package className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {summary.activeItems.length} barang:{" "}
                        {summary.activeItems.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ContactFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={userId}
        onSuccess={(saved) => {
          setContacts((prev) =>
            [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
          );
          router.refresh();
        }}
      />
    </div>
  );
}
