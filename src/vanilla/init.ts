/**
 * Vanilla JS / HTML script-tag entry point.
 *
 * Exposes `window.ZentraX.init()` and `window.ZentraX.destroy()`.
 *
 * Usage (HTML):
 * ```html
 * <link rel="stylesheet" href="https://cdn.zentrafi.xyz/terminal/style.css">
 * <script src="https://cdn.zentrafi.xyz/terminal/main.js"></script>
 * <div id="zentra-terminal"></div>
 * <script>
 *   window.ZentraX.init({
 *     containerId: "zentra-terminal",
 *     displayMode: "Integrated",
 *     themeType: "Dark",
 *     theme: { primary: "#97CBDC", btn_text: "#000000" },
 *   })
 * </script>
 * ```
 */

import { createElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { ZentraTerminal } from "@terminal/components/ZentraTerminal"
import type { ZentraXInitOptions } from "@terminal/types"

const roots = new Map<string, Root>()

function init(options: ZentraXInitOptions) {
  const { containerId, ...initProps } = options
  const container = document.getElementById(containerId)

  if (!container) {
    console.error(`[ZentraX] No element found with id="${containerId}"`)
    return
  }

  // Unmount any existing instance in this container
  destroy(containerId)

  const root = createRoot(container)
  roots.set(containerId, root)

  root.render(
    createElement(ZentraTerminal, { initProps })
  )
}

function destroy(containerId?: string) {
  if (containerId) {
    const root = roots.get(containerId)
    if (root) {
      root.unmount()
      roots.delete(containerId)
    }
  } else {
    // Destroy all instances
    roots.forEach((root) => root.unmount())
    roots.clear()
  }
}

// Expose on window
if (typeof window !== "undefined") {
  window.ZentraX = { init, destroy }
}

export { init, destroy }
