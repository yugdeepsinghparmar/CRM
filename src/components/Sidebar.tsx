'use client'
import { NAV_ITEMS, APP_NAME } from '@/lib/constants'

interface Props {
  open: boolean
  activeView: string
  onNav: (view: string) => void
}

export default function Sidebar({ open, activeView, onNav }: Props) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-brand">
        <h1>{APP_NAME}</h1>
        <span>Realtime sales tracking CRM</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-btn${activeView === item.id ? ' active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
