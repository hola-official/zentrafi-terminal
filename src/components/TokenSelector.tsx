"use client"

import { ChevronDown } from "lucide-react"
import { TokenIcon } from "@terminal/components/ui/token-icon"
import type { TokenConfig } from "@terminal/config/tokens"

export interface TokenSelectorProps {
  selected: TokenConfig | null
  onClick: () => void
}

/** Pill button that triggers the token-list panel inside SwapWidget */
export function TokenSelector({ selected, onClick }: TokenSelectorProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-2xl px-3 py-2 transition-all shrink-0 hover:opacity-80 cursor-pointer"
      style={{ background: "var(--zt-text-10)", border: "1px solid var(--zt-border)" }}
    >
      {selected ? (
        <>
          <TokenIcon src={selected.icon} symbol={selected.symbol} size={22} />
          <span className="font-semibold text-sm whitespace-nowrap" style={{ color: "var(--zt-text)" }}>
            {selected.symbol}
          </span>
        </>
      ) : (
        <span className="text-sm font-medium" style={{ color: "var(--zt-primary)" }}>
          Select
        </span>
      )}
      <ChevronDown className="w-3.5 h-3.5 ml-0.5" style={{ color: "var(--zt-text-40)" }} />
    </button>
  )
}
