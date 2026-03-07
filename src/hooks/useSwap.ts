"use client"

import { useState } from "react"
import { usePublicClient, useWalletClient, useAccount } from "wagmi"
import { Percent } from "@zentrafi/sdk-core"
import { TradeV2, TradeOptions, LB_ROUTER_V22_ADDRESS, jsonAbis } from "@zentrafi/sdk-v2"
import { toSDKChainId } from "@terminal/config/tokens"

const { LBRouterV22ABI } = jsonAbis

export interface SwapOptions {
  slippageBps: number
  deadline?: number
  recipient?: string
  feeOnTransfer?: boolean
}

export function useSwap(chainId: number) {
  const [isSwapping, setIsSwapping] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hash, setHash] = useState<`0x${string}` | null>(null)

  const publicClient = usePublicClient({ chainId })
  const { data: walletClient } = useWalletClient({ chainId })
  const { address } = useAccount()

  const executeSwap = async (trade: TradeV2, options: SwapOptions): Promise<`0x${string}`> => {
    if (!publicClient || !walletClient || !address) {
      throw new Error("Wallet not connected")
    }

    setIsSwapping(true)
    setError(null)
    setHash(null)

    const sdkChainId = toSDKChainId(chainId)

    try {
      const routerAddress = LB_ROUTER_V22_ADDRESS[sdkChainId]
      if (!routerAddress) throw new Error(`Router not found for chain ${chainId}`)

      const swapOptions: TradeOptions = {
        allowedSlippage: new Percent(options.slippageBps.toString(), "10000"),
        ttl: options.deadline ?? 3600,
        recipient: options.recipient ?? address,
        feeOnTransfer: options.feeOnTransfer ?? false,
      }

      const { methodName, args, value } = trade.swapCallParameters(swapOptions)

      const { request } = await publicClient.simulateContract({
        address: routerAddress as `0x${string}`,
        abi: LBRouterV22ABI,
        functionName: methodName as never,
        args: args as never,
        account: address,
        value: BigInt(value),
      })

      const txHash = await walletClient.writeContract(request)
      setHash(txHash)
      return txHash
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsSwapping(false)
    }
  }

  return { executeSwap, isSwapping, error, hash }
}
