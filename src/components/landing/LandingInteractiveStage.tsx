"use client";

import React, { useId, useState } from "react";
import { CheckCircle2, Clock, Package, Wallet } from "lucide-react";

type StageMode = "MONEY" | "ITEM";

export function LandingInteractiveStage() {
  const baseId = useId();
  const [mode, setMode] = useState<StageMode>("MONEY");
  const [confirmed, setConfirmed] = useState(true);

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-[#DDE4E2] rounded-2xl shadow-[0_8px_30px_rgba(11,19,18,0.05)] overflow-hidden text-left">
      {/* Top Toolbar */}
      <div className="px-5 py-4 sm:px-8 border-b border-[#DDE4E2] bg-[#F6F8F7]/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <fieldset>
          <legend className="visually-hidden">Pilih contoh catatan</legend>
          <div className="inline-flex p-1 rounded-xl bg-white border border-[#DDE4E2]">
            <label
              className={`min-h-[38px] px-3 sm:px-4 rounded-lg text-[13px] sm:text-[14px] font-semibold whitespace-nowrap inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-[background-color,color] duration-150 ${
                mode === "MONEY"
                  ? "bg-[#0F766E] text-white"
                  : "text-[#475569] hover:text-[#0B1312]"
              }`}
            >
              <input
                type="radio"
                name={`${baseId}-mode`}
                value="MONEY"
                checked={mode === "MONEY"}
                onChange={() => setMode("MONEY")}
                className="visually-hidden"
              />
              <Wallet className="w-4 h-4 shrink-0" aria-hidden="true" />
              Pinjaman uang
            </label>
            <label
              className={`min-h-[38px] px-3 sm:px-4 rounded-lg text-[13px] sm:text-[14px] font-semibold whitespace-nowrap inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-[background-color,color] duration-150 ${
                mode === "ITEM"
                  ? "bg-[#0F766E] text-white"
                  : "text-[#475569] hover:text-[#0B1312]"
              }`}
            >
              <input
                type="radio"
                name={`${baseId}-mode`}
                value="ITEM"
                checked={mode === "ITEM"}
                onChange={() => setMode("ITEM")}
                className="visually-hidden"
              />
              <Package className="w-4 h-4 shrink-0" aria-hidden="true" />
              Pinjaman barang
            </label>
          </div>
        </fieldset>

        <button
          type="button"
          onClick={() => setConfirmed((prev) => !prev)}
          className="min-h-[40px] px-4 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#E6F4F1] hover:border-[#0F766E]/40 text-[13px] font-semibold text-[#0F766E] inline-flex items-center justify-center gap-2 transition-[background-color,border-color] duration-150"
        >
          {confirmed ? (
            <>
              <Clock className="w-4 h-4" aria-hidden="true" />
              Lihat status sebelum konfirmasi
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Simulasikan konfirmasi teman
            </>
          )}
        </button>
      </div>

      {/* Hairline-Divided Interactive Ledger Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#DDE4E2]">
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-[#475569]">
                {mode === "MONEY"
                  ? "Peminjam: Budi Santoso"
                  : "Peminjam: Ratna Dewi"}
              </p>
              <h3 className="text-[20px] font-bold text-[#0B1312] mt-1">
                {mode === "MONEY"
                  ? "Talangan tiket pesawat dinas"
                  : "Kamera Mirrorless Sony A6400"}
              </h3>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold border ${
                confirmed
                  ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
                  : "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  confirmed ? "bg-[#059669]" : "bg-[#D97706]"
                }`}
                aria-hidden="true"
              />
              {confirmed ? "Terkonfirmasi" : "Menunggu konfirmasi"}
            </span>
          </div>

          {mode === "MONEY" ? (
            <div className="pt-4 border-t border-[#DDE4E2] space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[14px] text-[#475569]">Sisa tagihan</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1312] tabular-nums">
                  {confirmed ? "Rp 1.000.000" : "Rp 1.500.000"}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F6F8F7] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0F766E] transition-[width] duration-300"
                  style={{ width: confirmed ? "33%" : "0%" }}
                />
              </div>
              <div className="flex items-center justify-between text-[13px] text-[#475569] tabular-nums">
                <span>
                  Sudah dibayar {confirmed ? "Rp 500.000" : "Rp 0"}
                </span>
                <span>Total Rp 1.500.000</span>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-[#DDE4E2] grid grid-cols-2 gap-4 text-[14px]">
              <div>
                <p className="text-[13px] text-[#475569]">Kelengkapan</p>
                <p className="font-semibold text-[#0B1312] mt-0.5">
                  Lensa kit, baterai, tas kamera
                </p>
              </div>
              <div>
                <p className="text-[13px] text-[#475569]">Bukti foto</p>
                <p className="font-semibold text-[#0F766E] mt-0.5">
                  Kondisi awal tersimpan
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 p-6 sm:p-8 bg-[#F6F8F7]/60 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <p className="text-[14px] font-bold text-[#0B1312]">
              Jejak konfirmasi dua pihak
            </p>
            <div className="space-y-2.5 text-[13px] text-[#475569] tabular-nums">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#DDE4E2]">
                <span>Tautan publik</span>
                <span className="font-semibold text-[#0B1312]">
                  impas.app/c/9a4f...
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#DDE4E2]">
                <span>Jatuh tempo</span>
                <span className="font-semibold text-[#0B1312]">
                  {mode === "MONEY" ? "26 Nov 2026" : "28 Nov 2026"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Akun peminjam</span>
                <span className="font-semibold text-[#0F766E]">
                  {confirmed ? "Setuju via tautan" : "Belum perlu daftar"}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[13px] text-[#475569] leading-relaxed">
            {confirmed
              ? "Teman sudah menekan konfirmasi. Status dan waktu persetujuan langsung tercatat otomatis di dashboard kamu."
              : "Kirim tautan ke WhatsApp. Temanmu cukup membaca detail dan klik satu tombol konfirmasi."}
          </p>
        </div>
      </div>
    </div>
  );
}
