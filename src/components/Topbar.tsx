'use client'
import { NAV_ITEMS } from '@/lib/constants'
import type { AppUser, SalesManager } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

interface Props {
  view: string
  profile: AppUser
  isAdmin: boolean
  managers: SalesManager[]
  currentManagerId: string
  onManagerChange: (id: string) => void
  onMenuOpen: () => void
  supabase: SupabaseClient
}

export default function Topbar({ view, profile, isAdmin, managers, currentManagerId, onManagerChange, onMenuOpen, supabase }: Props) {
  const title = NAV_ITEMS.find(n => n.id === view)?.label || 'Dashboard'

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-secondary btn-sm mobile-menu-btn" onClick={onMenuOpen}>☰</button>
        <div className="topbar-left">
          <h2>{title}</h2>
          <p>{isAdmin ? 'Admin — all sales managers' : `Sales Manager — ${managers.find(m => m.id === currentManagerId)?.name || ''}`}</p>
        </div>
      </div>
      <div className="topbar-right">
        <span className="status-pill">
          <span className="status-dot live" />
          Supabase live
        </span>
        <span className="role-pill">{profile.email}</span>
        {isAdmin && (
          <select
            value={currentManagerId}
            onChange={e => onManagerChange(e.target.value)}
            style={{ minHeight: 36, border: '1px solid var(--line)', borderRadius: 8, padding: '0 10px', fontSize: 13 }}
          >
            <option value="">All Managers</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  )
}
