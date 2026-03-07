"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAccount, useChainId, useWaitForTransactionReceipt } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { ArrowDownUp, RefreshCw, Settings } from "lucide-react"
import { toast } from "sonner"
import { TokenSelector } from "@terminal/components/TokenSelector"
import { SwapDetails } from "@terminal/components/SwapDetails"
import { TokenIcon } from "@terminal/components/ui/token-icon"
import { Button } from "@terminal/components/ui/button"
import { useSwapQuote } from "@terminal/hooks/useSwapQuote"
import { useSwap } from "@terminal/hooks/useSwap"
import { useTokenApproval } from "@terminal/hooks/useTokenApproval"
import { useWrapUnwrap } from "@terminal/hooks/useWrapUnwrap"
import { useTokenBalance } from "@terminal/hooks/useTokenBalance"
import {
  getTokenList,
  getSDKToken,
  getSDKTokens,
  toSDKChainId,
  PHAROS_CHAIN_ID,
  type TokenConfig,
} from "@terminal/config/tokens"
import { isWrapOrUnwrap, isWrapOperation } from "@terminal/utils/swap"
import { sanitizeAmount, formatAmount } from "@terminal/utils/format"
import { cn } from "@terminal/utils/cn"

export interface SwapWidgetConfig {
  defaultFromToken?: string
  defaultToToken?: string
  defaultSlippageBps?: number
  onSwapSuccess?: (txHash: string) => void
  className?: string
}

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

  const tokenList = useMemo(() => getTokenList(chainId), [chainId])

  // Token state
  const [fromToken, setFromToken] = useState<TokenConfig | null>(
    () => tokenList.find((t) => t.address.toLowerCase() === defaultFromToken.toLowerCase()) ?? tokenList[0] ?? null
  )
  const [toToken, setToToken] = useState<TokenConfig | null>(
    () => tokenList.find((t) => t.address.toLowerCase() === defaultToToken.toLowerCase()) ?? tokenList[1] ?? null
  )
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [slippageBps, setSlippageBps] = useState(defaultSlippageBps)
  const [showSettings, setShowSettings] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [lastProcessedHash, setLastProcessedHash] = useState<string | null>(null)

  // Debounced amount for quote
  const [debouncedFromAmount, setDebouncedFromAmount] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFromAmount(fromAmount), 400)
    return () => clearTimeout(t)
  }, [fromAmount])

  // SDK tokens (memoized to prevent infinite re-renders)
  const sdkTokens = useMemo(() => getSDKTokens(chainId), [chainId])
  const bases = useMemo(() => Object.values(sdkTokens), [sdkTokens])

  const isWrapUnwrap = fromToken && toToken ? isWrapOrUnwrap(fromToken, toToken) : false
  const isFromNative = fromToken?.address === "NATIVE"
  const isToNative = toToken?.address === "NATIVE"

  const sdkFromToken = useMemo(
    () => (fromToken ? getSDKToken(fromToken.address, chainId) ?? null : null),
    [fromToken, chainId]
  )
  const sdkToToken = useMemo(
    () => (toToken ? getSDKToken(toToken.address, chainId) ?? null : null),
    [toToken, chainId]
  )

  // Balances
  const { balance: fromBalance, refetch: refetchFromBalance } = useTokenBalance({
    tokenAddress: fromToken?.address ?? null,
    userAddress: address,
    decimals: fromToken?.decimals ?? 18,
    chainId,
  })
  const { balance: toBalance, refetch: refetchToBalance } = useTokenBalance({
    tokenAddress: toToken?.address ?? null,
    userAddress: address,
    decimals: toToken?.decimals ?? 18,
    chainId,
  })

  // Quote
  const { trade, outputAmount, executionPrice, priceImpact, tradingFee, isLoading: isQuoteLoading, error: quoteError } =
    useSwapQuote({
      inputToken: sdkFromToken,
      outputToken: sdkToToken,
      typedValue: debouncedFromAmount,
      isExactIn: true,
      isNativeIn: isFromNative,
      isNativeOut: isToNative,
      bases,
      chainId,
      enabled: !isWrapUnwrap && !!debouncedFromAmount && parseFloat(debouncedFromAmount) > 0,
      refreshCounter,
    })

  // Update toAmount from quote
  useEffect(() => {
    if (isWrapUnwrap) {
      setToAmount(fromAmount)
    } else {
      setToAmount(outputAmount)
    }
  }, [outputAmount, isWrapUnwrap, fromAmount])

  // Approval
  const { needsApproval, isCheckingApproval, isApproving, isApprovalPending, isApprovalConfirmed, approvalHash, approve } =
    useTokenApproval({
      tokenAddress: isFromNative ? null : (fromToken?.address ?? null),
      amount: fromAmount,
      tokenDecimals: fromToken?.decimals ?? 18,
      chainId,
      enabled: !isWrapUnwrap && !!fromAmount && parseFloat(fromAmount) > 0,
    })

  // Swap execution
  const { executeSwap, isSwapping, hash: swapHash } = useSwap(chainId)
  const { isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({
    hash: swapHash ?? undefined,
  })

  // Wrap/unwrap
  const { wrap, unwrap, isPending: isWrapPending, isConfirmed: isWrapConfirmed, hash: wrapHash } = useWrapUnwrap()
  const [lastProcessedWrapHash, setLastProcessedWrapHash] = useState<string | null>(null)

  // Auto-refresh timer (10s)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!isWrapUnwrap && debouncedFromAmount && parseFloat(debouncedFromAmount) > 0) {
      timerRef.current = setInterval(() => setRefreshCounter((c) => c + 1), 10_000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isWrapUnwrap, debouncedFromAmount])

  // Swap success toast
  useEffect(() => {
    if (isSwapConfirmed && swapHash && swapHash !== lastProcessedHash) {
      const captured = { from: fromAmount, to: toAmount, fromSym: fromToken?.symbol, toSym: toToken?.symbol }
      setLastProcessedHash(swapHash)
      toast.success("Swap Successful!", {
        description: `${captured.from} ${captured.fromSym} → ${captured.to} ${captured.toSym}`,
      })
      setFromAmount("")
      setToAmount("")
      refetchFromBalance()
      refetchToBalance()
      onSwapSuccess?.(swapHash)
    }
  }, [isSwapConfirmed, swapHash, lastProcessedHash])

  // Wrap/unwrap success toast
  useEffect(() => {
    if (isWrapConfirmed && wrapHash && wrapHash !== lastProcessedWrapHash) {
      const isWrap = fromToken && toToken ? isWrapOperation(fromToken, toToken) : true
      setLastProcessedWrapHash(wrapHash)
      toast.success(isWrap ? "Wrap Successful!" : "Unwrap Successful!", {
        description: `${fromAmount} ${fromToken?.symbol} → ${toAmount} ${toToken?.symbol}`,
      })
      setFromAmount("")
      setToAmount("")
      refetchFromBalance()
      refetchToBalance()
      onSwapSuccess?.(wrapHash)
    }
  }, [isWrapConfirmed, wrapHash, lastProcessedWrapHash])

  // Validation
  const fromAmountNum = parseFloat(fromAmount)
  const fromBalanceNum = parseFloat(fromBalance)
  const hasInsufficientBalance = isConnected && fromAmount && fromAmountNum > fromBalanceNum
  const hasNoPool = quoteError?.message?.includes("No liquidity")
  const hasInsufficientLiquidity = quoteError?.message?.includes("Insufficient liquidity")

  const isLoading = isQuoteLoading || isCheckingApproval || isApproving || isApprovalPending || isSwapping || isWrapPending

  const canSwap =
    isConnected &&
    !!fromToken &&
    !!toToken &&
    !!fromAmount &&
    fromAmountNum > 0 &&
    !hasInsufficientBalance &&
    !hasNoPool &&
    !hasInsufficientLiquidity &&
    !isLoading &&
    (isWrapUnwrap || !!trade)

  const buttonLabel = useMemo(() => {
    if (!isConnected) return "Connect Wallet"
    if (!fromAmount || fromAmountNum <= 0) return "Enter Amount"
    if (hasInsufficientBalance) return `Insufficient ${fromToken?.symbol} Balance`
    if (hasNoPool) return "No Liquidity Pool"
    if (hasInsufficientLiquidity) return "Insufficient Liquidity"
    if (isApproving) return "Approving..."
    if (isApprovalPending) return "Waiting for Approval..."
    if (needsApproval) return `Approve ${fromToken?.symbol}`
    if (isSwapping || isWrapPending) return "Confirming..."
    if (isQuoteLoading) return "Fetching Quote..."
    if (isWrapUnwrap) return fromToken?.symbol === "PHRS" ? "Wrap" : "Unwrap"
    return "Swap"
  }, [isConnected, fromAmount, fromAmountNum, hasInsufficientBalance, hasNoPool, hasInsufficientLiquidity, isApproving, isApprovalPending, needsApproval, isSwapping, isWrapPending, isQuoteLoading, isWrapUnwrap, fromToken])

  const handleSwap = async () => {
    if (!canSwap) return
    try {
      if (needsApproval) {
        toast.info("Approve Token", { description: "Please approve token spending in your wallet" })
        await approve()
        toast.success("Approval Successful!")
        return
      }

      if (isWrapUnwrap) {
        toast.info("Confirm Transaction", { description: "Please confirm in your wallet" })
        if (fromToken?.symbol === "PHRS") {
          await wrap(fromAmount)
        } else {
          await unwrap(fromAmount)
        }
        return
      }

      if (!trade) return
      toast.info("Confirm Swap", { description: "Please confirm the swap in your wallet" })
      await executeSwap(trade, { slippageBps })
      toast.info("Transaction Submitted", { description: "Waiting for confirmation..." })
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? ""
      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        toast.error("Transaction Rejected")
      } else if (msg.includes("insufficient funds")) {
        toast.error("Insufficient Funds")
      } else {
        toast.error("Transaction Failed", { description: msg.slice(0, 120) })
      }
    }
  }

  const handleSwitch = () => {
    const prev = fromToken
    setFromToken(toToken)
    setToToken(prev)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const setPercentage = (pct: number) => {
    if (!fromBalance) return
    const value = (fromBalanceNum * pct).toFixed(fromToken?.decimals ?? 6)
    setFromAmount(sanitizeAmount(value))
  }

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm font-medium">Swap</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshCounter((c) => c + 1)}
            className="text-white/40 hover:text-white/70 transition-colors"
            title="Refresh quote"
          >
            <RefreshCw className={cn("w-4 h-4", isQuoteLoading && "animate-spin")} />
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="text-white/40 hover:text-white/70 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col gap-2">
          <span className="text-white/60 text-xs">Slippage Tolerance</span>
          <div className="flex items-center gap-2">
            {[10, 30, 50, 100].map((bps) => (
              <button
                key={bps}
                type="button"
                onClick={() => setSlippageBps(bps)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  slippageBps === bps
                    ? "bg-[#97CBDC]/20 text-[#97CBDC] border border-[#97CBDC]/40"
                    : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/10"
                )}
              >
                {bps / 100}%
              </button>
            ))}
            <div className="flex items-center gap-1 flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
              <input
                type="number"
                min={1}
                max={5000}
                value={slippageBps / 100}
                onChange={(e) => setSlippageBps(Math.round(parseFloat(e.target.value || "0") * 100))}
                className="bg-transparent text-white text-xs w-full outline-none"
                placeholder="Custom"
              />
              <span className="text-white/40 text-xs">%</span>
            </div>
          </div>
        </div>
      )}

      {/* From token input */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-xs">You Pay</span>
          {isConnected && fromToken && (
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs">Balance: {formatAmount(fromBalance)} {fromToken.symbol}</span>
              <div className="flex gap-1">
                {[0.5, 1].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setPercentage(pct)}
                    className="text-[10px] text-[#97CBDC]/70 hover:text-[#97CBDC] px-1.5 py-0.5 rounded bg-[#97CBDC]/10 hover:bg-[#97CBDC]/20 transition-colors"
                  >
                    {pct === 1 ? "MAX" : "50%"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            value={fromAmount}
            onChange={(e) => setFromAmount(sanitizeAmount(e.target.value))}
            placeholder="0.0"
            className="bg-transparent text-white text-2xl font-light outline-none flex-1 min-w-0"
          />
          <TokenSelector
            selected={fromToken}
            tokens={tokenList}
            disabledAddress={toToken?.address}
            onSelect={setFromToken}
          />
        </div>
      </div>

      {/* Switch button */}
      <div className="flex items-center justify-center -my-1">
        <button
          type="button"
          onClick={handleSwitch}
          className="w-9 h-9 rounded-xl bg-[#0d1117] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors z-10"
        >
          <ArrowDownUp className="w-4 h-4" />
        </button>
      </div>

      {/* To token output */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-xs">You Receive</span>
          {isConnected && toToken && (
            <span className="text-white/40 text-xs">Balance: {formatAmount(toBalance)} {toToken.symbol}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {isQuoteLoading ? (
              <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              <span className="text-white text-2xl font-light">
                {toAmount ? formatAmount(toAmount) : "0.0"}
              </span>
            )}
          </div>
          <TokenSelector
            selected={toToken}
            tokens={tokenList}
            disabledAddress={fromToken?.address}
            onSelect={setToToken}
          />
        </div>
      </div>

      {/* Quote details */}
      {!isWrapUnwrap && executionPrice && fromToken && toToken && (
        <SwapDetails
          fromToken={fromToken}
          toToken={toToken}
          executionPrice={executionPrice}
          priceImpact={priceImpact}
          tradingFee={tradingFee}
          outputAmount={toAmount}
          slippageBps={slippageBps}
        />
      )}

      {/* Errors */}
      {(hasNoPool || hasInsufficientLiquidity) && fromAmount && parseFloat(fromAmount) > 0 && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-red-400 text-sm">{quoteError?.message}</p>
        </div>
      )}

      {/* Swap button */}
      {!isConnected ? (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <Button onClick={openConnectModal} variant="primary" size="lg" className="w-full">
              Connect Wallet
            </Button>
          )}
        </ConnectButton.Custom>
      ) : (
        <Button
          onClick={handleSwap}
          disabled={!canSwap && isConnected && !!fromAmount && parseFloat(fromAmount) > 0}
          variant={canSwap ? "primary" : "default"}
          size="lg"
          className="w-full"
        >
          {isLoading && (
            <RefreshCw className="w-4 h-4 animate-spin" />
          )}
          {buttonLabel}
        </Button>
      )}
    </div>
  )
}
