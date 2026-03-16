"use client"

import { useState, useMemo, useEffect } from "react"
import { X } from "lucide-react"
import { Toaster } from "sonner"
import { SwapWidget } from "@terminal/components/SwapWidget"
import { TerminalProviders } from "@terminal/components/TerminalProviders"
import { ThemeProvider, useTerminalTheme } from "@terminal/theme/ThemeProvider"
import { ZentraLogo } from "@terminal/components/ZentraLogo"
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
    resolveTokenAddress(defaultPair?.to) ?? "0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8"
  const defaultSlippageBps = initialSlippage != null ? Math.round(initialSlippage * 100) : 50

  const widgetConfig = { defaultFromToken, defaultToToken, defaultSlippageBps, onSwapSuccess }

  // Skip SSR — the swap widget is entirely client-side (wallet, prices, wagmi)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <ThemeProvider themeType={themeType} theme={theme}>
      <TerminalProviders
        walletConnectProjectId={walletConnectProjectId}
        appName={appName}
        independentWallet={independentWallet}
      >
        <Toaster position="top-right" richColors theme={themeType === "Light" ? "light" : "dark"} />
        <TerminalRenderer
          mode={mode}
          widgetPosition={widgetPosition}
          widgetSize={widgetSize}
          showBranding={showBranding}
          logoUrl={logoUrl}
          widgetConfig={widgetConfig}
        />
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

  const panelWidth = widgetSize === "small" ? "w-[340px]" : "w-[400px]"

  const panel = (
    <SwapPanel
      showBranding={showBranding}
      logoUrl={logoUrl}
      widgetConfig={widgetConfig}
      onClose={mode !== "Integrated" ? () => setOpen(false) : undefined}
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

    return (
      <>
        {/* Floating panel */}
        {open && (
          <div className={cn("fixed z-[9999]", panelOffsetClass, panelWidth)}>
            <div
              style={{ background: theme.bg_primary, borderColor: theme.border }}
              className="rounded-2xl border shadow-2xl p-4"
            >
              {panel}
            </div>
          </div>
        )}

        {/* FAB */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{ background: theme.primary, color: theme.btn_text }}
          className={cn(
            "fixed z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center",
            "font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95",
            positionClass
          )}
          title="Open ZentraFi Swap"
        >
          {open ? (
            <X className="w-6 h-6" />
          ) : logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <ZentraLogo size={28} style={{ color: theme.btn_text }} />
          )}
        </button>
      </>
    )
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Trigger slot — rendered as a button by default */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ background: theme.primary, color: theme.btn_text }}
        className="px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
      >
        Launch Swap
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: theme.bg_overlay }}
            onClick={() => setOpen(false)}
          />
          {/* Dialog */}
          <div
            className={cn("relative z-10 w-full", panelWidth)}
            style={{ background: theme.bg_primary, borderColor: theme.border }}
          >
            <div className="rounded-2xl border p-4">{panel}</div>
          </div>
        </div>
      )}
    </>
  )
}

// ── SwapPanel shell ───────────────────────────────────────────────────────────

function SwapPanel({
  widgetConfig,
  showBranding,
  logoUrl,
  onClose,
}: {
  widgetConfig: Parameters<typeof SwapWidget>[0]
  showBranding: boolean
  logoUrl?: string
  onClose?: () => void
}) {
  const { theme } = useTerminalTheme()

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        {/* {showBranding && (
          <div className="flex items-center gap-1.5">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <ZentraLogo size={18} style={{ color: theme.primary }} />
            )}
            <span style={{ color: theme.text_secondary }} className="text-xs font-medium">
              Powered by{" "}
              <span style={{ color: theme.primary }} className="font-semibold">
                ZentraFi
              </span>
            </span>
          </div>
        )} */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{ color: theme.text_secondary }}
            className="ml-auto hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <SwapWidget {...widgetConfig} />
      
      
    </div>
  )
}

// Re-export types for convenience
export type { ZentraTerminalInitProps, DisplayMode, WidgetPosition, WidgetSize }
