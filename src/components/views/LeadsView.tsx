'use client'
import { useState, useMemo } from 'react'
import type { SharedProps } from './types'
import type { Lead } from '@/lib/types'
import Badge from '../ui/Badge'
import LeadForm from '../forms/LeadForm'
import { rupee } from '@/lib/utils'

export default function LeadsView(props: SharedProps) {
  const { visibleLeads, managerName, refresh, supabase, isAdmin, currentManagerId, data } = props
  const [editing, setEditing] = useState<Lead | null | 'new'>('new')
  const leads = useMemo(() => visibleLeads(), [visibleLeads])

  function exportCsv() {
    const headers = ['Date', 'Manager', 'Client', 'Brand', 'City', 'Type', 'Outlets', 'Stage', 'Status', 'Deal Value', 'Follow-up', 'Expected Close']
    const rows = leads.map(l => [l.lead_date, managerName(l.sales_manager_id), l.client_name, l.brand_name || '', l.city, l.client_type, l.outlets, l.stage, l.status, l.deal_value, l.follow_up_date || '', l.expected_closure_date || ''])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'leads.csv'; a.click()
  }

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <h3>{editing === 'new' ? 'Add New Lead' : editing ? `Editing: ${editing.client_name}` : 'Lead Form'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing('new')}>+ New Lead</button>
        </div>
        <div className="panel-body">
          {editing !== null && (
            <LeadForm
              lead={editing === 'new' ? undefined : editing}
              managers={data.managers}
              isAdmin={isAdmin}
              currentManagerId={currentManagerId}
              onSaved={() => { setEditing('new'); refresh() }}
            />
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Lead Register ({leads.length})</h3>
          <button className="btn btn-secondary btn-sm" onClick={exportCsv}>Export CSV</button>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            {leads.length === 0 ? (
              <div className="empty">No leads match the selected filters.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    {['Date', 'Manager', 'Client', 'City', 'Type', 'Outlets', 'Stage', 'Status', 'Deal Value', 'Follow-up', ''].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id}>
                      <td>{l.lead_date}</td>
                      <td>{managerName(l.sales_manager_id)}</td>
                      <td><strong>{l.client_name}</strong>{l.brand_name && <><br /><span style={{ color: 'var(--muted)', fontSize: 12 }}>{l.brand_name}</span></>}</td>
                      <td>{l.city}</td>
                      <td><Badge value={l.client_type} /></td>
                      <td>{l.outlets}</td>
                      <td style={{ fontSize: 12 }}>{l.stage}</td>
                      <td><Badge value={l.status} /></td>
                      <td>{rupee(l.deal_value)}</td>
                      <td>{l.follow_up_date || '—'}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(l)}>Edit</button>
                      </td>
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
