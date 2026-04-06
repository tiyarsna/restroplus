import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { disconnectSocket } from '../../utils/socket'
import { toggleSidebar } from '../../store/slices/uiSlice'

// ✅ NAV ITEMS
const NAV_ITEMS = [
  { path: '/dashboard',    icon: '⊞',  label: 'Dashboard',    roles: ['RestaurantAdmin','Manager'] },
  { path: '/new-order',    icon: '➕',  label: 'New Order',    roles: ['RestaurantAdmin','Manager','Waiter'], highlight: true },
  { path: '/orders',       icon: '⚡',  label: 'Live Orders',  roles: ['RestaurantAdmin','Manager','Waiter'] },
  { path: '/billing',      icon: '🧾',  label: 'Billing',      roles: ['RestaurantAdmin','Manager','Waiter'] },
  { path: '/menu',         icon: '📋',  label: 'Menu',         roles: ['RestaurantAdmin','Manager'] },
  { path: '/tables',       icon: '🪑',  label: 'Tables',       roles: ['RestaurantAdmin','Manager'] },
  { path: '/expenses',     icon: '💸',  label: 'Expenses',     roles: ['RestaurantAdmin','Manager'] },
  { path: '/waste',        icon: '♻️',  label: 'Waste',        roles: ['RestaurantAdmin','Manager'] },
  { path: '/savebite',     icon: '🍱',  label: 'SaveBite',     roles: ['RestaurantAdmin','Manager'] },
  { path: '/analytics',    icon: '📊',  label: 'Analytics',    roles: ['RestaurantAdmin','Manager'] },
  { path: '/staff',        icon: '👥',  label: 'Staff',        roles: ['RestaurantAdmin','Manager'] },

  // 🔥 ADMIN ONLY
  { path: '/subscription', icon: '💎',  label: 'Subscription', roles: ['RestaurantAdmin'] },
  { path: '/settings',     icon: '⚙️',  label: 'Settings',     roles: ['RestaurantAdmin'] },
  { path: '/profile',      icon: '👤',  label: 'Profile',      roles: ['RestaurantAdmin'] },
]

// 🎨 ROLE COLORS
const ROLE_COLORS = {
  RestaurantAdmin: 'text-purple-400',
  Manager: 'text-blue-400',
  Waiter: 'text-green-400',
}


// ✅ IMPORTANT: DEFAULT EXPORT
export default function RestaurantLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { user, restaurant } = useSelector(s => s.auth || {})
  const { sidebarOpen } = useSelector(s => s.ui || {})

  const handleLogout = () => {
    disconnectSocket()
    dispatch(logout())
    navigate('/login')
  }

  const navItems = NAV_ITEMS.filter(item =>
    item.roles.includes(user?.role)
  )

  const isWaiter = user?.role === 'Waiter'

  return (
    <div className="flex h-screen bg-bg overflow-hidden">

      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-surface border-r border-slate-700/50 flex flex-col transition-all`}>

        {/* LOGO */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700/50">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            R
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-white font-bold">RestroPulse</p>
              <p className="text-xs text-slate-400">{restaurant?.name}</p>
            </div>
          )}
        </div>

        {/* NAV */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                ${isActive ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-white'}`
              }
            >
              <span>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* USER */}
        <div className="p-3 border-t border-slate-700/50">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                {user?.name?.[0]}
              </div>

              <div className="flex-1">
                <p className="text-xs text-white">{user?.name}</p>
                <p className={`text-xs ${ROLE_COLORS[user?.role]}`}>
                  {user?.role}
                </p>
              </div>

              <button onClick={handleLogout} className="text-red-400">
                ⏏
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full text-center text-red-400">
              ⏏
            </button>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <header className="h-14 bg-surface border-b flex items-center px-4">
          <button onClick={() => dispatch(toggleSidebar())}>☰</button>
          <h1 className="ml-4 text-white text-sm">{restaurant?.name}</h1>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-4 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}