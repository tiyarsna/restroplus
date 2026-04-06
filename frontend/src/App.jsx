import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadUser } from './store/slices/authSlice'
import { initSocket } from './utils/socket'

import RestaurantLayout from './components/layout/RestaurantLayout'
import SuperAdminLayout from './components/layout/SuperAdminLayout'

// Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Restaurant pages
import DashboardPage from './pages/restaurant/DashboardPage'
import LiveOrdersPage from './pages/restaurant/LiveOrdersPage'
import NewOrderPage from './pages/restaurant/NewOrderPage'
import MenuPage from './pages/restaurant/MenuPage'
import TablesPage from './pages/restaurant/TablesPage'
import BillingPage from './pages/restaurant/BillingPage'
import WastePage from './pages/restaurant/WastePage'
import StaffPage from './pages/restaurant/StaffPage'
import AnalyticsPage from './pages/restaurant/AnalyticsPage'
import SubscriptionPage from './pages/restaurant/SubscriptionPage'
import SettingsPage from './pages/restaurant/SettingsPage'
import SaveBitePage from './pages/restaurant/SaveBitePage'
import ExpensePage from './pages/restaurant/ExpensePage'
import ProfilePage from './pages/restaurant/ProfilePage' // ✅ NEW

// SuperAdmin pages
import SuperDashboard from './pages/admin/SuperDashboard'
import ManageRestaurants from './pages/admin/ManageRestaurants'

// Customer
import CustomerDealsPage from './pages/customer/CustomerDealsPage'


// ── Route Guards ─────────────────────────────────────────
const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user, token } = useSelector(s => s.auth || {})

  if (!token && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    if (user.role === 'Waiter') return <Navigate to="/new-order" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector(s => s.auth || {})

  if (isAuthenticated && user) {
    if (user.role === 'SuperAdmin') return <Navigate to="/admin" replace />
    if (user.role === 'Waiter') return <Navigate to="/new-order" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Admin + Manager only
const AdminOnly = ({ children }) => (
  <PrivateRoute roles={['RestaurantAdmin', 'Manager']}>
    {children}
  </PrivateRoute>
)


// ── App ─────────────────────────────────────────────────
export default function App() {
  const dispatch = useDispatch()
  const { token } = useSelector(s => s.auth || {})

  useEffect(() => {
    if (token) {
      dispatch(loadUser())
      initSocket(token)
    }
  }, [token, dispatch])

  return (
    <Routes>

      {/* Public */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/deals" element={<CustomerDealsPage />} />

      {/* Restaurant */}
      <Route path="/" element={<PrivateRoute><RestaurantLayout /></PrivateRoute>}>

        {/* Waiter + All */}
        <Route path="new-order" element={<NewOrderPage />} />
        <Route path="orders" element={<LiveOrdersPage />} />
        <Route path="billing" element={<BillingPage />} />

        {/* Admin + Manager */}
        <Route path="dashboard" element={<AdminOnly><DashboardPage /></AdminOnly>} />
        <Route path="menu" element={<AdminOnly><MenuPage /></AdminOnly>} />
        <Route path="tables" element={<AdminOnly><TablesPage /></AdminOnly>} />
        <Route path="expenses" element={<AdminOnly><ExpensePage /></AdminOnly>} />
        <Route path="waste" element={<AdminOnly><WastePage /></AdminOnly>} />
        <Route path="savebite" element={<AdminOnly><SaveBitePage /></AdminOnly>} />
        <Route path="analytics" element={<AdminOnly><AnalyticsPage /></AdminOnly>} />
        <Route path="staff" element={<AdminOnly><StaffPage /></AdminOnly>} />

        {/* Admin only */}
        <Route
          path="subscription"
          element={
            <PrivateRoute roles={['RestaurantAdmin']}>
              <SubscriptionPage />
            </PrivateRoute>
          }
        />

        <Route
          path="settings"
          element={
            <PrivateRoute roles={['RestaurantAdmin']}>
              <SettingsPage />
            </PrivateRoute>
          }
        />

        {/* ✅ NEW PROFILE ROUTE */}
        <Route
          path="profile"
          element={
            <PrivateRoute roles={['RestaurantAdmin']}>
              <ProfilePage />
            </PrivateRoute>
          }
        />

      </Route>

      {/* SuperAdmin */}
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={['SuperAdmin']}>
            <SuperAdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<SuperDashboard />} />
        <Route path="restaurants" element={<ManageRestaurants />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  )
}