"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  ReceiptText,
  Search,
  SearchX,
} from "lucide-react";
import type { LoanWithRelations } from "@/types/database";
import { formatRupiah, getInitials, isLoanOverdue } from "@/lib/format";
import { DueDateBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { RealtimeSync } from "@/components/ui/RealtimeSync";

interface LoansClientProps {
  loans: LoanWithRelations[];
}

type TypeFilter = "ALL" | "MONEY" | "ITEM";
type StatusFilter =
  | "ALL"
  | "PENDING_CONFIRMATION"
  | "ACTIVE"
  | "PARTIAL"
  | "OVERDUE"
  | "SETTLED";

export function LoansClient({ loans }: LoansClientProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return loans.filter((loan) => {
      if (typeFilter !== "ALL" && loan.type !== typeFilter) return false;

      if (statusFilter === "OVERDUE") {
        if (!isLoanOverdue(loan.due_date, loan.status)) return false;
      } else if (statusFilter !== "ALL") {
        if (loan.status !== statusFilter) return false;
      }

      if (q) {
        const personName = loan.contact?.name ?? "";
        const itemOrNote = `${loan.item_name ?? ""} ${loan.note ?? ""}`;
        const haystack = `${personName} ${itemOrNote}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [loans, typeFilter, statusFilter, search]);

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
  };

  const hasPending = loans.some(
    (l) => !l.confirmed_at && l.status !== "SETTLED"
  );

  return (
    <div className="space-y-6">
      <RealtimeSync hasPending={hasPending} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1312] tracking-[-0.03em]">
            Daftar pinjaman
          </h1>
          <p className="text-[14px] text-[#475569] mt-0.5">
            Kelola seluruh catatan uang dan barang yang kamu pinjamkan ke teman.
          </p>
        </div>
        <Link
          href="/loans/new"
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-semibold transition-[background-color] duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Catat pinjaman
        </Link>
      </div>

      {/* Search & Non-Button Controls */}
      <search className="bg-white border border-[#DDE4E2] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="loans-search" className="visually-hidden">
              Cari catatan pinjaman
            </label>
            <input
              id="loans-search"
              type="search"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pinjaman..."
              className="impas-input w-full pl-10 pr-3.5"
            />
          </div>

          <fieldset className="shrink-0">
            <legend className="visually-hidden">Filter tipe pinjaman</legend>
            <div className="inline-flex p-1 rounded-xl bg-[#F6F8F7] border border-[#DDE4E2]">
              {(
                [
                  { value: "ALL", label: "Semua" },
                  { value: "MONEY", label: "Uang" },
                  { value: "ITEM", label: "Barang" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`min-h-[38px] px-3.5 rounded-lg text-[13px] font-semibold inline-flex items-center cursor-pointer transition-[background-color,color] duration-150 ${
                    typeFilter === opt.value
                      ? "bg-white text-[#0F766E] shadow-xs"
                      : "text-[#475569] hover:text-[#0B1312]"
                  }`}
                >
                  <input
                    type="radio"
                    name="loans-type"
                    value={opt.value}
                    checked={typeFilter === opt.value}
                    onChange={() => setTypeFilter(opt.value)}
                    className="visually-hidden"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="md:w-52 shrink-0">
            <label htmlFor="loans-status" className="visually-hidden">
              Filter status pinjaman
            </label>
            <select
              id="loans-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="impas-input w-full px-3.5"
            >
              <option value="ALL">Semua status</option>
              <option value="PENDING_CONFIRMATION">Menunggu konfirmasi</option>
              <option value="ACTIVE">Aktif</option>
              <option value="PARTIAL">Dicicil</option>
              <option value="OVERDUE">Jatuh tempo</option>
              <option value="SETTLED">Impas</option>
            </select>
          </div>
        </div>
      </search>

      {/* Results */}
      <section className="bg-white border border-[#DDE4E2] rounded-2xl overflow-hidden">
        {loans.length === 0 ? (
          <div className="px-6 py-14 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F6F8F7] text-[#475569] flex items-center justify-center">
              <ReceiptText className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h2 className="text-[16px] font-bold text-[#0B1312]">
                Belum ada pinjaman yang dicatat
              </h2>
              <p className="text-[14px] text-[#475569]">
                Mulai catat uang atau barang yang kamu pinjamkan ke teman.
              </p>
            </div>
            <Link
              href="/loans/new"
              className="inline-flex items-center gap-2 min-h-[48px] px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-semibold transition-[background-color] duration-150"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Catat pinjaman pertama
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F6F8F7] text-[#475569] flex items-center justify-center">
              <SearchX className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h2 className="text-[16px] font-bold text-[#0B1312]">
                Pinjaman tidak ditemukan
              </h2>
              <p className="text-[14px] text-[#475569]">
                Tidak ada catatan yang cocok dengan kata kunci atau filter yang
                dipilih.
              </p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[44px] px-4 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[14px] font-semibold text-[#0B1312] transition-[background-color] duration-150"
            >
              Reset filter
            </button>
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-label="Tabel daftar pinjaman"
            className="impas-table-wrapper"
          >
            <table className="impas-table text-[14px]">
              <thead>
                <tr className="border-b border-[#DDE4E2] text-[13px] font-semibold text-[#475569]">
                  <th scope="col" className="py-3 px-5">
                    Peminjam
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Tipe
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Nominal atau barang
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Jatuh tempo
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Status
                  </th>
                  <th scope="col" className="py-3 px-5 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE4E2]">
                {filtered.map((loan) => {
                  const personName = loan.contact?.name ?? "Teman";

                  return (
                    <tr key={loan.id}>
                      <th scope="row" className="py-3.5 px-5 font-semibold text-[#0B1312]">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center text-[13px] font-bold shrink-0">
                            {getInitials(personName)}
                          </div>
                          <span className="truncate">{personName}</span>
                        </div>
                      </th>
                      <td data-label="Tipe" className="py-3.5 px-4 text-[#475569] font-medium">
                        {loan.type === "MONEY" ? "Uang" : "Barang"}
                      </td>
                      <td
                        data-label="Nominal / Barang"
                        className="py-3.5 px-4 font-semibold text-[#0B1312] tabular-nums"
                      >
                        {loan.type === "MONEY" ? (
                          <div>
                            <span>{formatRupiah(loan.remaining_amount)}</span>
                            {loan.status === "PARTIAL" && (
                              <span className="block text-[13px] font-normal text-[#475569]">
                                dari {formatRupiah(loan.amount)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>{loan.item_name}</span>
                        )}
                      </td>
                      <td data-label="Jatuh tempo" className="py-3.5 px-4">
                        <DueDateBadge
                          dueDate={loan.due_date}
                          status={loan.status}
                        />
                      </td>
                      <td data-label="Status" className="py-3.5 px-4">
                        <StatusBadge
                          status={loan.status}
                          dueDate={loan.due_date}
                        />
                      </td>
                      <td data-label="Aksi" className="py-3.5 px-5 text-right">
                        <Link
                          href={`/loans/${loan.id}`}
                          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0F766E] hover:text-[#0D655E]"
                        >
                          Detail
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
