'use client'
import { useMemo } from 'react'
import type { SharedProps } from './types'
import type { ClientType } from '@/lib/types'
import KpiCard from '../ui/KpiCard'
import Badge from '../ui/Badge'
import { rupee, pct } from '@/lib/utils'

interface Props extends SharedProps { clientType: ClientType }

export default function TrackingView({ visibleLeads, managerName, clientType }: Props) {
  const leads = useMemo(() => visibleLeads().filter(l => l.client_type === clientType), [visibleLeads, clientType])
  const won = leads.filter(l => l.status === 'Won')
  const pipeline = leads.filter(l => l.status === 'Open').reduce((s, l) => s + (l.deal_value || 0), 0)
  const revenue = won.reduce((s, l) => s + (l.deal_value || 0), 0)
  const rate = leads.length ? (won.length / leads.length) * 100 : 0
  const rateLabel = clientType === 'PPU' ? '₹5,000 per outlet' : '₹30,000 per outlet'

  function exportCsv() {
    const headers = ['Date', 'Manager', 'Client', 'City', 'Outlets', 'Stage', 'Status', 'Deal Value']
    const rows = leads.map(l => [l.lead_date, managerName(l.sales_manager_id), l.client_name, l.city, l.outlets, l.stage, l.status, l.deal_value])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c ?? '')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `${clientType.toLowerCase()}-leads.csv`; a.click()
  }

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label={`${clientType} Leads`} value={leads.length} note="Filtered count" />
        <KpiCard label={`${clientType} Pipeline ₹`} value={rupee(pipeline)} note="Open value" />
        <KpiCard label={`${clientType} Revenue ₹`} value={rupee(revenue)} note={rateLabel} accent />
        <KpiCard label={`${clientType} Conversion`} value={pct(rate)} note="Won / total" />
      </div>
      <div className="panel">
        <div className="panel-header">
          <h3>{clientType} Lead Register ({leads.length})</h3>
          <button className="btn btn-secondary btn-sm" onClick={exportCsv}>Export CSV</button>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            {leads.length === 0 ? <div className="empty">No {clientType} leads found.</div> : (
              <table>
                <thead><tr>{['Date', 'Manager', 'Client', 'City', 'Outlets', 'Stage', 'Status', 'Deal Value', 'Follow-up'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id}>
                      <td>{l.lead_date}</td>
                      <td>{managerName(l.sales_manager_id)}</td>
                      <td><strong>{l.client_name}</strong></td>
                      <td>{l.city}</td>
                      <td>{l.outlets}</td>
                      <td style={{ fontSize: 12 }}>{l.stage}</td>
                      <td><Badge value={l.status} /></td>
                      <td>{rupee(l.deal_value)}</td>
                      <td>{l.follow_up_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
