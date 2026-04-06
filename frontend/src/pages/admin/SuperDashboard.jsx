import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function SuperDashboard() {
  const [stats, setStats] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  // 🔥 FETCH DATA
  const fetchData = async () => {
    try {
      setLoading(true)

      const [analyticsRes, restaurantRes] = await Promise.all([
        api.get('/superadmin/analytics'),
        api.get('/superadmin/restaurants')
      ])

      setStats(analyticsRes.data.stats)
      setRestaurants(restaurantRes.data.restaurants)
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 🔥 DELETE RESTAURANT
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" restaurant? This cannot be undone.`)) return

    try {
      await api.delete(`/superadmin/restaurants/${id}`)
      toast.success('Restaurant removed')

      // update UI instantly
      setRestaurants(prev => prev.filter(r => r._id !== id))

      // refresh stats
      fetchData()
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const planBreakdown = stats?.planBreakdown || []
  const getPlanCount = (plan) =>
    planBreakdown.find(p => p._id === plan)?.count || 0

  if (loading) {
    return <p className="text-white">Loading...</p>
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* HEADER */}
      <div className="flex items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-slate-400 text-sm">RestroPulse SaaS Analytics</p>
        </div>

        <button
          onClick={fetchData}
          className="ml-auto px-3 py-1 bg-slate-700 text-white rounded-lg text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Restaurants', value: stats?.totalRestaurants || 0, icon: '🏪' },
          { label: 'Revenue', value: formatCurrency(stats?.platformRevenue || 0), icon: '💰' },
          { label: 'Orders (7d)', value: stats?.recentOrders || 0, icon: '📦' },
          { label: 'Waste Cost', value: formatCurrency(stats?.wasteStats?.totalCost || 0), icon: '🗑️' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-2xl">{s.icon}</div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* PLAN */}
      <div className="card">
        <h3 className="text-white mb-3">Plans</h3>
        <div className="grid grid-cols-3 gap-3">
          {['FREE', 'BASIC', 'PRO'].map(plan => (
            <div key={plan} className="bg-slate-700 p-3 rounded text-center">
              <p className="text-2xl text-white">{getPlanCount(plan)}</p>
              <p className="text-xs text-slate-400">{plan}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 RESTAURANT LIST WITH DELETE */}
      <div className="card">
        <h3 className="text-white mb-4">All Restaurants</h3>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {restaurants.map(r => (
            <div key={r._id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">

              <div>
                <p className="text-white font-medium">{r.name}</p>
                <p className="text-xs text-slate-400">{r.email}</p>
              </div>

              <button
                onClick={() => handleDelete(r._id, r.name)}
                className="text-red-400 hover:text-red-500 text-sm"
              >
                🗑 Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* WARNING */}
      <div className="card bg-amber-500/5 border-amber-500/20">
        <p className="text-amber-400 text-sm">
          ⚠️ SuperAdmin: You can remove restaurants permanently
        </p>
      </div>
    </div>
  )
}