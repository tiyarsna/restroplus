import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/api'
import { formatCurrency, formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function BillingPage() {
  const { restaurant } = useSelector(s => s.auth)
  const [orders, setOrders] = useState([])
  const [bills, setBills] = useState([])
  const [billSummary, setBillSummary] = useState({})
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activeTab, setActiveTab] = useState('create')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [printBill, setPrintBill] = useState(null)
  const [billingForm, setBillingForm] = useState({
    gstEnabled: true,
    discountType: 'fixed',
    discountValue: 0,
    paymentMethod: 'cash',
    customerName: '',
    customerPhone: ''
  })

  const loadUnbilledOrders = useCallback(async () => {
    setLoading(true)
    try {
      // Load ALL active (served + completed but unbilled) orders
      const { data } = await api.get('/orders', { params: { status: 'served,pending,preparing' } })
      const unbilled = (Array.isArray(data) ? data : data.orders || []).filter(o => !o.isBilled)
      setOrders(unbilled)
    } catch (e) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadBills = useCallback(async () => {
    try {
      const { data } = await api.get('/billing')
      setBills(data.bills || [])
      setBillSummary(data.summary || {})
    } catch {}
  }, [])

  useEffect(() => {
    loadUnbilledOrders()
    loadBills()
  }, [])

  // Recalculate when form or order changes
  const calcTotals = () => {
    if (!selectedOrder) return { subtotal: 0, gst: 0, discount: 0, total: 0, gstRate: 0 }
    const subtotal  = Math.round(Number(selectedOrder.subtotal) * 100) / 100
    const gstRate   = billingForm.gstEnabled ? (restaurant?.settings?.gstRate || 5) : 0
    const gst       = Math.round((subtotal * gstRate / 100) * 100) / 100
    const discVal   = Math.max(0, Number(billingForm.discountValue) || 0)
    let discount    = 0
    if (billingForm.discountType === 'percentage') {
      discount = Math.round((subtotal * Math.min(discVal, 100) / 100) * 100) / 100
    } else {
      discount = Math.min(discVal, subtotal)
      discount = Math.round(discount * 100) / 100
    }
    const total = Math.round((subtotal + gst - discount) * 100) / 100
    return { subtotal, gst, discount, total, gstRate }
  }

  const handleSelectOrder = (order) => {
    setSelectedOrder(order)
    setBillingForm(f => ({
      ...f,
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || ''
    }))
  }

  const handleBill = async () => {
    if (!selectedOrder) return toast.error('Select an order first')
    if (submitting) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/billing', {
        orderId:       selectedOrder._id,
        gstEnabled:    billingForm.gstEnabled,
        discountType:  billingForm.discountType,
        discountValue: Number(billingForm.discountValue) || 0,
        paymentMethod: billingForm.paymentMethod,
        customerName:  billingForm.customerName || selectedOrder.customerName,
        customerPhone: billingForm.customerPhone || selectedOrder.customerPhone
      })
      toast.success(`Bill ${data.bill.billNumber} generated! 🎉`)
      setPrintBill(data.bill)
      setSelectedOrder(null)
      setBillingForm({ gstEnabled: true, discountType: 'fixed', discountValue: 0, paymentMethod: 'cash', customerName: '', customerPhone: '' })
      loadUnbilledOrders()
      loadBills()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Billing failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBill = async (billId) => {
    if (!confirm('Are you sure you want to delete this bill? This will reverse revenue from sales and restore the order back to Active queue.')) return;
    try {
      setSubmitting(true)
      const { data } = await api.delete(`/billing/${billId}`)
      toast.success(data.message || 'Bill deleted and order restored')
      setPrintBill(null)
      loadUnbilledOrders()
      loadBills()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete bill')
    } finally {
      setSubmitting(false)
    }
  }

  const t = calcTotals()

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing System</h1>
          <p className="text-slate-400 text-sm mt-0.5">{restaurant?.name}</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'create',  label: '🧾 Create Bill' },
            { key: 'history', label: '📋 History' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-surface border border-slate-700 text-slate-400'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Order selection */}
          <div className="space-y-3">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Active Orders — Select to Bill</h3>
                <button onClick={loadUnbilledOrders} className="text-xs text-primary hover:text-primary-light">↻ Refresh</button>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-700/30 rounded-xl animate-pulse" />)}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-3xl mb-2">🧾</p>
                  <p className="text-sm">No active orders</p>
                  <p className="text-xs mt-1">Orders appear here once created</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {orders.map(order => (
                    <div key={order._id}
                      onClick={() => handleSelectOrder(order)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border
                        ${selectedOrder?._id === order._id
                          ? 'bg-primary/20 border-primary/50'
                          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'}`}>
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-white text-sm">
                              {order.tableNumber ? `Table ${order.tableNumber}` : '🥡 Takeaway'}
                            </p>
                            <span className={`badge text-xs
                              ${order.status === 'served' ? 'badge-purple' :
                                order.status === 'preparing' ? 'badge-blue' : 'badge-amber'}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {order?.customerName || 'Guest'} · {order?.items?.length} item{order?.items?.length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">{order?.orderNumber || 'N/A'}</p>
                        </div>
                        <p className="font-bold text-white ml-2 flex-shrink-0">{formatCurrency(order?.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Bill preview */}
          <div>
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Bill Preview</h3>
              {!selectedOrder ? (
                <div className="text-center py-10 text-slate-500">
                  <p className="text-3xl mb-2">←</p>
                  <p className="text-sm">Select an order to generate bill</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Order header */}
                  <div className="bg-slate-800/50 rounded-xl p-3 text-sm space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Order#</span>
                      <span className="font-mono text-xs text-white">{selectedOrder?.orderNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Table</span>
                      <span className="text-white">{selectedOrder.tableNumber || 'Takeaway'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className={`badge text-xs ${selectedOrder.status === 'served' ? 'badge-purple' : 'badge-blue'}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Customer Name</label>
                      <input className="input text-xs py-2" value={billingForm.customerName}
                        onChange={e => setBillingForm(f => ({ ...f, customerName: e.target.value }))}
                        placeholder="Guest" />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input className="input text-xs py-2" value={billingForm.customerPhone}
                        onChange={e => setBillingForm(f => ({ ...f, customerPhone: e.target.value }))}
                        placeholder="Optional" />
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="bg-slate-800/30 rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-300 flex-1 min-w-0 truncate">
                          {item.quantity}× {item.name}
                          {item.notes && <span className="text-amber-400 ml-1">({item.notes})</span>}
                        </span>
                        <span className="text-slate-300 ml-2 flex-shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <hr className="border-slate-700" />

                  {/* Billing options */}
                  <div className="space-y-3">
                    {/* GST toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">GST ({restaurant?.settings?.gstRate || 5}%)</p>
                        <p className="text-xs text-slate-500">Goods & Services Tax</p>
                      </div>
                      <button
                        onClick={() => setBillingForm(f => ({ ...f, gstEnabled: !f.gstEnabled }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${billingForm.gstEnabled ? 'bg-primary' : 'bg-slate-600'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow
                          ${billingForm.gstEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    {/* Discount */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">Discount Type</label>
                        <select className="select" value={billingForm.discountType}
                          onChange={e => setBillingForm(f => ({ ...f, discountType: e.target.value, discountValue: 0 }))}>
                          <option value="fixed">Fixed Amount (₹)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">
                          {billingForm.discountType === 'percentage' ? 'Discount %' : 'Discount ₹'}
                        </label>
                        <input type="number" min="0"
                          max={billingForm.discountType === 'percentage' ? 100 : selectedOrder.subtotal}
                          step="0.01"
                          className="input"
                          value={billingForm.discountValue}
                          onChange={e => setBillingForm(f => ({ ...f, discountValue: e.target.value }))} />
                      </div>
                    </div>

                    {/* Payment method */}
                    <div>
                      <label className="label">Payment Method</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[['cash','💵 Cash'],['upi','📱 UPI'],['card','💳 Card'],['other','⚙️ Other']].map(([val, label]) => (
                          <button key={val}
                            onClick={() => setBillingForm(f => ({ ...f, paymentMethod: val }))}
                            className={`py-2 rounded-xl text-xs font-semibold transition-all
                              ${billingForm.paymentMethod === val ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="bg-slate-800/50 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between text-sm text-slate-300">
                      <span>Subtotal ({selectedOrder.items?.length} items)</span>
                      <span>{formatCurrency(t.subtotal)}</span>
                    </div>
                    {billingForm.gstEnabled && t.gstRate > 0 && (
                      <div className="flex justify-between text-sm text-slate-300">
                        <span>GST ({t.gstRate}%)</span>
                        <span className="text-green-400">+{formatCurrency(t.gst)}</span>
                      </div>
                    )}
                    {t.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">
                          Discount {billingForm.discountType === 'percentage' ? `(${billingForm.discountValue}%)` : ''}
                        </span>
                        <span className="text-green-400">-{formatCurrency(t.discount)}</span>
                      </div>
                    )}
                    <hr className="border-slate-700" />
                    <div className="flex justify-between font-bold text-white text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(t.total)}</span>
                    </div>
                  </div>

                  <button onClick={handleBill} disabled={submitting}
                    className="btn-primary w-full py-3 font-bold text-sm">
                    {submitting ? '⏳ Processing...' : `🧾 Generate Bill & Mark Paid · ${formatCurrency(t.total)}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* HISTORY TAB */
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-xl font-bold text-green-400">{formatCurrency(billSummary.totalRevenue || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">Total Revenue</p>
            </div>
            <div className="card text-center">
              <p className="text-xl font-bold text-white">{billSummary.totalBills || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Total Bills</p>
            </div>
            <div className="card text-center">
              <p className="text-xl font-bold text-primary">
                {formatCurrency(billSummary.totalBills ? (billSummary.totalRevenue / billSummary.totalBills) : 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Avg Bill</p>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Bill#','Table','Customer','Items','Subtotal','GST','Discount','Total','Payment','Date'].map(h => (
                    <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <tr key={bill._id} className="table-row cursor-pointer hover:bg-slate-700/20"
                    onClick={() => setPrintBill(bill)}>
                    <td className="table-cell font-mono text-xs text-slate-400 whitespace-nowrap">{bill.billNumber}</td>
                    <td className="table-cell">{bill.tableNumber || '-'}</td>
                    <td className="table-cell">{bill.customerName || 'Guest'}</td>
                    <td className="table-cell">{bill.items?.length || 0}</td>
                    <td className="table-cell">{formatCurrency(bill.subtotal)}</td>
                    <td className="table-cell text-green-400">+{formatCurrency(bill.gstAmount)}</td>
                    <td className="table-cell text-red-400">
                      {bill.discountAmount > 0 ? `-${formatCurrency(bill.discountAmount)}` : '—'}
                    </td>
                    <td className="table-cell font-bold text-white whitespace-nowrap">{formatCurrency(bill.totalAmount)}</td>
                    <td className="table-cell">
                      <span className="badge badge-green text-xs capitalize">{bill.paymentMethod}</span>
                    </td>
                    <td className="table-cell text-xs text-slate-400 whitespace-nowrap">{formatDateTime(bill.createdAt)}</td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-10 text-slate-500 text-sm">No bills yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Bill Modal */}
      {printBill && (
        <div className="modal-overlay" onClick={() => setPrintBill(null)}>
          <div className="modal max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">Bill Receipt</h2>
              <button onClick={() => setPrintBill(null)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="modal-body">
              {/* Printable receipt */}
              <div className="bg-white text-black rounded-xl p-4 text-sm font-mono" id="receipt">
                <div className="text-center mb-3 border-b border-gray-300 pb-3">
                  <p className="font-bold text-base">{restaurant?.name}</p>
                  <p className="text-xs text-gray-500">{restaurant?.location?.address}</p>
                  {restaurant?.gstNumber && <p className="text-xs">GST: {restaurant.gstNumber}</p>}
                </div>
                <div className="space-y-1 text-xs mb-3">
                  <div className="flex justify-between"><span>Bill#</span><span>{printBill.billNumber}</span></div>
                  <div className="flex justify-between"><span>Table</span><span>{printBill.tableNumber || 'Takeaway'}</span></div>
                  <div className="flex justify-between"><span>Customer</span><span>{printBill.customerName || 'Guest'}</span></div>
                  <div className="flex justify-between"><span>Payment</span><span className="capitalize">{printBill.paymentMethod}</span></div>
                  <div className="flex justify-between"><span>Date</span><span>{formatDateTime(printBill.createdAt)}</span></div>
                </div>
                <div className="border-t border-b border-gray-300 py-2 mb-2 space-y-1">
                  {printBill.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{item.quantity}× {item.name}</span>
                      <span>₹{item.amount?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{printBill.subtotal?.toFixed(2)}</span></div>
                  {printBill.gstAmount > 0 && <div className="flex justify-between"><span>GST ({printBill.gstRate}%)</span><span>+₹{printBill.gstAmount?.toFixed(2)}</span></div>}
                  {printBill.discountAmount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>-₹{printBill.discountAmount?.toFixed(2)}</span></div>}
                  <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-1 mt-1">
                    <span>TOTAL</span><span>₹{printBill.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-center mt-3 text-xs text-gray-400">Thank you! Visit again 🙏</div>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex gap-3">
                  <button onClick={() => window.print()} className="btn-primary flex-1 py-2.5 text-sm">🖨️ Print</button>
                  <button onClick={() => setPrintBill(null)} className="btn-secondary flex-1 py-2.5 text-sm">Close</button>
                </div>
                <button 
                  onClick={() => handleDeleteBill(printBill._id)} 
                  disabled={submitting}
                  className="w-full py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-xs font-bold transition-colors">
                  🗑️ Delete Bill & Restore Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}