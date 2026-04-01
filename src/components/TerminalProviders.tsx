"use client"

import { type ReactNode, createContext, useContext, useEffect } from "react"
import { WagmiProvider, createConfig, createStorage, http, usePublicClient } from "wagmi"
import { injected } from "wagmi/connectors"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RainbowKitProvider, darkTheme, lightTheme, connectorsForWallets } from "@rainbow-me/rainbowkit"
import {
  metaMaskWallet,
  okxWallet,
  bitgetWallet,
  walletConnectWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { pharosTestnet } from "@terminal/config/chains"
import { useTerminalTheme } from "@terminal/theme/ThemeProvider"

import "@rainbow-me/rainbowkit/styles.css"

export interface TerminalProvidersConfig {
  walletConnectProjectId?: string
  appName?: string
  /**
   * true  → terminal manages its own wallet connection (default)
   * false → reuses the host dApp's wagmi/RainbowKit context
   */
  independentWallet?: boolean
}

/** Context that child components can read to know if terminal owns the wallet */
export const IndependentWalletContext = createContext(true)
export const useIndependentWallet = () => useContext(IndependentWalletContext)

// ── Stable module-level cache ─────────────────────────────────────────────────
// wagmi config must never be re-created across React remounts — doing so drops
// the reconnection state and forces the user to re-connect after every refresh.
// Keying on projectId + appName lets multiple independent terminals coexist.

const wagmiConfigCache = new Map<string, ReturnType<typeof createConfig>>()

// A real Reown/WalletConnect project ID never contains underscores or spaces.
// Placeholder strings like "your_project_id_here" or an empty string are NOT valid.
function isRealProjectId(id: string): boolean {
  return id.length > 0 && !/[_\s]/.test(id)
}

function getWagmiConfig(
  walletConnectProjectId: string,
  appName: string,
): ReturnType<typeof createConfig> {
  const key = `${walletConnectProjectId}::${appName}`
  if (!wagmiConfigCache.has(key)) {
    // connectorsForWallets always calls the Reown config API — even if walletConnectWallet
    // is not in the list — because it initialises app-level WalletConnect metadata.
    // With an invalid/placeholder project ID that call returns 403 and the WalletConnect
    // connector bundle can fail to initialise, breaking ALL connectors in the group
    // (MetaMask, OKX, etc.) even though they don't need WalletConnect themselves.
    //
    // When there is no real project ID we fall back to wagmi's native injected() connector
    // which has zero Reown/WalletConnect dependency and works for any injected wallet
    // (MetaMask, OKX, Rabby, Coinbase, …).  RainbowKitProvider wraps it just fine.
    const connectors = isRealProjectId(walletConnectProjectId)
      ? connectorsForWallets(
          [{ groupName: "Recommended", wallets: [metaMaskWallet, okxWallet, bitgetWallet, coinbaseWallet, walletConnectWallet] }],
          { appName, projectId: walletConnectProjectId },
        )
      : [injected()]

    wagmiConfigCache.set(
      key,
      createConfig({
        connectors,
        chains: [pharosTestnet],
        transports: { [pharosTestnet.id]: http("https://atlantic.dplabs-internal.com") },
        // Explicit localStorage storage so wagmi can reconnect after a page refresh
        storage: createStorage({ storage: typeof window !== "undefined" ? window.localStorage : undefined as never }),
        ssr: false,
      }),
    )
  }
  return wagmiConfigCache.get(key)!
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
})

/** Simple deterministic gradient avatar — no DiceBear dependency */
function AddressAvatar({ address, size }: { address: string; size: number }) {
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue1 = Math.abs(hash) % 360
  const hue2 = (hue1 + 60) % 360
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, hsl(${hue1},70%,55%), hsl(${hue2},70%,40%))`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        color: "white",
        fontWeight: "bold",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {address.slice(2, 3).toUpperCase()}
    </div>
  )
}

const customAvatar = ({
  address,
  ensImage,
  size,
}: {
  address: string
  ensImage?: string | null
  size: number
}) =>
  ensImage ? (
    <img src={ensImage} width={size} height={size} alt="avatar" style={{ borderRadius: "50%" }} />
  ) : (
    <AddressAvatar address={address} size={size} />
  )

/**
 * Renders nothing, but warns in dev if independentWallet=false and no WagmiProvider
 * is found up the tree (publicClient will be undefined in that case).
 */
function WagmiPresenceGuard() {
  const publicClient = usePublicClient()
  useEffect(() => {
    if (!publicClient) {
      console.warn(
        "[ZentraFi Terminal] independentWallet=false but no WagmiProvider was found above this " +
        "component. Make sure your app wraps ZentraTerminal with <WagmiProvider> and that the " +
        "Pharos testnet chain (id: 688689) is included in your wagmi config."
      )
    }
  }, [publicClient])
  return null
}

export function TerminalProviders({
  walletConnectProjectId = "",
  appName = "ZentraFi Terminal",
  independentWallet = true,
  children,
}: TerminalProvidersConfig & { children: ReactNode }) {
  const { themeType, theme } = useTerminalTheme()

  // When independentWallet=false, skip own providers entirely.
  // Do NOT call getWagmiConfig here — creating connectors (MetaMask, OKX, etc.) even
  // without mounting a WagmiProvider registers event listeners on window.ethereum that
  // compete with the host dApp's connectors and corrupt wagmi's localStorage reconnect
  // state, causing the host to ask the user to reconnect after every page reload.
  if (!independentWallet) {
    return (
      <IndependentWalletContext.Provider value={false}>
        <WagmiPresenceGuard />
        {children}
      </IndependentWalletContext.Provider>
    )
  }

  // Independent wallet mode — create/reuse stable wagmi config from module-level cache.
  // getWagmiConfig is NOT a hook so calling it after an early return is valid.
  const wagmiConfig = getWagmiConfig(walletConnectProjectId, appName)

  const rkTheme =
    themeType === "Light"
      ? lightTheme({
          accentColor: theme.primary,
          accentColorForeground: theme.btn_text,
          fontStack: "system",
        })
      : darkTheme({
          accentColor: theme.primary,
          accentColorForeground: theme.btn_text,
          fontStack: "system",
          overlayBlur: "small",
        })

  return (
    <IndependentWalletContext.Provider value={true}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider modalSize="compact" theme={rkTheme} avatar={customAvatar}>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </IndependentWalletContext.Provider>
  )
}
