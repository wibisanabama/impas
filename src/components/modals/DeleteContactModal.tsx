"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import type { Contact } from "@/types/database";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface DeleteContactModalProps {
  open: boolean;
  onClose: () => void;
  contact: Contact | null;
  onSuccess: () => void;
}

export function DeleteContactModal({
  open,
  onClose,
  contact,
  onSuccess,
}: DeleteContactModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!contact) return;
    setErrorMsg(null);
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contact.id);

      if (error) {
        if (error.code === "23503") {
          setErrorMsg(
            "Kontak ini masih memiliki catatan pinjaman dan tidak bisa dihapus."
          );
          return;
        }
        throw error;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(translateSupabaseError(err, "Gagal menghapus kontak."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Hapus kontak?"
      maxWidthClass="md:max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239]">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[14px] leading-relaxed">
            Kamu yakin ingin menghapus kontak{" "}
            <strong className="font-semibold">{contact?.name}</strong>? Tindakan
            ini tidak dapat dibatalkan.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] font-medium text-[#9F1239]"
          >
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={deleting}
            className="min-h-[48px] px-4 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[14px] font-semibold text-[#0B1312] transition-[background-color] duration-150"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="min-h-[48px] px-5 rounded-xl bg-[#BE123C] hover:bg-[#9F1239] disabled:opacity-60 text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            Ya, hapus kontak
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
