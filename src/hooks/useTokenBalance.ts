"use client"

import { useBalance, useReadContract } from "wagmi"
import { ERC20_ABI } from "@terminal/config/contracts"
import { formatUnits } from "viem"

interface Params {
  tokenAddress: string | null
  userAddress: `0x${string}` | undefined
  decimals: number
  chainId: number
}

export function useTokenBalance({ tokenAddress, userAddress, decimals, chainId }: Params) {
  const isNative = tokenAddress === "NATIVE"

  const { data: nativeBalance, refetch: refetchNative } = useBalance({
    address: userAddress,
    chainId,
    query: { enabled: isNative && !!userAddress },
  })

  const { data: erc20Balance, refetch: refetchErc20 } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    chainId,
    query: { enabled: !isNative && !!tokenAddress && !!userAddress },
  })

  const rawBalance = isNative ? nativeBalance?.value : (erc20Balance as bigint | undefined)
  const formatted = rawBalance !== undefined ? formatUnits(rawBalance, decimals) : "0"

  const refetch = () => {
    if (isNative) refetchNative()
    else refetchErc20()
  }

  return { balance: formatted, rawBalance, refetch }
}
