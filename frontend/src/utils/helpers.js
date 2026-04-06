export const formatCurrency = (amount, symbol = '₹') =>
  `${symbol}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

export const formatDateTime = (date) => `${formatDate(date)}, ${formatTime(date)}`

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return formatDate(date)
}

export const getOrderStatusColor = (status) => {
  const colors = {
    pending: 'text-amber-400 bg-amber-400/10',
    preparing: 'text-blue-400 bg-blue-400/10',
    served: 'text-purple-400 bg-purple-400/10',
    completed: 'text-green-400 bg-green-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
    draft: 'text-slate-400 bg-slate-400/10'
  }
  return colors[status] || colors.pending
}

export const getRoleColor = (role) => {
  const colors = {
    SuperAdmin: 'text-amber-400 bg-amber-400/10',
    RestaurantAdmin: 'text-purple-400 bg-purple-400/10',
    Manager: 'text-blue-400 bg-blue-400/10',
    Waiter: 'text-green-400 bg-green-400/10'
  }
  return colors[role] || 'text-slate-400 bg-slate-400/10'
}

export const getPlanColor = (plan) => {
  const colors = {
    FREE: 'text-slate-400 bg-slate-400/10',
    BASIC: 'text-blue-400 bg-blue-400/10',
    PRO: 'text-amber-400 bg-amber-400/10'
  }
  return colors[plan] || colors.FREE
}

export const countdownTimer = (expiryTime) => {
  const diff = new Date(expiryTime) - new Date()
  if (diff <= 0) return { display: 'Expired', minutes: 0, seconds: 0, expired: true }
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { display: `${minutes}m ${seconds}s`, minutes, seconds, expired: false }
}

export const getDiscountColor = (pct) => {
  if (pct >= 70) return 'text-red-400'
  if (pct >= 50) return 'text-amber-400'
  return 'text-green-400'
}

export const truncate = (str, n = 30) => str?.length > n ? str.slice(0, n) + '...' : str

export const PLAN_FEATURES = {
  FREE: {
    label: 'Free', price: 0, color: 'slate',
    features: ['Basic menu management', 'Basic billing', 'Max 5 staff', 'Single branch'],
    missing: ['Realtime orders', 'Analytics', 'Waste tracking', 'SaveBite Mode']
  },
  BASIC: {
    label: 'Basic', price: 999, color: 'blue',
    features: ['Realtime orders (Socket.IO)', 'Unlimited staff', 'Table management', 'Expense tracking', 'Basic analytics', 'Manual waste tracking'],
    missing: ['Advanced analytics', 'AI waste insights', 'SaveBite Mode', 'Multi-branch']
  },
  PRO: {
    label: 'Pro', price: 2499, color: 'amber',
    features: ['Advanced analytics', 'AI waste insights', 'SaveBite Mode', 'Multi-branch support', 'Priority support', 'All Basic features'],
    missing: []
  }
}
