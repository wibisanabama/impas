import type { LoanStatus, LoanType } from "@/types/database";

export function formatRupiah(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "Rp 0";
  return `Rp ${Math.round(num).toLocaleString("id-ID")}`;
}

export function parseFlexibleRupiah(raw: string): number {
  const cleaned = raw.replace(/[^0-9.,]/g, "").trim();
  if (!cleaned) return Number.NaN;

  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");

  if (!hasDot && !hasComma) {
    return Number(cleaned);
  }

  if (hasDot && hasComma) {
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    if (lastComma > lastDot) {
      // Indonesian style: 1.500.000,50
      return Number(cleaned.replace(/\./g, "").replace(",", "."));
    }
    // US style: 1,500,000.50
    return Number(cleaned.replace(/,/g, ""));
  }

  const sep = hasDot ? "." : ",";
  const parts = cleaned.split(sep);

  if (parts.length > 2) {
    // Multiple separators -> thousands grouping (e.g. 1.500.000 or 1,500,000)
    return Number(parts.join(""));
  }

  const [intPart, fracPart] = parts;
  // Single separator with 3 digits after it and non-zero integer part -> thousands (e.g. 500.000 or 500,000)
  if (fracPart.length === 3 && intPart !== "" && Number(intPart) > 0) {
    return Number(`${intPart}${fracPart}`);
  }

  // Otherwise treat as decimal (e.g. 1500,50 or 1500.5)
  return Number(`${intPart || "0"}.${fracPart}`);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type DueUrgency = "overdue" | "soon" | "normal" | "settled";

export interface DueDateInfo {
  urgency: DueUrgency;
  diffDays: number;
  label: string;
  formattedDate: string;
}

export function getDueDateInfo(
  dueDateStr: string,
  status: LoanStatus
): DueDateInfo {
  const formattedDate = formatDate(dueDateStr);
  if (status === "SETTLED") {
    return {
      urgency: "settled",
      diffDays: 0,
      label: formattedDate,
      formattedDate,
    };
  }

  const today = new Date(`${getTodayIsoDate()}T00:00:00`);
  const due = new Date(
    dueDateStr.includes("T") ? dueDateStr : `${dueDateStr}T00:00:00`
  );
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      urgency: "overdue",
      diffDays,
      label: `Telat ${Math.abs(diffDays)} hari`,
      formattedDate,
    };
  }
  if (diffDays === 0) {
    return {
      urgency: "soon",
      diffDays: 0,
      label: "Jatuh tempo hari ini",
      formattedDate,
    };
  }
  if (diffDays <= 3) {
    return {
      urgency: "soon",
      diffDays,
      label: `H-${diffDays} jatuh tempo`,
      formattedDate,
    };
  }
  return {
    urgency: "normal",
    diffDays,
    label: formattedDate,
    formattedDate,
  };
}

export function isLoanOverdue(dueDateStr: string, status: LoanStatus): boolean {
  return getDueDateInfo(dueDateStr, status).urgency === "overdue";
}

export function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

export function getStatusLabel(status: LoanStatus): string {
  switch (status) {
    case "PENDING_CONFIRMATION":
      return "Menunggu Konfirmasi";
    case "ACTIVE":
      return "Aktif";
    case "PARTIAL":
      return "Dicicil";
    case "SETTLED":
      return "Impas";
  }
}

export type ReminderTone = "santai" | "formal";

export interface ReminderParams {
  borrowerName: string;
  lenderName: string;
  type: LoanType;
  remainingAmount?: number | null;
  itemName?: string | null;
  dueDate: string;
  confirmUrl: string;
  status: LoanStatus;
  tone: ReminderTone;
}

export function buildWhatsAppReminder(params: ReminderParams): string {
  const {
    borrowerName,
    lenderName,
    type,
    remainingAmount,
    itemName,
    dueDate,
    confirmUrl,
    status,
    tone,
  } = params;

  const subject =
    type === "MONEY"
      ? `pinjaman uang sebesar ${formatRupiah(remainingAmount)}`
      : `pinjaman barang "${itemName ?? "-"}"`;

  const dueFormatted = formatDate(dueDate);

  if (status === "PENDING_CONFIRMATION") {
    if (tone === "santai") {
      return `Halo ${borrowerName}! Aku barusan catat ${subject} di Impas (jatuh tempo ${dueFormatted}). Tolong bantu klik konfirmasi di link ini ya biar catatan kita sama-sama jelas:\n${confirmUrl}\n\nMakasih banyak! - ${lenderName}`;
    }
    return `Halo ${borrowerName},\n\nSaya telah mencatat ${subject} dengan jatuh tempo pada ${dueFormatted} melalui Impas.\n\nMohon kesediaannya untuk mengonfirmasi catatan tersebut melalui tautan berikut:\n${confirmUrl}\n\nTerima kasih.\nSalam,\n${lenderName}`;
  }

  if (tone === "santai") {
    return `Halo ${borrowerName}! Sekadar ngingetin dengan santai soal ${subject} yang jatuh temponya ${dueFormatted}. Detail lengkapnya bisa dicek di sini ya:\n${confirmUrl}\n\nKalau sudah beres kabari aja ya, biar langsung kita tandai Impas. Makasih! - ${lenderName}`;
  }

  return `Halo ${borrowerName},\n\nMelalui pesan ini saya ingin mengingatkan mengenai ${subject} dengan tanggal jatuh tempo ${dueFormatted}.\n\nRincian catatan dapat dilihat pada tautan berikut:\n${confirmUrl}\n\nTerima kasih atas perhatian dan kerja samanya.\nSalam,\n${lenderName}`;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!message) {
    return `https://wa.me/${normalized}`;
  }
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "IM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
