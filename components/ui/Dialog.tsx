"use client";

import { useEffect, useRef, useId, type ReactNode } from "react";

export default function Dialog({
  title,
  onClose,
  children,
  headerActions,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  headerActions?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const startedOutside = useRef(false);
  function outsideBounds(event: {clientX: number; clientY: number}, dialog: HTMLDialogElement) {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }
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
      onPointerDown={event => {
        startedOutside.current = event.target === event.currentTarget && outsideBounds(event, event.currentTarget);
      }}
      onPointerCancel={() => {startedOutside.current = false;}}
      onClick={event => {
        if (startedOutside.current && event.target === event.currentTarget && outsideBounds(event, event.currentTarget)) onClose();
        startedOutside.current = false;
      }}
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
        <div className="flex items-center gap-2">
        {headerActions}
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="min-h-11 min-w-11 rounded-full text-xl"
        >
          ×
        </button>
        </div>
      </div>
      {children}
    </dialog>
  );
}
