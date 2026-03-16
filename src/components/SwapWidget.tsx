"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAccount, useChainId, useWaitForTransactionReceipt } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import {
  ArrowDown, ChevronDown, ChevronLeft, Copy, Check,
  Search, Settings, Star, X, AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { TokenSelector } from "@terminal/components/TokenSelector"
import { TokenIcon } from "@terminal/components/ui/token-icon"
import { useSwapQuote } from "@terminal/hooks/useSwapQuote"
import { useSwap } from "@terminal/hooks/useSwap"
import { useTokenApproval } from "@terminal/hooks/useTokenApproval"
import { useWrapUnwrap } from "@terminal/hooks/useWrapUnwrap"
import { useTokenBalance } from "@terminal/hooks/useTokenBalance"
import {
  getTokenList, getSDKToken, getSDKTokens,
  PHAROS_CHAIN_ID, type TokenConfig,
} from "@terminal/config/tokens"
import { isWrapOrUnwrap, isWrapOperation } from "@terminal/utils/swap"
import { sanitizeAmount, formatAmount } from "@terminal/utils/format"
import { cn } from "@terminal/utils/cn"

type View = "swap" | "select-from" | "select-to" | "settings"

export interface SwapWidgetConfig {
  defaultFromToken?: string
  defaultToToken?: string
  defaultSlippageBps?: number
  onSwapSuccess?: (txHash: string) => void
  className?: string
}

const SLIPPAGE_PRESETS = [10, 50, 100] // bps

// ── CircularTimer ─────────────────────────────────────────────────────────────

function CircularTimer({ seconds, max = 10, size = 18, isLoading, onClick }: {
  seconds: number; max?: number; size?: number; isLoading?: boolean; onClick?: () => void
}) {
  const r = (size - 3) / 2
  const circ = 2 * Math.PI * r
  const offset = isLoading ? 0 : circ * (1 - seconds / max)
  return (
    <button type="button" onClick={onClick} title="Refresh quote"
      className="relative flex items-center justify-center hover:opacity-70 transition-opacity"
      style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} className="absolute">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--zt-text-10)" strokeWidth="2" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--zt-primary)" strokeWidth="2"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={isLoading ? undefined : { transition: "stroke-dashoffset 1s linear" }}
          className={isLoading ? "animate-spin" : undefined} />
      </svg>
      {!isLoading && (
        <span style={{ fontSize: size * 0.38, color: "var(--zt-text-50)", fontVariantNumeric: "tabular-nums" }}>
          {seconds}
        </span>
      )}
    </button>
  )
}

// ── Token list panel ──────────────────────────────────────────────────────────

function TokenListPanel({ tokens, disabledAddress, onSelect, onBack }: {
  tokens: TokenConfig[]
  disabledAddress?: string
  onSelect: (t: TokenConfig) => void
  onBack: () => void
}) {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"default" | "imported">("default")
  const [copied, setCopied] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("zt-fav-tokens") ?? "[]") } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem("zt-fav-tokens", JSON.stringify(favorites))
  }, [favorites])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tokens.filter(t =>
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
    )
  }, [tokens, search])

  const isFav = (addr: string) => favorites.includes(addr.toLowerCase())
  const toggleFav = (addr: string) => setFavorites(prev =>
    isFav(addr) ? prev.filter(a => a !== addr.toLowerCase()) : [...prev, addr.toLowerCase()]
  )

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(addr)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  const formatAddr = (addr: string) =>
    addr === "NATIVE" ? "Native" : `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div className="flex flex-col h-full" style={{ color: "var(--zt-text)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--zt-text-60)" }}>
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="flex-1 text-center font-semibold text-sm" style={{ color: "var(--zt-text)" }}>
          Select Token
        </span>
        {/* spacer to balance */}
        <div className="w-12" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3"
        style={{ background: "var(--zt-text-8)", border: "1px solid var(--zt-border)" }}>
        <Search className="w-4 h-4 shrink-0" style={{ color: "var(--zt-text-40)" }} />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by token or address"
          className="bg-transparent text-sm outline-none w-full"
          style={{ color: "var(--zt-text)" }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ color: "var(--zt-text-40)" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-2 border-b" style={{ borderColor: "var(--zt-border)" }}>
        {(["default", "imported"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="pb-2 text-sm font-medium capitalize transition-colors relative"
            style={{ color: tab === t ? "var(--zt-text)" : "var(--zt-text-40)" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: "var(--zt-primary)" }} />
            )}
          </button>
        ))}
      </div>

      {/* Token list */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {filtered.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: "var(--zt-text-40)" }}>
            No tokens found
          </p>
        ) : (
          filtered.map(token => {
            const disabled = token.address.toLowerCase() === disabledAddress?.toLowerCase()
            const fav = isFav(token.address)
            return (
              <div key={token.address}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors",
                  disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                )}
                style={{ background: "transparent" }}
                onMouseEnter={e => !disabled && ((e.currentTarget as HTMLDivElement).style.background = "var(--zt-text-5)")}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                onClick={() => { if (!disabled) { onSelect(token); onBack() } }}
              >
                {/* Icon */}
                <TokenIcon src={token.icon} symbol={token.symbol} size={36} />

                {/* Name/address */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm" style={{ color: "var(--zt-text)" }}>
                      {token.symbol}
                    </span>
                    {/* verified dot for non-imported */}
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{ background: "var(--zt-primary)" }}>
                      <Check className="w-2 h-2" style={{ color: "var(--zt-btn-text)" }} />
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--zt-text-50)" }}>{token.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[11px] font-mono" style={{ color: "var(--zt-text-40)" }}>
                      {formatAddr(token.address)}
                    </span>
                    {token.address !== "NATIVE" && (
                      <button type="button"
                        onClick={e => { e.stopPropagation(); handleCopy(token.address) }}
                        className="transition-opacity hover:opacity-70"
                        style={{ color: "var(--zt-text-40)" }}>
                        {copied === token.address
                          ? <Check className="w-3 h-3" style={{ color: "var(--zt-success)" }} />
                          : <Copy className="w-3 h-3" />
                        }
                      </button>
                    )}
                  </div>
                </div>

                {/* Favorite star */}
                <button type="button"
                  onClick={e => { e.stopPropagation(); toggleFav(token.address) }}
                  className="shrink-0 transition-colors hover:opacity-80 p-1"
                  style={{ color: fav ? "var(--zt-primary)" : "var(--zt-text-30)" }}>
                  <Star className={cn("w-4 h-4", fav && "fill-current")} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Settings panel ────────────────────────────────────────────────────────────

function SettingsPanel({ slippageBps, onSave, onClose }: {
  slippageBps: number
  onSave: (bps: number) => void
  onClose: () => void
}) {
  const [localBps, setLocalBps] = useState(slippageBps)
  const [custom, setCustom] = useState("")

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base" style={{ color: "var(--zt-text)" }}>Settings</span>
        <button type="button" onClick={onClose}
          className="transition-opacity hover:opacity-70"
          style={{ color: "var(--zt-text-50)" }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Slippage */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" style={{ color: "var(--zt-text-60)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--zt-text-70)" }}>
            Slippage Tolerance
          </span>
        </div>
        <div className="flex gap-2">
          {SLIPPAGE_PRESETS.map(bps => {
            const active = localBps === bps && !custom
            return (
              <button key={bps} type="button"
                onClick={() => { setLocalBps(bps); setCustom("") }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={active
                  ? { background: "var(--zt-primary)", color: "var(--zt-btn-text)" }
                  : { background: "var(--zt-text-8)", color: "var(--zt-text-50)", border: "1px solid var(--zt-border)" }
                }>
                {bps / 100}%
              </button>
            )
          })}
          {/* Custom */}
          <div className="flex-1 flex items-center gap-1 rounded-xl px-2 py-1.5 transition-all"
            style={custom
              ? { background: "var(--zt-primary-10)", border: "1px solid var(--zt-primary-40)" }
              : { background: "var(--zt-text-8)", border: "1px solid var(--zt-border)" }
            }>
            <input
              type="number" min="0.01" max="50" step="0.1"
              value={custom}
              onChange={e => {
                setCustom(e.target.value)
                const n = parseFloat(e.target.value)
                if (!isNaN(n) && n > 0 && n <= 50) setLocalBps(Math.round(n * 100))
              }}
              placeholder="Custom"
              className="bg-transparent text-xs w-full outline-none"
              style={{ color: "var(--zt-text)" }}
            />
            <span className="text-xs shrink-0" style={{ color: "var(--zt-text-40)" }}>%</span>
          </div>
        </div>
        {localBps > 200 && (
          <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--zt-warning)" }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            High slippage — your trade may be frontrun
          </p>
        )}
      </div>

      <div className="h-px" style={{ background: "var(--zt-border)" }} />

      {/* Save */}
      <button type="button"
        onClick={() => { onSave(localBps); onClose() }}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
        style={{ background: "var(--zt-primary)", color: "var(--zt-btn-text)" }}>
        Save
      </button>
    </div>
  )
}

// ── SwapWidget ────────────────────────────────────────────────────────────────

export function SwapWidget({
  defaultFromToken = "NATIVE",
  defaultToToken = "0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8",
  defaultSlippageBps = 50,
  onSwapSuccess,
  className,
}: SwapWidgetConfig) {
  const wagmiChainId = useChainId()
  const chainId = wagmiChainId ?? PHAROS_CHAIN_ID
  const { address, isConnected } = useAccount()
  const [view, setView] = useState<View>("swap")

  const tokenList = useMemo(() => getTokenList(chainId), [chainId])

  const [fromToken, setFromToken] = useState<TokenConfig | null>(
    () => tokenList.find(t => t.address.toLowerCase() === defaultFromToken.toLowerCase()) ?? tokenList[0] ?? null
  )
  const [toToken, setToToken] = useState<TokenConfig | null>(
    () => tokenList.find(t => t.address.toLowerCase() === defaultToToken.toLowerCase()) ?? tokenList[1] ?? null
  )
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [slippageBps, setSlippageBps] = useState(defaultSlippageBps)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [countdown, setCountdown] = useState(10)
  const [lastProcessedHash, setLastProcessedHash] = useState<string | null>(null)
  const [lastProcessedWrapHash, setLastProcessedWrapHash] = useState<string | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)

  // Debounce
  const [debouncedAmount, setDebouncedAmount] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAmount(fromAmount), 400)
    return () => clearTimeout(t)
  }, [fromAmount])

  const sdkTokens = useMemo(() => getSDKTokens(chainId), [chainId])
  const bases = useMemo(() => Object.values(sdkTokens), [sdkTokens])
  const isWrapUnwrap = useMemo(() => fromToken && toToken ? isWrapOrUnwrap(fromToken, toToken) : false, [fromToken, toToken])
  const isFromNative = fromToken?.address === "NATIVE"
  const isToNative = toToken?.address === "NATIVE"
  const sdkFrom = useMemo(() => fromToken ? getSDKToken(fromToken.address, chainId) ?? null : null, [fromToken, chainId])
  const sdkTo = useMemo(() => toToken ? getSDKToken(toToken.address, chainId) ?? null : null, [toToken, chainId])

  const { balance: fromBalance, refetch: refetchFrom } = useTokenBalance({ tokenAddress: fromToken?.address ?? null, userAddress: address, decimals: fromToken?.decimals ?? 18, chainId })
  const { balance: toBalance, refetch: refetchTo } = useTokenBalance({ tokenAddress: toToken?.address ?? null, userAddress: address, decimals: toToken?.decimals ?? 18, chainId })

  const { trade, outputAmount, executionPrice, priceImpact, tradingFee, isLoading: quoteLoading, error: quoteError } = useSwapQuote({
    inputToken: sdkFrom, outputToken: sdkTo, typedValue: debouncedAmount,
    isExactIn: true, isNativeIn: isFromNative, isNativeOut: isToNative,
    bases, chainId, enabled: !isWrapUnwrap && !!debouncedAmount && parseFloat(debouncedAmount) > 0, refreshCounter,
  })

  useEffect(() => { setToAmount(isWrapUnwrap ? fromAmount : outputAmount) }, [outputAmount, isWrapUnwrap, fromAmount])

  const { needsApproval, isCheckingApproval, isApproving, isApprovalPending, approve } = useTokenApproval({
    tokenAddress: isFromNative ? null : (fromToken?.address ?? null),
    amount: fromAmount, tokenDecimals: fromToken?.decimals ?? 18, chainId,
    enabled: !isWrapUnwrap && isConnected && !!fromAmount && parseFloat(fromAmount) > 0,
  })

  const { executeSwap, isSwapping, hash: swapHash } = useSwap(chainId)
  const { isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({ hash: swapHash ?? undefined })
  const { wrap, unwrap, isPending: isWrapPending, isConfirmed: isWrapConfirmed, hash: wrapHash } = useWrapUnwrap()

  // Countdown timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!isWrapUnwrap && debouncedAmount && parseFloat(debouncedAmount) > 0) {
      setCountdown(10)
      timerRef.current = setInterval(() => {
        setCountdown(c => { if (c <= 1) { setRefreshCounter(r => r + 1); return 10 } return c - 1 })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isWrapUnwrap, debouncedAmount])

  // Swap confirmed
  useEffect(() => {
    if (isSwapConfirmed && swapHash && swapHash !== lastProcessedHash) {
      const snap = { from: fromAmount, to: toAmount, fromSym: fromToken?.symbol, toSym: toToken?.symbol }
      setLastProcessedHash(swapHash)
      toast.success("Swap Successful!", { description: `${snap.from} ${snap.fromSym} → ${snap.to} ${snap.toSym}` })
      setFromAmount(""); setToAmount("")
      refetchFrom(); refetchTo()
      onSwapSuccess?.(swapHash)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSwapConfirmed, swapHash])

  useEffect(() => {
    if (isWrapConfirmed && wrapHash && wrapHash !== lastProcessedWrapHash) {
      const isWrap = fromToken && toToken ? isWrapOperation(fromToken, toToken) : true
      setLastProcessedWrapHash(wrapHash)
      toast.success(isWrap ? "Wrap Successful!" : "Unwrap Successful!", {
        description: `${fromAmount} ${fromToken?.symbol} → ${toAmount} ${toToken?.symbol}`,
      })
      setFromAmount(""); setToAmount("")
      refetchFrom(); refetchTo()
      onSwapSuccess?.(wrapHash)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWrapConfirmed, wrapHash])

  // Derived
  const fromAmountNum = parseFloat(fromAmount) || 0
  const fromBalanceNum = parseFloat(fromBalance) || 0
  const hasInsufficientBalance = isConnected && fromAmountNum > 0 && fromAmountNum > fromBalanceNum
  const hasNoPool = quoteError?.message?.includes("No liquidity")
  const hasInsufficientLiquidity = quoteError?.message?.includes("Insufficient liquidity")
  const priceImpactNum = parseFloat(priceImpact) || 0
  const isHighImpact = priceImpactNum >= 5
  const isLoading = quoteLoading || isCheckingApproval || isApproving || isApprovalPending || isSwapping || isWrapPending
  const canSwap = isConnected && !!fromToken && !!toToken && fromAmountNum > 0 &&
    !hasInsufficientBalance && !hasNoPool && !hasInsufficientLiquidity &&
    !isLoading && (isWrapUnwrap || !!trade)
  const minimumReceived = toAmount && !isWrapUnwrap
    ? (parseFloat(toAmount) * (1 - slippageBps / 10000)).toFixed(6) : toAmount

  const buttonLabel = useMemo(() => {
    if (!isConnected) return "Connect Wallet"
    if (!fromAmount || fromAmountNum <= 0) return "Enter an Amount"
    if (hasInsufficientBalance) return `Insufficient ${fromToken?.symbol}`
    if (hasNoPool) return "No Pool Found"
    if (hasInsufficientLiquidity) return "Insufficient Liquidity"
    if (isApproving) return "Approving..."
    if (isApprovalPending) return "Waiting..."
    if (needsApproval) return `Approve ${fromToken?.symbol}`
    if (isSwapping || isWrapPending) return "Confirming..."
    if (quoteLoading) return "Getting Quote..."
    if (isWrapUnwrap) return fromToken?.symbol === "PHRS" ? "Wrap" : "Unwrap"
    return isHighImpact ? "Swap Anyway" : "Swap"
  }, [isConnected, fromAmount, fromAmountNum, hasInsufficientBalance, hasNoPool, hasInsufficientLiquidity,
      isApproving, isApprovalPending, needsApproval, isSwapping, isWrapPending, quoteLoading, isWrapUnwrap,
      fromToken, isHighImpact])

  const handleSwap = async () => {
    if (!isConnected || !fromToken || !toToken) return
    try {
      if (needsApproval) {
        toast.info(`Approve ${fromToken.symbol}`, { description: "Approve token spending in your wallet" })
        await approve(); toast.success("Approval Successful!"); return
      }
      if (isWrapUnwrap) {
        toast.info("Confirm Transaction", { description: "Please confirm in your wallet" })
        fromToken.symbol === "PHRS" ? await wrap(fromAmount) : await unwrap(fromAmount); return
      }
      if (!trade) return
      toast.info("Confirm Swap", { description: "Please confirm in your wallet" })
      await executeSwap(trade, { slippageBps })
      toast.info("Transaction Submitted", { description: "Waiting for confirmation..." })
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? ""
      if (msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("denied"))
        toast.error("Transaction Rejected")
      else if (msg.includes("insufficient funds"))
        toast.error("Insufficient Funds")
      else
        toast.error("Transaction Failed", { description: msg.slice(0, 120) })
    }
  }

  const handleFlip = () => {
    setIsFlipping(true)
    setTimeout(() => setIsFlipping(false), 300)
    const prev = fromToken; setFromToken(toToken); setToToken(prev)
    setFromAmount(toAmount); setToAmount("")
  }

  const handleFromSelect = useCallback((t: TokenConfig) => {
    if (t.address === toToken?.address) setToToken(fromToken)
    setFromToken(t); setFromAmount(""); setView("swap")
  }, [fromToken, toToken])

  const handleToSelect = useCallback((t: TokenConfig) => {
    if (t.address === fromToken?.address) setFromToken(toToken)
    setToToken(t); setView("swap")
  }, [fromToken, toToken])

  const setPercentage = (pct: number) => {
    if (!fromBalance || fromBalanceNum <= 0) return
    setFromAmount(sanitizeAmount((fromBalanceNum * pct).toFixed(fromToken?.decimals ?? 6)))
  }

  const showTimer = !isWrapUnwrap && !!debouncedAmount && parseFloat(debouncedAmount) > 0

  // ── Token selection panel ─────────────────────────────────────────────
  if (view === "select-from" || view === "select-to") {
    return (
      <div className={cn("flex flex-col w-full min-h-[420px]", className)}>
        <TokenListPanel
          tokens={tokenList}
          disabledAddress={view === "select-from" ? toToken?.address : fromToken?.address}
          onSelect={view === "select-from" ? handleFromSelect : handleToSelect}
          onBack={() => setView("swap")}
        />
      </div>
    )
  }

  // ── Settings panel ────────────────────────────────────────────────────
  if (view === "settings") {
    return (
      <div className={cn("flex flex-col w-full", className)}>
        <SettingsPanel
          slippageBps={slippageBps}
          onSave={setSlippageBps}
          onClose={() => setView("swap")}
        />
      </div>
    )
  }

  // ── Main swap UI ──────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>

      {/* ── Row 1: Wallet connect + Settings ─────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        {/* Connect / address pill */}
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, openAccountModal }) => (
            account ? (
              <button type="button" onClick={openAccountModal}
                className="flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                style={{ background: "var(--zt-primary-15)", color: "var(--zt-primary)", border: "1px solid var(--zt-primary-30)" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--zt-success)" }} />
                {account.displayName}
              </button>
            ) : (
              <button type="button" onClick={openConnectModal}
                className="rounded-2xl px-4 py-1.5 text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: "var(--zt-primary)", color: "var(--zt-btn-text)" }}>
                Connect
              </button>
            )
          )}
        </ConnectButton.Custom>

        {/* Settings icon */}
        <button type="button" onClick={() => setView("settings")}
          className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:opacity-70"
          style={{ background: "var(--zt-text-8)", border: "1px solid var(--zt-border)", color: "var(--zt-text-50)" }}>
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Row 2: Swap label + slippage + timer ─────────────────────── */}
      <div className="flex items-center justify-between px-0.5">
        <span className="font-bold text-base" style={{ color: "var(--zt-text)" }}>Swap</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setView("settings")}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-all hover:opacity-80"
            style={{ background: "var(--zt-text-8)", color: "var(--zt-text-50)" }}>
            <Settings className="w-3 h-3" />
            <span className="tabular-nums">{(slippageBps / 100).toFixed(1)}%</span>
          </button>
          {showTimer && (
            <CircularTimer seconds={countdown} max={10} size={20} isLoading={quoteLoading}
              onClick={() => { setRefreshCounter(c => c + 1); setCountdown(10) }} />
          )}
        </div>
      </div>

      {/* ── From box ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 flex flex-col gap-2 transition-all"
        style={{ background: "var(--zt-text-8)", border: "1px solid var(--zt-border)" }}>
        {/* Amount row */}
        <div className="flex items-center gap-3">
          <input
            type="text" inputMode="decimal"
            value={fromAmount}
            onChange={e => setFromAmount(sanitizeAmount(e.target.value))}
            placeholder="0.0"
            className="bg-transparent text-3xl font-light outline-none flex-1 min-w-0 placeholder-[var(--zt-text-20)]"
            style={{ color: "var(--zt-text)" }}
          />
          <TokenSelector selected={fromToken} onClick={() => setView("select-from")} />
        </div>
        {/* Balance row */}
        {isConnected && fromToken && (
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--zt-text-40)" }}>
              Balance: {formatAmount(fromBalance)} {fromToken.symbol}
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPercentage(0.5)}
                className="text-[10px] font-medium px-2 py-0.5 rounded-lg transition-colors"
                style={{ background: "var(--zt-primary-10)", color: "var(--zt-primary-50)" }}>
                50%
              </button>
              <button onClick={() => setPercentage(1)}
                className="text-[10px] font-medium px-2 py-0.5 rounded-lg transition-colors"
                style={{ background: "var(--zt-primary-10)", color: "var(--zt-primary-50)" }}>
                MAX
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Flip button ──────────────────────────────────────────────── */}
      <div className="relative h-0 flex items-center justify-center z-10">
        <button type="button" onClick={handleFlip}
          style={{
            transform: isFlipping ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
            background: "var(--zt-bg, #0d1117)",
            border: "1px solid var(--zt-border)",
            color: "var(--zt-text-50)",
          }}
          className="absolute w-9 h-9 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity">
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>

      {/* ── To box ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 flex flex-col gap-2 transition-all"
        style={{ background: "var(--zt-text-8)", border: "1px solid var(--zt-border)" }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {quoteLoading ? (
              <div className="h-9 w-28 rounded-lg animate-pulse" style={{ background: "var(--zt-text-10)" }} />
            ) : (
              <span className="text-3xl font-light"
                style={{ color: toAmount && parseFloat(toAmount) > 0 ? "var(--zt-text)" : "var(--zt-text-20)" }}>
                {toAmount && parseFloat(toAmount) > 0 ? formatAmount(toAmount, 6) : "0.0"}
              </span>
            )}
          </div>
          <TokenSelector selected={toToken} onClick={() => setView("select-to")} />
        </div>
        {isConnected && toToken && (
          <span className="text-xs" style={{ color: "var(--zt-text-40)" }}>
            Balance: {formatAmount(toBalance)} {toToken.symbol}
          </span>
        )}
      </div>

      {/* ── Quote panel ──────────────────────────────────────────────── */}
      {!isWrapUnwrap && executionPrice && fromToken && toToken && !quoteLoading && (
        <QuotePanel
          fromToken={fromToken} toToken={toToken}
          executionPrice={executionPrice} priceImpact={priceImpact}
          priceImpactNum={priceImpactNum} tradingFee={tradingFee}
          minimumReceived={minimumReceived} slippageBps={slippageBps}
        />
      )}

      {/* ── High impact warning ───────────────────────────────────────── */}
      {isHighImpact && toAmount && parseFloat(toAmount) > 0 && (
        <div className="rounded-xl px-4 py-3 flex items-start gap-2 border"
          style={{ background: "var(--zt-error-10)", borderColor: "var(--zt-error-20)" }}>
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--zt-error)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--zt-error)" }}>High Price Impact</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--zt-error)" }}>
              -{priceImpact}% · Consider a smaller trade
            </p>
          </div>
        </div>
      )}

      {/* ── Pool error ────────────────────────────────────────────────── */}
      {(hasNoPool || hasInsufficientLiquidity) && fromAmountNum > 0 && (
        <div className="rounded-xl px-4 py-2.5 border"
          style={{ background: "var(--zt-warning-10)", borderColor: "var(--zt-warning-20)" }}>
          <p className="text-sm" style={{ color: "var(--zt-warning)" }}>{quoteError?.message}</p>
        </div>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      {!isConnected ? (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button type="button" onClick={openConnectModal}
              className="w-full h-12 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ background: "var(--zt-primary)", color: "var(--zt-btn-text)" }}>
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>
      ) : (
        <button type="button" onClick={handleSwap}
          disabled={isLoading || (fromAmountNum > 0 && (hasInsufficientBalance || hasNoPool || hasInsufficientLiquidity || (!isWrapUnwrap && !trade && !quoteLoading)))}
          className={cn(
            "w-full h-12 rounded-2xl font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2",
            (isLoading || !canSwap) && "cursor-not-allowed opacity-50"
          )}
          style={canSwap
            ? isHighImpact
              ? { background: "var(--zt-error)", color: "var(--zt-text)" }
              : { background: "var(--zt-primary)", color: "var(--zt-btn-text)" }
            : { background: "var(--zt-text-8)", color: "var(--zt-text-40)", border: "1px solid var(--zt-border)" }
          }>
          {isLoading && (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {buttonLabel}
        </button>
      )}
    </div>
  )
}

// ── QuotePanel ────────────────────────────────────────────────────────────────

function QuotePanel({ fromToken, toToken, executionPrice, priceImpact, priceImpactNum, tradingFee, minimumReceived, slippageBps }: {
  fromToken: TokenConfig; toToken: TokenConfig
  executionPrice: string; priceImpact: string; priceImpactNum: number
  tradingFee: string; minimumReceived: string; slippageBps: number
}) {
  const [expanded, setExpanded] = useState(false)
  const impactColor = priceImpactNum >= 5 ? "var(--zt-error)" : priceImpactNum >= 2 ? "var(--zt-warning)" : "var(--zt-success)"

  return (
    <div className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--zt-border)", background: "var(--zt-text-5)" }}>
      <button type="button" onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5">
        <span className="text-xs" style={{ color: "var(--zt-text-50)" }}>
          1 {fromToken.symbol} ≈ {executionPrice} {toToken.symbol}
        </span>
        <div className="flex items-center gap-2">
          {priceImpactNum > 0.01 && (
            <span className="text-xs tabular-nums" style={{ color: impactColor }}>-{priceImpact}%</span>
          )}
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")}
            style={{ color: "var(--zt-text-30)" }} />
        </div>
      </button>
      {expanded && (
        <div className="border-t px-4 py-3 flex flex-col gap-2" style={{ borderColor: "var(--zt-border)" }}>
          {[
            { label: "Price Impact", value: `${priceImpact}%`, color: impactColor },
            { label: "Trading Fee", value: `${tradingFee} ${fromToken.symbol}` },
            { label: "Slippage", value: `${(slippageBps / 100).toFixed(2)}%` },
            { label: "Min. Received", value: `${minimumReceived} ${toToken.symbol}`, color: "var(--zt-text-80)" },
            { label: "Route", value: `${fromToken.symbol} → ${toToken.symbol}` },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--zt-text-40)" }}>{label}</span>
              <span className="text-xs font-medium" style={{ color: color ?? "var(--zt-text-60)" }}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
