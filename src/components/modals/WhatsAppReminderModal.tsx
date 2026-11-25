"use client";

import React, { useEffect, useId, useState } from "react";
import { Copy, Check } from "lucide-react";
import type { LoanStatus, LoanType } from "@/types/database";
import {
  buildWhatsAppReminder,
  buildWhatsAppUrl,
  type ReminderTone,
} from "@/lib/format";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

interface WhatsAppReminderModalProps {
  open: boolean;
  onClose: () => void;
  borrowerName: string;
  borrowerPhone: string;
  lenderName: string;
  type: LoanType;
  remainingAmount?: number | null;
  itemName?: string | null;
  dueDate: string;
  confirmUrl: string;
  status: LoanStatus;
}

export function WhatsAppReminderModal({
  open,
  onClose,
  borrowerName,
  borrowerPhone,
  lenderName,
  type,
  remainingAmount,
  itemName,
  dueDate,
  confirmUrl,
  status,
}: WhatsAppReminderModalProps) {
  const baseId = useId();
  const [tone, setTone] = useState<ReminderTone>("santai");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setTone("santai");
      setMessage(
        buildWhatsAppReminder({
          borrowerName,
          lenderName,
          type,
          remainingAmount,
          itemName,
          dueDate,
          confirmUrl,
          status,
          tone: "santai",
        })
      );
      setCopied(false);
    }
  }, [
    open,
    borrowerName,
    lenderName,
    type,
    remainingAmount,
    itemName,
    dueDate,
    confirmUrl,
    status,
  ]);

  const handleToneChange = (nextTone: ReminderTone) => {
    setTone(nextTone);
    setMessage(
      buildWhatsAppReminder({
        borrowerName,
        lenderName,
        type,
        remainingAmount,
        itemName,
        dueDate,
        confirmUrl,
        status,
        tone: nextTone,
      })
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const waUrl = buildWhatsAppUrl(borrowerPhone, message);

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Kirim pengingat WhatsApp"
      description={`Kirim ke ${borrowerName} (${borrowerPhone})`}
    >
      <div className="space-y-4">
        <fieldset>
          <legend className="block text-[14px] font-semibold text-[#0B1312] mb-2">
            Pilih gaya bahasa
          </legend>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F6F8F7] border border-[#DDE4E2]">
            {(
              [
                { value: "santai", label: "Santai" },
                { value: "formal", label: "Formal" },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`relative min-h-[40px] rounded-lg text-[14px] font-semibold inline-flex items-center justify-center cursor-pointer transition-[background-color,color] duration-150 ${
                  tone === opt.value
                    ? "bg-white text-[#0F766E] shadow-xs"
                    : "text-[#475569] hover:text-[#0B1312]"
                }`}
              >
                <input
                  type="radio"
                  name={`${baseId}-tone`}
                  value={opt.value}
                  checked={tone === opt.value}
                  onChange={() => handleToneChange(opt.value)}
                  className="visually-hidden"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor={`${baseId}-message`}
            className="block text-[14px] font-semibold text-[#0B1312] mb-1.5"
          >
            Pratinjau pesan (bisa diedit)
          </label>
          <textarea
            id={`${baseId}-message`}
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="impas-textarea w-full p-3.5 leading-relaxed resize-y"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[48px] px-4 rounded-xl border border-[#DDE4E2] bg-white hover:bg-[#F6F8F7] text-[14px] font-semibold text-[#0B1312] inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4 text-[#475569]" aria-hidden="true" />
            )}
            {copied ? "Tersalin" : "Salin pesan"}
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="min-h-[48px] px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color] duration-150"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Buka WhatsApp
          </a>
        </div>
      </div>
    </ResponsiveModal>
  );
}
