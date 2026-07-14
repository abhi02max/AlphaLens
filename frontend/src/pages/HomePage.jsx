import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Globe, BarChart3, Sparkles, ArrowRight } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import { Card, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import { useStockQuote } from '../hooks/useStocks'
import { formatCurrency, formatPercent } from '../utils/helpers'
import { STOCK_SYMBOLS } from '../constants'

/**
 * Market Overview Card - Shows individual stock/index
 */
const MarketCard = ({ symbol, name, category }) => {
  const { data: quote, isLoading, error } = useStockQuote(symbol)

  const isPositive = quote?.regularMarketChangePercent >= 0 || false
  const price = quote?.regularMarketPrice || quote?.price || 0
  const changePercent = quote?.regularMarketChangePercent || quote?.changePercent || 0

  return (
    <Link to={`/stock/${symbol}`}>
      <Card className="hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer h-full">
        <CardBody>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-lg">{symbol}</h4>
              <p className="text-xs text-slate-500 mt-1">{name}</p>
            </div>
            <Badge variant="default" size="sm">{category}</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-6 w-24 bg-slate-200 rounded"></div>
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-sm">Load failed</div>
          ) : (
            <>
              <div className="mb-3">
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {formatCurrency(price)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={isPositive ? 'positive' : 'negative'} size="sm">
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {formatPercent(changePercent)}
                  </Badge>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-blue-600 group">
                <span className="text-sm font-semibold">View Details</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </Link>
  )
}

/**
 * Home Page - Enterprise dashboard with Stripe-like design
 */
const HomePage = () => {
  const marketIndices = useMemo(() => STOCK_SYMBOLS.slice(0, 4), [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          {/* Hero Heading */}
          <div className="mb-8">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-4">
              Your Intelligence<br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Stock Market Dashboard
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Get professional-grade market insights, AI-powered analysis, and real-time data
              all in one beautiful platform.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <SearchBar />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" variant="primary">
              <Sparkles size={20} />
              Explore Markets
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <StatCard
            title="Market Status"
            value="Open"
            change="Trading live"
            icon={BarChart3}
          />
          <StatCard
            title="Active Watchlist"
            value="—"
            change="Sign in to track"
            icon={Globe}
          />
          <StatCard
            title="AI Insights"
            value="Enabled"
            change="Powered by AI"
            icon={Sparkles}
          />
        </div>

        {/* Market Overview Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Globe className="text-blue-600" size={28} />
                Market Overview
              </h2>
              <p className="text-slate-600 mt-2">Track major indices and cryptocurrencies</p>
            </div>
            <Link to="/search">
              <Button variant="outline">
                View All
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {marketIndices.map((item) => (
              <MarketCard
                key={item.symbol}
                symbol={item.symbol}
                name={item.name}
                category={item.category}
              />
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-sm mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            Why Choose WalletStack?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Sparkles,
                title: 'AI-Powered Insights',
                description: 'Get intelligent analysis of market trends and stock movements powered by advanced AI.',
              },
              {
                icon: BarChart3,
                title: 'Real-Time Data',
                description: 'Access live market data and stay updated with instant price changes and trends.',
              },
              {
                icon: TrendingUp,
                title: 'Portfolio Tracking',
                description: 'Build and manage your watchlist with detailed performance metrics.',
              },
              {
                icon: Globe,
                title: 'Global Markets',
                description: 'Track stocks, indices, cryptos, and commodities from around the world.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-100">
                    <feature.icon className="text-blue-600" size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 mt-2">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 sm:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Market Analysis</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Get started with WalletStack today and take control of your financial decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search">
              <Button size="lg" variant="secondary">
                Browse Markets
              </Button>
            </Link>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Sign Up Free
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
