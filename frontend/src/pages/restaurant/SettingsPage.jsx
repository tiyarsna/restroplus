import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateSettings } from '../../store/slices/restaurantSlice'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const dispatch = useDispatch()
  const { restaurant } = useSelector(s => s.auth)
  const [settings, setSettings] = useState(restaurant?.settings || {
    gstEnabled: true, gstRate: 5, savebiteEnabled: false, autoSavebiteDiscount: true,
    openTime: '07:00', closeTime: '23:00', currency: 'INR', currencySymbol: '₹'
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    const result = await dispatch(updateSettings(settings))
    setSaving(false)
    if (updateSettings.fulfilled.match(result)) toast.success('Settings saved!')
    else toast.error('Failed to save settings')
  }

  const handleResetData = async () => {
    const confirmation = prompt('DANGER ZONE: Type "RESET" to confirm deletion of ALL Orders and Bills. This cannot be undone!')
    if (confirmation !== 'RESET') {
      if (confirmation) toast.error('Invalid confirmation phrase')
      return;
    }
    
    try {
      setSaving(true)
      const { data } = await api.delete('/orders/reset', { data: { confirmation: 'RESET' } })
      toast.success(data.message || 'Sales data reset successfully!')
      // Optionally reload the page to refresh stats
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset sales data')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Restaurant Settings</h1>

      {/* Billing Settings */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-slate-700/50 pb-3">💰 Billing & Tax</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">GST Enabled</p>
            <p className="text-xs text-slate-400">Apply GST to all bills</p>
          </div>
          <button onClick={() => set('gstEnabled', !settings.gstEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.gstEnabled ? 'bg-primary' : 'bg-slate-600'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.gstEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
        {settings.gstEnabled && (
          <div>
            <label className="label">GST Rate (%)</label>
            <input type="number" min="0" max="28" className="input w-32"
              value={settings.gstRate} onChange={e => set('gstRate', Number(e.target.value))} />
          </div>
        )}
      </div>

      {/* Operating Hours */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-slate-700/50 pb-3">🕐 Operating Hours</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Opening Time</label>
            <input type="time" className="input" value={settings.openTime} onChange={e => set('openTime', e.target.value)} />
          </div>
          <div>
            <label className="label">Closing Time</label>
            <input type="time" className="input" value={settings.closeTime} onChange={e => set('closeTime', e.target.value)} />
          </div>
        </div>
      </div>

      {/* SaveBite Settings */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-white border-b border-slate-700/50 pb-3">🍱 SaveBite Mode</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Enable SaveBite</p>
            <p className="text-xs text-slate-400">Allow listing leftover food at discounted prices</p>
          </div>
          <button onClick={() => set('savebiteEnabled', !settings.savebiteEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.savebiteEnabled ? 'bg-secondary' : 'bg-slate-600'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.savebiteEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
        {settings.savebiteEnabled && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Auto Discount Calculation</p>
              <p className="text-xs text-slate-400">Automatically apply discount based on expiry time</p>
            </div>
            <button onClick={() => set('autoSavebiteDiscount', !settings.autoSavebiteDiscount)}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoSavebiteDiscount ? 'bg-secondary' : 'bg-slate-600'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.autoSavebiteDiscount ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3 font-semibold">
        {saving ? 'Saving...' : '💾 Save Settings'}
      </button>

      {/* Danger Zone */}
      <div className="card space-y-4 border border-red-500/30 bg-red-500/5 mt-8">
        <h3 className="text-sm font-semibold text-red-400 border-b border-red-500/20 pb-3">⚠️ Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Reset All Sales Data</p>
            <p className="text-xs text-red-300 mt-1">Permanently deletes all orders, bills, and resets revenue counters to zero.</p>
          </div>
          <button onClick={handleResetData} disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors">
            Reset Data
          </button>
        </div>
      </div>
    </div>
  )
}
