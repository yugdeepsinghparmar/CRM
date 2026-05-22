'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NAV_ITEMS, APP_NAME } from '@/lib/constants'
import type { AppUser, SalesManager, Lead, Target, Meeting, Activity, Followup, Revenue } from '@/lib/types'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Dashboard from './views/Dashboard'
import LeadsView from './views/LeadsView'
import MeetingsView from './views/MeetingsView'
import ActivitiesView from './views/ActivitiesView'
import TrackingView from './views/TrackingView'
import TargetsView from './views/TargetsView'
import RevenueView from './views/RevenueView'
import FollowupsView from './views/FollowupsView'
import ReportsView from './views/ReportsView'
import SettingsView from './views/SettingsView'

export interface CRMData {
  managers: SalesManager[]
  leads: Lead[]
  targets: Target[]
  meetings: Meeting[]
  activities: Activity[]
  followups: Followup[]
  revenue: Revenue[]
  users: AppUser[]
}

export interface Filters {
  from: string; to: string; manager: string
  city: string; type: string; stage: string
}

interface Props { profile: AppUser }

const today = new Date().toISOString().slice(0, 10)
const thisMonth = today.slice(0, 7)

export default function AppShell({ profile }: Props) {
  const supabase = createClient()
  const [view, setView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CRMData>({ managers: [], leads: [], targets: [], meetings: [], activities: [], followups: [], revenue: [], users: [] })
  const [filters, setFilters] = useState<Filters>({ from: `${thisMonth}-01`, to: today, manager: 'All', city: 'All', type: 'All', stage: 'All' })
  const [currentManagerId, setCurrentManagerId] = useState<string>('')

  const isAdmin = profile.role === 'admin'

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/data')
      if (!res.ok) throw new Error('Failed to fetch data')
      const json = await res.json()
      setData({
        managers: json.managers || [],
        leads: json.leads || [],
        targets: json.targets || [],
        meetings: json.meetings || [],
        activities: json.activities || [],
        followups: json.followups || [],
        revenue: json.revenue || [],
        users: json.users || [],
      })
      if (!isAdmin && !currentManagerId) {
        const mgr = (json.managers || []).find((m: SalesManager) => m.user_id === profile.id)
        if (mgr) setCurrentManagerId(mgr.id)
      }
    } catch (e) {
      console.error('fetchAll error:', e)
    }
    setLoading(false)
  }, []) // eslint-disable-line

  useEffect(() => { fetchAll() }, [fetchAll])

  // Realtime subscription for leads
  useEffect(() => {
    const channel = supabase.channel('crm-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAll]) // eslint-disable-line

  const visibleLeads = useCallback(() => {
    let leads = [...data.leads]
    if (!isAdmin) leads = leads.filter(l => l.sales_manager_id === currentManagerId)
    const f = filters
    return leads.filter(l => {
      if (f.from && l.lead_date < f.from) return false
      if (f.to && l.lead_date > f.to) return false
      if (f.manager !== 'All' && l.sales_manager_id !== f.manager) return false
      if (f.city !== 'All' && l.city !== f.city) return false
      if (f.type !== 'All' && l.client_type !== f.type) return false
      if (f.stage !== 'All' && l.stage !== f.stage) return false
      return true
    })
  }, [data.leads, filters, isAdmin, currentManagerId])

  const managerName = (id: string) => data.managers.find(m => m.id === id)?.name || 'Unassigned'

  const sharedProps = { data, filters, setFilters, visibleLeads, managerName, isAdmin, currentManagerId, profile, refresh: fetchAll, supabase }

  const renderView = () => {
    if (loading) return <div className="loading"><div className="spinner" />Loading data…</div>
    switch (view) {
      case 'dashboard':   return <Dashboard {...sharedProps} />
      case 'leads':       return <LeadsView {...sharedProps} />
      case 'meetings':    return <MeetingsView {...sharedProps} />
      case 'activities':  return <ActivitiesView {...sharedProps} />
      case 'ppu':         return <TrackingView {...sharedProps} clientType="PPU" />
      case 'npu':         return <TrackingView {...sharedProps} clientType="NPU" />
      case 'targets':     return <TargetsView {...sharedProps} />
      case 'revenue':     return <RevenueView {...sharedProps} />
      case 'followups':   return <FollowupsView {...sharedProps} />
      case 'reports':     return <ReportsView {...sharedProps} />
      case 'settings':    return <SettingsView {...sharedProps} />
      default:            return <Dashboard {...sharedProps} />
    }
  }

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        open={sidebarOpen}
        activeView={view}
        onNav={(v) => { setView(v); setSidebarOpen(false) }}
      />
      <main className="main">
        <Topbar
          view={view}
          profile={profile}
          isAdmin={isAdmin}
          managers={data.managers}
          currentManagerId={currentManagerId}
          onManagerChange={setCurrentManagerId}
          onMenuOpen={() => setSidebarOpen(true)}
          supabase={supabase}
        />
        {renderView()}
      </main>
    </div>
  )
}
