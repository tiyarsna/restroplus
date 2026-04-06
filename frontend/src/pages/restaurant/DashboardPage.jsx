import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchAnalytics, fetchLiveOrders } from '../../store/slices/orderSlice'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { formatCurrency, formatDate } from '../../utils/helpers'
import api from '../../utils/api'

const StatCard = ({ icon, label, value, sub, color = 'primary', onClick }) => (
  <div
    className={`card hover:border-slate-600 transition-all ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
        ${color === 'green' ? 'bg-green-500/20' :
          color === 'amber' ? 'bg-amber-500/20' :
          color === 'red' ? 'bg-red-500/20' :
          'bg-primary/20'}`}>
        {icon}
      </div>
    </div>

    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-slate-400 uppercase">{label}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
)

export default function DashboardPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { restaurant } = useSelector(s => s.auth)
  const {
    analytics = {},   // 🔥 FIX: now object
    totals = {},
    liveOrders = [],
    loading,
    error
  } = useSelector(s => s.orders)

  const [waste, setWaste] = useState({ summary: [], totalCost: 0 })
  const [period, setPeriod] = useState('7d')
  const [topItems, setTopItems] = useState([])

  // ✅ Fetch analytics
  useEffect(() => {
    dispatch(fetchAnalytics(period))
  }, [dispatch, period])

  // ✅ Fetch live orders
  useEffect(() => {
    dispatch(fetchLiveOrders())
  }, [dispatch])

  // ✅ Waste API
  useEffect(() => {
    api.get('/waste', { params: { period } })
      .then(res => {
        setWaste({
          summary: res.data.summary || [],
          totalCost: res.data.totalCost || 0
        })
      })
      .catch(err => console.error("Waste API Error:", err))
  }, [period])

  // ✅ Top Items API
  useEffect(() => {
    api.get('/orders/analytics', { params: { period } })
      .then(res => {
        setTopItems(res.data.topItems || [])
      })
      .catch(err => console.error("Top Items Error:", err))
  }, [period])

  // ✅ Active orders
  const activeOrders = (liveOrders || []).filter(o =>
    ['pending', 'preparing'].includes(o.status)
  ).length

  // ✅ 🔥 FIXED CHART DATA
  const chartData = (analytics?.analytics || []).map(d => ({
    date: d._id?.slice(5),
    revenue: Math.round((d.totalRevenue || 0) * 100) / 100,
    orders: d.orderCount || 0,
    avg: Math.round((d.avgOrderValue || 0) * 100) / 100
  }))

  const maxCount = topItems.length > 0 ? topItems[0].count : 1

  if (loading) {
    return <div className="text-center text-white py-10">Loading Dashboard...</div>
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl text-white font-bold">Dashboard</h1>
          <p className="text-slate-400 text-sm">
            {restaurant?.name} · {formatDate(new Date())}
          </p>
        </div>

        <div className="flex gap-2">
          {['1d', '7d', '30d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs
                ${period === p ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {p === '1d' ? 'Today' : p === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Revenue"
          value={formatCurrency(totals.totalRevenue || 0)}
          color="green"
          sub={`${totals.completedOrders || 0} completed`}
        />

        <StatCard icon="📦" label="Orders"
          value={totals.totalOrders || 0}
          sub={`${activeOrders} active`}
          onClick={() => navigate('/orders')}
        />

        <StatCard icon="⚡" label="Live"
          value={liveOrders.length}
          color="amber"
        />

        <StatCard icon="🗑️" label="Waste"
          value={formatCurrency(waste.totalCost)}
          color="red"
          onClick={() => navigate('/waste')}
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">

        <div className="card">
          <h3 className="text-white mb-3">Revenue Trend</h3>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid stroke="#334155" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area dataKey="revenue" stroke="#6366F1" fill="#6366F1" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500">No data</p>}
        </div>

        <div className="card">
          <h3 className="text-white mb-3">Orders</h3>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="#334155" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500">No data</p>}
        </div>
      </div>

      {/* Live Orders */}
      <div className="card">
        <h3 className="text-white mb-3">Live Orders</h3>
        {liveOrders.length === 0 ? (
          <p className="text-slate-500">No active orders</p>
        ) : (
          liveOrders.slice(0, 5).map(o => (
            <div key={o._id} className="flex justify-between text-sm py-1">
              <span>T{o.tableNumber || 'Takeaway'}</span>
              <span>{o.status}</span>
              <span>{formatCurrency(o.subtotal)}</span>
            </div>
          ))
        )}
      </div>

      {/* Top Items */}
      <div className="card">
        <h3 className="text-white mb-3">Top Items</h3>
        {topItems.length === 0 ? (
          <p className="text-slate-500">No data</p>
        ) : (
          topItems.map((item, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between text-sm">
                <span>{item._id}</span>
                <span>{item.count}</span>
              </div>
              <div className="bg-slate-700 h-2 rounded">
                <div
                  className="bg-primary h-2 rounded"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}