import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { WalletContext } from './wallet'
import { TDEXv2Market, TDEXv2Provider } from 'lib/types'
import { fetchMarketsFromProvider, getMarketPrice } from 'lib/tdex/market'
import { getProvidersFromRegistry } from 'lib/tdex/registry'
import { showToast } from 'lib/toast'

interface TradeContextProps {
  loading: boolean
  markets: TDEXv2Market[]
  providers: TDEXv2Provider[]
}

export const TradeContext = createContext<TradeContextProps>({
  loading: false,
  markets: [],
  providers: [],
})

interface TradeProviderProps {
  children: ReactNode
}

export const TradeProvider = ({ children }: TradeProviderProps) => {
  const { network } = useContext(WalletContext)

  const [loading, setLoading] = useState(false)
  const [markets, setMarkets] = useState<TDEXv2Market[]>([])
  const [providers, setProviders] = useState<TDEXv2Provider[]>([])

  // fetch and set markets (needs to fetch providers)
  useEffect(() => {
    if (!network) return
    const asyncFetchAndSetMarketsAndProviders = async () => {
      try {
        setLoading(true)
        const markets: TDEXv2Market[] = []
        const providers = await getProvidersFromRegistry(network)
        for (const provider of providers) {
          for (let market of await fetchMarketsFromProvider(provider)) {
            markets.push({
              ...market,
              price: await getMarketPrice(market),
            })
          }
        }
        setMarkets(markets)
        setProviders(providers)
      } catch (err) {
        console.error(err)
        showToast(err)
        setMarkets([])
        setProviders([])
      } finally {
        setLoading(false)
      }
    }
    asyncFetchAndSetMarketsAndProviders()
  }, [network])

  return (
    <TradeContext.Provider value={{ loading, markets, providers }}>
      {children}
    </TradeContext.Provider>
  )
}
