"use client"

import { type ReactNode, useMemo } from "react"
import { WagmiProvider, createConfig, http } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RainbowKitProvider, darkTheme, connectorsForWallets } from "@rainbow-me/rainbowkit"
import {
  metaMaskWallet,
  okxWallet,
  bitgetWallet,
  walletConnectWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { pharosTestnet } from "@terminal/config/chains"

import "@rainbow-me/rainbowkit/styles.css"

export interface TerminalProvidersConfig {
  walletConnectProjectId?: string
  appName?: string
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

/** Simple deterministic gradient avatar — no external dependencies */
function AddressAvatar({ address, size }: { address: string; size: number }) {
  // Hash address to hue (0-360)
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
      }}
    >
      {address.slice(2, 3).toUpperCase()}
    </div>
  )
}

const customAvatar = ({ address, ensImage, size }: { address: string; ensImage?: string | null; size: number }) =>
  ensImage ? (
    <img src={ensImage} width={size} height={size} alt="avatar" style={{ borderRadius: "50%" }} />
  ) : (
    <AddressAvatar address={address} size={size} />
  )

export function TerminalProviders({
  walletConnectProjectId = "",
  appName = "ZentraFi Terminal",
  children,
}: TerminalProvidersConfig & { children: ReactNode }) {
  const wagmiConfig = useMemo(() => {
    const connectors = connectorsForWallets(
      [
        {
          groupName: "Recommended",
          wallets: [metaMaskWallet, okxWallet, bitgetWallet, coinbaseWallet, walletConnectWallet],
        },
      ],
      { appName, projectId: walletConnectProjectId }
    )

    return createConfig({
      connectors,
      chains: [pharosTestnet],
      transports: {
        [pharosTestnet.id]: http("https://atlantic.dplabs-internal.com"),
      },
      ssr: true,
    })
  }, [walletConnectProjectId, appName])

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#97CBDC",
            accentColorForeground: "black",
            fontStack: "system",
          })}
          avatar={customAvatar}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
