import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { fetchMenu } from '../../store/slices/menuSlice'
import { createOrder } from '../../store/slices/orderSlice'
import api from '../../utils/api'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function NewOrderPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, loading } = useSelector(s => s.menu)

  const [tables, setTables] = useState([])
  const [cart, setCart] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [orderInfo, setOrderInfo] = useState({
    tableId: '', tableNumber: '', customerName: '', customerPhone: '', notes: '', orderType: 'dine-in'
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  useEffect(() => {
    dispatch(fetchMenu())
    api.get('/tables').then(r => setTables(r.data.tables || [])).catch(() => {})
  }, [])

  const CATEGORIES = ['all', ...new Set(items.map(i => i.category))]

  const filtered = items.filter(item => {
    if (!item.isAvailable) return false
    const catOk   = activeCategory === 'all' || item.category === activeCategory
    const searchOk = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return catOk && searchOk
  })

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item._id)
      if (existing) return prev.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, category: item.category, notes: '' }]
    })
  }

  const removeFromCart = (menuItemId) => setCart(prev => prev.filter(c => c.menuItemId !== menuItemId))

  const updateQty = (menuItemId, delta) => {
    setCart(prev => prev.map(c => {
      if (c.menuItemId !== menuItemId) return c
      const newQty = c.quantity + delta
      return newQty <= 0 ? null : { ...c, quantity: newQty }
    }).filter(Boolean))
  }

  const updateItemNote = (menuItemId, notes) => {
    setCart(prev => prev.map(c => c.menuItemId === menuItemId ? { ...c, notes } : c))
  }

  const handleTableSelect = (table) => {
    setOrderInfo(o => ({ ...o, tableId: table._id, tableNumber: table.tableNumber }))
  }

  const subtotal   = Math.round(cart.reduce((a, c) => a + c.price * c.quantity, 0) * 100) / 100
  const cartCount  = cart.reduce((a, c) => a + c.quantity, 0)

  const selectedTable = tables.find(t => t._id === orderInfo.tableId)
  const tableOccupied = selectedTable?.status === 'occupied'

  const handleSubmit = async () => {
    if (cart.length === 0) return toast.error('Add at least one item')
    if (!orderInfo.tableId && orderInfo.orderType === 'dine-in') return toast.error('Select a table')
    setSubmitting(true)
    try {
      const result = await dispatch(createOrder({
        tableId:       orderInfo.tableId || undefined,
        tableNumber:   orderInfo.tableNumber || undefined,
        customerName:  orderInfo.customerName || undefined,
        customerPhone: orderInfo.customerPhone || undefined,
        notes:         orderInfo.notes || undefined,
        orderType:     orderInfo.orderType,
        items: cart.map(c => ({
          menuItemId: c.menuItemId, name: c.name, price: c.price,
          quantity: c.quantity, category: c.category, notes: c.notes
        }))
      }))

      if (createOrder.fulfilled.match(result)) {
        const { order, merged } = result.payload
        setSubmitted({ order, merged })
        setCart([])
        setOrderInfo({ tableId: '', tableNumber: '', customerName: '', customerPhone: '', notes: '', orderType: 'dine-in' })
        if (merged) {
          toast.success(`Items added to existing order ${order?.orderNumber ? 'for Table ' + order.tableNumber : ''}!`, { icon: '➕', duration: 4000 })
        } else {
          toast.success(`Order ${order?.orderNumber || ''} sent to kitchen!`, { icon: '🍽️', duration: 4000 })
        }
      } else {
        toast.error(result.payload || 'Failed to create order')
      }
    } catch (e) {
      toast.error('Failed to create order')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    const { order, merged } = submitted
    return (
      <div className="max-w-md mx-auto mt-12 animate-fade-in">
        <div className="card text-center py-10">
          <div className="text-6xl mb-4">{merged ? '➕' : '🍽️'}</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {merged ? 'Items Added to Existing Order!' : 'Order Sent to Kitchen!'}
          </h2>
          <p className="text-slate-400 mb-1 font-mono text-sm">{order?.orderNumber || 'N/A'}</p>
          {order?.tableNumber && <p className="text-slate-400 mb-1">Table {order.tableNumber}</p>}
          {merged && (
            <p className="text-amber-400 text-xs mb-4 bg-amber-500/10 px-3 py-1.5 rounded-lg inline-block">
              Table was occupied — items merged into existing order
            </p>
          )}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-left space-y-1.5">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-slate-300">
                <span>{item.quantity}× {item.name}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between font-bold text-white">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSubmitted(null)} className="btn-primary flex-1 py-3">+ New Order</button>
            <button onClick={() => navigate('/orders')} className="btn-secondary flex-1 py-3">View Orders</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">New Order</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Select items → choose table → send to kitchen
          </p>
        </div>
        {cartCount > 0 && (
          <span className="badge badge-amber">{cartCount} items · {formatCurrency(subtotal)}</span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-140px)] pb-10 lg:pb-0">

        {/* LEFT — Menu */}
        <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden min-h-[400px]">
          <div className="mb-3 space-y-2">
            <input className="input" placeholder="Search menu items..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap capitalize
                    ${activeCategory === cat ? 'bg-primary text-white' : 'bg-surface border border-slate-700 text-slate-400 hover:text-white'}`}>
                  {cat === 'all'
                    ? `All (${items.filter(i=>i.isAvailable).length})`
                    : `${cat} (${items.filter(i=>i.category===cat&&i.isAvailable).length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 lg:overflow-y-auto pr-1 pb-4 lg:pb-0">
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4,5,6].map(i => <div key={i} className="card h-24 animate-pulse bg-slate-700/30" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filtered.map(item => {
                  const inCart = cart.find(c => c.menuItemId === item._id)
                  return (
                    <div key={item._id} onClick={() => addToCart(item)}
                      className={`card cursor-pointer transition-all hover:border-primary/60 hover:-translate-y-0.5 select-none
                        ${inCart ? 'border-primary/50 bg-primary/5' : 'hover:bg-slate-700/30'}`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <p className="font-semibold text-white text-xs leading-tight truncate">{item.name}</p>
                        </div>
                        {inCart && (
                          <span className="ml-1 flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-2 truncate">{item.category}</p>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-primary">{formatCurrency(item.price)}</p>
                        <span className="text-xs text-slate-500">{item.preparationTime}m</span>
                      </div>
                    </div>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="col-span-3 text-center py-10 text-slate-500">No items found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Cart + Order Info */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-3 lg:overflow-y-auto pb-6 lg:pb-0 pt-4 lg:pt-0 border-t border-slate-700 lg:border-none">

          {/* Order type + table */}
          <div className="card">
            <p className="label">Order Type</p>
            <div className="flex gap-2 mb-3">
              {[['dine-in','🪑 Dine In'],['takeaway','🥡 Takeaway']].map(([val, label]) => (
                <button key={val} onClick={() => setOrderInfo(o => ({ ...o, orderType: val, tableId: '', tableNumber: '' }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all
                    ${orderInfo.orderType === val ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {label}
                </button>
              ))}
            </div>

            {orderInfo.orderType === 'dine-in' && (
              <>
                <p className="label">Select Table</p>
                <div className="grid grid-cols-4 gap-1.5 mb-3 max-h-28 overflow-y-auto">
                  {tables.map(table => (
                    <button key={table._id} onClick={() => handleTableSelect(table)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all relative
                        ${orderInfo.tableId === table._id
                          ? 'bg-primary text-white'
                          : table.status === 'available'
                            ? 'bg-slate-800 text-green-400 border border-green-500/30 hover:border-green-500/60'
                            : table.status === 'occupied'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:border-amber-500/50'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-60'}`}>
                      {table.tableNumber}
                      {table.status === 'occupied' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></span>}
                    </button>
                  ))}
                </div>

                {tableOccupied && orderInfo.tableId && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 mb-3">
                    <p className="text-amber-400 text-xs font-semibold">⚠️ Table is occupied</p>
                    <p className="text-slate-400 text-xs mt-0.5">New items will be merged into the existing order</p>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <div>
                <p className="label">Customer Name</p>
                <input className="input text-xs py-2" placeholder="Optional"
                  value={orderInfo.customerName}
                  onChange={e => setOrderInfo(o => ({ ...o, customerName: e.target.value }))} />
              </div>
              <div>
                <p className="label">Phone</p>
                <input className="input text-xs py-2" placeholder="Optional"
                  value={orderInfo.customerPhone}
                  onChange={e => setOrderInfo(o => ({ ...o, customerPhone: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="card flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Cart {cartCount > 0 && `(${cartCount})`}</p>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-300">Clear all</button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-3xl mb-2">🛒</p>
                <p className="text-xs">Tap items on the left to add</p>
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {cart.map(item => (
                  <div key={item.menuItemId} className="bg-slate-800/60 rounded-xl p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-white flex-1 min-w-0 truncate">{item.name}</p>
                      <button onClick={() => removeFromCart(item.menuItemId)}
                        className="text-red-400 hover:text-red-300 ml-1 text-sm flex-shrink-0">×</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.menuItemId, -1)}
                          className="w-6 h-6 rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center justify-center text-sm font-bold">−</button>
                        <span className="text-sm font-bold text-white w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.menuItemId, 1)}
                          className="w-6 h-6 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors flex items-center justify-center text-sm font-bold">+</button>
                      </div>
                      <span className="text-xs font-bold text-primary">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                    <input
                      className="mt-1.5 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-primary/50"
                      placeholder="Note: spicy, no onion..."
                      value={item.notes}
                      onChange={e => updateItemNote(item.menuItemId, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div>
                  <p className="label">Order Notes</p>
                  <textarea className="input text-xs py-2" rows={2}
                    placeholder="Special instructions for kitchen..."
                    value={orderInfo.notes}
                    onChange={e => setOrderInfo(o => ({ ...o, notes: e.target.value }))} />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700 space-y-1">
                  {cart.map(item => (
                    <div key={item.menuItemId} className="flex justify-between text-xs text-slate-400">
                      <span>{item.quantity}× {item.name}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-slate-700 mt-1">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <button onClick={handleSubmit} disabled={submitting || cart.length === 0}
                  className="btn-primary w-full py-3 mt-3 font-bold text-sm disabled:opacity-50">
                  {submitting ? '⏳ Sending...' :
                    tableOccupied && orderInfo.tableId
                      ? `➕ Add to Existing Order · ${formatCurrency(subtotal)}`
                      : `🍽️ Send to Kitchen · ${formatCurrency(subtotal)}`
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}