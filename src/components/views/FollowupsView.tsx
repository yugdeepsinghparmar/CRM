'use client'
import { useMemo } from 'react'
import type { SharedProps } from './types'
import Badge from '../ui/Badge'

export default function FollowupsView({ data, managerName }: SharedProps) {
  const today = new Date().toISOString().slice(0, 10)
  const rows = useMemo(() => data.followups.map(f => {
    const lead = data.leads.find(l => l.id === f.lead_id)
    const status = f.status === 'Pending' && f.due_date < today ? 'Overdue' : f.status
    return { ...f, status, clientName: lead?.client_name || '—', managerName: managerName(f.sales_manager_id) }
  }).sort((a, b) => a.due_date.localeCompare(b.due_date)), [data, managerName, today])

  const pending = rows.filter(r => r.status === 'Pending').length
  const overdue = rows.filter(r => r.status === 'Overdue').length

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Follow-up Management</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {overdue > 0 && <span className="badge badge-lost">{overdue} Overdue</span>}
          {pending > 0 && <span className="badge badge-pending">{pending} Pending</span>}
        </div>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        <div className="table-wrap">
          {rows.length === 0 ? <div className="empty">No follow-ups recorded.</div> : (
            <table>
              <thead><tr>{['Due Date', 'Manager', 'Client', 'Status', 'Next Action'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.due_date}</td>
                    <td>{r.managerName}</td>
                    <td>{r.clientName}</td>
                    <td><Badge value={r.status} /></td>
                    <td style={{ maxWidth: 280, fontSize: 12, color: 'var(--muted)' }}>{r.next_action || '—'}</td>
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
