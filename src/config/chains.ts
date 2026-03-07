import { defineChain } from "viem"

export const pharosTestnet = defineChain({
  id: 688689,
  caipNetworkId: "eip155:688689",
  chainNamespace: "eip155",
  name: "Pharos Atlantic Ocean",
  nativeCurrency: {
    decimals: 18,
    name: "Pharos Atlantic",
    symbol: "PHRS",
  },
  rpcUrls: {
    default: {
      http: ["https://atlantic.dplabs-internal.com"],
      webSocket: ["wss://atlantic.dplabs-internal.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Pharos Explorer",
      url: "https://atlantic.pharosscan.xyz",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 4000000,
    },
  },
})

export const SUPPORTED_CHAINS = [pharosTestnet] as const
export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]["id"]
