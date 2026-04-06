import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { formatCurrency, countdownTimer } from '../../utils/helpers'

export default function CustomerDealsPage() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    api.get('/savebite/all').then(r => { setSales(r.data.sales); setLoading(false) }).catch(() => setLoading(false))
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary/20 to-primary/20 border-b border-slate-700/50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-secondary to-green-600 rounded-xl flex items-center justify-center text-2xl">🍱</div>
            <div>
              <h1 className="text-2xl font-bold text-white">SaveBite Last-Minute Deals</h1>
              <p className="text-slate-400 text-sm">Fresh food at discounted prices — pickup only</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="card h-48 animate-pulse bg-slate-700/30" />)}
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="text-xl text-white font-semibold">No deals available right now</p>
            <p className="text-slate-400 mt-2">Check back near closing time for the best deals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sales.map(sale => {
              const timer = countdownTimer(sale.expiryTime)
              const remaining = sale.quantityAvailable - (sale.quantitySold || 0)
              const discountPct = sale.discountPercentage

              return (
                <div key={sale._id} className="card hover:border-slate-600 transition-all hover:-translate-y-0.5">
                  {/* Restaurant */}
                  {sale.restaurantId && (
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/50">
                      <div className="w-7 h-7 bg-primary/20 rounded-lg flex items-center justify-center text-primary text-xs font-bold">
                        {sale.restaurantId.name?.[0]}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{sale.restaurantId.name}</p>
                        <p className="text-xs text-slate-500">{sale.restaurantId.location?.city}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-white">{sale.itemName}</h3>
                      <p className="text-xs text-slate-400">{sale.category}</p>
                    </div>
                    <span className={`badge text-xs font-bold
                      ${discountPct >= 70 ? 'bg-red-500/20 text-red-400' :
                        discountPct >= 50 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'}`}>
                      {discountPct}% OFF
                    </span>
                  </div>

                  {sale.description && <p className="text-xs text-slate-400 mb-3">{sale.description}</p>}

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-500 line-through">{formatCurrency(sale.originalPrice)}</p>
                      <p className="text-2xl font-black text-secondary">{formatCurrency(sale.discountedPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Available</p>
                      <p className="text-xl font-bold text-white">{remaining}</p>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className={`rounded-xl p-2.5 flex items-center justify-between mb-3
                    ${timer.expired ? 'bg-red-500/10' : timer.minutes < 10 ? 'bg-red-500/10' : 'bg-slate-800/50'}`}>
                    <span className="text-xs text-slate-400">⏱ Expires in</span>
                    <span className={`font-mono font-bold text-sm
                      ${timer.expired ? 'text-red-400' : timer.minutes < 10 ? 'text-red-400' : timer.minutes < 30 ? 'text-amber-400' : 'text-secondary'}`}>
                      {timer.expired ? 'EXPIRED' : timer.display}
                    </span>
                  </div>

                  <button className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all
                    ${timer.expired || remaining <= 0
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-secondary hover:bg-secondary-dark text-white'}`}
                    disabled={timer.expired || remaining <= 0}>
                    {timer.expired ? 'Expired' : remaining <= 0 ? 'Sold Out' : '🛒 Order Pickup'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
