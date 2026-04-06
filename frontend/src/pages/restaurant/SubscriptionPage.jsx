import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/api'
import { PLAN_FEATURES, formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function SubscriptionPage() {
  const { restaurant } = useSelector(s => s.auth)
  const currentPlan = restaurant?.subscription?.plan || 'FREE'
  const [billing, setBilling] = useState('monthly')
  const [upgrading, setUpgrading] = useState(null)

  const handleUpgrade = async (plan) => {
    if (plan === currentPlan) return
    setUpgrading(plan)
    try {
      await api.post('/subscriptions/upgrade', { plan, billingCycle: billing, paymentMethod: 'demo', transactionId: `DEMO-${Date.now()}` })
      toast.success(`Upgraded to ${plan}! Refresh to see changes. 🎉`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upgrade failed')
    } finally { setUpgrading(null) }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscription & Pricing</h1>
        <p className="text-slate-400 text-sm mt-1">Current plan: <span className="text-amber-400 font-semibold">{currentPlan}</span></p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center gap-4">
        <span className={`text-sm ${billing === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
        <button onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
          className={`w-12 h-6 rounded-full transition-colors relative ${billing === 'yearly' ? 'bg-primary' : 'bg-slate-600'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${billing === 'yearly' ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
        <span className={`text-sm ${billing === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
          Yearly <span className="text-green-400 text-xs font-medium">Save 17%</span>
        </span>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Object.entries(PLAN_FEATURES).map(([planKey, plan]) => {
          const isCurrent = planKey === currentPlan
          const price = billing === 'yearly' ? Math.round(plan.price * 10) : plan.price
          const isPopular = planKey === 'BASIC'
          return (
            <div key={planKey} className={`card relative flex flex-col transition-all
              ${isCurrent ? 'border-primary glow-primary' : isPopular ? 'border-blue-500/50' : 'hover:border-slate-600'}`}>
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge bg-primary text-white text-xs px-3 py-1">Current Plan</span>
                </div>
              )}
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge bg-blue-500 text-white text-xs px-3 py-1">Most Popular</span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{plan.label}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-black text-white">
                    {price === 0 ? 'Free' : formatCurrency(price)}
                  </span>
                  {price > 0 && <span className="text-slate-400 text-sm">/{billing === 'yearly' ? 'yr' : 'mo'}</span>}
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-slate-300">{f}</span>
                  </li>
                ))}
                {plan.missing?.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-slate-600 flex-shrink-0 mt-0.5">✗</span>
                    <span className="text-slate-600">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(planKey)}
                disabled={isCurrent || upgrading === planKey}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all
                  ${isCurrent ? 'bg-slate-700 text-slate-400 cursor-default' :
                    planKey === 'PRO' ? 'bg-amber-500 hover:bg-amber-400 text-black' :
                    'btn-primary'}`}>
                {isCurrent ? 'Current Plan' : upgrading === planKey ? 'Processing...' :
                  planKey === 'FREE' ? 'Downgrade' : `Upgrade to ${plan.label}`}
              </button>
            </div>
          )
        })}
      </div>

      <div className="card bg-slate-800/30 text-center">
        <p className="text-slate-400 text-sm">Need help choosing? <span className="text-primary cursor-pointer">Contact us</span> · All plans include 24/7 platform uptime</p>
      </div>
    </div>
  )
}
