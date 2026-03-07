"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Toaster } from "sonner"
import { SwapWidget, type SwapWidgetConfig } from "@terminal/components/SwapWidget"
import { TerminalProviders, type TerminalProvidersConfig } from "@terminal/components/TerminalProviders"
import { cn } from "@terminal/utils/cn"

export type DisplayMode = "modal" | "widget" | "integrated"

export interface ZentraTerminalProps extends SwapWidgetConfig, TerminalProvidersConfig {
  mode?: DisplayMode
  // Modal-specific
  trigger?: React.ReactNode
  defaultOpen?: boolean
  // Widget-specific
  floatPosition?: "bottom-right" | "bottom-left"
  // Branding
  showBranding?: boolean
}

/**
 * ZentraTerminal — three display modes:
 *
 * - "integrated": Renders directly in the DOM (embed anywhere)
 * - "widget":     Floating bubble button that expands to the swap panel
 * - "modal":      Dialog overlay triggered by a custom trigger element
 */
export function ZentraTerminal({
  mode = "integrated",
  trigger,
  defaultOpen = false,
  floatPosition = "bottom-right",
  showBranding = true,
  // Provider config
  walletConnectProjectId,
  appName,
  // Widget config
  defaultFromToken,
  defaultToToken,
  defaultSlippageBps,
  onSwapSuccess,
  className,
}: ZentraTerminalProps) {
  const [open, setOpen] = useState(defaultOpen)

  const widgetConfig: SwapWidgetConfig = {
    defaultFromToken,
    defaultToToken,
    defaultSlippageBps,
    onSwapSuccess,
  }

  const shell = (
    <TerminalProviders walletConnectProjectId={walletConnectProjectId} appName={appName}>
      <Toaster position="top-right" richColors theme="dark" />
      <SwapPanel showBranding={showBranding} widgetConfig={widgetConfig} className={className} />
    </TerminalProviders>
  )

  // ── Integrated ────────────────────────────────────────────────────────────
  if (mode === "integrated") {
    return shell
  }

  // ── Widget (floating) ─────────────────────────────────────────────────────
  if (mode === "widget") {
    return (
      <TerminalProviders walletConnectProjectId={walletConnectProjectId} appName={appName}>
        <Toaster position="top-right" richColors theme="dark" />

        {/* Floating panel */}
        {open && (
          <div
            className={cn(
              "fixed z-50 w-[380px]",
              floatPosition === "bottom-right" ? "bottom-20 right-4" : "bottom-20 left-4"
            )}
          >
            <SwapPanel
              showBranding={showBranding}
              widgetConfig={widgetConfig}
              className={className}
              onClose={() => setOpen(false)}
            />
          </div>
        )}

        {/* FAB trigger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "fixed z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200",
            "bg-[#97CBDC] hover:bg-[#97CBDC]/90 text-black font-bold text-lg",
            floatPosition === "bottom-right" ? "bottom-4 right-4" : "bottom-4 left-4"
          )}
          title="Open Swap"
        >
          {open ? <X className="w-6 h-6" /> : <span className="text-xl font-bold">Z</span>}
        </button>
      </TerminalProviders>
    )
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  return (
    <TerminalProviders walletConnectProjectId={walletConnectProjectId} appName={appName}>
      <Toaster position="top-right" richColors theme="dark" />

      {/* Trigger */}
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer", display: "inline-block" }}>
        {trigger ?? (
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-[#97CBDC] text-black font-semibold text-sm hover:bg-[#97CBDC]/90 transition-colors"
          >
            Swap
          </button>
        )}
      </span>

      {/* Backdrop + Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-[420px]">
            <SwapPanel
              showBranding={showBranding}
              widgetConfig={widgetConfig}
              className={className}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </TerminalProviders>
  )
}

// ── Internal panel shell ────────────────────────────────────────────────────

function SwapPanel({
  widgetConfig,
  showBranding,
  className,
  onClose,
}: {
  widgetConfig: SwapWidgetConfig
  showBranding: boolean
  className?: string
  onClose?: () => void
}) {
  return (
    <div className={cn("relative rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl p-4 flex flex-col gap-1")}>
      {/* Optional close button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Branding header */}
      {showBranding && (
        <div className="flex items-center gap-2 mb-1 pr-8">
          <div className="w-6 h-6 rounded-full bg-[#97CBDC] flex items-center justify-center text-black font-bold text-xs">
            Z
          </div>
          <span className="text-white/60 text-xs font-medium">Powered by ZentraFi</span>
        </div>
      )}

      <SwapWidget {...widgetConfig} className={className} />
    </div>
  )
}
