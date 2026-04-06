import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/api'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { key: 'ingredients',  label: 'Ingredients',  icon: '🥬', color: '#22C55E' },
  { key: 'utilities',    label: 'Utilities',     icon: '💡', color: '#F59E0B' },
  { key: 'staff',        label: 'Staff',         icon: '👥', color: '#6366F1' },
  { key: 'equipment',    label: 'Equipment',     icon: '🔧', color: '#3B82F6' },
  { key: 'maintenance',  label: 'Maintenance',   icon: '🔨', color: '#8B5CF6' },
  { key: 'marketing',    label: 'Marketing',     icon: '📢', color: '#EC4899' },
  { key: 'rent',         label: 'Rent',          icon: '🏠', color: '#EF4444' },
  { key: 'transport',    label: 'Transport',     icon: '🚗', color: '#14B8A6' },
  { key: 'other',        label: 'Other',         icon: '📦', color: '#94A3B8' },
]

const PAYMENT_MODES = ['cash','upi','card','bank_transfer','other']

const emptyForm = {
  title: '', category: 'ingredients', amount: '',
  date: new Date().toISOString().split('T')[0],
  description: '', vendor: '', paymentMode: 'cash'
}

export default function ExpensePage() {
  const { restaurant } = useSelector(s => s.auth)

  const [expenses,     setExpenses]     = useState([])
  const [byCategory,   setByCategory]   = useState([])
  const [totalAmount,  setTotalAmount]  = useState(0)
  const [trend,        setTrend]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [editExpense,  setEditExpense]  = useState(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [activeTab,    setActiveTab]    = useState('list')
  const [filterCat,    setFilterCat]    = useState('all')
  const [form,         setForm]         = useState(emptyForm)

  const now = new Date()
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear,  setFilterYear]  = useState(now.getFullYear())

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/expenses', {
        params: { month: filterMonth, year: filterYear, category: filterCat }
      })
      setExpenses(data.expenses    || [])
      setByCategory(data.byCategory || [])
      setTotalAmount(data.totalAmount || 0)
      setTrend(data.trend          || [])
    } catch (e) {
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [filterMonth, filterYear, filterCat])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditExpense(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (exp) => {
    setEditExpense(exp)
    setForm({
      title:       exp.title,
      category:    exp.category,
      amount:      exp.amount,
      date:        new Date(exp.date).toISOString().split('T')[0],
      description: exp.description || '',
      vendor:      exp.vendor      || '',
      paymentMode: exp.paymentMode || 'cash'
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Valid amount is required')

    setSubmitting(true)
    try {
      if (editExpense) {
        await api.put(`/expenses/${editExpense._id}`, form)
        toast.success('Expense updated!')
      } else {
        await api.post('/expenses', form)
        toast.success('Expense added!')
      }
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try {
      await api.delete(`/expenses/${id}`)
      toast.success('Expense deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const getCatInfo  = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1]
  const monthLabel  = new Date(filterYear, filterMonth - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  const pieData     = byCategory.map(b => ({ name: b._id, value: b.total, color: getCatInfo(b._id).color }))

  const MONTHS = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i, 1).toLocaleString('default', { month: 'short' })
  }))

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expense Tracker</h1>
          <p className="text-slate-400 text-sm mt-0.5">{restaurant?.name} · {monthLabel}</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm">+ Add Expense</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select className="select w-32"
          value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}>
          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select className="select w-28"
          value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="select w-40"
          value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
        </select>
        <button onClick={load} className="btn-secondary text-sm">↻ Refresh</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Expenses</p>
          <p className="text-xs text-slate-500 mt-0.5">{monthLabel}</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-white">{expenses.length}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Transactions</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-amber-400">
            {formatCurrency(expenses.length ? totalAmount / expenses.length : 0)}
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Avg Transaction</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-primary">
            {byCategory.length > 0 ? getCatInfo(byCategory[0]._id).icon + ' ' + byCategory[0]._id : '—'}
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Top Category</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'list',     label: '📋 Expenses List' },
          { key: 'charts',   label: '📊 Analytics' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-surface border border-slate-700 text-slate-400'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── LIST TAB ── */}
      {activeTab === 'list' && (
        <div className="card overflow-x-auto">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-700/30 rounded-xl animate-pulse" />)}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-slate-400">No expenses for {monthLabel}</p>
              <button onClick={openCreate} className="btn-primary mt-4 text-sm">+ Add First Expense</button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Date','Title','Category','Vendor','Amount','Payment','By','Actions'].map(h => (
                    <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => {
                  const cat = getCatInfo(exp.category)
                  return (
                    <tr key={exp._id} className="table-row group">
                      <td className="table-cell text-xs text-slate-400 whitespace-nowrap">{formatDate(exp.date)}</td>
                      <td className="table-cell">
                        <p className="font-medium text-white text-sm">{exp.title}</p>
                        {exp.description && <p className="text-xs text-slate-500 truncate max-w-40">{exp.description}</p>}
                      </td>
                      <td className="table-cell">
                        <span className="badge text-xs" style={{ background: cat.color + '20', color: cat.color }}>
                          {cat.icon} {cat.label}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-slate-400">{exp.vendor || '—'}</td>
                      <td className="table-cell font-bold text-red-400 whitespace-nowrap">{formatCurrency(exp.amount)}</td>
                      <td className="table-cell">
                        <span className="badge badge-blue text-xs capitalize">{exp.paymentMode || 'cash'}</span>
                      </td>
                      <td className="table-cell text-xs text-slate-500">{exp.createdBy?.name || '—'}</td>
                      <td className="table-cell">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(exp)}
                            className="text-xs px-2 py-1 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(exp._id)}
                            className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-600">
                  <td colSpan={4} className="table-cell font-bold text-white">Total</td>
                  <td className="table-cell font-bold text-red-400 text-base">{formatCurrency(totalAmount)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* ── CHARTS TAB ── */}
      {activeTab === 'charts' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Category breakdown pie */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">By Category</h3>
              {pieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data</div>
              ) : (
                <div className="flex items-center gap-4">
                  <PieChart width={180} height={180}>
                    <Pie data={pieData} cx={85} cy={85} innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={v => formatCurrency(v)}
                      contentStyle={{ background:'#1E293B', border:'1px solid #334155', borderRadius:8, fontSize:12 }} />
                  </PieChart>
                  <div className="flex-1 space-y-2">
                    {byCategory.map(b => {
                      const cat = getCatInfo(b._id)
                      const pct = totalAmount > 0 ? Math.round((b.total / totalAmount) * 100) : 0
                      return (
                        <div key={b._id}>
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span style={{ color: cat.color }}>{cat.icon} {cat.label}</span>
                            <span className="text-slate-300 font-medium">{formatCurrency(b.total)}</span>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: cat.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Monthly trend bar chart */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Monthly Trend (6 months)</h3>
              {trend.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trend.map(t => ({ month: t._id, amount: Math.round(t.total) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false}
                      tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} />
                    <Tooltip
                      contentStyle={{ background:'#1E293B', border:'1px solid #334155', borderRadius:8, fontSize:12 }}
                      formatter={v => [formatCurrency(v), 'Expenses']} />
                    <Bar dataKey="amount" fill="#EF4444" radius={[4,4,0,0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {byCategory.map(b => {
              const cat = getCatInfo(b._id)
              const pct = totalAmount > 0 ? Math.round((b.total / totalAmount) * 100) : 0
              return (
                <div key={b._id} className="card">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm font-medium text-white capitalize">{cat.label}</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: cat.color }}>{formatCurrency(b.total)}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-400">{b.count} entries</p>
                    <p className="text-xs text-slate-400">{pct}%</p>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
              )
            })}
            {byCategory.length === 0 && (
              <div className="col-span-4 text-center py-8 text-slate-500 text-sm">No category data</div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Add / Edit Expense ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal w-full max-w-lg">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">
                {editExpense ? '✏️ Edit Expense' : '➕ Add Expense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body space-y-4">
              {/* Title */}
              <div>
                <label className="label">Title *</label>
                <input className="input" required placeholder="e.g. Amul Cheese 5kg"
                  value={form.title} onChange={e => set('title', e.target.value)} />
              </div>

              {/* Category + Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category *</label>
                  <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => (
                      <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₹) *</label>
                  <input type="number" className="input" required min="0.01" step="0.01"
                    placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
                </div>
              </div>

              {/* Date + Payment Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date *</label>
                  <input type="date" className="input" required
                    value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
                <div>
                  <label className="label">Payment Mode</label>
                  <select className="select" value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)}>
                    {PAYMENT_MODES.map(m => (
                      <option key={m} value={m} className="capitalize">{m.replace('_',' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vendor */}
              <div>
                <label className="label">Vendor / Supplier</label>
                <input className="input" placeholder="e.g. Amul Dairy, HP Gas Agency"
                  value={form.vendor} onChange={e => set('vendor', e.target.value)} />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} placeholder="Additional notes..."
                  value={form.description} onChange={e => set('description', e.target.value)} />
              </div>

              {/* Preview amount */}
              {form.amount && Number(form.amount) > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">{CATEGORIES.find(c=>c.key===form.category)?.icon} {form.title || 'Expense'}</p>
                    <p className="text-xs text-slate-400">{form.category} · {form.date}</p>
                  </div>
                  <p className="text-xl font-bold text-red-400">{formatCurrency(form.amount)}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 font-semibold">
                  {submitting ? '⏳ Saving...' : editExpense ? '✓ Update' : '+ Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}