"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@terminal/utils/cn"

interface TokenIconProps {
  src: string
  symbol: string
  size?: number
  className?: string
}

export function TokenIcon({ src, symbol, size = 24, className }: TokenIconProps) {
  const [imgError, setImgError] = useState(false)

  const fallbackLetter = symbol?.charAt(0)?.toUpperCase() ?? "?"

  if (imgError || !src) {
    return (
      <div
        className={cn(
          "rounded-full bg-[#97CBDC]/20 flex items-center justify-center text-[#97CBDC] font-bold border border-[#97CBDC]/30",
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {fallbackLetter}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
      onError={() => setImgError(true)}
      unoptimized
    />
  )
}
