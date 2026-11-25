import React from "react";
import type { LoanStatus } from "@/types/database";
import { getDueDateInfo, getStatusLabel } from "@/lib/format";

interface StatusBadgeProps {
  status: LoanStatus;
  dueDate?: string;
  showOverdueOverride?: boolean;
}

export function StatusBadge({
  status,
  dueDate,
  showOverdueOverride = true,
}: StatusBadgeProps) {
  const overdue =
    showOverdueOverride &&
    dueDate &&
    getDueDateInfo(dueDate, status).urgency === "overdue";

  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" aria-hidden="true" />
        Jatuh tempo
      </span>
    );
  }

  switch (status) {
    case "PENDING_CONFIRMATION":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" aria-hidden="true" />
          {getStatusLabel(status)}
        </span>
      );
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" aria-hidden="true" />
          {getStatusLabel(status)}
        </span>
      );
    case "PARTIAL":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" aria-hidden="true" />
          {getStatusLabel(status)}
        </span>
      );
    case "SETTLED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" aria-hidden="true" />
          {getStatusLabel(status)}
        </span>
      );
  }
}

export function DueDateBadge({
  dueDate,
  status,
}: {
  dueDate: string;
  status: LoanStatus;
}) {
  const info = getDueDateInfo(dueDate, status);

  if (info.urgency === "overdue") {
    return (
      <span className="inline-flex items-center text-[13px] font-semibold text-[#9F1239] bg-[#FFF1F2] px-2.5 py-0.5 rounded-md tabular-nums">
        {info.label}
      </span>
    );
  }
  if (info.urgency === "soon") {
    return (
      <span className="inline-flex items-center text-[13px] font-semibold text-[#92400E] bg-[#FFFBEB] px-2.5 py-0.5 rounded-md tabular-nums">
        {info.label}
      </span>
    );
  }
  return (
    <span className="text-[13px] font-medium text-[#475569] tabular-nums">
      {info.formattedDate}
    </span>
  );
}
