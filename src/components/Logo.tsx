// src/components/Logo.tsx
"use client";
import Image from "next/image";
import { useState } from "react";

type Props = { className?: string; width?: number; height?: number; src?: string };

export default function Logo({ className = "", width = 140, height = 32, src = "/brand/logo-full.svg" }: Props) {
  const [errored, setErrored] = useState(false);

  if (!errored) {
    return (
      <div className={className} style={{ width, height, position: "relative", display: "inline-block" }}>
        <Image
          src={src}
          alt="Zecode"
          fill
          sizes={`${width}px`}
          style={{ objectFit: "contain" }}
          onError={() => setErrored(true)}
          priority
        />
      </div>
    );
  }

  // fallback text
  return (
    <div className={className} style={{ width, height, display: "flex", alignItems: "center" }}>
      <span style={{ fontWeight: 800, letterSpacing: "0.12em" }}>ZECODE</span>
    </div>
  );
}
