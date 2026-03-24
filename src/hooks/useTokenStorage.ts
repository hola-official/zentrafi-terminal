"use client"

import { useState, useEffect, type Dispatch, type SetStateAction } from "react"
import type { TokenConfig } from "@terminal/config/tokens"

export function useFavoriteTokens(): [string[], Dispatch<SetStateAction<string[]>>] {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("zt-fav-tokens") ?? "[]") } catch { return [] }
  })
  useEffect(() => {
    localStorage.setItem("zt-fav-tokens", JSON.stringify(favorites))
  }, [favorites])
  return [favorites, setFavorites]
}

export function useImportedTokens(chainId: number): [TokenConfig[], Dispatch<SetStateAction<TokenConfig[]>>] {
  const key = `zt-imported-tokens-${chainId}`
  const [importedTokens, setImportedTokens] = useState<TokenConfig[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? "[]") } catch { return [] }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(importedTokens))
  }, [importedTokens, key])
  return [importedTokens, setImportedTokens]
}
