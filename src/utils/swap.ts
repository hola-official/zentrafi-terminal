import type { TokenConfig } from "@terminal/config/tokens"

export function isWrapOperation(from: TokenConfig, to: TokenConfig): boolean {
  return from.address === "NATIVE" && from.symbol === "PHRS" && to.symbol === "WPHRS"
}

export function isUnwrapOperation(from: TokenConfig, to: TokenConfig): boolean {
  return from.symbol === "WPHRS" && to.address === "NATIVE" && to.symbol === "PHRS"
}

export function isWrapOrUnwrap(from: TokenConfig, to: TokenConfig): boolean {
  return isWrapOperation(from, to) || isUnwrapOperation(from, to)
}
