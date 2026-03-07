"use client"

import { ChevronDown, ChevronUp, Info } from "lucide-react"
import { useState } from "react"
import { cn } from "@terminal/utils/cn"
import type { TokenConfig } from "@terminal/config/tokens"

interface SwapDetailsProps {
  fromToken: TokenConfig | null
  toToken: TokenConfig | null
  executionPrice: string
  priceImpact: string
  tradingFee: string
  outputAmount: string
  slippageBps: number
  className?: string
}

export function SwapDetails({
  fromToken,
  toToken,
  executionPrice,
  priceImpact,
  tradingFee,
  outputAmount,
  slippageBps,
  className,
}: SwapDetailsProps) {
  const [expanded, setExpanded] = useState(false)

  if (!executionPrice || !fromToken || !toToken) return null

  const priceImpactNum = parseFloat(priceImpact)
  const impactColor =
    priceImpactNum >= 5
      ? "text-red-400"
      : priceImpactNum >= 2
      ? "text-yellow-400"
      : "text-emerald-400"

  const minimumReceived =
    outputAmount
      ? (parseFloat(outputAmount) * (1 - slippageBps / 10000)).toFixed(6)
      : "—"

  return (
    <div className={cn("rounded-xl border border-white/10 bg-white/5 overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-white/70 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          <span>
            1 {fromToken.symbol} = {executionPrice} {toToken.symbol}
          </span>
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-4 py-3 flex flex-col gap-2">
          <Row label="Price Impact" value={`${priceImpact}%`} valueClass={impactColor} />
          <Row label="Trading Fee" value={`${tradingFee} ${fromToken.symbol}`} />
          <Row label="Slippage Tolerance" value={`${(slippageBps / 100).toFixed(2)}%`} />
          <Row label="Min. Received" value={`${minimumReceived} ${toToken.symbol}`} />
        </div>
      )}
    </div>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/50">{label}</span>
      <span className={cn("text-white font-medium", valueClass)}>{value}</span>
    </div>
  )
}
