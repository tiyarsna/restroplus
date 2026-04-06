import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector(s => s.auth)
  const [form, setForm] = useState({
    restaurantName: '', ownerName: '', email: '', phone: '',
    password: '', address: '', city: '', state: '', pincode: '', gstNumber: ''
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(register(form))
    if (register.fulfilled.match(result)) {
      toast.success('Restaurant registered! Welcome to RestroPulse 🎉')
      navigate('/dashboard')
    } else {
      toast.error(result.payload || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl mb-3">
            <span className="text-white font-black text-xl">R</span>
          </div>
          <h1 className="text-2xl font-black text-white">Register your Restaurant</h1>
          <p className="text-slate-400 text-sm mt-1">Start free, upgrade anytime</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Restaurant Name *</label>
                <input className="input" placeholder="JK Spicy Dosa Cafe" required
                  value={form.restaurantName} onChange={e => set('restaurantName', e.target.value)} />
              </div>
              <div>
                <label className="label">Owner Name *</label>
                <input className="input" placeholder="Jayesh Kumar" required
                  value={form.ownerName} onChange={e => set('ownerName', e.target.value)} />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input className="input" placeholder="9876543210" required
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="owner@email.com" required
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" className="input" placeholder="Min 6 chars" required minLength={6}
                  value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">Address</label>
                <input className="input" placeholder="Shop No, Street"
                  value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" placeholder="Ahmedabad"
                  value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" placeholder="Gujarat"
                  value={form.state} onChange={e => set('state', e.target.value)} />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input className="input" placeholder="380001"
                  value={form.pincode} onChange={e => set('pincode', e.target.value)} />
              </div>
              <div>
                <label className="label">GST Number (optional)</label>
                <input className="input" placeholder="24ABCDE1234F1Z5"
                  value={form.gstNumber} onChange={e => set('gstNumber', e.target.value)} />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 font-semibold">
                {loading ? 'Creating Account...' : '🚀 Start Free Trial'}
              </button>
            </div>
            <p className="text-center text-sm text-slate-400">
              Already registered? <Link to="/login" className="text-primary hover:text-primary-light">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
