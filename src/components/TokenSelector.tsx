"use client"

import { useState } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { TokenIcon } from "@terminal/components/ui/token-icon"
import { cn } from "@terminal/utils/cn"
import type { TokenConfig } from "@terminal/config/tokens"

interface TokenSelectorProps {
  selected: TokenConfig | null
  tokens: TokenConfig[]
  disabledAddress?: string
  onSelect: (token: TokenConfig) => void
  className?: string
}

export function TokenSelector({ selected, tokens, disabledAddress, onSelect, className }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = tokens.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 hover:bg-white/10 transition-colors",
          className
        )}
      >
        {selected ? (
          <>
            <TokenIcon src={selected.icon} symbol={selected.symbol} size={22} />
            <span className="font-semibold text-white text-sm">{selected.symbol}</span>
          </>
        ) : (
          <span className="text-white/50 text-sm">Select token</span>
        )}
        <ChevronDown className="w-4 h-4 text-white/50 ml-1" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Modal */}
          <div className="relative w-full max-w-sm bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Select Token</h3>
              <button
                onClick={() => { setOpen(false); setSearch("") }}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-white/40 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or address"
                className="bg-transparent text-sm text-white placeholder-white/30 outline-none w-full"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-white/40 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Token list */}
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1 -mr-1">
              {filtered.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">No tokens found</p>
              ) : (
                filtered.map((token) => {
                  const isDisabled = token.address.toLowerCase() === disabledAddress?.toLowerCase()
                  return (
                    <button
                      key={token.address}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        onSelect(token)
                        setOpen(false)
                        setSearch("")
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-left",
                        isDisabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-white/5 cursor-pointer"
                      )}
                    >
                      <TokenIcon src={token.icon} symbol={token.symbol} size={36} />
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{token.symbol}</span>
                        <span className="text-white/50 text-xs">{token.name}</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
