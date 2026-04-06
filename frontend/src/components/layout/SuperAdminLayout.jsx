import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'

export default function SuperAdminLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <aside className="w-60 bg-surface border-r border-slate-700/50 flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
            <div>
              <p className="font-bold text-white text-sm">RestroPulse</p>
              <p className="text-xs text-amber-400">Super Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {[
            { to: '/admin', label: 'Dashboard', icon: '⊞', end: true },
            { to: '/admin/restaurants', label: 'Restaurants', icon: '🏪' },
          ].map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`
              }>
              <span>{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-xs font-bold">
            {user?.name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-amber-400">SuperAdmin</p>
          </div>
          <button onClick={() => { dispatch(logout()); navigate('/login') }}
            className="text-slate-500 hover:text-red-400 transition-colors text-sm">⏏</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-surface border-b border-slate-700/50 flex items-center px-6">
          <h1 className="text-sm font-semibold text-white">Platform Control Center</h1>
          <div className="ml-auto">
            <span className="badge badge-amber text-xs">SuperAdmin</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  )
}
