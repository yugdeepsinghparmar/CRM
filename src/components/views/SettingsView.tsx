'use client'
import { useState } from 'react'
import type { SharedProps } from './types'
import type { AppUser } from '@/lib/types'
import { todayIso } from '@/lib/utils'

export default function SettingsView({ data, isAdmin, profile, supabase, refresh }: SharedProps) {
  const today = todayIso()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successCreds, setSuccessCreds] = useState<{ email: string; password: string } | null>(null)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)

  // Create user form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'sales_manager'>('sales_manager')

  // Edit user form state
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<'admin' | 'sales_manager'>('sales_manager')

  if (!isAdmin) {
    return (
      <div className="panel">
        <div className="panel-header"><h3>Settings</h3></div>
        <div className="panel-body">
          <div className="insight">
            <strong>Your account</strong>
            <p>{profile.full_name} ({profile.email}) — Sales Manager</p>
            <p style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>Contact your admin to change account settings.</p>
          </div>
        </div>
      </div>
    )
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccessCreds(null)

    try {
      const res = await fetch('/api/admin/managers/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: name, role, password: password || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to create user')
      } else {
        setSuccessCreds(json.credentials)
        setName(''); setEmail(''); setPassword(''); setRole('sales_manager')
        refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
    setSaving(false)
  }

  function startEdit(u: AppUser) {
    setEditingUser(u)
    setEditName(u.full_name)
    setEditRole(u.role as 'admin' | 'sales_manager')
    setError('')
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          auth_user_id: editingUser.auth_user_id,
          full_name: editName,
          role: editRole,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to update'); setSaving(false); return }
      setEditingUser(null); refresh()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
    setSaving(false)
  }

  async function handleDeleteUser(u: AppUser) {
    if (!confirm(`Delete ${u.full_name} (${u.email})?\n\nThis removes their login permanently.`)) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, auth_user_id: u.auth_user_id }),
      })
      if (!res.ok) { alert('Failed to delete user'); return }
      refresh()
    } catch {
      alert('Network error')
    }
  }

  const users: AppUser[] = data.users || []

  return (
    <div style={{ display: 'grid', gap: 18 }}>

      {/* ── Create New User ── */}
      <div className="panel">
        <div className="panel-header"><h3>Create New User</h3></div>
        <div className="panel-body">
          <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 13 }}>
            Creates a login account immediately. Share the credentials with the user.
          </p>

          {error && (
            <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>
          )}

          {successCreds && (
            <div style={{ background: '#e5f6ef', border: '1px solid #b7e4cf', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
              <strong style={{ color: 'var(--green)', display: 'block', marginBottom: 10, fontSize: 14 }}>
                ✓ User created — share these login credentials
              </strong>
              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 6, padding: '12px 16px', fontFamily: 'monospace', fontSize: 14, lineHeight: 2 }}>
                <div>📧 <b>Email:</b> {successCreds.email}</div>
                <div>🔑 <b>Password:</b> {successCreds.password}</div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                The user can log in immediately at this app's URL.
              </p>
            </div>
          )}

          <form onSubmit={handleCreateUser}>
            <div className="form-grid">
              <div className="field span2">
                <label>Full Name</label>
                <input
                  type="text" required
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="field span2">
                <label>Email Address</label>
                <input
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                />
              </div>
              <div className="field span2">
                <label>
                  Password{' '}
                  <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>
                    (leave blank to auto-generate)
                  </span>
                </label>
                <input
                  type="text"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="e.g. Sales2026@"
                />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'sales_manager')}>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="field" style={{ alignSelf: 'end' }}>
                <button className="btn" type="submit" disabled={saving}>
                  {saving ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── User List ── */}
      <div className="panel">
        <div className="panel-header">
          <h3>All Users ({users.length})</h3>
        </div>

        {/* Inline edit form */}
        {editingUser && (
          <div style={{ padding: 16, borderBottom: '1px solid var(--line)', background: '#f7f9fc' }}>
            <p style={{ fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
              Editing: {editingUser.email}
            </p>
            <form onSubmit={handleUpdateUser}>
              <div className="form-grid">
                <div className="field span2">
                  <label>Full Name</label>
                  <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="field">
                  <label>Role</label>
                  <select value={editRole} onChange={e => setEditRole(e.target.value as 'admin' | 'sales_manager')}>
                    <option value="sales_manager">Sales Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="field form-actions" style={{ alignSelf: 'end' }}>
                  <button className="btn btn-sm" type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditingUser(null)}>
                    Cancel
                  </button>
                </div>
              </div>
              {error && <div className="login-error" style={{ marginTop: 10 }}>{error}</div>}
            </form>
          </div>
        )}

        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            {users.length === 0 ? (
              <div className="empty">No users found.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.full_name}</strong></td>
                      <td style={{ fontSize: 12 }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-won' : 'badge-ppu'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Sales Manager'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => editingUser?.id === u.id ? setEditingUser(null) : startEdit(u)}
                          >
                            {editingUser?.id === u.id ? 'Cancel' : 'Edit'}
                          </button>
                          {u.id !== profile.id && (
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--red)', color: '#fff' }}
                              onClick={() => handleDeleteUser(u)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Connection Info ── */}
      <div className="panel">
        <div className="panel-header"><h3>Connection Info</h3></div>
        <div className="panel-body">
          <div className="insight">
            <strong>Supabase connected</strong>
            <p>Live database with row-level security. Realtime updates active for leads.</p>
          </div>
          <div className="insight" style={{ marginTop: 10 }}>
            <strong>Logged in as</strong>
            <p>{profile.full_name} ({profile.email}) — {profile.role === 'admin' ? 'Admin' : 'Sales Manager'}</p>
          </div>
        </div>
      </div>

    </div>
  )
}
