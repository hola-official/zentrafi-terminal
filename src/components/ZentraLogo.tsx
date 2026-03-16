"use client"

import type { SVGProps } from "react"

/**
 * ZentraFi brand mark — a stylised "Z" inside a hexagonal gem shape.
 * Use `currentColor` via className/style for color control.
 */
export function ZentraLogo({ size = 20, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Hexagon gem background */}
      <path
        d="M12 2L20.39 6.75V16.25L12 21L3.61 16.25V6.75L12 2Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Outer hex ring */}
      <path
        d="M12 2L20.39 6.75V16.25L12 21L3.61 16.25V6.75L12 2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Bold Z letterform */}
      <path
        d="M8.2 8.5H15.8L9.4 14.5H15.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Full ZentraFi wordmark — logo + text, for use in headers and splash screens.
 */
export function ZentraWordmark({ size = 20, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <ZentraLogo size={size} style={{ color: "var(--zt-primary)" }} />
      {showText && (
        <span
          className="font-semibold tracking-tight"
          style={{ color: "var(--zt-text)", fontSize: size * 0.75 }}
        >
          ZentraFi
        </span>
      )}
    </div>
  )
}
