"use client"

import { useState } from "react"
import { ZentraTerminal } from "@terminal/components/ZentraTerminal"
import { ZentraLogoAnimated } from "@terminal/components/zentraFi-logo-animated"
import type { DisplayMode, ThemeType, TerminalTheme, WidgetPosition } from "@terminal/types"
import { cn } from "@terminal/utils/cn"

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ""

// ── Default theme values ─────────────────────────────────────────────────────
const DEFAULT_DARK: Required<TerminalTheme> = {
  bg_primary: "#0d1117",
  primary: "#97CBDC",
  text_primary: "#FFFFFF",
  text_secondary: "#6b7280",
  success: "#4ade80",
  warning: "#fbbf24",
  error: "#f87171",
  btn_text: "#000000",
  bg_overlay: "rgba(0,0,0,0.65)",
  border: "rgba(255,255,255,0.1)",
}

const DEFAULT_LIGHT: Required<TerminalTheme> = {
  bg_primary: "#ffffff",
  primary: "#0ea5c9",
  text_primary: "#111827",
  text_secondary: "#6b7280",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
  btn_text: "#ffffff",
  bg_overlay: "rgba(0,0,0,0.4)",
  border: "rgba(0,0,0,0.1)",
}

// ── Slippage presets ──────────────────────────────────────────────────────────
const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0] // percent

export function DemoPage() {
  const [mode, setMode] = useState<DisplayMode>("Integrated")
  const [themeType, setThemeType] = useState<ThemeType>("Dark")
  const [themeColors, setThemeColors] = useState<Required<TerminalTheme>>(DEFAULT_DARK)
  const [slippage, setSlippage] = useState(0.5)
  const [independentWallet, setIndependentWallet] = useState(true)
  const [widgetPosition, setWidgetPosition] = useState<WidgetPosition>("bottom-right")
  const [logoUrl, setLogoUrl] = useState("")
  const [showBranding, setShowBranding] = useState(true)
  const [activeColorKey, setActiveColorKey] = useState<keyof Required<TerminalTheme>>("primary")
  const [copied, setCopied] = useState(false)

  // Sync theme defaults when themeType changes
  const handleThemeTypeChange = (t: ThemeType) => {
    setThemeType(t)
    setThemeColors(t === "Dark" ? DEFAULT_DARK : DEFAULT_LIGHT)
  }

  const updateColor = (key: keyof Required<TerminalTheme>, value: string) => {
    setThemeColors((prev) => ({ ...prev, [key]: value }))
  }

  // ── Code snippet ────────────────────────────────────────────────────────────
  const npmSnippet = `import { ZentraTerminal } from '@zentrafi/terminal'
import '@zentrafi/terminal/dist/style.css'

<ZentraTerminal initProps={{
  displayMode: "${mode}",
  themeType: "${themeType}",
  theme: ${JSON.stringify(themeColors, null, 4).replace(/"/g, '"')},
  independentWallet: ${independentWallet},
  initialSlippage: ${slippage},${logoUrl ? `\n  logoUrl: "${logoUrl}",` : ""}
  walletConnectProjectId: "YOUR_PROJECT_ID",
}} />`

  const htmlSnippet = `<!-- In your <head> -->
<link rel="stylesheet" href="https://cdn.zentrafi.xyz/terminal/style.css">
<script src="https://cdn.zentrafi.xyz/terminal/main.js"></script>

<!-- In your <body> -->
<div id="zentra-terminal"></div>
<script>
  window.ZentraX.init({
    containerId: "zentra-terminal",
    displayMode: "${mode}",
    themeType: "${themeType}",
    theme: ${JSON.stringify(themeColors, null, 6)},
    independentWallet: ${independentWallet},
    initialSlippage: ${slippage},
    walletConnectProjectId: "YOUR_PROJECT_ID",
  })
</script>`

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const colorFields: Array<{ key: keyof Required<TerminalTheme>; label: string }> = [
    { key: "bg_primary", label: "Panel BG" },
    { key: "primary", label: "Primary Color" },
    { key: "text_primary", label: "Primary Text" },
    { key: "text_secondary", label: "Secondary Text" },
    { key: "success", label: "Positive Text" },
    { key: "warning", label: "Warning Text" },
    { key: "error", label: "Error Text" },
    { key: "btn_text", label: "Button Text" },
  ]

  return (
    <div className="min-h-screen bg-[#060910] text-white">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060910]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
         <ZentraLogoAnimated showTagline={false}   />
        {/* <div className="flex items-center gap-3">
          <div>
          </div>
        </div> */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Zentra-Finance/zentrafi-terminal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://x.zentrafi.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#97CBDC]/10 border border-[#97CBDC]/20 text-[#97CBDC] text-xs font-medium hover:bg-[#97CBDC]/20 transition-colors"
          >
            Launch App
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-16">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="text-center flex flex-col items-center gap-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#97CBDC]/10 border border-[#97CBDC]/20 text-[#97CBDC] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#97CBDC] animate-pulse" />
            Pharos Atlantic Testnet
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Embeddable <span className="text-[#97CBDC]">Swap Terminal</span>
            <br />for ZentraFi
          </h1>
          <p className="text-white/50 text-lg max-w-2xl">
            Drop a fully functional DEX swap interface into any dApp in minutes.
            Three display modes, fully themeable, zero-config wallet integration.
          </p>

          {/* Install snippet */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-mono">
            <span className="text-white/30">$</span>
            <span className="text-white/80">npm install @zentrafi/terminal</span>
            <button
              onClick={() => copySnippet("npm install @zentrafi/terminal")}
              className="ml-2 text-white/30 hover:text-white transition-colors text-xs"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </section>

        {/* ── Main demo area ────────────────────────────────────────────── */}
        <section className="flex flex-col lg:flex-row gap-6">

          {/* Left: config panel */}
          <div className="flex flex-col gap-5 w-full lg:w-80 shrink-0">

            {/* Display Mode */}
            <ConfigCard title="Display Mode">
              <div className="flex flex-col gap-1.5">
                {(["Integrated", "Modal", "Widget"] as DisplayMode[]).map((m) => (
                  <ModeButton
                    key={m}
                    active={mode === m}
                    onClick={() => setMode(m)}
                    label={m}
                    desc={
                      m === "Integrated"
                        ? "Renders inline in your page"
                        : m === "Modal"
                        ? "Full-screen overlay dialog"
                        : "Floating corner button + panel"
                    }
                  />
                ))}
              </div>
            </ConfigCard>

            {/* Theme */}
            <ConfigCard title="Theme">
              <div className="flex gap-2 mb-3">
                {(["Dark", "Light"] as ThemeType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleThemeTypeChange(t)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all border",
                      themeType === t
                        ? "bg-[#97CBDC]/20 text-[#97CBDC] border-[#97CBDC]/40"
                        : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {colorFields.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs font-mono">{themeColors[key]}</span>
                      <label className="cursor-pointer">
                        <div
                          className="w-6 h-6 rounded-md border border-white/20 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                          style={{ background: themeColors[key] }}
                        />
                        <input
                          type="color"
                          value={themeColors[key].startsWith("#") ? themeColors[key] : "#97cbdc"}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </ConfigCard>

            {/* Slippage */}
            <ConfigCard title="Initial Slippage">
              <div className="flex gap-2">
                {SLIPPAGE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlippage(s)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      slippage === s
                        ? "bg-[#97CBDC]/20 text-[#97CBDC] border-[#97CBDC]/40"
                        : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </ConfigCard>

            {/* Wallet */}
            <ConfigCard title="Independent Wallet">
              <div className="flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => setIndependentWallet(v)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      independentWallet === v
                        ? "bg-[#97CBDC]/20 text-[#97CBDC] border-[#97CBDC]/40"
                        : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
              <p className="text-white/30 text-[11px] mt-2">
                {independentWallet
                  ? "Terminal manages its own wallet connection"
                  : "Follows your dApp's wallet connection"}
              </p>
            </ConfigCard>

            {/* Widget position */}
            {mode === "Widget" && (
              <ConfigCard title="Widget Position">
                <div className="grid grid-cols-2 gap-2">
                  {(["bottom-right", "bottom-left", "top-right", "top-left"] as WidgetPosition[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setWidgetPosition(p)}
                      className={cn(
                        "py-1.5 rounded-lg text-xs font-medium transition-all border",
                        widgetPosition === p
                          ? "bg-[#97CBDC]/20 text-[#97CBDC] border-[#97CBDC]/40"
                          : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                      )}
                    >
                      {p.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </ConfigCard>
            )}

            {/* Branding */}
            <ConfigCard title="Options">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-white/60 text-xs">Show "Powered by ZentraFi"</span>
                <div
                  onClick={() => setShowBranding(!showBranding)}
                  className={cn(
                    "w-9 h-5 rounded-full border transition-all",
                    showBranding
                      ? "bg-[#97CBDC]/30 border-[#97CBDC]/40"
                      : "bg-white/10 border-white/20"
                  )}
                >
                  <div className={cn(
                    "w-3.5 h-3.5 rounded-full mt-[3px] transition-all",
                    showBranding ? "ml-[18px] bg-[#97CBDC]" : "ml-[3px] bg-white/40"
                  )} />
                </div>
              </label>
            </ConfigCard>

            {/* Custom logo */}
            <ConfigCard title="Custom Logo">
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Enter logo URL"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/30 outline-none focus:border-[#97CBDC]/40"
              />
            </ConfigCard>
          </div>

          {/* Right: live preview + code */}
          <div className="flex-1 flex flex-col gap-6">

            {/* Live preview */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  Live Preview — <span className="text-[#97CBDC]">{mode}</span>
                </span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
              </div>

              <div
                className="p-8 flex items-center justify-center min-h-[480px] relative"
                style={{
                  background:
                    themeType === "Light"
                      ? "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
                      : "linear-gradient(135deg, #0d1117 0%, #0a0f1a 100%)",
                }}
              >
                {mode === "Integrated" && (
                  <div className="w-full max-w-sm">
                    <ZentraTerminal
                      initProps={{
                        displayMode: "Integrated",
                        themeType,
                        theme: themeColors,
                        independentWallet,
                        initialSlippage: slippage,
                        showBranding,
                        logoUrl: logoUrl || undefined,
                        walletConnectProjectId: PROJECT_ID,
                      }}
                    />
                  </div>
                )}

                {mode === "Modal" && (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-white/40 text-sm">Click the button below to open the swap modal</p>
                    <ZentraTerminal
                      initProps={{
                        displayMode: "Modal",
                        themeType,
                        theme: themeColors,
                        independentWallet,
                        initialSlippage: slippage,
                        showBranding,
                        logoUrl: logoUrl || undefined,
                        walletConnectProjectId: PROJECT_ID,
                      }}
                    />
                  </div>
                )}

                {mode === "Widget" && (
                  <div className="flex flex-col items-center gap-4 relative w-full h-64">
                    <p className="text-white/40 text-sm">
                      Widget button appears in the <strong className="text-white/60">{widgetPosition}</strong> corner
                    </p>
                    <div className="relative w-full h-full rounded-xl border border-dashed border-white/10 overflow-hidden">
                      <ZentraTerminal
                        initProps={{
                          displayMode: "Widget",
                          themeType,
                          theme: themeColors,
                          independentWallet,
                          initialSlippage: slippage,
                          showBranding,
                          widgetPosition,
                          logoUrl: logoUrl || undefined,
                          walletConnectProjectId: PROJECT_ID,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Code snippets */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <CodeTabs npmSnippet={npmSnippet} htmlSnippet={htmlSnippet} />
            </div>
          </div>
        </section>

        {/* ── Feature grid ─────────────────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <h2 className="text-white/50 text-sm font-medium uppercase tracking-wider text-center">
            What&apos;s included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex flex-col gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#97CBDC]/10 flex items-center justify-center text-xl">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfigCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function ModeButton({
  active, onClick, label, desc,
}: {
  active: boolean
  onClick: () => void
  label: string
  desc: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl p-3 text-left transition-all border",
        active
          ? "bg-[#97CBDC]/10 border-[#97CBDC]/30"
          : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
      )}
    >
      <div className={cn(
        "w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5",
        active ? "bg-[#97CBDC]" : "bg-white/20"
      )} />
      <div>
        <p className={cn("text-sm font-medium", active ? "text-[#97CBDC]" : "text-white/70")}>{label}</p>
        <p className="text-white/30 text-xs mt-0.5">{desc}</p>
      </div>
    </button>
  )
}

function CodeTabs({ npmSnippet, htmlSnippet }: { npmSnippet: string; htmlSnippet: string }) {
  const [tab, setTab] = useState<"npm" | "html">("npm")
  const [copied, setCopied] = useState(false)

  const code = tab === "npm" ? npmSnippet : htmlSnippet

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex gap-1">
          {(["npm", "html"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                tab === t
                  ? "bg-[#97CBDC]/20 text-[#97CBDC]"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {t === "npm" ? "NPM / React" : "HTML / Script Tag"}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
        >
          {copied ? (
            <span className="text-[#97CBDC]">Copied!</span>
          ) : (
            "Copy"
          )}
        </button>
      </div>
      <pre className="p-5 text-xs text-white/70 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </>
  )
}

// ── Feature list ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🔳",
    title: "3 Display Modes",
    desc: "Integrated inline, floating Widget, or full-screen Modal — fits any page layout.",
  },
  {
    icon: "🎨",
    title: "Fully Themeable",
    desc: "Dark/Light presets plus per-color overrides via CSS variables. No Tailwind required.",
  },
  {
    icon: "⚡",
    title: "DLMM Routing",
    desc: "Real-time quotes via ZentraFi's Liquidity Book pools. Auto price-impact warnings.",
  },
  {
    icon: "🔐",
    title: "Independent Wallet",
    desc: "Manages its own wallet connection or follows your dApp's existing wagmi context.",
  },
  {
    icon: "🌐",
    title: "Script Tag Support",
    desc: "window.ZentraX.init() for non-React frameworks: Vue, Svelte, vanilla JS.",
  },
  {
    icon: "🔄",
    title: "Wrap / Unwrap",
    desc: "1:1 PHRS ↔ WPHRS handled automatically. No extra config needed.",
  },
]
