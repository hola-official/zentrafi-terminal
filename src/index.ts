// ── Styles (extracted to dist/styles.css by the lib build) ───────────────────
import "./styles/terminal.css"

// ── Main component ────────────────────────────────────────────────────────────
export { ZentraTerminal } from "@terminal/components/ZentraTerminal"
export type { ZentraTerminalProps } from "@terminal/components/ZentraTerminal"

// ── Individual building blocks (advanced usage) ────────────────────────────────
export { SwapWidget } from "@terminal/components/SwapWidget"
export type { SwapWidgetConfig } from "@terminal/components/SwapWidget"

export { TerminalProviders } from "@terminal/components/TerminalProviders"
export type { TerminalProvidersConfig } from "@terminal/components/TerminalProviders"

export { TokenSelector } from "@terminal/components/TokenSelector"
export { SwapDetails } from "@terminal/components/SwapDetails"

export { ZentraLogo, ZentraWordmark } from "@terminal/components/ZentraLogo"

// ── Theme ─────────────────────────────────────────────────────────────────────
export { ThemeProvider, useTerminalTheme } from "@terminal/theme/ThemeProvider"
export { DARK_THEME, LIGHT_THEME, resolveTheme } from "@terminal/theme/themes"

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useSwapQuote } from "@terminal/hooks/useSwapQuote"
export { useSwap } from "@terminal/hooks/useSwap"
export { useTokenApproval } from "@terminal/hooks/useTokenApproval"
export { useWrapUnwrap } from "@terminal/hooks/useWrapUnwrap"
export { useTokenBalance } from "@terminal/hooks/useTokenBalance"

// ── Config / tokens ───────────────────────────────────────────────────────────
export {
  TOKEN_LIST,
  SDK_TOKENS,
  PHAROS_CHAIN_ID,
  WPHRS_ADDRESS,
  getTokenList,
  getSDKTokens,
  getSDKToken,
  toSDKChainId,
} from "@terminal/config/tokens"
export type { TokenConfig } from "@terminal/config/tokens"
export { pharosTestnet } from "@terminal/config/chains"

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  ZentraTerminalInitProps,
  ZentraXInitOptions,   // was ZentraSwapInitOptions
  DisplayMode,
  ThemeType,
  TerminalTheme,
  WidgetPosition,
  WidgetSize,
  DefaultPair,
  RpcConfig,
} from "@terminal/types"

// ── Utilities ─────────────────────────────────────────────────────────────────
export { isWrapOrUnwrap, isWrapOperation, isUnwrapOperation } from "@terminal/utils/swap"
export { formatAmount, formatUSD, truncateAddress, sanitizeAmount } from "@terminal/utils/format"
