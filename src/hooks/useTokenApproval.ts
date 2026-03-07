"use client"

import { useState, useEffect, useCallback } from "react"
import { usePublicClient, useWalletClient, useAccount, useWaitForTransactionReceipt } from "wagmi"
import { LB_ROUTER_V22_ADDRESS } from "@zentrafi/sdk-v2"
import { toSDKChainId } from "@terminal/config/tokens"
import { ERC20_ABI } from "@terminal/config/contracts"
import { parseUnits, maxUint256 } from "viem"

interface Params {
  tokenAddress: string | null
  amount: string
  tokenDecimals: number
  chainId: number
  enabled?: boolean
}

export function useTokenApproval({ tokenAddress, amount, tokenDecimals, chainId, enabled = true }: Params) {
  const [needsApproval, setNeedsApproval] = useState(false)
  const [isCheckingApproval, setIsCheckingApproval] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const publicClient = usePublicClient({ chainId })
  const { data: walletClient } = useWalletClient({ chainId })
  const { address } = useAccount()

  const routerAddress = LB_ROUTER_V22_ADDRESS[toSDKChainId(chainId)] as `0x${string}` | undefined

  const { isSuccess: isApprovalConfirmed, isLoading: isApprovalPending } = useWaitForTransactionReceipt({
    hash: approvalHash ?? undefined,
  })

  const checkApproval = useCallback(async () => {
    if (!enabled || !tokenAddress || !address || !publicClient || !routerAddress || !amount || Number.parseFloat(amount) <= 0) {
      setNeedsApproval(false)
      return
    }
    if (tokenAddress === "NATIVE") {
      setNeedsApproval(false)
      return
    }

    setIsCheckingApproval(true)
    try {
      const amountBn = parseUnits(amount, tokenDecimals)
      const allowance = (await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, routerAddress],
      })) as bigint
      setNeedsApproval(allowance < amountBn)
    } catch (err) {
      setError(err as Error)
      setNeedsApproval(false)
    } finally {
      setIsCheckingApproval(false)
    }
  }, [enabled, tokenAddress, address, publicClient, routerAddress, amount, tokenDecimals])

  const approve = async () => {
    if (!walletClient || !address || !tokenAddress || !routerAddress) {
      throw new Error("Wallet not connected")
    }
    if (tokenAddress === "NATIVE") throw new Error("Native tokens don't need approval")

    setIsApproving(true)
    setError(null)
    setApprovalHash(null)

    try {
      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [routerAddress, maxUint256],
        account: address,
      })
      setApprovalHash(hash)
      return hash
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsApproving(false)
    }
  }

  useEffect(() => {
    if (isApprovalConfirmed && approvalHash) {
      const t = setTimeout(checkApproval, 1000)
      return () => clearTimeout(t)
    }
  }, [isApprovalConfirmed, approvalHash, checkApproval])

  useEffect(() => {
    checkApproval()
  }, [checkApproval])

  const resetApproval = useCallback(() => {
    setApprovalHash(null)
    setIsApproving(false)
    setError(null)
  }, [])

  return {
    needsApproval,
    isCheckingApproval,
    isApproving,
    isApprovalPending,
    isApprovalConfirmed,
    approvalHash,
    error,
    approve,
    checkApproval,
    resetApproval,
  }
}
