import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMenu, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability } from '../../store/slices/menuSlice'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const DEFAULT_CATEGORIES = ['Starters', 'Main Course', 'Desserts', 'Beverages']

const emptyForm = { name: '', category: '', price: '', description: '', isVeg: true, preparationTime: 10, tags: '' }

export default function MenuPage() {
  const dispatch = useDispatch()
  const { items, grouped, categories, loading } = useSelector(s => s.menu)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { dispatch(fetchMenu()) }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (item) => {
    setEditItem(item)
    setForm({ ...item, tags: item.tags?.join(', ') || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...form, price: Number(form.price), preparationTime: Number(form.preparationTime),
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] }
    const action = editItem
      ? updateMenuItem({ id: editItem._id, ...payload })
      : createMenuItem(payload)
    const result = await dispatch(action)
    if (createMenuItem.fulfilled.match(result) || updateMenuItem.fulfilled.match(result)) {
      toast.success(editItem ? 'Item updated!' : 'Item added!')
      setShowModal(false)
    } else {
      toast.error('Failed to save item')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    await dispatch(deleteMenuItem(id))
    toast.success('Item deleted')
  }

  const handleToggle = async (id) => {
    await dispatch(toggleAvailability(id))
  }

  const filtered = items.filter(item => {
    const catMatch = activeCategory === 'all' || item.category === activeCategory
    const searchMatch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return catMatch && searchMatch
  })

  const allCategories = useMemo(() => {
    return [...new Set([...DEFAULT_CATEGORIES, ...categories, ...items.map(i => i.category)])].filter(Boolean)
  }, [categories, items])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Menu Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">{items.length} items across {categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm">+ Add Item</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input className="input flex-1" placeholder="Search menu items..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveCategory('all')}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeCategory === 'all' ? 'bg-primary text-white' : 'bg-surface border border-slate-700 text-slate-400'}`}>
            All ({items.length})
          </button>
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-primary text-white' : 'bg-surface border border-slate-700 text-slate-400'}`}>
              {cat} ({grouped[cat]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card h-36 animate-pulse bg-slate-700/30" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item._id} className={`card transition-all hover:border-slate-600 ${!item.isAvailable ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <h3 className="font-semibold text-white text-sm truncate">{item.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{item.description}</p>
                </div>
                <p className="text-primary font-bold ml-2 flex-shrink-0">{formatCurrency(item.price)}</p>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-blue text-xs">{item.category}</span>
                {item.tags?.map(tag => (
                  <span key={tag} className="text-xs text-slate-500">#{tag}</span>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-700/50">
                <button onClick={() => handleToggle(item._id)}
                  className={`flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium
                    ${item.isAvailable ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-slate-700'}`}>
                  {item.isAvailable ? '● Available' : '○ Unavailable'}
                </button>
                <button onClick={() => openEdit(item)}
                  className="text-xs px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">✏️</button>
                <button onClick={() => handleDelete(item._id)}
                  className="text-xs px-2 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal w-full max-w-md">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">{editItem ? 'Edit Item' : 'Add Menu Item'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body space-y-4">
              <div>
                <label className="label">Item Name *</label>
                <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Masala Dosa" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="label">Category *</label>
                  <input 
                    className="input" 
                    required 
                    list="category-options"
                    value={form.category} 
                    onChange={e => set('category', e.target.value)} 
                    placeholder="e.g. Pizza" 
                  />
                  <datalist id="category-options">
                    {allCategories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="label">Price (₹) *</label>
                  <input type="number" className="input" required min="0" value={form.price}
                    onChange={e => set('price', e.target.value)} placeholder="100" />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description}
                  onChange={e => set('description', e.target.value)} placeholder="Brief description..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prep Time (min)</label>
                  <input type="number" className="input" value={form.preparationTime}
                    onChange={e => set('preparationTime', e.target.value)} />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="select" value={form.isVeg} onChange={e => set('isVeg', e.target.value === 'true')}>
                    <option value="true">🟢 Veg</option>
                    <option value="false">🔴 Non-Veg</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Tags (comma separated)</label>
                <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)}
                  placeholder="bestseller, spicy, cheese" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editItem ? 'Update' : 'Add Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
