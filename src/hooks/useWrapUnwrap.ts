"use client"

import { useState, useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"
import { WPHRS_ADDRESS, WPHRS_ABI } from "@terminal/config/contracts"

export interface UseWrapUnwrapResult {
  wrap: (amount: string) => Promise<void>
  unwrap: (amount: string) => Promise<void>
  hash: string | undefined
  error: Error | null
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  reset: () => void
}

export function useWrapUnwrap(): UseWrapUnwrapResult {
  const [isPendingLocal, setIsPendingLocal] = useState(false)
  const [pendingTxPromise, setPendingTxPromise] = useState<{
    resolve: () => void
    reject: (err: unknown) => void
  } | null>(null)

  const { data: hash, writeContract, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isConfirmed && pendingTxPromise) {
      pendingTxPromise.resolve()
      setPendingTxPromise(null)
      setIsPendingLocal(false)
    }
  }, [isConfirmed, pendingTxPromise])

  useEffect(() => {
    if (error && pendingTxPromise) {
      pendingTxPromise.reject(error)
      setPendingTxPromise(null)
      setIsPendingLocal(false)
    }
  }, [error, pendingTxPromise])

  const wrap = (amount: string): Promise<void> =>
    new Promise((resolve, reject) => {
      try {
        const amountWei = parseUnits(amount, 18)
        if (amountWei === 0n) return reject(new Error("Amount must be greater than zero"))
        setIsPendingLocal(true)
        setPendingTxPromise({ resolve, reject })
        writeContract({ address: WPHRS_ADDRESS, abi: WPHRS_ABI, functionName: "deposit", value: amountWei })
      } catch (err) {
        setIsPendingLocal(false)
        setPendingTxPromise(null)
        reject(err)
      }
    })

  const unwrap = (amount: string): Promise<void> =>
    new Promise((resolve, reject) => {
      try {
        const amountWei = parseUnits(amount, 18)
        if (amountWei === 0n) return reject(new Error("Amount must be greater than zero"))
        setIsPendingLocal(true)
        setPendingTxPromise({ resolve, reject })
        writeContract({ address: WPHRS_ADDRESS, abi: WPHRS_ABI, functionName: "withdraw", args: [amountWei] })
      } catch (err) {
        setIsPendingLocal(false)
        setPendingTxPromise(null)
        reject(err)
      }
    })

  return {
    wrap,
    unwrap,
    hash,
    error,
    isPending: isPendingLocal || isConfirming,
    isConfirming,
    isConfirmed,
    reset,
  }
}
