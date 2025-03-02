import Decimal from 'decimal.js'
import { CoinPair } from '../types'
import axios from 'axios'
import {
  TDEXv2Market,
  TDEXv2MarketPrice,
  TDEXv2Provider,
  TDEXv2TradeType,
  isTDEXv2Market,
  isTDEXv2MarketPrice,
} from '../types'

/**
 * Get a list of markets from a given provider
 * @param provider
 * @returns an array of markets
 */
export async function fetchMarketsFromProvider(
  provider: TDEXv2Provider,
): Promise<TDEXv2Market[]> {
  console.debug('fetchMarketsFromProvider', provider)
  const url = provider.endpoint + '/v2/markets'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  const res = (await axios.post(url, {}, opt)).data.markets
  if (!Array.isArray(res)) throw new Error('Invalid markets response')
  return res
    .map((m: any) => ({
      provider,
      baseAsset: m.market.baseAsset,
      quoteAsset: m.market.quoteAsset,
      percentageFee: m.fee.percentageFee,
      fixedFee: m.fee.fixedFee,
    }))
    .filter(isTDEXv2Market)
}

/**
 * Get the price for a given market
 * @param market
 * @returns an array of markets
 */
export async function getMarketPrice(
  market: TDEXv2Market,
): Promise<TDEXv2MarketPrice | undefined> {
  console.debug('getMarketPrice', market)
  const url = market.provider.endpoint + '/v2/market/price'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  const res = (await axios.post(url, { market }, opt)).data
  return isTDEXv2MarketPrice(res) ? res : undefined
}

/**
 * Calculate total fees in a given market for a given pair
 * Note: percentageFee is represented in basis points (10^-4)
 * @param market
 * @param pair
 * @returns number
 */
function totalMarketFees(market: TDEXv2Market, pair: CoinPair): number | undefined {
  console.debug('totalMarketFees', market, pair);

  if (typeof market.fixedFee === 'undefined' || typeof market.percentageFee === 'undefined') {
    return;
  }

  const tradeType = getTradeType(market, pair);

  if (tradeType === TDEXv2TradeType.BUY) {
    // Buying base asset → Fees apply to quoteAsset
    const fixedFee = market.fixedFee.quoteAsset;
    const percentageFee = Decimal.mul(pair.from.amount ?? 0, market.percentageFee.quoteAsset).div(10_000);
    return Decimal.add(fixedFee, percentageFee).toNumber();
  } else {
    // Selling base asset → Fees apply to baseAsset
    const fixedFee = market.fixedFee.baseAsset;
    const percentageFee = Decimal.mul(pair.from.amount ?? 0, market.percentageFee.baseAsset).div(10_000);
    return Decimal.add(fixedFee, percentageFee).toNumber();
  }
}

/**
 * Find the best market for a given pair
 * @param markets
 * @param pair
 * @returns market
 */
export function getBestMarket(
  markets: TDEXv2Market[],
  pair: CoinPair,
  useProvider?: TDEXv2Provider,
): TDEXv2Market | undefined {
  console.debug('getBestMarket', markets, pair, useProvider)

  if (markets.length == 0) return; // No valid markets
  const tradeType = getTradeType(markets[0], pair);

  const validMarkets = markets
    // return markets filtered by provider if useProvider is defined
    .filter((market) =>
      useProvider ? market.provider.endpoint === useProvider.endpoint : true,
    )
    // find markets for this pair
    .filter(
      (market) =>
        (market.baseAsset === pair.from.assetHash &&
          market.quoteAsset === pair.dest.assetHash) ||
        (market.baseAsset === pair.dest.assetHash &&
          market.quoteAsset === pair.from.assetHash),
    )
    // Ensure provider has enough balance
    .filter((market) => {
      const tradeAmount = pair.dest.amount ?? 0;
      if (!market.price?.balance) return false;

      if (tradeType === TDEXv2TradeType.BUY) {
        return !(Number(market.price.balance.baseAmount) < tradeAmount);
      } else {
        return !(Number(market.price.balance.quoteAmount) < tradeAmount);
      }
    });

  if (!validMarkets) return
  if (validMarkets.length === 1) return validMarkets[0]

  // if we reach this point, it means we have several matching markets,
  // so lets find the market with the highest proceeds from the trade
  return validMarkets.reduce((bestMarket, currentMarket) => {
    const spotPrice = currentMarket.price?.spotPrice ?? 0
    const marketFees = totalMarketFees(currentMarket, pair) ?? 0

    let netProceeds: number

    if (tradeType === TDEXv2TradeType.BUY) {
      // Buying base asset: How much base asset do we get after fees?
      netProceeds = (pair.from.amount ?? 0) / spotPrice - marketFees
    } else {
      // Selling base asset: How much quote asset do we get after fees?
      netProceeds = (pair.from.amount ?? 0) * spotPrice - marketFees
    }

    const bestNetProceeds = (() => {
      const bestSpotPrice = bestMarket.price?.spotPrice ?? 0
      const bestMarketFees = totalMarketFees(bestMarket, pair) ?? 0
      return tradeType === TDEXv2TradeType.BUY
        ? (pair.from.amount ?? 0) / bestSpotPrice - bestMarketFees
        : (pair.from.amount ?? 0) * bestSpotPrice - bestMarketFees
    })()

    return netProceeds > bestNetProceeds ? currentMarket : bestMarket
  }, validMarkets[0])
}

/**
 * Get trade type (SELL or BUY)
 * @param market
 * @param pair
 * @returns trade type
 */
export function getTradeType(
  market: TDEXv2Market,
  pair: CoinPair,
): TDEXv2TradeType {
  console.debug('getTradeType', market, pair)
  return market.baseAsset === pair.from.assetHash
    ? TDEXv2TradeType.SELL
    : TDEXv2TradeType.BUY
}
