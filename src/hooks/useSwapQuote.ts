"use client"

import { useReducer, useEffect, useRef } from "react"
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

type QuoteAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; trade: TradeV2; outputAmount: string; executionPrice: string; priceImpact: string; tradingFee: string }
  | { type: "FETCH_ERROR"; error: Error }
  | { type: "CLEAR" }

const INITIAL_STATE: SwapQuoteResult = {
  trade: null,
  outputAmount: "",
  executionPrice: "",
  priceImpact: "",
  tradingFee: "",
  isLoading: false,
  error: null,
}

function quoteReducer(state: SwapQuoteResult, action: QuoteAction): SwapQuoteResult {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null }
    case "FETCH_SUCCESS":
      return {
        trade: action.trade,
        outputAmount: action.outputAmount,
        executionPrice: action.executionPrice,
        priceImpact: action.priceImpact,
        tradingFee: action.tradingFee,
        isLoading: false,
        error: null,
      }
    case "FETCH_ERROR":
      return { ...INITIAL_STATE, error: action.error }
    case "CLEAR":
      return INITIAL_STATE
    default:
      return state
  }
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
  const [state, dispatch] = useReducer(quoteReducer, INITIAL_STATE)
  const requestIdRef = useRef(0)
  const publicClient = usePublicClient({ chainId })

  useEffect(() => {
    const currentRequestId = ++requestIdRef.current

    const fetchQuote = async () => {
      if (
        !enabled ||
        !inputToken ||
        !outputToken ||
        !typedValue ||
        Number.parseFloat(typedValue) <= 0 ||
        !publicClient
      ) {
        dispatch({ type: "CLEAR" })
        return
      }

      dispatch({ type: "FETCH_START" })

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

        dispatch({
          type: "FETCH_SUCCESS",
          trade: bestTrade,
          outputAmount: output,
          executionPrice: bestTrade.executionPrice.toSignificant(6),
          priceImpact: bestTrade.priceImpact.toSignificant(2),
          tradingFee: feeInfo.feeAmountIn.toSignificant(6),
        })
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          dispatch({ type: "FETCH_ERROR", error: err as Error })
        }
      }
    }

    fetchQuote()
  }, [inputToken, outputToken, typedValue, isExactIn, isNativeIn, isNativeOut, bases, chainId, publicClient, enabled, refreshCounter])

  return state
}
