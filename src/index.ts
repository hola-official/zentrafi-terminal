// Main component (all three modes)
export { ZentraTerminal } from "@terminal/components/ZentraTerminal"
export type { ZentraTerminalProps, DisplayMode } from "@terminal/components/ZentraTerminal"

// Individual pieces (for advanced usage)
export { SwapWidget } from "@terminal/components/SwapWidget"
export type { SwapWidgetConfig } from "@terminal/components/SwapWidget"

export { TerminalProviders } from "@terminal/components/TerminalProviders"
export type { TerminalProvidersConfig } from "@terminal/components/TerminalProviders"

export { TokenSelector } from "@terminal/components/TokenSelector"
export { SwapDetails } from "@terminal/components/SwapDetails"
export { TokenIcon } from "@terminal/components/ui/token-icon"

// Hooks
export { useSwapQuote } from "@terminal/hooks/useSwapQuote"
export { useSwap } from "@terminal/hooks/useSwap"
export { useTokenApproval } from "@terminal/hooks/useTokenApproval"
export { useWrapUnwrap } from "@terminal/hooks/useWrapUnwrap"
export { useTokenBalance } from "@terminal/hooks/useTokenBalance"

// Config / tokens
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

// Utilities
export { isWrapOrUnwrap, isWrapOperation, isUnwrapOperation } from "@terminal/utils/swap"
export { formatAmount, formatUSD, truncateAddress, sanitizeAmount } from "@terminal/utils/format"
