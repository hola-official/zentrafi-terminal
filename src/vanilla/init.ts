/**
 * Vanilla JS / HTML script-tag entry point.
 *
 * Exposes `window.ZentraX.init()`, `window.ZentraX.update()`, and `window.ZentraX.destroy()`.
 *
 * Usage (HTML):
 * ```html
 * <link rel="stylesheet" href="https://cdn.zentrafi.xyz/terminal/style.css">
 * <script src="https://cdn.zentrafi.xyz/terminal/main.js"></script>
 *
 * <!-- Option A: manual init -->
 * <div id="zentra-terminal"></div>
 * <script>
 *   window.ZentraX.init({
 *     containerId: "zentra-terminal",
 *     displayMode: "Integrated",
 *     themeType: "Dark",
 *     theme: { primary: "#97CBDC", btn_text: "#000000" },
 *   })
 * </script>
 *
 * <!-- Option B: zero-JS auto-init via data attributes -->
 * <div data-zentra-terminal data-mode="Widget" data-theme="Dark"></div>
 * ```
 */

// Pull in Tailwind utilities + RainbowKit CSS for the IIFE bundle
import "../styles/terminal.css"

import { createElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { ZentraTerminal } from "@terminal/components/ZentraTerminal"
import type { ZentraXInitOptions, ZentraTerminalInitProps, DisplayMode, ThemeType } from "@terminal/types"

const roots = new Map<string, Root>()
const currentOptions = new Map<string, ZentraTerminalInitProps>()

function init(options: ZentraXInitOptions) {
  const { containerId, ...initProps } = options
  const container = document.getElementById(containerId)

  if (!container) {
    console.error(`[ZentraX] No element found with id="${containerId}"`)
    return
  }

  // Unmount any existing instance in this container first
  destroy(containerId)

  const root = createRoot(container)
  roots.set(containerId, root)
  currentOptions.set(containerId, initProps)

  root.render(createElement(ZentraTerminal, { initProps }))
}

/**
 * Re-render an existing instance with merged options.
 * React reconciles this as a prop update — no remount, no wallet disconnect.
 */
function update(containerId: string, options: Partial<ZentraTerminalInitProps>) {
  const root = roots.get(containerId)
  const existing = currentOptions.get(containerId)

  if (!root || existing === undefined) {
    console.warn(`[ZentraX] No instance found for containerId="${containerId}". Call init() first.`)
    return
  }

  const merged: ZentraTerminalInitProps = { ...existing, ...options }
  currentOptions.set(containerId, merged)
  root.render(createElement(ZentraTerminal, { initProps: merged }))
}

function destroy(containerId?: string) {
  if (containerId) {
    const root = roots.get(containerId)
    if (root) {
      root.unmount()
      roots.delete(containerId)
      currentOptions.delete(containerId)
    }
  } else {
    roots.forEach((root) => root.unmount())
    roots.clear()
    currentOptions.clear()
  }
}

/**
 * Zero-JS auto-init: scans for [data-zentra-terminal] elements on DOMContentLoaded.
 *
 * Supported data attributes:
 *   data-mode="Integrated" | "Modal" | "Widget"   (displayMode)
 *   data-theme="Dark" | "Light"                    (themeType)
 *   data-position="bottom-right" | ...             (widgetPosition)
 *   data-wallet-connect-id="YOUR_ID"               (walletConnectProjectId)
 */
function autoInit() {
  document.querySelectorAll<HTMLElement>("[data-zentra-terminal]").forEach((el) => {
    if (!el.id) {
      el.id = `zentra-auto-${Math.random().toString(36).slice(2, 8)}`
    }

    init({
      containerId: el.id,
      displayMode: (el.dataset.mode as DisplayMode) ?? "Integrated",
      themeType: (el.dataset.theme as ThemeType) ?? "Dark",
      widgetPosition: (el.dataset.position as ZentraXInitOptions["widgetPosition"]) ?? "bottom-right",
      walletConnectProjectId: el.dataset.walletConnectId ?? "",
    })
  })
}

// Expose on window
if (typeof window !== "undefined") {
  window.ZentraX = { init, update, destroy }

  // Auto-init after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit)
  } else {
    autoInit()
  }
}

export { init, update, destroy }
