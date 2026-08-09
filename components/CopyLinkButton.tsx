"use client";

import { useState } from "react";

// Shared by CampaignCard and the campaign overview page — both already
// link to /c/[slug] in a new tab, but sharing it (WhatsApp, social) meant
// opening that tab just to copy the address bar. One click here does it
// without leaving the dashboard.
export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
    >
      {copied ? "✓ Copiat" : "Copiază link"}
    </button>
  );
}
