import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  fetchLiveOrders,
  updateOrderStatus,
  addLiveOrder,
  updateLiveOrder
} from '../../store/slices/orderSlice'
import { getSocket } from '../../utils/socket'
import { formatCurrency, timeAgo } from '../../utils/helpers'
import toast from 'react-hot-toast'

const STATUS_FLOW = {
  pending: 'preparing',
  preparing: 'served',
  served: 'completed'
}

const STATUS_LABELS = {
  pending: 'Accept & Prepare',
  preparing: 'Mark Ready',
  served: 'Complete & Bill'
}

export default function LiveOrdersPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // ✅ SAFE fallback
  const { liveOrders = [], liveLoading } = useSelector(s => s.orders || {})

  const [filter, setFilter] = useState('all')

  useEffect(() => {
    dispatch(fetchLiveOrders())

    const socket = getSocket()
    if (!socket) return

    socket.off('order:new')
    socket.off('order:update')

    socket.on('order:new', (order) => {
      dispatch(addLiveOrder(order))
      toast.success(`New order: ${order?.orderNumber || 'N/A'}`, {
        icon: '🔔',
        duration: 4000
      })
    })

    socket.on('order:update', (order) => {
      dispatch(updateLiveOrder(order))
    })

    socket.on('order:kitchen_accepted', () => {
      toast.success('Order accepted by kitchen')
    })

    socket.on('order:ready', () => {
      toast.success('Order ready to serve')
    })

    return () => {
      socket.off('order:new')
      socket.off('order:update')
      socket.off('order:kitchen_accepted')
      socket.off('order:ready')
    }
  }, [dispatch])

  const handleStatusUpdate = async (orderId, currentStatus) => {
    const next = STATUS_FLOW[currentStatus]
    if (!next) return

    const result = await dispatch(updateOrderStatus({ id: orderId, status: next }))

    if (updateOrderStatus.fulfilled.match(result)) {
      if (next === 'completed') {
        toast.success('Order completed! Go to Billing.')
        navigate('/billing')
      } else {
        toast.success(`Order ${next}`)
      }
    }
  }

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return

    const result = await dispatch(
      updateOrderStatus({ id: orderId, status: 'cancelled' })
    )

    if (updateOrderStatus.fulfilled.match(result)) {
      toast.error('Order cancelled')
    }
  }

  // ✅ SAFE filtering
  const filtered =
    filter === 'all'
      ? liveOrders
      : (liveOrders || []).filter(o => o.status === filter)

  // ✅ SAFE counts
  const counts = {
    pending: (liveOrders || []).filter(o => o.status === 'pending').length,
    preparing: (liveOrders || []).filter(o => o.status === 'preparing').length,
    served: (liveOrders || []).filter(o => o.status === 'served').length
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-white">Live Orders</h1>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/new-order')}
            className="btn-primary text-sm"
          >
            ➕ New Order
          </button>
          <button
            onClick={() => dispatch(fetchLiveOrders())}
            className="btn-secondary text-sm"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: `All (${liveOrders.length})` },
          { key: 'pending', label: `Pending (${counts.pending})` },
          { key: 'preparing', label: `Preparing (${counts.preparing})` },
          { key: 'served', label: `Served (${counts.served})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm ${
              filter === tab.key
                ? 'bg-primary text-white'
                : 'bg-surface text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {liveLoading ? (
        <p className="text-slate-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400">No orders</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(order => (
            <div key={order._id} className="card">
              <div className="flex justify-between">
                <div>
                  <p className="text-white font-bold">
                    {order?.orderNumber || 'N/A'}
                  </p>
                  <p className="text-sm text-slate-400">
                    {order.tableNumber
                      ? `Table ${order.tableNumber}`
                      : 'Takeaway'}
                  </p>
                </div>

                <span className="text-xs bg-slate-700 px-2 py-1 rounded">
                  {order.status}
                </span>
              </div>

              <div className="mt-3 space-y-1">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}× {item.name}
                    </span>
                    <span>
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-3">
                <span className="text-white font-bold">
                  {formatCurrency(order.subtotal || 0)}
                </span>
                <span className="text-xs text-slate-500">
                  {timeAgo(order.createdAt)}
                </span>
              </div>

              <div className="flex gap-2 mt-3">
                {STATUS_FLOW[order.status] && (
                  <button
                    onClick={() =>
                      handleStatusUpdate(order._id, order.status)
                    }
                    className="btn-primary flex-1 text-xs"
                  >
                    {STATUS_LABELS[order.status]}
                  </button>
                )}

                {order.status !== 'completed' &&
                  order.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancel(order._id)}
                      className="btn-danger text-xs px-3"
                    >
                      ✕
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}