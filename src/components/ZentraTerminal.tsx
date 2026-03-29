"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Toaster } from "sonner"
import { SwapWidget } from "@terminal/components/SwapWidget"
import { TerminalProviders } from "@terminal/components/TerminalProviders"
import { ThemeProvider, useTerminalTheme } from "@terminal/theme/ThemeProvider"
import { ZentraLogoAnimated } from "@terminal/components/zentraFi-logo-animated"
import { getTokenList } from "@terminal/config/tokens"
import { PHAROS_CHAIN_ID } from "@terminal/config/tokens"
import { cn } from "@terminal/utils/cn"
import type { ZentraTerminalInitProps, DisplayMode, WidgetPosition, WidgetSize } from "@terminal/types"

// ── Public component (mirrors Cetus <CetusSwap initProps={...} />) ────────────

export interface ZentraTerminalProps {
  initProps?: ZentraTerminalInitProps
  /** Shorthand: override displayMode directly */
  displayMode?: DisplayMode
}

/**
 * Drop-in swap terminal for ZentraFi on Pharos EVM.
 *
 * Usage:
 * ```tsx
 * <ZentraTerminal initProps={{ displayMode: "Integrated", themeType: "Dark" }} />
 * ```
 */
export function ZentraTerminal({ initProps = {}, displayMode: displayModeProp }: ZentraTerminalProps) {
  const {
    displayMode: initDisplayMode = "Integrated",
    themeType = "Dark",
    theme,
    independentWallet = true,
    defaultPair,
    initialSlippage,
    walletConnectProjectId = "",
    appName = "ZentraFi Terminal",
    widgetPosition = "bottom-right",
    widgetSize = "default",
    showBranding = true,
    logoUrl,
    onSwapSuccess,
    onError,
  } = initProps

  const mode = displayModeProp ?? initDisplayMode

  // Resolve default token addresses from pair symbols/addresses
  const tokenList = useMemo(() => getTokenList(PHAROS_CHAIN_ID), [])

  const resolveTokenAddress = (symbolOrAddr: string | undefined): string | undefined => {
    if (!symbolOrAddr) return undefined
    if (symbolOrAddr.startsWith("0x") || symbolOrAddr === "NATIVE") return symbolOrAddr
    const found = tokenList.find((t) => t.symbol.toLowerCase() === symbolOrAddr.toLowerCase())
    return found?.address
  }

  const defaultFromToken = resolveTokenAddress(defaultPair?.from) ?? "NATIVE"
  const defaultToToken =
    resolveTokenAddress(defaultPair?.to) ?? "0xE7E84B8B4f39C507499c40B4ac199B050e2882d5"
  const defaultSlippageBps = initialSlippage != null ? Math.round(initialSlippage * 100) : 50

  const widgetConfig = { defaultFromToken, defaultToToken, defaultSlippageBps, onSwapSuccess, onError }

  // Mount guard for SSR-safe rendering — but TerminalProviders mounts immediately
  // so wagmi begins reconnecting from localStorage before the user can open the widget
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <ThemeProvider themeType={themeType} theme={theme}>
      <TerminalProviders
        walletConnectProjectId={walletConnectProjectId}
        appName={appName}
        independentWallet={independentWallet}
      >
        <Toaster position="top-right" richColors theme={themeType === "Light" ? "light" : "dark"} />
        {!mounted ? (
          <MountSkeleton mode={mode} widgetPosition={widgetPosition} widgetSize={widgetSize} />
        ) : (
          <TerminalRenderer
            mode={mode}
            widgetPosition={widgetPosition}
            widgetSize={widgetSize}
            showBranding={showBranding}
            logoUrl={logoUrl}
            widgetConfig={widgetConfig}
          />
        )}
      </TerminalProviders>
    </ThemeProvider>
  )
}

// ── Internal renderer ─────────────────────────────────────────────────────────

interface RendererProps {
  mode: DisplayMode
  widgetPosition: WidgetPosition
  widgetSize: WidgetSize
  showBranding: boolean
  logoUrl?: string
  widgetConfig: Parameters<typeof SwapWidget>[0]
}

function TerminalRenderer({ mode, widgetPosition, widgetSize, showBranding, logoUrl, widgetConfig }: RendererProps) {
  const [open, setOpen] = useState(false)
  const { theme } = useTerminalTheme()

  const isZentrafiDomain =
    typeof window !== "undefined" &&
    (window.location.hostname === "x.zentrafi.xyz" ||
      window.location.hostname === "atlantic.zentrafi.xyz")

  const panelWidth = widgetSize === "small" ? "w-[340px]" : "w-[400px]"
  const panelMaxWidth = widgetSize === "small" ? "max-w-[340px]" : "max-w-[400px]"

  // Always render SwapPanel — never unmount it so wallet connection persists
  const panel = (
    <SwapPanel
      showBranding={showBranding}
      widgetConfig={widgetConfig}
    />
  )

  // ── Integrated ─────────────────────────────────────────────────────────────
  if (mode === "Integrated") {
    return <div style={{ background: theme.bg_primary }} className="rounded-2xl p-4">{panel}</div>
  }

  // ── Widget ─────────────────────────────────────────────────────────────────
  if (mode === "Widget") {
    const positionClass = {
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
    }[widgetPosition]

    const panelOffsetClass = {
      "bottom-right": "bottom-20 right-4",
      "bottom-left": "bottom-20 left-4",
      "top-right": "top-20 right-4",
      "top-left": "top-20 left-4",
    }[widgetPosition]

    // For top positions panel slides down on open, bottom positions slide up
    const isTop = widgetPosition.startsWith("top")

    return (
      <>
        {/* Floating panel — always mounted, shown/hidden via CSS */}
        <div
          className={cn(
            "fixed z-[9999] max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out",
            panelOffsetClass, panelWidth,
            open
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : isTop
                ? "opacity-0 -translate-y-3 pointer-events-none"
                : "opacity-0 translate-y-3 pointer-events-none"
          )}
        >
          <div
            style={{ background: theme.bg_primary, borderColor: theme.border }}
            className="rounded-2xl border shadow-2xl p-4"
          >
            {panel}
          </div>
        </div>

        {/* FAB */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={(logoUrl || isZentrafiDomain) ? { background: theme.primary, color: theme.btn_text } : undefined}
          className={cn(
            "fixed z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center",
            "transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer",
            positionClass
          )}
          title="Open ZentraFi Swap"
        >
          {/* Close chevron — carries its own background when the logo is animated */}
          <span
            className={cn("absolute inset-0 rounded-full flex items-center justify-center transition-all duration-200",
              open ? "opacity-100 scale-100" : "opacity-0 scale-75")}
            style={(!logoUrl && !isZentrafiDomain) ? { background: theme.primary, color: theme.btn_text } : undefined}
          >
            <ChevronDown className="w-6 h-6" />
          </span>
          {/* Logo */}
          <span className={cn(
            "absolute inset-0 rounded-full flex items-center justify-center overflow-hidden transition-all duration-200",
            open ? "opacity-0 scale-75" : "opacity-100 scale-100"
          )}>
            {(logoUrl || isZentrafiDomain)
              ? <img src={logoUrl || "/zentra-mascot.png"} alt="Logo" className="w-14 h-14 object-cover" />
              : <ZentraLogoAnimated size={widgetSize === "small" ? "sm" : "md"} showLogoText={false} showTagline={false} />
            }
          </span>
        </button>
      </>
    )
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Logo trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-16 h-16 rounded-full overflow-hidden shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 ring-2 cursor-pointer"
        style={{ boxShadow: `0 0 0 2px ${theme.primary}, 0 0 24px ${theme.primary}40` }}
        title="Open ZentraFi Swap"
      >
        <img
          src={logoUrl || "/zentra-mascot.png"}
          alt="Open ZentraFi Swap"
          className="w-full h-full object-cover"
        />
      </button>

      {/* Modal overlay — always mounted, shown/hidden via CSS to preserve wallet state */}
      <div
        className={cn(
          "fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 cursor-pointer"
          style={{ background: theme.bg_overlay }}
          onClick={() => setOpen(false)}
        />
        {/* Dialog — slides up + fades in */}
        <div
          className={cn(
            "relative z-10 w-full transition-all duration-300 ease-out",
            panelMaxWidth,
            open ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          )}
          style={{ background: theme.bg_primary, borderColor: theme.border }}
        >
          <div className="rounded-2xl border p-4">{panel}</div>
        </div>
      </div>
    </>
  )
}

// ── SwapPanel shell ───────────────────────────────────────────────────────────

function SwapPanel({
  widgetConfig,
  showBranding,
}: {
  widgetConfig: Parameters<typeof SwapWidget>[0]
  showBranding: boolean
}) {
  const { theme } = useTerminalTheme()

  return (
    <div className="flex flex-col gap-3">
      <SwapWidget {...widgetConfig} />

      {showBranding && (
        <div className="flex items-center justify-center gap-2 pt-0.5">
          <ZentraLogoAnimated size="xs" showLogoText={false} showTagline={false} />
          <span style={{ color: theme.text_secondary }} className="text-xs font-medium">
            Powered by{" "}
            <span style={{ color: theme.primary }} className="font-semibold">
              ZentraFi
            </span>
          </span>
        </div>
      )}
    </div>
  )
}

// ── Mount skeleton (shows before hydration, avoids layout shift) ──────────────

function MountSkeleton({
  mode,
  widgetPosition,
  widgetSize,
}: {
  mode: DisplayMode
  widgetPosition: WidgetPosition
  widgetSize: WidgetSize
}) {
  const { theme } = useTerminalTheme()
  const shimmer: React.CSSProperties = { background: "rgba(255,255,255,0.07)", borderRadius: 8 }
  const pulse = "animate-pulse"

  if (mode === "Widget") {
    const posClass = {
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
    }[widgetPosition]
    return (
      <div
        className={cn("fixed z-[9999] w-14 h-14 rounded-full", pulse, posClass)}
        style={{ background: theme.primary, opacity: 0.7 }}
      />
    )
  }

  if (mode === "Modal") {
    return (
      <div
        className={cn("px-5 py-2.5 rounded-xl w-32 h-9", pulse)}
        style={{ background: theme.primary, opacity: 0.7 }}
      />
    )
  }

  // Integrated — full panel shimmer
  const panelWidth = widgetSize === "small" ? "w-[340px]" : "w-[400px]"
  return (
    <div
      className={cn("rounded-2xl p-4 flex flex-col gap-3", pulse, panelWidth)}
      style={{ background: theme.bg_primary }}
    >
      {/* Header row */}
      <div className="flex justify-between items-center">
        <div className="h-5 w-20 rounded" style={shimmer} />
        <div className="h-5 w-16 rounded" style={shimmer} />
      </div>
      {/* From box */}
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="flex justify-between">
          <div className="h-3 w-12 rounded" style={shimmer} />
          <div className="h-3 w-20 rounded" style={shimmer} />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full" style={shimmer} />
          <div className="h-8 flex-1 rounded-xl" style={shimmer} />
        </div>
      </div>
      {/* Arrow */}
      <div className="flex justify-center">
        <div className="h-8 w-8 rounded-full" style={shimmer} />
      </div>
      {/* To box */}
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="flex justify-between">
          <div className="h-3 w-12 rounded" style={shimmer} />
          <div className="h-3 w-20 rounded" style={shimmer} />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full" style={shimmer} />
          <div className="h-8 flex-1 rounded-xl" style={shimmer} />
        </div>
      </div>
      {/* Button */}
      <div className="h-12 rounded-xl" style={{ ...shimmer, background: theme.primary, opacity: 0.4 }} />
    </div>
  )
}

// Re-export types for convenience
export type { ZentraTerminalInitProps, DisplayMode, WidgetPosition, WidgetSize }
