"use client";

import React, { useCallback, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface ResponsiveModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  safeCloseAutoFocus?: boolean;
}

let cachedSupportsDisplayTransition: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (cachedSupportsDisplayTransition !== undefined) {
    return cachedSupportsDisplayTransition;
  }
  if (
    typeof window === "undefined" ||
    !window.CSS?.supports?.("transition-behavior", "allow-discrete") ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = "none";
  cachedSupportsDisplayTransition = getComputedStyle(probe).display === "block";
  probe.remove();
  return cachedSupportsDisplayTransition;
}

function supportsTopLayerExit(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.CSS?.supports?.("overlay", "auto")) &&
    canTransitionDisplay()
  );
}

export function ResponsiveModal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClass = "md:max-w-lg",
}: ResponsiveModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isClosingRef = useRef(false);

  const closeWithAnimation = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open || isClosingRef.current) return;
    isClosingRef.current = true;

    if (!supportsTopLayerExit()) {
      dialog.setAttribute("data-closing", "");
      const animations = dialog.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((a) => a.finished)),
          new Promise((r) => setTimeout(r, 350)),
        ]);
      }
      dialog.removeAttribute("data-closing");
    }

    if (dialog.open) {
      dialog.close();
    }
    isClosingRef.current = false;
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.removeAttribute("data-closing");
      isClosingRef.current = false;
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      void closeWithAnimation();
    }
  }, [open, closeWithAnimation]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      void closeWithAnimation();
    };

    const handleClose = () => {
      dialog.returnValue = "";
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);

    // Fallback for browsers without native closedby="any" (e.g. Safari)
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
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) {
          void closeWithAnimation();
        }
        pressedOutside = false;
      };
      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);
      cleanupOutside = () => {
        dialog.removeEventListener("pointerdown", onPointerDown);
        dialog.removeEventListener("pointerup", onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
      cleanupOutside?.();
    };
  }, [closeWithAnimation]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, string>)}
      aria-labelledby={titleId}
      className={`impas-dialog w-full max-w-none ${maxWidthClass} m-0 mt-auto md:m-auto p-0 bg-white border-x-0 border-b-0 border-t md:border border-[#DDE4E2] rounded-t-2xl md:rounded-2xl shadow-xl max-h-[92dvh] overflow-hidden text-[#0B1312]`}
    >
      <div className="flex flex-col max-h-[92dvh]">
        {/* Mobile drag indicator */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#CBD5E1]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 md:px-6 md:py-5 border-b border-[#DDE4E2] shrink-0">
          <div>
            <h1
              id={titleId}
              className="text-lg font-bold text-[#0B1312] leading-tight"
            >
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-[13px] text-[#475569]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void closeWithAnimation()}
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-[#475569] hover:text-[#0B1312] hover:bg-[#F6F8F7] transition-[color,background-color] duration-150"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 md:px-6 md:py-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </dialog>
  );
}
