"use client";

import React, { Suspense, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Package,
  Plus,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseError } from "@/lib/errors";
import { createLoanSchema } from "@/lib/validations";
import { formatRupiah, getTodayIsoDate, parseFlexibleRupiah } from "@/lib/format";
import { uploadLoanProof } from "@/lib/storage";
import type { Contact, LoanType } from "@/types/database";
import { ContactFormModal } from "@/components/modals/ContactFormModal";

function NewLoanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const baseId = useId();

  const contactRef = useRef<HTMLSelectElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const itemNameRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);

  const preselectedContactId = searchParams.get("contactId") ?? "";

  const [userId, setUserId] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const [loanType, setLoanType] = useState<LoanType>("MONEY");
  const [contactId, setContactId] = useState(preselectedContactId);
  const [amountInput, setAmountInput] = useState("");
  const [itemName, setItemName] = useState("");
  const [dueDate, setDueDate] = useState(getTodayIsoDate());
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [contactModalOpen, setContactModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (!active) return;
      const list = (data ?? []) as Contact[];
      setContacts(list);
      if (
        preselectedContactId &&
        list.some((c) => c.id === preselectedContactId)
      ) {
        setContactId(preselectedContactId);
      }
      setLoadingContacts(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [preselectedContactId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const numericAmount =
      loanType === "MONEY" ? parseFlexibleRupiah(amountInput) : null;

    const parsed = createLoanSchema.safeParse({
      type: loanType,
      contact_id: contactId,
      amount: numericAmount,
      item_name: loanType === "ITEM" ? itemName.trim() : null,
      due_date: dueDate,
      note: note.trim() || null,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      if (fieldErrors.contact_id) contactRef.current?.focus();
      else if (fieldErrors.amount) amountRef.current?.focus();
      else if (fieldErrors.item_name) itemNameRef.current?.focus();
      else if (fieldErrors.due_date) dueDateRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      let photoUrl: string | null = null;
      if (file && userId) {
        photoUrl = await uploadLoanProof(supabase, userId, file);
      }

      const isMoney = parsed.data.type === "MONEY";
      const payload = {
        user_id: userId,
        contact_id: parsed.data.contact_id,
        type: parsed.data.type,
        amount: isMoney ? (parsed.data.amount ?? null) : null,
        remaining_amount: isMoney ? (parsed.data.amount ?? null) : null,
        item_name: isMoney ? null : (parsed.data.item_name ?? null),
        photo_url: photoUrl,
        due_date: parsed.data.due_date,
        note: parsed.data.note ?? null,
      };

      const { data, error } = await supabase
        .from("loans")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      router.push(`/loans/${data.id}`);
      router.refresh();
    } catch (err) {
      setErrors({
        form: translateSupabaseError(err, "Gagal menyimpan catatan pinjaman."),
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/loans"
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[#475569] transition-[background-color] duration-150"
          aria-label="Kembali ke daftar pinjaman"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1312] tracking-[-0.03em]">
            Catat pinjaman baru
          </h1>
          <p className="text-[14px] text-[#475569]">
            Catat uang atau barang yang kamu pinjamkan ke teman.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-[#DDE4E2] rounded-2xl p-5 sm:p-7 space-y-5"
      >
        {errors.form && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] font-medium text-[#9F1239]"
          >
            {errors.form}
          </div>
        )}
        {/* Native Radio Segmented Toggle */}
        <fieldset>
          <legend className="block text-[14px] font-semibold text-[#0B1312] mb-2">
            Jenis pinjaman
          </legend>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F6F8F7] border border-[#DDE4E2]">
            {(
              [
                { value: "MONEY", label: "Uang", Icon: Wallet },
                { value: "ITEM", label: "Barang", Icon: Package },
              ] as const
            ).map(({ value, label, Icon }) => (
              <label
                key={value}
                className={`min-h-[44px] rounded-lg text-[14px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-[background-color,color] duration-150 ${
                  loanType === value
                    ? "bg-white text-[#0F766E] shadow-xs"
                    : "text-[#475569] hover:text-[#0B1312]"
                }`}
              >
                <input
                  type="radio"
                  name={`${baseId}-type`}
                  value={value}
                  checked={loanType === value}
                  onChange={() => {
                    setLoanType(value);
                    setErrors({});
                  }}
                  className="visually-hidden"
                />
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Pilih Kontak + Tambah Kontak Baru */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={`${baseId}-contact`}
              className="text-[14px] font-semibold text-[#0B1312]"
            >
              Pilih teman (peminjam) <span className="text-[#BE123C]">*</span>
            </label>
            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0F766E] hover:text-[#0D655E]"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Tambah kontak baru
            </button>
          </div>
          <select
            ref={contactRef}
            id={`${baseId}-contact`}
            name="contact_id"
            required
            value={contactId}
            onChange={(e) => {
              setContactId(e.target.value);
              if (errors.contact_id) {
                setErrors((p) => ({ ...p, contact_id: "" }));
              }
            }}
            aria-invalid={errors.contact_id ? "true" : "false"}
            aria-describedby={
              errors.contact_id ? `${baseId}-contact-err` : undefined
            }
            disabled={loadingContacts}
            className="impas-input w-full px-3.5"
          >
            <option value="">
              {loadingContacts
                ? "Memuat daftar kontak..."
                : contacts.length === 0
                ? "Belum ada kontak, klik + Tambah kontak baru"
                : "-- Pilih teman --"}
            </option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.whatsapp_number})
              </option>
            ))}
          </select>
          {errors.contact_id && (
            <p
              id={`${baseId}-contact-err`}
              className="mt-1.5 text-[13px] font-medium text-[#BE123C]"
            >
              {errors.contact_id}
            </p>
          )}
        </div>

        {/* Nominal or Item Name */}
        {loanType === "MONEY" ? (
          <div>
            <label
              htmlFor={`${baseId}-amount`}
              className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
            >
              Nominal pinjaman (Rp) <span className="text-[#BE123C]">*</span>
            </label>
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
                enterKeyHint="next"
                required
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
                }}
                aria-invalid={errors.amount ? "true" : "false"}
                aria-describedby={
                  errors.amount ? `${baseId}-amount-err` : undefined
                }
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
              <p
                id={`${baseId}-amount-err`}
                className="mt-1.5 text-[13px] font-medium text-[#BE123C]"
              >
                {errors.amount}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label
              htmlFor={`${baseId}-item-name`}
              className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
            >
              Nama barang <span className="text-[#BE123C]">*</span>
            </label>
            <input
              ref={itemNameRef}
              id={`${baseId}-item-name`}
              name="item_name"
              type="text"
              enterKeyHint="next"
              required
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
                if (errors.item_name) {
                  setErrors((p) => ({ ...p, item_name: "" }));
                }
              }}
              aria-invalid={errors.item_name ? "true" : "false"}
              aria-describedby={
                errors.item_name ? `${baseId}-item-err` : undefined
              }
              placeholder="Masukkan nama barang"
              className="impas-input w-full px-3.5"
            />
            {errors.item_name && (
              <p
                id={`${baseId}-item-err`}
                className="mt-1.5 text-[13px] font-medium text-[#BE123C]"
              >
                {errors.item_name}
              </p>
            )}
          </div>
        )}

        {/* Due Date */}
        <div>
          <label
            htmlFor={`${baseId}-due-date`}
            className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
          >
            Tanggal jatuh tempo <span className="text-[#BE123C]">*</span>
          </label>
          <input
            ref={dueDateRef}
            id={`${baseId}-due-date`}
            name="due_date"
            type="date"
            required
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              if (errors.due_date) {
                setErrors((p) => ({ ...p, due_date: "" }));
              }
            }}
            aria-invalid={errors.due_date ? "true" : "false"}
            aria-describedby={
              errors.due_date ? `${baseId}-due-err` : undefined
            }
            className="impas-input w-full px-3.5 tabular-nums"
          />
          {errors.due_date && (
            <p
              id={`${baseId}-due-err`}
              className="mt-1.5 text-[13px] font-medium text-[#BE123C]"
            >
              {errors.due_date}
            </p>
          )}
        </div>

        {/* Dynamic Photo Upload Label */}
        <div>
          <label
            htmlFor={`${baseId}-photo`}
            className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
          >
            {loanType === "MONEY"
              ? "Bukti transfer atau struk"
              : "Foto kondisi barang"}{" "}
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
              htmlFor={`${baseId}-photo`}
              className="flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#0F766E] bg-[#F6F8F7] cursor-pointer text-[13px] font-semibold text-[#475569] hover:text-[#0F766E] transition-[border-color,color] duration-150"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              {loanType === "MONEY"
                ? "Unggah bukti transfer atau struk (JPG, PNG, WEBP)"
                : "Unggah foto kondisi barang (JPG, PNG, WEBP)"}
              <input
                id={`${baseId}-photo`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="visually-hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>

        {/* Note */}
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
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Masukkan catatan"
            className="impas-textarea w-full p-3.5 resize-y"
          />
          {errors.note && (
            <p className="mt-1.5 text-[13px] font-medium text-[#BE123C]">
              {errors.note}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
          <Link
            href="/loans"
            className="min-h-[48px] px-5 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[14px] font-semibold text-[#475569] inline-flex items-center justify-center transition-[background-color] duration-150"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[48px] px-6 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-60 text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
          >
            {submitting && (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            )}
            Simpan dan buat link konfirmasi
          </button>
        </div>
      </form>

      {userId && (
        <ContactFormModal
          open={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          userId={userId}
          onSuccess={(saved) => {
            setContacts((prev) =>
              [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
            );
            setContactId(saved.id);
            setErrors((prev) => ({ ...prev, contact_id: "" }));
          }}
        />
      )}
    </div>
  );
}

export default function NewLoanPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
      <NewLoanForm />
    </Suspense>
  );
}
