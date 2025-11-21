"use client";

import Image from "next/image";
import { fileUrl } from "@/lib/directus"; // use absolute alias from src/

export default function SiteImage({
  file,
  alt = "",
  placeholder = "/placeholders/hero-default.jpg",
  width = 1600,
  height = 600,
}: {
  file?: any;
  alt?: string;
  placeholder?: string;
  width?: number;
  height?: number;
}) {
  // ensure src is a string URL (Image requires a string or static import)
  const computed = file ? fileUrl(file) : null;
  const src = computed || placeholder;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="object-cover w-full"
      priority={false}
    />
  );
}
