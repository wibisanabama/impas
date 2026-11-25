"use client";

import React, { useEffect, useId, useState } from "react";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import { markItemReturnedSchema } from "@/lib/validations";
import { uploadLoanProof } from "@/lib/storage";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface MarkItemReturnedModalProps {
  open: boolean;
  onClose: () => void;
  loanId: string;
  userId: string;
  itemName: string;
  borrowerName: string;
  onSuccess: () => void | Promise<void>;
}

export function MarkItemReturnedModal({
  open,
  onClose,
  loanId,
  userId,
  itemName,
  borrowerName,
  onSuccess,
}: MarkItemReturnedModalProps) {
  const baseId = useId();
  const [returnNote, setReturnNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReturnNote("");
      setFile(null);
      setErrorMsg(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsed = markItemReturnedSchema.safeParse({
      return_note: returnNote.trim() || undefined,
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Input tidak valid");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      let returnPhotoUrl: string | null = null;
      if (file) {
        returnPhotoUrl = await uploadLoanProof(supabase, userId, file);
      }

      const { error } = await supabase.rpc("mark_item_returned", {
        p_loan_id: loanId,
        p_return_photo_url: returnPhotoUrl,
        p_return_note: parsed.data.return_note ?? null,
      });

      if (error) throw error;

      await onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(
        translateSupabaseError(err, "Gagal menandai barang sudah kembali.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Tandai barang sudah kembali"
      description={`Barang "${itemName}" dari ${borrowerName} akan ditandai Impas.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] font-medium text-[#9F1239]"
          >
            {errorMsg}
          </div>
        )}
        <div>
          <label
            htmlFor={`${baseId}-return-photo`}
            className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
          >
            Foto kondisi kembali{" "}
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
              htmlFor={`${baseId}-return-photo`}
              className="flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#0F766E] bg-[#F6F8F7] cursor-pointer text-[13px] font-semibold text-[#475569] hover:text-[#0F766E] transition-[border-color,color] duration-150"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              Unggah foto kondisi barang kembali
              <input
                id={`${baseId}-return-photo`}
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
            htmlFor={`${baseId}-return-note`}
            className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
          >
            Catatan pengembalian{" "}
            <span className="text-[#475569] font-normal">(opsional)</span>
          </label>
          <textarea
            id={`${baseId}-return-note`}
            name="return_note"
            rows={2}
            value={returnNote}
            onChange={(e) => setReturnNote(e.target.value)}
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
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            )}
            Tandai sudah kembali
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
