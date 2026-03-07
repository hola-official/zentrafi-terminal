"use client"

import { useState, useEffect, useRef } from "react"
import { usePublicClient } from "wagmi"
import { Token, TokenAmount } from "@zentrafi/sdk-core"
import { PairV2, RouteV2, TradeV2 } from "@zentrafi/sdk-v2"
import { parseUnits } from "viem"

export interface SwapQuoteParams {
  inputToken: Token | null
  outputToken: Token | null
  typedValue: string
  isExactIn: boolean
  isNativeIn: boolean
  isNativeOut: boolean
  bases: Token[]
  chainId: number
  enabled?: boolean
  refreshCounter?: number
}

export interface SwapQuoteResult {
  trade: TradeV2 | null
  outputAmount: string
  executionPrice: string
  priceImpact: string
  tradingFee: string
  isLoading: boolean
  error: Error | null
}

export function useSwapQuote({
  inputToken,
  outputToken,
  typedValue,
  isExactIn,
  isNativeIn,
  isNativeOut,
  bases,
  chainId,
  enabled = true,
  refreshCounter = 0,
}: SwapQuoteParams): SwapQuoteResult {
  const [trade, setTrade] = useState<TradeV2 | null>(null)
  const [outputAmount, setOutputAmount] = useState("")
  const [executionPrice, setExecutionPrice] = useState("")
  const [priceImpact, setPriceImpact] = useState("")
  const [tradingFee, setTradingFee] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const requestIdRef = useRef(0)
  const publicClient = usePublicClient({ chainId })

  useEffect(() => {
    const currentRequestId = ++requestIdRef.current

    const clear = () => {
      setTrade(null)
      setOutputAmount("")
      setExecutionPrice("")
      setPriceImpact("")
      setTradingFee("")
      setError(null)
      setIsLoading(false)
    }

    const fetchQuote = async () => {
      if (
        !enabled ||
        !inputToken ||
        !outputToken ||
        !typedValue ||
        Number.parseFloat(typedValue) <= 0 ||
        !publicClient
      ) {
        clear()
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const directPair = new PairV2(inputToken, outputToken)
        const availablePairs = await directPair.fetchAvailableLBPairs("v22", publicClient, chainId)

        if (currentRequestId !== requestIdRef.current) return

        if (availablePairs.length === 0) {
          throw new Error("No liquidity pool found for this token pair")
        }

        const allTokenPairs = PairV2.createAllTokenPairs(inputToken, outputToken, bases)
        const allPairs = PairV2.initPairs(allTokenPairs)
        const allRoutes = RouteV2.createAllRoutes(allPairs, inputToken, outputToken)

        let trades: (TradeV2 | undefined)[] | undefined

        if (isExactIn) {
          const amountIn = new TokenAmount(inputToken, parseUnits(typedValue, inputToken.decimals))
          trades = await TradeV2.getTradesExactIn(
            allRoutes,
            amountIn,
            outputToken,
            isNativeIn,
            isNativeOut,
            publicClient,
            chainId
          )
        } else {
          const amountOut = new TokenAmount(outputToken, parseUnits(typedValue, outputToken.decimals))
          trades = await TradeV2.getTradesExactOut(
            allRoutes,
            amountOut,
            inputToken,
            isNativeIn,
            isNativeOut,
            publicClient,
            chainId
          )
        }

        if (currentRequestId !== requestIdRef.current) return

        const validTrades = trades?.filter((t): t is TradeV2 => t !== undefined) ?? []
        if (validTrades.length === 0) throw new Error("Insufficient liquidity in the pool")

        const bestTrade = TradeV2.chooseBestTrade(validTrades, isExactIn)
        if (!bestTrade) throw new Error("Insufficient liquidity in the pool")

        const output = isExactIn
          ? bestTrade.outputAmount.toSignificant(6)
          : bestTrade.inputAmount.toSignificant(6)

        const feeInfo = await bestTrade.getTradeFee()

        if (currentRequestId !== requestIdRef.current) return

        setTrade(bestTrade)
        setOutputAmount(output)
        setExecutionPrice(bestTrade.executionPrice.toSignificant(6))
        setPriceImpact(bestTrade.priceImpact.toSignificant(2))
        setTradingFee(feeInfo.feeAmountIn.toSignificant(6))
        setError(null)
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          setError(err as Error)
          setTrade(null)
          setOutputAmount("")
          setExecutionPrice("")
          setPriceImpact("")
          setTradingFee("")
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchQuote()
  }, [inputToken, outputToken, typedValue, isExactIn, isNativeIn, isNativeOut, bases, chainId, publicClient, enabled, refreshCounter])

  return { trade, outputAmount, executionPrice, priceImpact, tradingFee, isLoading, error }
}
