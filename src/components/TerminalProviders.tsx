"use client"

import { type ReactNode, useRef, createContext, useContext } from "react"
import { WagmiProvider, createConfig, http } from "wagmi"
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

export function TerminalProviders({
  walletConnectProjectId = "",
  appName = "ZentraFi Terminal",
  independentWallet = true,
  children,
}: TerminalProvidersConfig & { children: ReactNode }) {
  const { themeType, theme } = useTerminalTheme()

  // Create config once — wagmiConfig must be stable (re-creating it causes context loss)
  const wagmiConfigRef = useRef<ReturnType<typeof createConfig> | null>(null)
  if (!wagmiConfigRef.current) {
    const wallets = [metaMaskWallet, okxWallet, bitgetWallet, coinbaseWallet]
    // Only include WalletConnect when a valid project ID is provided
    if (walletConnectProjectId) wallets.push(walletConnectWallet)
    const connectors = connectorsForWallets(
      [{ groupName: "Recommended", wallets }],
      { appName, projectId: walletConnectProjectId || "placeholder" }
    )
    wagmiConfigRef.current = createConfig({
      connectors,
      chains: [pharosTestnet],
      transports: { [pharosTestnet.id]: http("https://atlantic.dplabs-internal.com") },
      ssr: false,
    })
  }
  const wagmiConfig = wagmiConfigRef.current

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

  // When independentWallet=false, skip own providers (host dApp provides them)
  if (!independentWallet) {
    return (
      <IndependentWalletContext.Provider value={false}>
        {children}
      </IndependentWalletContext.Provider>
    )
  }

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
