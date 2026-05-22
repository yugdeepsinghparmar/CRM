'use client'
import { useMemo } from 'react'
import type { SharedProps } from './types'
import FiltersBar from '../ui/Filters'
import KpiCard from '../ui/KpiCard'
import { rupee, pct, getMetrics, daysSince } from '@/lib/utils'
import DashboardCharts from '../charts/DashboardCharts'

export default function Dashboard(props: SharedProps) {
  const { data, filters, setFilters, visibleLeads, managerName, isAdmin, currentManagerId } = props
  const leads = useMemo(() => visibleLeads(), [visibleLeads])
  const m = useMemo(() => getMetrics(leads, data.targets, isAdmin ? 'admin' : 'sales_manager', currentManagerId), [leads, data.targets, isAdmin, currentManagerId])

  const insights = useMemo(() => {
    const byMgr = data.managers.map(mgr => {
      const ml = data.leads.filter(l => l.sales_manager_id === mgr.id)
      const rev = ml.filter(l => l.status === 'Won').reduce((s, l) => s + (l.deal_value || 0), 0)
      const tgt = data.targets.filter(t => t.sales_manager_id === mgr.id).reduce((s, t) => s + t.target_value, 0)
      return { name: mgr.name, rev, tgt, ach: tgt ? rev / tgt : 0 }
    })
    const best = [...byMgr].sort((a, b) => b.rev - a.rev)[0]
    const behind = [...byMgr].filter(m => m.tgt > 0).sort((a, b) => a.ach - b.ach)[0]
    const stuck = data.leads.filter(l => l.status === 'Open' && daysSince(l.updated_at) >= 7).sort((a, b) => (b.deal_value || 0) - (a.deal_value || 0))[0]

    // Derive recommendation from live data
    const pendingFollowups = data.followups.filter(f => f.status === 'Pending').length
    const negotiationLeads = data.leads.filter(l => l.stage === 'Negotiation' && l.status === 'Open').length
    const recommendation = negotiationLeads > 0
      ? `${negotiationLeads} lead${negotiationLeads > 1 ? 's' : ''} in Negotiation stage — push toward closure. ${pendingFollowups > 0 ? `${pendingFollowups} follow-up${pendingFollowups > 1 ? 's' : ''} pending.` : ''}`
      : pendingFollowups > 0
        ? `${pendingFollowups} follow-up${pendingFollowups > 1 ? 's' : ''} pending — review and action today.`
        : 'Pipeline is healthy. Focus on adding new qualified leads.'

    return [
      { title: 'Best performer', body: best ? `${best.name} leads with ${rupee(best.rev)} closed revenue.` : 'No data yet.' },
      { title: 'Behind target', body: behind ? `${behind.name} is at ${pct(behind.ach * 100)} achievement.` : 'All on track.' },
      { title: 'Stuck deal', body: stuck ? `${stuck.client_name} — no update for ${daysSince(stuck.updated_at)} days. Next: ${stuck.next_action || '—'}` : 'No stuck deals.' },
      { title: 'Recommendation', body: recommendation },
    ]
  }, [data])

  const alerts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const dueToday = data.followups.filter(f => f.status === 'Pending' && f.due_date === today)
    const stale = data.leads.filter(l => l.status === 'Open' && daysSince(l.updated_at) >= 7)
    const highVal = data.leads.filter(l => l.status === 'Open' && (l.deal_value || 0) >= 1000000)
    const items = [
      ...dueToday.map(f => ({ level: 'medium', title: 'Follow-up due today', body: `${managerName(f.sales_manager_id)} — ${data.leads.find(l => l.id === f.lead_id)?.client_name || ''}` })),
      ...stale.map(l => ({ level: 'high', title: 'No update for 7+ days', body: `${l.client_name} — ${rupee(l.deal_value)} pipeline` })),
      ...highVal.map(l => ({ level: 'low', title: 'High-value deal', body: `${l.client_name} worth ${rupee(l.deal_value)} needs review` })),
    ]
    return items.length ? items : [{ level: 'low', title: 'All clear', body: 'No alerts for the selected period.' }]
  }, [data, managerName])

  return (
    <>
      <FiltersBar filters={filters} onChange={setFilters} managers={data.managers} isAdmin={isAdmin} />

      <div className="kpi-grid">
        <KpiCard label="Total Leads" value={m.totalLeads} note="Filtered pipeline" />
        <KpiCard label="Total Pipeline ₹" value={rupee(m.totalPipeline)} note="Open deal value" accent />
        <KpiCard label="Closed Won ₹" value={rupee(m.wonRevenue)} note="Booked revenue" accent />
        <KpiCard label="Achievement %" value={pct(m.achievement)} note={`${rupee(m.remaining)} remaining`} />
        <KpiCard label="PPU Revenue ₹" value={rupee(m.ppuRevenue)} note="₹5,000 per outlet" />
        <KpiCard label="NPU Revenue ₹" value={rupee(m.npuRevenue)} note="₹30,000 per outlet" />
        <KpiCard label="Monthly Target ₹" value={rupee(m.monthlyTarget)} note="PPU monthly" />
        <KpiCard label="Quarterly Target ₹" value={rupee(m.quarterlyTarget)} note="NPU quarterly" />
        <KpiCard label="Conversion Rate" value={pct(m.conversion)} note="Won / total leads" />
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Performance Charts</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>Export PDF</button>
          </div>
          <div className="panel-body">
            <DashboardCharts leads={leads} managers={data.managers} targets={data.targets} />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="panel">
            <div className="panel-header"><h3>AI Insight Panel</h3></div>
            <div className="panel-body insight-list">
              {insights.map((i, idx) => (
                <div key={idx} className="insight">
                  <strong>{i.title}</strong>
                  <p>{i.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header"><h3>Automation Alerts</h3></div>
            <div className="panel-body alert-list">
              {alerts.map((a, idx) => (
                <div key={idx} className={`alert-item alert-${a.level}`}>
                  <strong>{a.title}</strong>
                  <p>{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
