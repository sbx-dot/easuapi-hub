"use client";

import Image from "next/image";
import { Bot } from "lucide-react";
import { useState } from "react";
import { defaultModelIcon, getProviderById } from "@/lib/model-catalog";
import type { ModelProviderId } from "@/lib/model-catalog";
import { cn } from "@/lib/utils";

type VendorLogoSize = "xs" | "sm" | "md" | "lg";

const sizeClass: Record<VendorLogoSize, string> = {
  xs: "h-7 w-7 rounded-lg",
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
  lg: "h-11 w-11 rounded-xl",
};

const imageSize: Record<VendorLogoSize, { width: number; height: number }> = {
  xs: { width: 22, height: 22 },
  sm: { width: 26, height: 26 },
  md: { width: 32, height: 32 },
  lg: { width: 36, height: 36 },
};

export function VendorLogo({
  providerId,
  providerName,
  logoSrc,
  logoAlt,
  size = "md",
  className,
}: {
  providerId: ModelProviderId;
  providerName?: string;
  logoSrc?: string;
  logoAlt?: string;
  size?: VendorLogoSize;
  className?: string;
}) {
  const provider = getProviderById(providerId);
  const [failed, setFailed] = useState(false);
  const dimensions = imageSize[size];
  const label = providerName ?? provider.name;
  const src = failed ? defaultModelIcon.src : logoSrc ?? defaultModelIcon.src;
  const alt = failed ? defaultModelIcon.alt : logoAlt ?? defaultModelIcon.alt;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border border-slate-200 bg-white shadow-sm shadow-slate-200/60",
        sizeClass[size],
        className,
      )}
      aria-label={`${label} logo`}
      title={label}
    >
      {failed && providerId === "other" && !logoSrc ? (
        <Bot className="h-4 w-4 text-slate-500" aria-hidden="true" />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          className="h-[78%] w-[78%] object-contain"
          unoptimized
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
