import { useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: ''
  })

  const updateProfile = async () => {
    try {
      await api.put('/restaurants/profile', profile)
      toast.success('Profile updated')
    } catch {
      toast.error('Update failed')
    }
  }

  const changePassword = async () => {
    try {
      await api.put('/restaurants/change-password', password)
      toast.success('Password changed')
    } catch {
      toast.error('Wrong current password')
    }
  }

  return (
    <div className="space-y-6">

      <div className="card">
        <h2 className="text-white mb-3">Profile</h2>

        <input
          placeholder="Name"
          className="input mb-2"
          onChange={e => setProfile({ ...profile, name: e.target.value })}
        />

        <input
          placeholder="Email"
          className="input mb-2"
          onChange={e => setProfile({ ...profile, email: e.target.value })}
        />

        <button onClick={updateProfile} className="btn-primary">
          Update Profile
        </button>
      </div>

      <div className="card">
        <h2 className="text-white mb-3">Change Password</h2>

        <input
          type="password"
          placeholder="Current Password"
          className="input mb-2"
          onChange={e =>
            setPassword({ ...password, currentPassword: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="New Password"
          className="input mb-2"
          onChange={e =>
            setPassword({ ...password, newPassword: e.target.value })
          }
        />

        <button onClick={changePassword} className="btn-primary">
          Change Password
        </button>
      </div>
    </div>
  )
}