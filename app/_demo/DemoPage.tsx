"use client"

import { useState, useEffect, useRef } from "react"
import { ZentraTerminal } from "@terminal/components/ZentraTerminal"
import { ZentraLogoAnimated } from "@terminal/components/zentraFi-logo-animated"
import type { DisplayMode, ThemeType, TerminalTheme, WidgetPosition, WidgetSize } from "@terminal/types"
import { cn } from "@terminal/utils/cn"

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "your_project_id_here"

// ── Default theme values ──────────────────────────────────────────────────────
const DEFAULT_DARK: Required<TerminalTheme> = {
  bg_primary:   "#0a0f1a",
  primary:      "#97CBDC",
  text_primary: "#FFFFFF",
  text_secondary:"#6b7280",
  success:      "#4ade80",
  warning:      "#fbbf24",
  error:        "#f87171",
  btn_text:     "#0a0f1a",
  bg_overlay:   "rgba(10,15,26,0.85)",
  border:       "#475B74",
}

const DEFAULT_LIGHT: Required<TerminalTheme> = {
  bg_primary:   "#ffffff",
  primary:      "#0ea5c9",
  text_primary: "#111827",
  text_secondary:"#6b7280",
  success:      "#16a34a",
  warning:      "#d97706",
  error:        "#dc2626",
  btn_text:     "#ffffff",
  bg_overlay:   "rgba(0,0,0,0.4)",
  border:       "rgba(0,0,0,0.1)",
}

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0]

// ── Syntax tokenizer ──────────────────────────────────────────────────────────
type TKind = "kw" | "str" | "cmt" | "tag" | "num" | "br" | "plain"
type Tok = { k: TKind; v: string }

const KWSET = new Set([
  "import","from","export","default","const","let","var","function","return",
  "async","await","type","interface","true","false","null","undefined","new","class",
])

const SYN: Record<TKind, string> = {
  kw:    "#c084fc",
  str:   "#fbbf24",
  cmt:   "#6b7280",
  tag:   "#97CBDC",
  num:   "#fb923c",
  br:    "#94a3b8",
  plain: "#e2e8f0",
}

function tokenizeLine(line: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < line.length) {
    if (line.startsWith("//", i)) { out.push({ k: "cmt", v: line.slice(i) }); break }
    if (line.startsWith("<!--", i)) {
      const e = line.indexOf("-->", i + 4)
      const v = e < 0 ? line.slice(i) : line.slice(i, e + 3)
      out.push({ k: "cmt", v }); i += v.length; continue
    }
    if (line[i] === "`") {
      let j = i + 1
      while (j < line.length && line[j] !== "`") { if (line[j] === "\\") j++; j++ }
      out.push({ k: "str", v: line.slice(i, Math.min(j + 1, line.length)) })
      i = Math.min(j + 1, line.length); continue
    }
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i]; let j = i + 1
      while (j < line.length && line[j] !== q) { if (line[j] === "\\") j++; j++ }
      out.push({ k: "str", v: line.slice(i, j + 1) }); i = j + 1; continue
    }
    if (line[i] === "<" && (line[i + 1] === "/" || /[a-zA-Z!]/.test(line[i + 1] || ""))) {
      let j = i + 1
      if (line[j] === "/" || line[j] === "!") j++
      while (j < line.length && /[a-zA-Z0-9.-]/.test(line[j])) j++
      out.push({ k: "tag", v: line.slice(i, j) }); i = j; continue
    }
    if (line[i] === ">" || (line[i] === "/" && line[i + 1] === ">")) {
      const v = line[i] === "/" ? "/>" : ">"
      out.push({ k: "tag", v }); i += v.length; continue
    }
    if (/\d/.test(line[i])) {
      let j = i + 1
      while (j < line.length && /[\d.]/.test(line[j])) j++
      out.push({ k: "num", v: line.slice(i, j) }); i = j; continue
    }
    if (/[a-zA-Z_$@]/.test(line[i])) {
      let j = i + 1
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++
      const w = line.slice(i, j)
      out.push({ k: KWSET.has(w) ? "kw" : "plain", v: w }); i = j; continue
    }
    if ("{}[]()".includes(line[i])) { out.push({ k: "br", v: line[i] }); i++; continue }
    out.push({ k: "plain", v: line[i] }); i++
  }
  return out
}

function CodeBlock({ code }: { code: string }) {
  const lines = code.split("\n")
  return (
    <div className="flex text-xs font-mono leading-[1.75]">
      {/* Line numbers */}
      <div className="select-none text-right pr-4 pl-3 border-r border-white/[0.06] text-white/20 min-w-[3rem] shrink-0">
        {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
      </div>
      {/* Highlighted code */}
      <div className="pl-4 overflow-x-auto flex-1 scrollbar-hide">
        {lines.map((line, i) => (
          <div key={i} className="min-w-max whitespace-pre">
            {line.length === 0
              ? <span>&nbsp;</span>
              : tokenizeLine(line).map((t, j) => (
                  <span key={j} style={{ color: SYN[t.k] }}>{t.v}</span>
                ))
            }
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function DemoPage() {
  const [mode, setMode] = useState<DisplayMode>("Integrated")
  const [themeType, setThemeType] = useState<ThemeType>("Dark")
  const [themeColors, setThemeColors] = useState<Required<TerminalTheme>>(DEFAULT_DARK)
  const [slippage, setSlippage] = useState(0.5)
  const [independentWallet, setIndependentWallet] = useState(true)
  const [widgetPosition, setWidgetPosition] = useState<WidgetPosition>("bottom-right")
  const [widgetSize, setWidgetSize] = useState<WidgetSize>("default")
  const [logoUrl, setLogoUrl] = useState("")
  const [showBranding, setShowBranding] = useState(true)

  const handleThemeTypeChange = (t: ThemeType) => {
    setThemeType(t)
    setThemeColors(t === "Dark" ? DEFAULT_DARK : DEFAULT_LIGHT)
  }

  const updateColor = (key: keyof Required<TerminalTheme>, value: string) => {
    setThemeColors((prev) => ({ ...prev, [key]: value }))
  }

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

  const colorFields: Array<{ key: keyof Required<TerminalTheme>; label: string }> = [
    { key: "bg_primary",    label: "Panel BG" },
    { key: "primary",       label: "Primary" },
    { key: "text_primary",  label: "Primary Text" },
    { key: "text_secondary",label: "Muted Text" },
    { key: "success",       label: "Success" },
    { key: "warning",       label: "Warning" },
    { key: "error",         label: "Error" },
    { key: "btn_text",      label: "Button Text" },
  ]

  return (
    <div className="min-h-screen bg-[#060910] text-white relative overflow-x-hidden">

      {/* ── Animated ambient background ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {/* Dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle, rgba(151,203,220,0.055) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        {/* Orb 1 — top-left, primary cyan */}
        <div className="animate-orb-1 absolute -top-64 -left-64 w-[720px] h-[720px] rounded-full" style={{
          background: "radial-gradient(circle, rgba(151,203,220,0.11) 0%, transparent 65%)",
        }} />
        {/* Orb 2 — bottom-right, deep blue */}
        <div className="animate-orb-2 absolute -bottom-64 -right-64 w-[820px] h-[820px] rounded-full" style={{
          background: "radial-gradient(circle, rgba(1,138,189,0.10) 0%, transparent 65%)",
        }} />
        {/* Orb 3 — center, navy accent */}
        <div className="animate-orb-3 absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full" style={{
          background: "radial-gradient(circle, rgba(0,69,129,0.07) 0%, transparent 60%)",
        }} />
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between"
        style={{ background: "rgba(6,9,16,0.75)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <ZentraLogoAnimated showTagline={false} />
        <div className="flex items-center gap-2">
          {/* Social icon links */}
          {[
            { href: "https://x.com/zentrafi", icon: <XIcon className="w-4 h-4" />, title: "X (Twitter)" },
            { href: "https://github.com/Zentra-Finance/zentrafi-terminal", icon: <GitHubIcon className="w-4 h-4" />, title: "GitHub" },
            { href: "https://t.me/zentrafi", icon: <TelegramIcon className="w-4 h-4" />, title: "Telegram" },
            { href: "https://discord.com/invite/rW7VJ8JjbC", icon: <DiscordIcon className="w-4 h-4" />, title: "Discord" },
          ].map(({ href, icon, title }) => (
            <a key={title} href={href} target="_blank" rel="noopener noreferrer" title={title}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 text-white/35 hover:text-white/80 hover:bg-white/[0.06]">
              {icon}
            </a>
          ))}
          <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />
          <a href="https://x.zentrafi.xyz" target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #97CBDC 0%, #018ABD 100%)", color: "#0a0f1a" }}>
            Launch App
          </a>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center gap-2 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono" style={{
              background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.65) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              minWidth: "18ch",
            }}>
              <AnimatedTitle />
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest self-start mt-1"
              style={{ background: "rgba(151,203,220,0.12)", border: "1px solid rgba(151,203,220,0.28)", color: "#97CBDC" }}>
              beta
            </span>
          </div>
          <p className="text-white/45 text-sm max-w-xl leading-relaxed">
            A lite version of ZentraFi Swap Aggregator that can be embedded into your own dApp.
            Configure your demo below and complete your integration in minutes.
          </p>
        </section>

        {/* ── Main demo area ─────────────────────────────────────────────────── */}
        <section className="flex flex-col lg:flex-row gap-5">

          {/* ── Left: config panel ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 w-full lg:w-72 xl:w-80 shrink-0">

            {/* Display Mode */}
            <GlassCard title="Display Mode">
              <div className="flex flex-col gap-1.5">
                {(["Integrated", "Modal", "Widget"] as DisplayMode[]).map((m) => (
                  <ModeButton key={m} active={mode === m} onClick={() => setMode(m)} label={m}
                    desc={m === "Integrated" ? "Renders inline in your page" : m === "Modal" ? "Full-screen overlay dialog" : "Floating corner button + panel"} />
                ))}
              </div>
            </GlassCard>

            {/* Theme */}
            <GlassCard title="Theme">
              <div className="flex gap-1.5 mb-3">
                {(["Dark", "Light"] as ThemeType[]).map((t) => (
                  <button key={t} onClick={() => handleThemeTypeChange(t)}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
                      themeType === t
                        ? "bg-[#97CBDC]/12 text-[#97CBDC] border-[#97CBDC]/35"
                        : "bg-white/[0.04] text-white/40 border-white/[0.07] hover:bg-white/[0.07]")}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {colorFields.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between group">
                    <span className="text-white/45 text-[11px]">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/25 text-[10px] font-mono truncate max-w-[76px]">{themeColors[key]}</span>
                      <label className="cursor-pointer">
                        <div className="w-5 h-5 rounded-md cursor-pointer hover:scale-110 transition-transform"
                          style={{ background: themeColors[key], boxShadow: `0 0 0 1px rgba(255,255,255,0.15)` }} />
                        <input type="color"
                          value={themeColors[key].startsWith("#") ? themeColors[key] : "#97cbdc"}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="sr-only" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Slippage */}
            <GlassCard title="Initial Slippage">
              <div className="flex gap-1.5">
                {SLIPPAGE_OPTIONS.map((s) => (
                  <button key={s} onClick={() => setSlippage(s)}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
                      slippage === s
                        ? "bg-[#97CBDC]/12 text-[#97CBDC] border-[#97CBDC]/35"
                        : "bg-white/[0.04] text-white/40 border-white/[0.07] hover:bg-white/[0.07]")}>
                    {s}%
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Wallet */}
            <GlassCard title="Wallet Mode">
              <div className="flex gap-1.5">
                {[true, false].map((v) => (
                  <button key={String(v)} onClick={() => setIndependentWallet(v)}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
                      independentWallet === v
                        ? "bg-[#97CBDC]/12 text-[#97CBDC] border-[#97CBDC]/35"
                        : "bg-white/[0.04] text-white/40 border-white/[0.07] hover:bg-white/[0.07]")}>
                    {v ? "Independent" : "Host dApp"}
                  </button>
                ))}
              </div>
              <p className="text-white/25 text-[10px] mt-1">
                {independentWallet ? "Terminal manages its own wallet" : "Follows your dApp's wagmi context"}
              </p>
            </GlassCard>

            {/* Widget size */}
            {mode === "Widget" && (
              <GlassCard title="Set Size">
                <div className="flex gap-1.5">
                  {(["small", "default"] as WidgetSize[]).map((s) => (
                    <button key={s} onClick={() => setWidgetSize(s)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 border",
                        widgetSize === s
                          ? "bg-[#97CBDC]/12 text-[#97CBDC] border-[#97CBDC]/35"
                          : "bg-white/[0.04] text-white/40 border-white/[0.07] hover:bg-white/[0.07]")}>
                      {s === "default" ? "Default" : "Small"}
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Options */}
            <GlassCard title="Options">
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white/50 text-xs">Show &quot;Powered by ZentraFi&quot;</span>
                  <Toggle on={showBranding} onToggle={() => setShowBranding(!showBranding)} />
                </label>
                <div>
                  <p className="text-white/35 text-[11px] mb-1.5">Custom Logo URL</p>
                  <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg px-3 py-2 text-white/80 text-xs placeholder-white/20 outline-none transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(151,203,220,0.35)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.07)")} />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* ── Right: preview + code ───────────────────────────────────────── */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Live preview window */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>

              {/* Window chrome */}
              <div className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-white/25 text-xs font-mono">preview · {mode.toLowerCase()}</span>
                </div>
                {/* Quick mode switcher in toolbar */}
                <div className="flex items-center gap-1">
                  {(["Integrated", "Modal", "Widget"] as DisplayMode[]).map((m) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={cn("px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 border",
                        mode === m
                          ? "bg-[#97CBDC]/12 text-[#97CBDC] border-[#97CBDC]/30"
                          : "text-white/25 border-transparent hover:text-white/50 hover:border-white/[0.08]")}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview canvas */}
              <div className="p-8 sm:p-12 flex items-center justify-center min-h-[500px] relative"
                style={{
                  background: themeType === "Light"
                    ? "linear-gradient(135deg, #f0f4f8 0%, #dde4ed 100%)"
                    : "linear-gradient(135deg, #0a0f1a 0%, #0c1526 100%)",
                }}>
                {/* Subtle inner grid */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }} />
                <div className="relative z-10 w-full flex items-center justify-center">
                  {mode === "Integrated" && (
                    <div className="w-full max-w-sm">
                      <ZentraTerminal initProps={{ displayMode: "Integrated", themeType, theme: themeColors, independentWallet, initialSlippage: slippage, showBranding, logoUrl: logoUrl || undefined, walletConnectProjectId: PROJECT_ID }} />
                    </div>
                  )}
                  {mode === "Modal" && (
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-white/30 text-xs text-center">
                        Click the logo to open the full-screen ZentraFi Swap Modal
                      </p>
                      <ZentraTerminal initProps={{ displayMode: "Modal", themeType, theme: themeColors, independentWallet, initialSlippage: slippage, showBranding, logoUrl: logoUrl || undefined, walletConnectProjectId: PROJECT_ID }} />
                    </div>
                  )}
                  {mode === "Widget" && (
                    <div className="relative w-full" style={{ minHeight: 300 }}>
                      {/* Instruction */}
                      <p className="text-white/25 text-[11px] text-center mb-4">
                        Click the arrows to position the widget · the live button is active on this page
                      </p>
                      {/* Arrow + corner selector box */}
                      <div className="relative w-full rounded-xl" style={{ height: 240, border: "1px dashed rgba(255,255,255,0.1)" }}>
                        {/* Corner arrows */}
                        <CornerArrow pos="top-left"     active={widgetPosition === "top-left"}     onClick={() => setWidgetPosition("top-left")} />
                        <CornerArrow pos="top-right"    active={widgetPosition === "top-right"}    onClick={() => setWidgetPosition("top-right")} />
                        <CornerArrow pos="bottom-left"  active={widgetPosition === "bottom-left"}  onClick={() => setWidgetPosition("bottom-left")} />
                        <CornerArrow pos="bottom-right" active={widgetPosition === "bottom-right"} onClick={() => setWidgetPosition("bottom-right")} />
                        {/* Static FAB preview at selected corner */}
                        <div className={cn("absolute w-14 h-14 rounded-full pointer-events-none overflow-hidden", {
                          "top-2 left-2": widgetPosition === "top-left",
                          "top-2 right-2": widgetPosition === "top-right",
                          "bottom-2 left-2": widgetPosition === "bottom-left",
                          "bottom-2 right-2": widgetPosition === "bottom-right",
                        })} style={{ boxShadow: "0 4px 20px rgba(151,203,220,0.35)", border: "2px solid rgba(151,203,220,0.5)" }}>
                          <img src={logoUrl || "/zentra-mascot.png"} alt="Widget preview" className="w-full h-full object-cover" />
                        </div>
                        {/* Center label */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-8">
                          <p className="text-white/25 text-xs text-center leading-relaxed">
                            Click on the arrows to see how the ZentraFi Widget will appear on your web browser.
                            <br />
                            Click on the live logo button on the page to open the swap.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Code block */}
            <CodeTabs npmSnippet={npmSnippet} htmlSnippet={htmlSnippet} />
          </div>
        </section>

        {/* ── Feature grid ───────────────────────────────────────────────────── */}
        {/* <section className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(151,203,220,0.18))" }} />
            <h2 className="text-white/35 text-[11px] font-semibold uppercase tracking-widest shrink-0">
              What&apos;s included
            </h2>
            <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(151,203,220,0.18))" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group relative rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-0.5 cursor-default"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(151,203,220,0.18)" }} />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: "rgba(151,203,220,0.08)", border: "1px solid rgba(151,203,220,0.12)" }}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-white/85 font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-white/35 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section> */}

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <footer className="pt-6 pb-2 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-white/22 text-xs">
            Built by{" "}
            <a href="https://x.zentrafi.xyz" target="_blank" rel="noopener noreferrer"
              className="text-[#97CBDC]/50 hover:text-[#97CBDC] transition-colors duration-200">
              ZentraFi
            </a>
            {" "}· Pharos EVM DEX Terminal
          </p>
        </footer>
      </div>

      {/* ── Widget renders at page level (position:fixed FAB, no transform) ─── */}
      {mode === "Widget" && (
        <ZentraTerminal initProps={{ displayMode: "Widget", themeType, theme: themeColors, independentWallet, initialSlippage: slippage, showBranding, widgetPosition, widgetSize, logoUrl: logoUrl || undefined, walletConnectProjectId: PROJECT_ID }} />
      )}
    </div>
  )
}

// ── Animated title ────────────────────────────────────────────────────────────

const HERO_TITLES = ["ZentraFi Terminal", "Swap Aggregator", "DeFi Gateway", "Pharos DEX Embed"]
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*"

function AnimatedTitle() {
  const [text, setText] = useState(HERO_TITLES[0])
  const idxRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const cycle = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % HERO_TITLES.length
      const target = HERO_TITLES[idxRef.current]
      let frame = 0
      const maxFrames = 20

      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        frame++
        if (frame >= maxFrames) {
          setText(target)
          clearInterval(timerRef.current!)
          return
        }
        const revealed = Math.floor((frame / maxFrames) * target.length)
        setText(
          target.split("").map((ch, i) =>
            ch === " " || i < revealed
              ? ch
              : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
          ).join("")
        )
      }, 45)
    }, 3200)

    return () => {
      clearInterval(cycle)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return <>{text}</>
}

// ── Social icon SVGs ──────────────────────────────────────────────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.73-8.835L1.254 2.25H8.08l4.261 5.635L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.082.11 18.104.128 18.12a19.893 19.893 0 0 0 5.993 3.03.077.077 0 0 0 .084-.026 13.865 13.865 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GlassCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(10px)" }}>
      <h3 className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  )
}

function ModeButton({ active, onClick, label, desc }: {
  active: boolean; onClick: () => void; label: string; desc: string
}) {
  return (
    <button onClick={onClick}
      className={cn("flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 border",
        active ? "border-[#97CBDC]/28" : "border-white/[0.06] hover:border-white/[0.11]")}
      style={active ? { background: "rgba(151,203,220,0.06)" } : { background: "rgba(255,255,255,0.02)" }}>
      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 transition-all duration-200",
        active ? "bg-[#97CBDC]" : "bg-white/15")}
        style={active ? { boxShadow: "0 0 8px rgba(151,203,220,0.6)" } : {}} />
      <div>
        <p className={cn("text-sm font-medium transition-colors duration-200", active ? "text-[#97CBDC]" : "text-white/55")}>
          {label}
        </p>
        <p className="text-white/25 text-[11px] mt-0.5">{desc}</p>
      </div>
    </button>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onToggle}
      className="relative w-9 h-5 rounded-full transition-all duration-300 shrink-0"
      style={{
        background: on ? "rgba(151,203,220,0.2)" : "rgba(255,255,255,0.07)",
        border: on ? "1px solid rgba(151,203,220,0.38)" : "1px solid rgba(255,255,255,0.12)",
      }}>
      <div className={cn("absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300",
        on ? "left-[18px]" : "left-0.5")}
        style={{ background: on ? "#97CBDC" : "rgba(255,255,255,0.3)" }} />
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
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(8,12,22,0.9)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1">
          {/* Mac dots */}
          <div className="flex gap-1.5 mr-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          {/* Tabs */}
          {(["npm", "html"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200",
                tab === t ? "bg-[#97CBDC]/12 text-[#97CBDC]" : "text-white/30 hover:text-white/55")}>
              {t === "npm" ? "NPM · React" : "Script Tag · HTML"}
            </button>
          ))}
        </div>
        {/* Copy button */}
        <button onClick={copy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: copied ? "#97CBDC" : "rgba(255,255,255,0.4)" }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code */}
      <div className="py-5">
        <CodeBlock code={code} />
      </div>
    </div>
  )
}

// ── Corner arrow for widget position selector ─────────────────────────────────
function CornerArrow({ pos, active, onClick }: {
  pos: WidgetPosition; active: boolean; onClick: () => void
}) {
  const posClass = {
    "top-left":     "top-2 left-2",
    "top-right":    "top-2 right-2",
    "bottom-left":  "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
  }[pos]

  // Arrow SVG pointing toward the corner
  const arrows: Record<WidgetPosition, string> = {
    "top-left":     "M14 14 L6 6 M6 6 h6 M6 6 v6",
    "top-right":    "M6 14 L14 6 M14 6 h-6 M14 6 v6",
    "bottom-left":  "M14 6 L6 14 M6 14 h6 M6 14 v-6",
    "bottom-right": "M6 6 L14 14 M14 14 h-6 M14 14 v-6",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("absolute p-1.5 rounded-lg transition-all duration-200 hover:scale-110", posClass,
        active ? "opacity-100" : "opacity-35 hover:opacity-70")}
      style={active ? { background: "rgba(151,203,220,0.15)", border: "1px solid rgba(151,203,220,0.4)" } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
      title={pos}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="2" strokeLinecap="round"
        stroke={active ? "#97CBDC" : "rgba(255,255,255,0.5)"}>
        <path d={arrows[pos]} />
      </svg>
    </button>
  )
}

// ── Feature list ──────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "🔳", title: "3 Display Modes",     desc: "Integrated inline, floating Widget, or full-screen Modal — fits any page layout." },
  { icon: "🎨", title: "Fully Themeable",     desc: "Dark/Light presets plus per-color overrides via CSS variables. No Tailwind required." },
  { icon: "⚡", title: "DLMM Routing",        desc: "Real-time quotes via ZentraFi's Liquidity Book pools. Auto price-impact warnings." },
  { icon: "🔐", title: "Independent Wallet",  desc: "Manages its own wallet connection or follows your dApp's existing wagmi context." },
  { icon: "🌐", title: "Script Tag Support",  desc: "window.ZentraX.init() for non-React frameworks: Vue, Svelte, vanilla JS." },
  { icon: "🔄", title: "Wrap / Unwrap",       desc: "1:1 PHRS ↔ WPHRS handled automatically. No extra config needed." },
]
