import { Token, ChainId } from "@zentrafi/sdk-core"

export const PHAROS_CHAIN_ID = 688689 as const

// SDK Token definitions
export const SDK_TOKENS = {
  [PHAROS_CHAIN_ID]: {
    WPHRS: new Token(
      PHAROS_CHAIN_ID,
      "0x838800b758277CC111B2d48Ab01e5E164f8E9471",
      18,
      "WPHRS",
      "Wrapped Pharos"
    ),
    USDC: new Token(
      PHAROS_CHAIN_ID,
      "0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8",
      6,
      "USDC",
      "USD Coin"
    ),
    USDT: new Token(
      PHAROS_CHAIN_ID,
      "0xE7E84B8B4f39C507499c40B4ac199B050e2882d5",
      6,
      "USDT",
      "Tether"
    ),
  },
} as const

export type TokenConfig = {
  symbol: string
  name: string
  address: string
  decimals: number
  icon: string
  chainId: number
}

// UI token list (includes native PHRS)
export const TOKEN_LIST: Record<number, TokenConfig[]> = {
  [PHAROS_CHAIN_ID]: [
    {
      symbol: "PHRS",
      name: "Pharos",
      address: "NATIVE",
      decimals: 18,
      icon: "https://raw.githubusercontent.com/Zentra-Finance/assets/main/pharos-chain.png",
      chainId: PHAROS_CHAIN_ID,
    },
    {
      symbol: "WPHRS",
      name: "Wrapped Pharos",
      address: "0x838800b758277CC111B2d48Ab01e5E164f8E9471",
      decimals: 18,
      icon: "https://raw.githubusercontent.com/Zentra-Finance/assets/main/pharos-chain.png",
      chainId: PHAROS_CHAIN_ID,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8",
      decimals: 6,
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
      chainId: PHAROS_CHAIN_ID,
    },
    {
      symbol: "USDT",
      name: "Tether",
      address: "0xE7E84B8B4f39C507499c40B4ac199B050e2882d5",
      decimals: 6,
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
      chainId: PHAROS_CHAIN_ID,
    },
    {
      symbol: "WETH",
      name: "Wrapped Ethereum",
      address: "0x7d211f77525ea39a0592794f793cc1036eeaccd5",
      decimals: 18,
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
      chainId: PHAROS_CHAIN_ID,
    },
  ],
}

export const WPHRS_ADDRESS = "0x838800b758277CC111B2d48Ab01e5E164f8E9471" as const

// Convert wagmi chain ID to SDK ChainId
export function toSDKChainId(wagmiChainId: number): ChainId {
  if (wagmiChainId === PHAROS_CHAIN_ID) return PHAROS_CHAIN_ID
  return PHAROS_CHAIN_ID // fallback
}

// Get SDK tokens for chain
export function getSDKTokens(chainId: number) {
  return SDK_TOKENS[chainId as keyof typeof SDK_TOKENS] ?? SDK_TOKENS[PHAROS_CHAIN_ID]
}

// Get SDK Token by UI address (handles "NATIVE" → WPHRS)
export function getSDKToken(address: string, chainId: number): Token | undefined {
  const tokens = getSDKTokens(chainId)
  if (address === "NATIVE") return tokens.WPHRS
  return Object.values(tokens as Record<string, Token>).find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  )
}

// Get UI token list for chain
export function getTokenList(chainId: number): TokenConfig[] {
  return TOKEN_LIST[chainId] ?? TOKEN_LIST[PHAROS_CHAIN_ID]
}
