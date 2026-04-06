import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const REASONS = ['overcooked', 'unsold', 'returned', 'expired', 'damaged', 'other']

export default function WastePage() {
  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState([])
  const [period, setPeriod] = useState('7d')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ itemName: '', category: 'Fancy Dosa', quantity: 1, unit: 'portions', reason: 'unsold', estimatedCost: '', notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    try {
      const { data } = await api.get('/waste', { params: { period } })
      setLogs(data.logs)
      setSummary(data.summary)
    } catch {}
  }

  useEffect(() => { load() }, [period])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/waste', { ...form, quantity: Number(form.quantity), estimatedCost: Number(form.estimatedCost) })
      toast.success('Waste logged')
      setShowModal(false)
      setForm({ itemName: '', category: 'Fancy Dosa', quantity: 1, unit: 'portions', reason: 'unsold', estimatedCost: '', notes: '' })
      load()
    } catch (err) { toast.error('Failed to log waste') }
  }

  const totalCost = summary.reduce((a, s) => a + (s.totalCost || 0), 0)
  const totalQty = summary.reduce((a, s) => a + (s.totalQty || 0), 0)

  const REASON_COLORS = { overcooked: 'text-orange-400', unsold: 'text-amber-400', returned: 'text-red-400', expired: 'text-red-500', damaged: 'text-rose-400', other: 'text-slate-400' }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Waste Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and reduce food waste</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">+ Log Waste</button>
      </div>

      {/* Period */}
      <div className="flex gap-2">
        {['1d', '7d', '30d'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-primary text-white' : 'bg-surface border border-slate-700 text-slate-400'}`}>
            {p === '1d' ? 'Today' : p === '7d' ? '7 Days' : '30 Days'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalCost)}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Waste Cost</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-amber-400">{totalQty}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Portions</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-white">{logs.length}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Waste Entries</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-secondary">{totalCost > 0 ? Math.round((1 - totalCost / (totalCost * 1.5)) * 100) : 0}%</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Potential Savings</p>
        </div>
      </div>

      {/* Summary by reason */}
      {summary.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">By Reason</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {summary.map(s => (
              <div key={s._id} className="bg-slate-800/50 rounded-xl p-3">
                <p className={`text-xs font-medium capitalize ${REASON_COLORS[s._id] || 'text-slate-400'}`}>{s._id}</p>
                <p className="text-lg font-bold text-white mt-1">{s.count} entries</p>
                <p className="text-xs text-slate-400">{s.totalQty} portions · {formatCurrency(s.totalCost)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="card overflow-x-auto">
        <h3 className="text-sm font-semibold text-white mb-4">Waste Log</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              {['Item', 'Category', 'Qty', 'Reason', 'Cost', 'Notes', 'Date'].map(h => (
                <th key={h} className="table-header text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log._id} className="table-row">
                <td className="table-cell font-medium">{log.itemName}</td>
                <td className="table-cell text-slate-400">{log.category}</td>
                <td className="table-cell">{log.quantity} {log.unit}</td>
                <td className="table-cell">
                  <span className={`badge text-xs px-2 py-0.5 capitalize ${REASON_COLORS[log.reason]} bg-current/10`}>{log.reason}</span>
                </td>
                <td className="table-cell text-red-400">{formatCurrency(log.estimatedCost)}</td>
                <td className="table-cell text-xs text-slate-500">{log.notes || '-'}</td>
                <td className="table-cell text-xs text-slate-400">{formatDate(log.date)}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-slate-500 text-sm">No waste logged for this period 🎉</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">Log Waste</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Item Name *</label>
                  <input className="input" required value={form.itemName} onChange={e => set('itemName', e.target.value)} placeholder="Masala Dosa" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <input className="input" value={form.category} onChange={e => set('category', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quantity *</label>
                  <input type="number" min="0.1" step="0.1" className="input" required value={form.quantity}
                    onChange={e => set('quantity', e.target.value)} />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select className="select" value={form.unit} onChange={e => set('unit', e.target.value)}>
                    {['portions', 'kg', 'g', 'litres', 'pieces'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Reason *</label>
                  <select className="select" value={form.reason} onChange={e => set('reason', e.target.value)}>
                    {REASONS.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Estimated Cost (₹)</label>
                  <input type="number" min="0" className="input" value={form.estimatedCost}
                    onChange={e => set('estimatedCost', e.target.value)} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Any additional notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Log Waste</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
