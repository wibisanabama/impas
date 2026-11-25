"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Download, X } from "lucide-react";

interface LightboxProps {
  open: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export function Lightbox({
  open,
  imageUrl,
  title = "Pratinjau Bukti Lampiran",
  onClose,
}: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && imageUrl) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, imageUrl]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onCancel = (e: Event) => {
      e.preventDefault();
      handleClose();
    };
    dialog.addEventListener("cancel", onCancel);

    let cleanupOutside: (() => void) | undefined;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        );
      };
      const onDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) {
          handleClose();
        }
        pressedOutside = false;
      };
      dialog.addEventListener("pointerdown", onDown);
      dialog.addEventListener("pointerup", onUp);
      cleanupOutside = () => {
        dialog.removeEventListener("pointerdown", onDown);
        dialog.removeEventListener("pointerup", onUp);
      };
    }

    return () => {
      dialog.removeEventListener("cancel", onCancel);
      cleanupOutside?.();
    };
  }, [handleClose]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, string>)}
      aria-label={title}
      className="impas-dialog m-auto w-[calc(100vw-2rem)] max-w-4xl max-h-[90dvh] p-0 rounded-2xl bg-[#0B1312] text-white border border-white/15 shadow-2xl overflow-hidden"
    >
      {imageUrl && (
        <div className="flex flex-col max-h-[90dvh]">
          <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-white/10 shrink-0">
            <p className="text-[15px] font-semibold truncate">{title}</p>
            <div className="flex items-center gap-2">
              <a
                href={imageUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[13px] font-semibold text-white transition-[background-color] duration-150"
              >
                <Download className="w-4 h-4" />
                Unduh
              </a>
              <button
                type="button"
                onClick={handleClose}
                className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-[background-color] duration-150"
                aria-label="Tutup pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-auto bg-[#0B1312]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-[72dvh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </dialog>
  );
}
