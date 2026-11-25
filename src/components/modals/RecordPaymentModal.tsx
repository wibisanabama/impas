"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import { createRecordPaymentSchema } from "@/lib/validations";
import { formatRupiah, getTodayIsoDate, parseFlexibleRupiah } from "@/lib/format";
import { uploadLoanProof } from "@/lib/storage";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  loanId: string;
  userId: string;
  remainingAmount: number;
  borrowerName: string;
  onSuccess: () => void | Promise<void>;
}

export function RecordPaymentModal({
  open,
  onClose,
  loanId,
  userId,
  remainingAmount,
  borrowerName,
  onSuccess,
}: RecordPaymentModalProps) {
  const baseId = useId();
  const amountRef = useRef<HTMLInputElement>(null);

  const [amountInput, setAmountInput] = useState("");
  const [paidAt, setPaidAt] = useState(getTodayIsoDate());
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmountInput("");
      setPaidAt(getTodayIsoDate());
      setNote("");
      setFile(null);
      setErrors({});
    }
  }, [open]);

  const handleSetFull = () => {
    setAmountInput(String(remainingAmount));
    setErrors((prev) => ({ ...prev, amount: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const numericAmount = parseFlexibleRupiah(amountInput);
    const schema = createRecordPaymentSchema(remainingAmount);
    const parsed = schema.safeParse({
      amount: numericAmount,
      paid_at: paidAt,
      note: note.trim() || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      if (fieldErrors.amount) amountRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      let proofUrl: string | null = null;

      if (file) {
        proofUrl = await uploadLoanProof(supabase, userId, file);
      }

      const { error } = await supabase.rpc("record_loan_payment", {
        p_loan_id: loanId,
        p_amount: parsed.data.amount,
        p_paid_at: parsed.data.paid_at,
        p_proof_url: proofUrl,
        p_note: parsed.data.note ?? null,
      });

      if (error) throw error;

      await onSuccess();
      onClose();
    } catch (err) {
      setErrors({
        form: translateSupabaseError(err, "Gagal mencatat pembayaran."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Catat cicilan atau pelunasan"
      description={`Peminjam: ${borrowerName} · Sisa tagihan: ${formatRupiah(remainingAmount)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] font-medium text-[#9F1239]"
          >
            {errors.form}
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={`${baseId}-amount`}
              className="text-[14px] font-semibold text-[#0B1312]"
            >
              Nominal diterima (Rp) <span className="text-[#BE123C]">*</span>
            </label>
            <button
              type="button"
              onClick={handleSetFull}
              className="text-[13px] font-semibold text-[#0F766E] hover:text-[#0D655E] bg-[#E6F4F1] hover:bg-[#CCFBF1] px-2.5 py-1 rounded-lg transition-[background-color,color] duration-150"
            >
              Lunasi semua
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-[#475569]">
              Rp
            </span>
            <input
              ref={amountRef}
              id={`${baseId}-amount`}
              name="amount"
              type="text"
              inputMode="decimal"
              required
              autoFocus
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
              }}
              aria-invalid={errors.amount ? "true" : "false"}
              aria-describedby={errors.amount ? `${baseId}-amount-err` : undefined}
              placeholder="Masukkan nominal"
              className="impas-input w-full pl-10 pr-3.5 font-semibold tabular-nums"
            />
          </div>
          {amountInput.trim() !== "" &&
            !Number.isNaN(parseFlexibleRupiah(amountInput)) &&
            parseFlexibleRupiah(amountInput) > 0 && (
              <p className="mt-1.5 text-[13px] text-[#475569] tabular-nums">
                Terbaca:{" "}
                <strong className="text-[#0B1312]">
                  {formatRupiah(parseFlexibleRupiah(amountInput))}
                </strong>
              </p>
            )}
          {errors.amount && (
            <p id={`${baseId}-amount-err`} className="mt-1.5 text-[13px] font-medium text-[#BE123C]">
              {errors.amount}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${baseId}-paid-at`}
            className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
          >
            Tanggal pembayaran <span className="text-[#BE123C]">*</span>
          </label>
          <input
            id={`${baseId}-paid-at`}
            name="paid_at"
            type="date"
            required
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="impas-input w-full px-3.5 tabular-nums"
          />
          {errors.paid_at && (
            <p className="mt-1.5 text-[13px] font-medium text-[#BE123C]">
              {errors.paid_at}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${baseId}-proof`}
            className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
          >
            Bukti transfer{" "}
            <span className="text-[#475569] font-normal">(opsional, maks 5 MB)</span>
          </label>
          {file ? (
            <div className="flex items-center justify-between px-3.5 min-h-[48px] rounded-xl border border-[#DDE4E2] bg-[#F6F8F7]">
              <span className="text-[13px] font-medium text-[#0B1312] truncate">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1.5 text-[#475569] hover:text-[#BE123C]"
                aria-label="Hapus file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={`${baseId}-proof`}
              className="flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#0F766E] bg-[#F6F8F7] cursor-pointer text-[13px] font-semibold text-[#475569] hover:text-[#0F766E] transition-[border-color,color] duration-150"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              Unggah foto bukti (JPG, PNG, WEBP)
              <input
                id={`${baseId}-proof`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="visually-hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>

        <div>
          <label
            htmlFor={`${baseId}-note`}
            className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
          >
            Catatan{" "}
            <span className="text-[#475569] font-normal">(opsional)</span>
          </label>
          <textarea
            id={`${baseId}-note`}
            name="note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Masukkan catatan"
            className="impas-textarea w-full p-3.5 resize-y"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-[48px] px-4 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[14px] font-semibold text-[#475569] transition-[background-color] duration-150"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[48px] px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-60 text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            Simpan pembayaran
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
