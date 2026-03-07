export function formatAmount(value: string, maxDecimals = 6): string {
  const num = parseFloat(value)
  if (isNaN(num)) return "0"
  if (num === 0) return "0"
  if (num < 0.000001) return "< 0.000001"
  return num.toLocaleString("en-US", {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  })
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function truncateAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function sanitizeAmount(value: string): string {
  // Remove non-numeric except single decimal point
  const cleaned = value.replace(/[^0-9.]/g, "")
  const parts = cleaned.split(".")
  if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("")
  return cleaned
}
