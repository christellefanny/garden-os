"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Dialog from "@/components/ui/Dialog";

const PhotoJournal = dynamic(() => import("@/components/PhotoJournal"), { loading: () => <p role="status">Opening pictures…</p> });

export default function ItemPicturesButton({ userId, collection, contextId, title, label = "Add pictures" }: {
  userId: string;
  collection: "tasks" | "bouquets";
  contextId?: string;
  title: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="seasonal-outline item-pictures-button" onClick={() => setOpen(true)} aria-label={contextId ? `Pictures for ${title}` : label}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m4 17 5-5 4 4 3-3 5 5M17 5v6m-3-3h6"/></svg>
      {label}
    </button>
    {open && <Dialog title={title} onClose={() => setOpen(false)}>
      <PhotoJournal key={`${userId}:${collection}:${contextId ?? "all"}`} userId={userId} collection={collection} contextId={contextId} embedded />
    </Dialog>}
  </>;
}
