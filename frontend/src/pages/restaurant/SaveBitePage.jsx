// SaveBitePage.jsx
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { formatCurrency, countdownTimer } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function SaveBitePage() {
  const [sales, setSales] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [timers, setTimers] = useState({})
  const [form, setForm] = useState({ itemName: '', category: 'Fancy Dosa', originalPrice: '', quantityAvailable: 1, expiryTime: '', description: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    try {
      const { data } = await api.get('/savebite')
      setSales(data.sales)
    } catch {}
  }

  useEffect(() => {
    load()
    const interval = setInterval(() => {
      setSales(prev => [...prev])
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/savebite', { ...form, originalPrice: Number(form.originalPrice), quantityAvailable: Number(form.quantityAvailable) })
      toast.success('Leftover listed on SaveBite! 🍱')
      setShowModal(false)
      load()
    } catch (err) { toast.error('Failed to list item') }
  }

  const getDiscountLabel = (pct) => {
    if (pct >= 70) return { label: '🔥 70% OFF', cls: 'bg-red-500/20 text-red-400 border-red-500/30' }
    if (pct >= 50) return { label: '⚡ 50% OFF', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
    return { label: '🟢 30% OFF', cls: 'bg-green-500/20 text-green-400 border-green-500/30' }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SaveBite Mode 🍱</h1>
          <p className="text-slate-400 text-sm mt-0.5">List unsold food at discounted prices before closing</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">+ List Leftover</button>
      </div>

      {/* How it works */}
      <div className="card bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/20">
        <h3 className="text-sm font-semibold text-white mb-3">Auto Discount Rules</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { time: '> 60 min', disc: '30%', color: 'text-green-400' },
            { time: '30–60 min', disc: '50%', color: 'text-amber-400' },
            { time: '< 10 min', disc: '70%', color: 'text-red-400' },
          ].map(r => (
            <div key={r.time} className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className={`text-xl font-black ${r.color}`}>{r.disc}</p>
              <p className="text-xs text-slate-400 mt-1">{r.time} to expiry</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Sales */}
      {sales.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🍱</p>
          <p className="text-slate-400">No active SaveBite listings</p>
          <p className="text-slate-500 text-sm mt-1">List leftover food to reduce waste and earn extra revenue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sales.map(sale => {
            const timer = countdownTimer(sale.expiryTime)
            const { label, cls } = getDiscountLabel(sale.discountPercentage)
            const remaining = sale.quantityAvailable - sale.quantitySold
            return (
              <div key={sale._id} className="card hover:border-slate-600 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-white">{sale.itemName}</p>
                    <p className="text-xs text-slate-400">{sale.category}</p>
                  </div>
                  <span className={`badge border text-xs ${cls}`}>{label}</span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500 line-through">{formatCurrency(sale.originalPrice)}</p>
                    <p className="text-xl font-bold text-secondary">{formatCurrency(sale.discountedPrice)}</p>
                  </div>
                  <div className="text-right ml-auto">
                    <p className="text-xs text-slate-400">Remaining</p>
                    <p className="text-lg font-bold text-white">{remaining}</p>
                  </div>
                </div>
                <div className={`flex items-center justify-between p-2 rounded-lg ${timer.expired ? 'bg-red-500/10' : timer.minutes < 10 ? 'bg-red-500/10' : 'bg-slate-800/50'}`}>
                  <span className="text-xs text-slate-400">Expires in</span>
                  <span className={`font-mono font-bold text-sm ${timer.expired ? 'text-red-400' : timer.minutes < 10 ? 'text-red-400' : timer.minutes < 30 ? 'text-amber-400' : 'text-secondary'}`}>
                    {timer.expired ? 'EXPIRED' : timer.display}
                  </span>
                </div>
                {sale.description && <p className="text-xs text-slate-400 mt-2">{sale.description}</p>}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">List Leftover Item</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body space-y-4">
              <div>
                <label className="label">Item Name *</label>
                <input className="input" required value={form.itemName} onChange={e => set('itemName', e.target.value)} placeholder="Masala Dosa" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Original Price (₹) *</label>
                  <input type="number" className="input" required value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} />
                </div>
                <div>
                  <label className="label">Quantity Available *</label>
                  <input type="number" min="1" className="input" required value={form.quantityAvailable} onChange={e => set('quantityAvailable', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Expiry Time *</label>
                <input type="datetime-local" className="input" required value={form.expiryTime} onChange={e => set('expiryTime', e.target.value)} />
                <p className="text-xs text-slate-500 mt-1">Discount auto-calculates based on time remaining</p>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Freshly made, grab before closing!" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">🍱 List on SaveBite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
