import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login, clearError } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { label: '🏪 Admin', email: 'owner@jkspicydosa.com', password: 'Admin@123' },
  { label: '👔 Manager', email: 'manager@jkspicydosa.com', password: 'Staff@123' },
  { label: '🧑‍🍳 Waiter', email: 'amit@jkspicydosa.com', password: 'Staff@123' },
  { label: '👑 Super Admin', email: 'superadmin@restropulse.com', password: 'SuperAdmin@123' },
]

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading = false, error = null } = useSelector(s => s.auth || {})

  const [form, setForm] = useState({ email: '', password: '' })

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.email || !form.password) {
      toast.error('Enter email & password')
      return
    }

    try {
      const result = await dispatch(login(form))

      if (login.fulfilled.match(result)) {
        toast.success('Welcome!')

        const role = result.payload?.user?.role

        if (role === 'SuperAdmin') navigate('/admin')
        else if (role === 'Waiter') navigate('/new-order')
        else navigate('/dashboard')
      } else {
        toast.error(result.payload || 'Login failed')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

      {/* BLUE GLOW BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full top-[-120px] left-[-120px]"></div>
        <div className="absolute w-[400px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full bottom-[-120px] right-[-120px]"></div>
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-xl shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center font-bold">
            R
          </div>
          <span className="font-bold">RestroPulse</span>
        </div>

        <div className="flex gap-4">
          <a href="#features" className="text-sm text-gray-400 hover:text-blue-400">Features</a>
          <a href="#pricing" className="text-sm text-gray-400 hover:text-blue-400">Pricing</a>
        </div>

        <Link to="/register">
          <button className="bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2 rounded-lg text-sm hover:scale-105 transition shadow-md shadow-blue-500/20">
            Get Started
          </button>
        </Link>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 px-6 py-20">

        {/* LEFT */}
        <div>
          <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-5">
            Smart Restaurant <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-600 text-transparent bg-clip-text">
              Management Platform
            </span>
          </h1>

          <p className="text-gray-400 mb-6">
            Manage orders, billing, staff & analytics in one powerful dashboard.
          </p>

          <div className="flex gap-3">
            <Link to="/register">
              <button className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 rounded-xl font-medium hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300">
                Start Free →
              </button>
            </Link>

            <a href="#features">
              <button className="border border-white/20 px-6 py-3 rounded-xl hover:border-blue-400 hover:text-blue-400 transition">
                Explore
              </button>
            </a>
          </div>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/40">

          <h2 className="text-xl font-bold mb-4">Sign In</h2>

          {/* DEMO ACCOUNTS */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                onClick={() => setForm({ email: acc.email, password: acc.password })}
                className="bg-[#0f172a]/60 text-xs p-2 rounded-lg hover:bg-blue-500/20 hover:scale-105 transition-all duration-200 border border-white/10"
              >
                {acc.label}
              </button>
            ))}
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f172a]/70 border border-white/10 rounded-xl 
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 
              outline-none transition-all duration-200"
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f172a]/70 border border-white/10 rounded-xl 
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 
              outline-none transition-all duration-200"
            />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 py-3 rounded-xl font-semibold hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-md shadow-blue-500/20"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p className="text-sm text-gray-400 mt-4 text-center">
            New user?{' '}
            <Link to="/register" className="text-blue-400 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold mb-8 text-blue-400">Features</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            'Live Orders',
            'Billing System',
            'Analytics Dashboard',
            'Expense Tracking',
            'Role Management',
            'Menu Control'
          ].map(f => (
            <div
              key={f}
              className="bg-[#0f172a]/60 p-6 rounded-xl border border-white/10 
              hover:-translate-y-2 hover:border-blue-500/40 
              hover:shadow-lg hover:shadow-blue-500/10 
              transition-all duration-300"
            >
              {f}
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-[#0f172a]/40 py-20 px-6">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-bold mb-8 text-blue-400">Pricing</h2>

          <div className="grid md:grid-cols-3 gap-6">

            {['Starter', 'Pro', 'Enterprise'].map(p => (
              <div
                key={p}
                className="relative border border-white/10 p-6 rounded-xl 
                bg-gradient-to-b from-[#0f172a] to-[#020617] 
                hover:border-blue-500/40 hover:scale-[1.02] 
                transition-all duration-300"
              >
                {p === 'Pro' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                <h3 className="text-xl font-bold mb-2">{p}</h3>
                <p className="text-gray-400 mb-4">
                  {p === 'Starter' ? 'Free' : p === 'Pro' ? '₹999/mo' : 'Custom'}
                </p>

                <Link to={p === 'Enterprise' ? '/contact' : '/register'}>
                  <button className="w-full bg-blue-500 py-2 rounded-lg hover:bg-blue-600 transition shadow-md shadow-blue-500/20">
                    Get Started
                  </button>
                </Link>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-6 text-center text-gray-500 text-sm bg-black/40 backdrop-blur">
        © 2025 RestroPulse — Built by Tiyarsna
      </footer>

    </div>
  )
}