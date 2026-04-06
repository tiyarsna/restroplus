import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAnalytics } from '../../store/slices/orderSlice'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { formatCurrency } from '../../utils/helpers'
import api from '../../utils/api'

export default function AnalyticsPage() {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [expenses, setExpenses] = useState([])
  const [waste, setWaste] = useState({ summary: [] })

  // --- 1. ROBUST STATE SELECTION ---
  const state = useSelector(s => s.orders || {})
  
  const analytics = useMemo(() => {
    // Digging through potential nested structures from Redux/API
    const raw = state.analytics?.analytics || state.analytics || []
    return Array.isArray(raw) ? raw : []
  }, [state.analytics])

  const totals = state.totals || state.analytics?.totals || {}

  // --- 2. DATA FETCHING ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Dispatch redux action
        await dispatch(fetchAnalytics(period))

        const now = new Date()
        // Parallel API calls for Expenses and Waste
        const [expRes, wasteRes] = await Promise.all([
          api.get('/expenses', {
            params: { month: now.getMonth() + 1, year: now.getFullYear() }
          }),
          api.get('/waste', { params: { period } })
        ])

        setExpenses(expRes.data?.expenses || [])
        setWaste(wasteRes.data || { summary: [] })
      } catch (err) {
        console.error("Analytics Load Error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [period, dispatch])

  // --- 3. FORMATTING DATA FOR RECHARTS ---
  const chartData = useMemo(() => {
    if (!analytics.length) return []
    return analytics.map(d => ({
      // Safety check: ensure _id exists and is string before slicing
      date: (d?._id && typeof d._id === 'string') ? d._id.slice(5) : 'N/A', 
      revenue: Math.round(d?.totalRevenue || 0),
      orders: d?.orderCount || 0
    }))
  }, [analytics])

  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, e) => sum + (e?.amount || 0), 0)
  , [expenses])

  const totalRevenue = totals?.totalRevenue || 0
  const profit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0

  const pieData = useMemo(() => {
    const grouped = expenses.reduce((acc, e) => {
      const key = e?.category || 'Other'
      acc[key] = (acc[key] || 0) + (e?.amount || 0)
      return acc
    }, {})
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [expenses])

  const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  // --- 4. RENDER ---
  return (
    <div className="space-y-6 animate-fade-in p-4 lg:p-0">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Analytics & Insights</h1>
        <div className="flex bg-surface p-1 rounded-lg">
          {['7d', '30d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-xs transition-colors ${
                period === p ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Revenue" value={formatCurrency(totalRevenue)} icon="💰" color="text-green-400" />
        <Card label="Expenses" value={formatCurrency(totalExpenses)} icon="📤" color="text-red-400" />
        <Card label="Profit" value={formatCurrency(profit)} icon="📈" color={profit >= 0 ? 'text-green-400' : 'text-red-400'} />
        <Card label="Margin" value={`${profitMargin}%`} icon="🎯" color="text-amber-400" />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend */}
        <div className="card min-h-[320px] flex flex-col">
          <h3 className="text-white font-medium mb-4">Revenue Trend</h3>
          {loading ? <SkeletonLoader /> : (
            <ResponsiveContainer width="100%" height={220} key={`rev-${chartData.length}`}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {!loading && chartData.length === 0 && <NoData />}
        </div>

        {/* Order Volume */}
        <div className="card min-h-[320px] flex flex-col">
          <h3 className="text-white font-medium mb-4">Order Volume</h3>
          {loading ? <SkeletonLoader /> : (
            <ResponsiveContainer width="100%" height={220} key={`bar-${chartData.length}`}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#2d3748'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="orders" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {!loading && chartData.length === 0 && <NoData />}
        </div>

        {/* Expense Breakdown */}
        <div className="card flex flex-col items-center min-h-[320px]">
          <h3 className="text-white font-medium mb-4 w-full text-left">Expense Distribution</h3>
          {!loading && pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220} key={`pie-${pieData.length}`}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData label="No expense data" />}
        </div>

        {/* Waste Summary */}
        <div className="card min-h-[320px]">
          <h3 className="text-white font-medium mb-4">Waste Summary</h3>
          <div className="space-y-3">
            {!loading && (waste.summary || []).length > 0 ? (
              waste.summary.map(w => (
                <div key={w._id} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                  <span className="text-slate-300 text-sm">{w._id}</span>
                  <span className="text-red-400 font-mono text-sm">{formatCurrency(w.totalCost)}</span>
                </div>
              ))
            ) : <NoData label="No waste recorded 🎉" />}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- SUB-COMPONENTS ---

function Card({ label, value, icon, color }) {
  return (
    <div className="card hover:border-slate-600 transition-colors cursor-default">
      <div className="text-2xl mb-1">{icon}</div>
      <p className={`text-xl font-bold tracking-tight ${color}`}>{value}</p>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  )
}

function NoData({ label = "No data available" }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-slate-500 text-sm italic">{label}</p>
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div className="w-full h-[220px] bg-slate-800/20 animate-pulse rounded-lg flex items-center justify-center">
      <div className="w-full h-1 bg-slate-700/30"></div>
    </div>
  )
}