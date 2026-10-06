"use client";

import { useEffect, useRef, useId, type ReactNode } from "react";

export default function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="seasonal-card fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl border p-5 text-[var(--foreground)] shadow-xl backdrop:bg-black/50 sm:p-7"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 id={headingId} className="seasonal-heading text-2xl font-black">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="min-h-11 min-w-11 rounded-full text-xl"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
