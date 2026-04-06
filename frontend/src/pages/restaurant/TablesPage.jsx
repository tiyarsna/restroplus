import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'border-green-500/50 bg-green-500/5', dot: 'bg-green-500' },
  occupied: { label: 'Occupied', color: 'border-amber-500/50 bg-amber-500/5', dot: 'bg-amber-500' },
  reserved: { label: 'Reserved', color: 'border-blue-500/50 bg-blue-500/5', dot: 'bg-blue-500' },
  cleaning: { label: 'Cleaning', color: 'border-slate-500/50 bg-slate-500/5', dot: 'bg-slate-400' },
}

export default function TablesPage() {
  const [tables, setTables] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [floor, setFloor] = useState('All')
  const [form, setForm] = useState({ tableNumber: '', capacity: 4, floor: 'Ground' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    try { const { data } = await api.get('/tables'); setTables(data.tables) } catch {}
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/tables', { ...form, capacity: Number(form.capacity) })
      toast.success('Table added!')
      setShowModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const handleStatusChange = async (id, status) => {
    try { await api.put(`/tables/${id}`, { status }); load() } catch {}
  }

  const floors = ['All', ...new Set(tables.map(t => t.floor))]
  const filtered = floor === 'All' ? tables : tables.filter(t => t.floor === floor)
  const stats = { total: tables.length, available: tables.filter(t => t.status === 'available').length, occupied: tables.filter(t => t.status === 'occupied').length }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Table Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">+ Add Table</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tables', value: stats.total, color: 'text-white' },
          { label: 'Available', value: stats.available, color: 'text-green-400' },
          { label: 'Occupied', value: stats.occupied, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {floors.map(f => (
          <button key={f} onClick={() => setFloor(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${floor === f ? 'bg-primary text-white' : 'bg-surface border border-slate-700 text-slate-400'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map(table => {
          const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.available
          return (
            <div key={table._id} className={`card border-2 ${cfg.color} cursor-pointer hover:scale-105 transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-lg">{table.tableNumber}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`}></div>
              </div>
              <p className="text-xs text-slate-400 mb-1">👥 {table.capacity} seats</p>
              <p className="text-xs text-slate-500 mb-3">{table.floor} Floor</p>
              <select className="select text-xs py-1 px-2" value={table.status}
                onChange={e => handleStatusChange(table._id, e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">Add Table</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body space-y-4">
              <div>
                <label className="label">Table Number *</label>
                <input className="input" required value={form.tableNumber} onChange={e => set('tableNumber', e.target.value)} placeholder="T11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Capacity</label>
                  <input type="number" min="1" max="20" className="input" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
                </div>
                <div>
                  <label className="label">Floor</label>
                  <input className="input" value={form.floor} onChange={e => set('floor', e.target.value)} placeholder="Ground" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Table</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
