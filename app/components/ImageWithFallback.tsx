"use client";

import Image, { ImageProps } from "next/image";
import { useState, useMemo } from "react";

/** Neutral SVG placeholder (base64) — circular, lightweight, SSR-safe */
const PLACEHOLDER_DATA = `data:image/svg+xml;base64,${Buffer.from(`
  <svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop stop-color='#f4f4f5' offset='0%'/><stop stop-color='#e4e4e7' offset='100%'/>
      </linearGradient>
    </defs>
    <circle cx='60' cy='60' r='60' fill='url(#g)'/>
    <circle cx='60' cy='60' r='22' fill='#a1a1aa' opacity='0.25'/>
    <path d='M30 90a30 30 0 0 1 60 0' fill='#a1a1aa' opacity='0.35'/>
  </svg>
`).toString("base64")}`;

type Props = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt?: string;
  /** Optional fallback data URL or URL */
  fallbackSrc?: string;
  /** Optional fixed size in px (applies width & height) */
  size?: number;
  rounded?: string;
};

/**
 * Rounded (circular) Image component with graceful fallback.
 * Ideal for avatars or small logos.
 */
export default function ImageWithFallback({
  src,
  alt = "",
  fallbackSrc,
  onError,
  size = 48,
  className,
  rounded = "rounded-full", 
  ...imgProps
}: Props) {
  const [failed, setFailed] = useState(false);

  const currentSrc = useMemo(() => {
    if (!src || failed) return fallbackSrc || PLACEHOLDER_DATA;
    return src;
  }, [src, failed, fallbackSrc]);

  return (
    <Image
      {...imgProps}
      alt={alt}
      src={currentSrc}
      width={size}
      height={size}
      className={`${rounded} object-cover border border-zinc-200/60 dark:border-zinc-700/50 ${className || ""}`}
      onError={(e) => {
        if (!failed) setFailed(true);
        onError?.(e);
      }}
    />
  );
}
