// ── Theme ────────────────────────────────────────────────────────────────────

export interface TerminalTheme {
  /** Panel/card background */
  bg_primary?: string
  /** Accent / brand color (buttons, highlights) */
  primary?: string
  /** Main text */
  text_primary?: string
  /** Muted / secondary text */
  text_secondary?: string
  /** Positive states (success toasts, green prices) */
  success?: string
  /** Warning states */
  warning?: string
  /** Error states */
  error?: string
  /** Text on primary-colored buttons */
  btn_text?: string
  /** Outer page background (for modal overlay) */
  bg_overlay?: string
  /** Border color */
  border?: string
}

export type ThemeType = "Dark" | "Light"

// ── Display mode ─────────────────────────────────────────────────────────────

export type DisplayMode = "Integrated" | "Modal" | "Widget"

export type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left"

export type WidgetSize = "small" | "default"

// ── Token pair ────────────────────────────────────────────────────────────────

export interface DefaultPair {
  /** Token symbol (e.g. "PHRS") or address (e.g. "NATIVE" / "0x...") */
  from: string
  to: string
}

// ── RPC ───────────────────────────────────────────────────────────────────────

export interface RpcConfig {
  url: string
  label?: string
}

// ── Main init props (mirrors Cetus Terminal API) ──────────────────────────────

export interface ZentraTerminalInitProps {
  /** How the terminal is rendered */
  displayMode?: DisplayMode

  /** Color scheme preset */
  themeType?: ThemeType

  /** Fine-grained theme overrides (applied on top of themeType preset) */
  theme?: TerminalTheme

  /** Whether the terminal manages its own wallet connection */
  independentWallet?: boolean

  /** Default token pair shown on load */
  defaultPair?: DefaultPair

  /** Initial slippage tolerance in percent (e.g. 0.5 = 0.5%) */
  initialSlippage?: number

  /** WalletConnect / Reown project ID */
  walletConnectProjectId?: string

  /** App name shown in wallet connection dialogs */
  appName?: string

  /** Floating widget corner position (Widget mode only) */
  widgetPosition?: WidgetPosition

  /** Floating panel size (Widget mode only) */
  widgetSize?: WidgetSize

  /** Show "Powered by ZentraFi" branding */
  showBranding?: boolean

  /** Custom logo URL to replace the default Z icon */
  logoUrl?: string

  /** Callback fired after a successful swap/wrap/unwrap */
  onSwapSuccess?: (txHash: string) => void

  /** Callback fired when a swap/approval fails (after user rejects or tx reverts) */
  onError?: (error: Error) => void

  /** Override toast notifications — lets the host app route toasts through its own system */
  onToast?: (opts: { title: string; description?: string; variant?: "default" | "success" | "info" | "error" }) => void

  /** Additional RPCs to add to the network config */
  rpcUrls?: RpcConfig[]
}

// ── HTML / vanilla JS ─────────────────────────────────────────────────────────

export interface ZentraXInitOptions extends ZentraTerminalInitProps {
  /** DOM container ID to render into */
  containerId: string
}

// ── Window global (for vanilla JS / script tag usage) ─────────────────────────

declare global {
  interface Window {
    ZentraX: {
      init: (options: ZentraXInitOptions) => void
      /** Re-render an existing instance with merged options (no remount) */
      update: (containerId: string, options: Partial<ZentraTerminalInitProps>) => void
      destroy: (containerId?: string) => void
    }
  }
}
