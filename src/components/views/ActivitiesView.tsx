'use client'
import { useMemo } from 'react'
import type { SharedProps } from './types'

export default function ActivitiesView({ data, managerName }: SharedProps) {
  const rows = useMemo(() => data.activities.map(a => {
    const lead = data.leads.find(l => l.id === a.lead_id)
    return { ...a, clientName: lead?.client_name || '—', managerName: managerName(a.sales_manager_id) }
  }), [data, managerName])

  return (
    <div className="panel">
      <div className="panel-header"><h3>Daily Activity Tracking ({rows.length})</h3></div>
      <div className="panel-body" style={{ padding: 0 }}>
        <div className="table-wrap">
          {rows.length === 0 ? <div className="empty">No activities recorded.</div> : (
            <table>
              <thead><tr>{['Date', 'Manager', 'Client', 'Activity Type', 'Summary'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.activity_date}</td>
                    <td>{r.managerName}</td>
                    <td>{r.clientName}</td>
                    <td>{r.type}</td>
                    <td style={{ maxWidth: 300, fontSize: 12, color: 'var(--muted)' }}>{r.summary || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
