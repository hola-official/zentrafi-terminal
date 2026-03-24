"use client"

import { memo, useState } from "react"
import { Settings, X, AlertTriangle } from "lucide-react"

const SLIPPAGE_PRESETS = [10, 50, 100] // bps

export interface SettingsPanelProps {
  slippageBps: number
  onSave: (bps: number) => void
  onClose: () => void
}

export const SettingsPanel = memo(function SettingsPanel({ slippageBps, onSave, onClose }: SettingsPanelProps) {
  const [localBps, setLocalBps] = useState(slippageBps)
  const [custom, setCustom] = useState("")

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base" style={{ color: "var(--zt-text)" }}>Settings</span>
        <button type="button" onClick={onClose}
          className="transition-opacity hover:opacity-70 cursor-pointer"
          style={{ color: "var(--zt-text-50)" }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Slippage */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" style={{ color: "var(--zt-text-60)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--zt-text-70)" }}>
            Slippage Tolerance
          </span>
        </div>
        <div className="flex gap-2">
          {SLIPPAGE_PRESETS.map(bps => {
            const active = localBps === bps && !custom
            return (
              <button key={bps} type="button"
                onClick={() => { setLocalBps(bps); setCustom("") }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer hover:opacity-90"
                style={active
                  ? { background: "var(--zt-primary-gradient)", color: "var(--zt-btn-text)" }
                  : { background: "var(--zt-text-8)", color: "var(--zt-text-50)", border: "1px solid var(--zt-border)" }
                }>
                {bps / 100}%
              </button>
            )
          })}
          {/* Custom */}
          <div className="flex-1 flex items-center gap-1 rounded-xl px-2 py-1.5 transition-all"
            style={custom
              ? { background: "var(--zt-primary-10)", border: "1px solid var(--zt-primary-40)" }
              : { background: "var(--zt-text-8)", border: "1px solid var(--zt-border)" }
            }>
            <input
              type="number" min="0.01" max="50" step="0.1"
              value={custom}
              onChange={e => {
                setCustom(e.target.value)
                const n = parseFloat(e.target.value)
                if (!isNaN(n) && n > 0 && n <= 50) setLocalBps(Math.round(n * 100))
              }}
              placeholder="Custom"
              className="bg-transparent text-xs w-full outline-none"
              style={{ color: "var(--zt-text)" }}
            />
            <span className="text-xs shrink-0" style={{ color: "var(--zt-text-40)" }}>%</span>
          </div>
        </div>
        {localBps > 200 && (
          <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--zt-warning)" }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            High slippage — your trade may be frontrun
          </p>
        )}
      </div>

      <div className="h-px" style={{ background: "var(--zt-border)" }} />

      {/* Save */}
      <button type="button"
        onClick={() => { onSave(localBps); onClose() }}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 cursor-pointer"
        style={{ background: "var(--zt-primary-gradient)", color: "var(--zt-btn-text)" }}>
        Save
      </button>
    </div>
  )
})
