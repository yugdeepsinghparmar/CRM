'use client'
import { useMemo } from 'react'
import type { SharedProps } from './types'
import Badge from '../ui/Badge'

export default function MeetingsView({ data, managerName }: SharedProps) {
  const rows = useMemo(() => data.meetings.map(m => {
    const lead = data.leads.find(l => l.id === m.lead_id)
    return { ...m, clientName: lead?.client_name || '—', managerName: managerName(m.sales_manager_id) }
  }), [data, managerName])

  return (
    <div className="panel">
      <div className="panel-header"><h3>Meeting Tracking ({rows.length})</h3></div>
      <div className="panel-body" style={{ padding: 0 }}>
        <div className="table-wrap">
          {rows.length === 0 ? <div className="empty">No meetings recorded.</div> : (
            <table>
              <thead><tr>{['Date', 'Manager', 'Client', 'Type', 'Status', 'Notes'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.meeting_date}</td>
                    <td>{r.managerName}</td>
                    <td>{r.clientName}</td>
                    <td>{r.meeting_type}</td>
                    <td><Badge value={r.status} /></td>
                    <td style={{ maxWidth: 260, fontSize: 12, color: 'var(--muted)' }}>{r.notes || '—'}</td>
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
