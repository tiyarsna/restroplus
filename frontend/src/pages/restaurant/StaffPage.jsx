// StaffPage.jsx
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { formatDate, getRoleColor } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function StaffPage() {
  const [staff, setStaff] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'Waiter' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    try { const { data } = await api.get('/staff'); setStaff(data.staff) } catch {}
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/staff', form)
      toast.success('Staff member added!')
      setShowModal(false)
      setForm({ name: '', email: '', phone: '', password: '', role: 'Waiter' })
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this staff member?')) return
    await api.delete(`/staff/${id}`)
    toast.success('Staff deactivated')
    load()
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Staff Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">+ Add Staff</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(s => (
          <div key={s._id} className="card hover:border-slate-600 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {s.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{s.name}</p>
                <span className={`badge text-xs ${getRoleColor(s.role)}`}>{s.role}</span>
              </div>
            </div>
            <div className="space-y-1 text-xs text-slate-400 mb-3">
              <p>📧 {s.email}</p>
              {s.phone && <p>📞 {s.phone}</p>}
              <p>🗓 Joined {formatDate(s.createdAt)}</p>
            </div>
            <button onClick={() => handleDeactivate(s._id)}
              className="w-full text-xs py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              Deactivate
            </button>
          </div>
        ))}
        {staff.length === 0 && <div className="col-span-3 text-center py-10 text-slate-500">No staff added yet</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">Add Staff Member</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body space-y-4">
              {[
                { k: 'name', label: 'Full Name', type: 'text', placeholder: 'Ravi Patel', required: true },
                { k: 'email', label: 'Email', type: 'email', placeholder: 'ravi@email.com', required: true },
                { k: 'phone', label: 'Phone', type: 'text', placeholder: '9876543210' },
                { k: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 chars', required: true },
              ].map(f => (
                <div key={f.k}>
                  <label className="label">{f.label}{f.required ? ' *' : ''}</label>
                  <input type={f.type} className="input" placeholder={f.placeholder} required={f.required}
                    value={form[f.k]} onChange={e => set(f.k, e.target.value)} />
                </div>
              ))}
              <div>
                <label className="label">Role *</label>
                <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="Waiter">Waiter</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
