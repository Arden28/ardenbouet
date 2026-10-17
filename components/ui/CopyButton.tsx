// components/CopyButton.tsx  (or inline if you prefer)
'use client';
import { useState } from 'react';

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`code-copy ${copied ? 'copied' : ''}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch { /* ignore */ }
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}