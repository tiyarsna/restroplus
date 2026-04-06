import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { formatDate, getPlanColor } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [total, setTotal] = useState(0)

  const load = async () => {
    try {
      const { data } = await api.get('/superadmin/restaurants', { params: { search, plan: planFilter } })
      setRestaurants(data.restaurants)
      setTotal(data.total)
    } catch {}
  }

  useEffect(() => { load() }, [search, planFilter])

  const handlePlanChange = async (id, plan) => {
    try {
      await api.patch(`/superadmin/restaurants/${id}/subscription`, { plan })
      toast.success('Plan updated')
      load()
    } catch { toast.error('Update failed') }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Restaurants</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} restaurants on platform</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input className="input flex-1" placeholder="Search restaurants..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <select className="select w-36" value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
          <option value="">All Plans</option>
          <option value="FREE">Free</option>
          <option value="BASIC">Basic</option>
          <option value="PRO">Pro</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              {['Restaurant', 'Owner', 'Location', 'Plan', 'Joined', 'Actions'].map(h => (
                <th key={h} className="table-header text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {restaurants.map(r => (
              <tr key={r._id} className="table-row">
                <td className="table-cell">
                  <p className="font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.email}</p>
                </td>
                <td className="table-cell">{r.ownerName}</td>
                <td className="table-cell text-xs">{r.location?.city}, {r.location?.state}</td>
                <td className="table-cell">
                  <span className={`badge text-xs ${getPlanColor(r.subscription?.plan)}`}>
                    {r.subscription?.plan}
                  </span>
                </td>
                <td className="table-cell text-xs text-slate-400">{formatDate(r.createdAt)}</td>
                <td className="table-cell">
                  <select className="select text-xs py-1 px-2 w-24"
                    value={r.subscription?.plan}
                    onChange={e => handlePlanChange(r._id, e.target.value)}>
                    <option value="FREE">FREE</option>
                    <option value="BASIC">BASIC</option>
                    <option value="PRO">PRO</option>
                  </select>
                </td>
              </tr>
            ))}
            {restaurants.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-slate-500 text-sm">No restaurants found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
