"use client"

import { memo, useMemo, useState } from "react"
import { usePublicClient } from "wagmi"
import {
  ChevronLeft, Copy, Check,
  Search, Star, X, AlertTriangle, Plus, Loader2,
} from "lucide-react"
import { TokenIcon } from "@terminal/components/ui/token-icon"
import { ERC20_ABI } from "@terminal/config/contracts"
import { type TokenConfig } from "@terminal/config/tokens"
import { useFavoriteTokens, useImportedTokens } from "@terminal/hooks/useTokenStorage"
import { cn } from "@terminal/utils/cn"

export interface TokenListPanelProps {
  tokens: TokenConfig[]
  chainId: number
  disabledAddress?: string
  onSelect: (t: TokenConfig) => void
  onBack: () => void
}

export const TokenListPanel = memo(function TokenListPanel({
  tokens,
  chainId,
  disabledAddress,
  onSelect,
  onBack,
}: TokenListPanelProps) {
  const publicClient = usePublicClient({ chainId })
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"default" | "imported">("default")
  const [copied, setCopied] = useState<string | null>(null)
  const [favorites, setFavorites] = useFavoriteTokens()
  const [importedTokens, setImportedTokens] = useImportedTokens(chainId)
  const [importAddr, setImportAddr] = useState("")
  const [importPreview, setImportPreview] = useState<TokenConfig | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const lookupToken = async (addr: string) => {
    if (!publicClient || !addr.startsWith("0x") || addr.length !== 42) {
      setImportError("Enter a valid contract address (0x...)")
      return
    }
    const already = [...tokens, ...importedTokens].find(
      t => t.address.toLowerCase() === addr.toLowerCase()
    )
    if (already) { setImportError("Token already in list"); return }

    setImportLoading(true)
    setImportError(null)
    setImportPreview(null)
    try {
      const [symbol, name, decimals] = await Promise.all([
        publicClient.readContract({ address: addr as `0x${string}`, abi: ERC20_ABI, functionName: "symbol" }) as Promise<string>,
        publicClient.readContract({ address: addr as `0x${string}`, abi: ERC20_ABI, functionName: "name" }) as Promise<string>,
        publicClient.readContract({ address: addr as `0x${string}`, abi: ERC20_ABI, functionName: "decimals" }) as Promise<number>,
      ])
      setImportPreview({ symbol, name, address: addr, decimals, icon: "", chainId })
    } catch {
      setImportError("Could not fetch token — check address and network")
    } finally {
      setImportLoading(false)
    }
  }

  const confirmImport = () => {
    if (!importPreview) return
    setImportedTokens(prev => [...prev, importPreview])
    setImportAddr("")
    setImportPreview(null)
    setImportError(null)
  }

  const removeImported = (addr: string) => {
    setImportedTokens(prev => prev.filter(t => t.address.toLowerCase() !== addr.toLowerCase()))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tokens.filter(t =>
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
    )
  }, [tokens, search])

  const isFav = (addr: string) => favorites.includes(addr.toLowerCase())
  const toggleFav = (addr: string) => setFavorites(prev =>
    isFav(addr) ? prev.filter(a => a !== addr.toLowerCase()) : [...prev, addr.toLowerCase()]
  )

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(addr)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  const formatAddr = (addr: string) =>
    addr === "NATIVE" ? "Native" : `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div className="flex flex-col h-full" style={{ color: "var(--zt-text)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70 cursor-pointer"
          style={{ color: "var(--zt-text-60)" }}>
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="flex-1 text-center font-semibold text-sm" style={{ color: "var(--zt-text)" }}>
          Select Token
        </span>
        <div className="w-12" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3"
        style={{ background: "var(--zt-text-8)", border: "1px solid var(--zt-border)" }}>
        <Search className="w-4 h-4 shrink-0" style={{ color: "var(--zt-text-40)" }} />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by token or address"
          className="bg-transparent text-sm outline-none w-full"
          style={{ color: "var(--zt-text)" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="cursor-pointer hover:opacity-70 transition-opacity" style={{ color: "var(--zt-text-40)" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-2 border-b" style={{ borderColor: "var(--zt-border)" }}>
        {(["default", "imported"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="pb-2 text-sm font-medium capitalize transition-colors relative cursor-pointer"
            style={{ color: tab === t ? "var(--zt-text)" : "var(--zt-text-40)" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: "var(--zt-primary)" }} />
            )}
          </button>
        ))}
      </div>

      {/* Token list — default tab */}
      {tab === "default" && (
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {filtered.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: "var(--zt-text-40)" }}>
              No tokens found
            </p>
          ) : (
            filtered.map(token => {
              const disabled = token.address.toLowerCase() === disabledAddress?.toLowerCase()
              const fav = isFav(token.address)
              return (
                <div key={token.address}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors",
                    disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                  )}
                  style={{ background: "transparent" }}
                  onMouseEnter={e => !disabled && ((e.currentTarget as HTMLDivElement).style.background = "var(--zt-text-5)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                  onClick={() => { if (!disabled) { onSelect(token); onBack() } }}
                >
                  <TokenIcon src={token.icon} symbol={token.symbol} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm" style={{ color: "var(--zt-text)" }}>
                        {token.symbol}
                      </span>
                      <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ background: "var(--zt-primary)" }}>
                        <Check className="w-2 h-2" style={{ color: "var(--zt-btn-text)" }} />
                      </span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--zt-text-50)" }}>{token.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[11px] font-mono" style={{ color: "var(--zt-text-40)" }}>
                        {formatAddr(token.address)}
                      </span>
                      {token.address !== "NATIVE" && (
                        <button type="button"
                          onClick={e => { e.stopPropagation(); handleCopy(token.address) }}
                          className="transition-opacity hover:opacity-70 cursor-pointer"
                          style={{ color: "var(--zt-text-40)" }}>
                          {copied === token.address
                            ? <Check className="w-3 h-3" style={{ color: "var(--zt-success)" }} />
                            : <Copy className="w-3 h-3" />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                  <button type="button"
                    onClick={e => { e.stopPropagation(); toggleFav(token.address) }}
                    className="shrink-0 transition-colors hover:opacity-80 p-1 cursor-pointer"
                    style={{ color: fav ? "var(--zt-primary)" : "var(--zt-text-30)" }}>
                    <Star className={cn("w-4 h-4", fav && "fill-current")} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Imported tab */}
      {tab === "imported" && (
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto -mx-1 px-1">
          {/* Address input */}
          <div className="flex gap-2">
            <input
              value={importAddr}
              onChange={e => { setImportAddr(e.target.value); setImportPreview(null); setImportError(null) }}
              placeholder="Paste token address (0x...)"
              className="flex-1 rounded-xl px-3 py-2 text-sm bg-transparent outline-none"
              style={{ border: "1px solid var(--zt-border)", color: "var(--zt-text)" }}
            />
            <button
              type="button"
              onClick={() => lookupToken(importAddr)}
              disabled={importLoading || !importAddr}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={{ background: "var(--zt-primary-gradient)", color: "var(--zt-btn-text)" }}
            >
              {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
            </button>
          </div>

          {/* Error */}
          {importError && (
            <p className="text-xs flex items-center gap-1" style={{ color: "var(--zt-error)" }}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {importError}
            </p>
          )}

          {/* Preview + confirm */}
          {importPreview && (
            <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{ background: "var(--zt-text-8)", border: "1px solid var(--zt-primary-30)" }}>
              <div>
                <span className="font-semibold text-sm" style={{ color: "var(--zt-text)" }}>
                  {importPreview.symbol}
                </span>
                <span className="text-xs ml-2" style={{ color: "var(--zt-text-50)" }}>{importPreview.name}</span>
                <div className="text-[11px] font-mono mt-0.5" style={{ color: "var(--zt-text-40)" }}>
                  {formatAddr(importPreview.address)}
                </div>
              </div>
              <button type="button" onClick={confirmImport}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90"
                style={{ background: "var(--zt-primary-gradient)", color: "var(--zt-btn-text)" }}>
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          )}

          {/* Saved imported tokens */}
          {importedTokens.length === 0 && !importPreview && (
            <p className="text-center py-8 text-sm" style={{ color: "var(--zt-text-40)" }}>
              No imported tokens yet
            </p>
          )}
          {importedTokens.map(token => {
            const disabled = token.address.toLowerCase() === disabledAddress?.toLowerCase()
            return (
              <div key={token.address}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors",
                  disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                )}
                style={{ background: "transparent" }}
                onMouseEnter={e => !disabled && ((e.currentTarget as HTMLDivElement).style.background = "var(--zt-text-5)")}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                onClick={() => { if (!disabled) { onSelect(token); onBack() } }}
              >
                <TokenIcon src={token.icon} symbol={token.symbol} size={36} />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm" style={{ color: "var(--zt-text)" }}>
                    {token.symbol}
                  </span>
                  <div className="text-[11px] font-mono mt-0.5" style={{ color: "var(--zt-text-40)" }}>
                    {formatAddr(token.address)}
                  </div>
                </div>
                <button type="button"
                  onClick={e => { e.stopPropagation(); removeImported(token.address) }}
                  className="shrink-0 p-1 hover:opacity-70 transition-opacity cursor-pointer"
                  style={{ color: "var(--zt-text-40)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})
