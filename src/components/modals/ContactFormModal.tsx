"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import { contactSchema } from "@/lib/validations";
import type { Contact } from "@/types/database";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface ContactFormModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  contact?: Contact | null;
  onSuccess: (savedContact: Contact) => void;
}

export function ContactFormModal({
  open,
  onClose,
  userId,
  contact,
  onSuccess,
}: ContactFormModalProps) {
  const isEdit = Boolean(contact);
  const baseId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(contact?.name ?? "");
      setWhatsappNumber(contact?.whatsapp_number ?? "");
      setNote(contact?.note ?? "");
      setErrors({});
    }
  }, [open, contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = contactSchema.safeParse({
      name,
      whatsapp_number: whatsappNumber,
      note,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      if (fieldErrors.name) nameRef.current?.focus();
      else if (fieldErrors.whatsapp_number) phoneRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      if (isEdit && contact) {
        const { data, error } = await supabase
          .from("contacts")
          .update({
            name: parsed.data.name,
            whatsapp_number: parsed.data.whatsapp_number,
            note: parsed.data.note || null,
          })
          .eq("id", contact.id)
          .select()
          .single();

        if (error) throw error;
        onSuccess(data as Contact);
        onClose();
      } else {
        const { data, error } = await supabase
          .from("contacts")
          .insert({
            user_id: userId,
            name: parsed.data.name,
            whatsapp_number: parsed.data.whatsapp_number,
            note: parsed.data.note || null,
          })
          .select()
          .single();

        if (error) throw error;
        onSuccess(data as Contact);
        onClose();
      }
    } catch (err) {
      setErrors({
        form: translateSupabaseError(err, "Gagal menyimpan data kontak."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit kontak teman" : "Tambah kontak baru"}
      description={
        isEdit
          ? "Perbarui nama atau nomor WhatsApp teman kamu."
          : "Simpan data teman agar lebih cepat saat mencatat pinjaman."
      }
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
          <label
            htmlFor={`${baseId}-name`}
            className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
          >
            Nama lengkap atau panggilan <span className="text-[#BE123C]">*</span>
          </label>
          <input
            ref={nameRef}
            id={`${baseId}-name`}
            name="name"
            type="text"
            autoComplete="name"
            enterKeyHint="next"
            required
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: "" }));
            }}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? `${baseId}-name-err` : undefined}
            placeholder="Masukkan nama lengkap"
            className="impas-input w-full px-3.5"
          />
          {errors.name && (
            <p id={`${baseId}-name-err`} className="mt-1.5 text-[13px] font-medium text-[#BE123C]">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${baseId}-phone`}
            className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
          >
            Nomor WhatsApp <span className="text-[#BE123C]">*</span>
          </label>
          <input
            ref={phoneRef}
            id={`${baseId}-phone`}
            name="whatsapp_number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="next"
            required
            value={whatsappNumber}
            onChange={(e) => {
              setWhatsappNumber(e.target.value);
              if (errors.whatsapp_number) {
                setErrors((p) => ({ ...p, whatsapp_number: "" }));
              }
            }}
            aria-invalid={errors.whatsapp_number ? "true" : "false"}
            aria-describedby={
              errors.whatsapp_number
                ? `${baseId}-phone-help ${baseId}-phone-err`
                : `${baseId}-phone-help`
            }
            placeholder="Masukkan nomor WhatsApp"
            className="impas-input w-full px-3.5 tabular-nums"
          />
          <p id={`${baseId}-phone-help`} className="mt-1.5 text-[13px] text-[#475569]">
            Otomatis diformat ke kode negara 62 saat mengirim pengingat.
          </p>
          {errors.whatsapp_number && (
            <p id={`${baseId}-phone-err`} className="mt-1 text-[13px] font-medium text-[#BE123C]">
              {errors.whatsapp_number}
            </p>
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
          {errors.note && (
            <p className="mt-1 text-[13px] font-medium text-[#BE123C]">
              {errors.note}
            </p>
          )}
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
            {isEdit ? "Simpan perubahan" : "Simpan kontak"}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
