"use client"

import { useState } from "react"
import { ZentraTerminal, type DisplayMode } from "@terminal/components/ZentraTerminal"

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ""

export function DemoPage() {
  const [mode, setMode] = useState<DisplayMode>("integrated")

  return (
    <main className="min-h-screen bg-[#060910] text-white">
      {/* ── Nav ── */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#97CBDC] flex items-center justify-center text-black font-bold text-sm">
            Z
          </div>
          <span className="font-semibold text-white">@zentrafi/terminal</span>
          <span className="text-white/30 text-sm">— Demo</span>
        </div>
        <a
          href="https://github.com/Zentra-Finance/zentrafi-terminal"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          GitHub →
        </a>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col gap-16">
        {/* ── Hero ── */}
        <section className="text-center flex flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-[#97CBDC]">Embeddable</span> Swap Terminal
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Drop ZentraFi's swap interface into any dApp in three display modes — modal, floating widget, or inline.
          </p>

          {/* Mode picker */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {(["integrated", "modal", "widget"] as DisplayMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  mode === m
                    ? "bg-[#97CBDC]/20 text-[#97CBDC] border-[#97CBDC]/40"
                    : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* ── Live Demo ── */}
        <section className="flex flex-col gap-6">
          <div className="border-t border-white/10 pt-6">
            <h2 className="text-white/60 text-sm font-medium mb-6 uppercase tracking-wider">
              Live Demo — <span className="text-[#97CBDC]">{mode}</span> mode
            </h2>

            {mode === "integrated" && (
              <div className="flex justify-center">
                <div className="w-full max-w-sm">
                  <ZentraTerminal
                    mode="integrated"
                    walletConnectProjectId={PROJECT_ID}
                    appName="ZentraFi Terminal Demo"
                    showBranding
                  />
                </div>
              </div>
            )}

            {mode === "modal" && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-white/40 text-sm">Click the button below to open the swap modal.</p>
                <ZentraTerminal
                  mode="modal"
                  walletConnectProjectId={PROJECT_ID}
                  appName="ZentraFi Terminal Demo"
                  showBranding
                  trigger={
                    <button className="px-6 py-3 rounded-xl bg-[#97CBDC] text-black font-semibold hover:bg-[#97CBDC]/90 transition-colors">
                      Open Swap Modal
                    </button>
                  }
                />
              </div>
            )}

            {mode === "widget" && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-white/40 text-sm">
                  Look at the bottom-right corner for the floating swap button.
                </p>
                <ZentraTerminal
                  mode="widget"
                  walletConnectProjectId={PROJECT_ID}
                  appName="ZentraFi Terminal Demo"
                  floatPosition="bottom-right"
                  showBranding
                />
              </div>
            )}
          </div>
        </section>

        {/* ── Code snippet ── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider">Quick Start</h2>
          <pre className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/70 overflow-x-auto">
            <code>{`import { ZentraTerminal } from "@zentrafi/terminal"
import "@zentrafi/terminal/styles"

// Integrated (inline)
<ZentraTerminal
  mode="integrated"
  walletConnectProjectId="YOUR_PROJECT_ID"
/>

// Floating widget
<ZentraTerminal
  mode="widget"
  floatPosition="bottom-right"
  walletConnectProjectId="YOUR_PROJECT_ID"
/>

// Modal with custom trigger
<ZentraTerminal
  mode="modal"
  trigger={<button>Swap</button>}
  walletConnectProjectId="YOUR_PROJECT_ID"
/>`}</code>
          </pre>
        </section>

        {/* ── Features ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "🔗",
              title: "Three Display Modes",
              desc: "Modal, floating widget, or embedded inline — fits any layout.",
            },
            {
              icon: "⚡",
              title: "DLMM Routing",
              desc: "Real-time quotes via ZentraFi's Discretized Liquidity Market Maker pools.",
            },
            {
              icon: "🔐",
              title: "Full Wallet Support",
              desc: "MetaMask, OKX, Bitget, Coinbase, WalletConnect via RainbowKit.",
            },
            {
              icon: "🎨",
              title: "Minimal, Dark UI",
              desc: "Built with Tailwind CSS v4, fully customizable via className prop.",
            },
            {
              icon: "🔄",
              title: "Wrap / Unwrap",
              desc: "1:1 PHRS ↔ WPHRS operations handled automatically.",
            },
            {
              icon: "📦",
              title: "Zero Config",
              desc: "Batteries included — wagmi, RainbowKit, and TanStack Query are bundled.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="text-white font-medium text-sm">{f.title}</h3>
              <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
