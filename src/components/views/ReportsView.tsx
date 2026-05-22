'use client'
import { useState, useMemo } from 'react'
import type { SharedProps } from './types'
import { rupee, pct, quarterLabel } from '@/lib/utils'
import Badge from '../ui/Badge'

const TABS = [
  { id: 'summary',    label: 'MTD Summary' },
  { id: 'ppu',        label: 'PPU Report' },
  { id: 'npu',        label: 'NPU Report' },
  { id: 'targets',    label: 'Target vs Actual' },
  { id: 'quarterly',  label: 'Quarterly' },
  { id: 'won',        label: 'Closed Won' },
  { id: 'lost',       label: 'Lost Deals' },
  { id: 'pipeline',   label: 'Pipeline' },
  { id: 'followups',  label: 'Pending Follow-ups' },
]

export default function ReportsView(props: SharedProps) {
  const { data, visibleLeads, managerName, isAdmin, currentManagerId } = props
  const [tab, setTab] = useState('summary')
  const leads = useMemo(() => visibleLeads(), [visibleLeads])

  function exportCsv(rows: (string | number)[][], filename: string) {
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = filename; a.click()
  }

  const summaryRows = useMemo(() => data.managers.map(m => {
    const ml = leads.filter(l => l.sales_manager_id === m.id)
    const won = ml.filter(l => l.status === 'Won')
    const ppu = won.filter(l => l.client_type === 'PPU').reduce((s, l) => s + (l.deal_value || 0), 0)
    const npu = won.filter(l => l.client_type === 'NPU').reduce((s, l) => s + (l.deal_value || 0), 0)
    return [m.name, ml.length, won.length, rupee(ppu), rupee(npu), rupee(ppu + npu), pct(ml.length ? won.length / ml.length * 100 : 0)]
  }), [leads, data.managers])

  const targetRows = useMemo(() => {
    const scope = isAdmin ? data.targets : data.targets.filter(t => t.sales_manager_id === currentManagerId)
    return scope.map(t => {
      const actual = data.leads.filter(l => l.sales_manager_id === t.sales_manager_id && l.client_type === t.client_type && l.status === 'Won').reduce((s, l) => s + (l.deal_value || 0), 0)
      return [managerName(t.sales_manager_id), t.client_type, `${t.period_type} ${t.period_start}`, rupee(t.target_value), rupee(actual), pct(t.target_value ? actual / t.target_value * 100 : 0), rupee(actual - t.target_value)]
    })
  }, [data, isAdmin, currentManagerId, managerName])

  const quarterRows = useMemo(() => {
    const map: Record<string, { ppuT: number; ppuA: number; npuT: number; npuA: number }> = {}
    data.targets.forEach(t => {
      const q = quarterLabel(t.period_start)
      if (!map[q]) map[q] = { ppuT: 0, ppuA: 0, npuT: 0, npuA: 0 }
      if (t.client_type === 'PPU') map[q].ppuT += t.target_value
      else map[q].npuT += t.target_value
    })
    data.leads.filter(l => l.status === 'Won').forEach(l => {
      const q = quarterLabel(l.expected_closure_date || l.lead_date)
      if (!map[q]) map[q] = { ppuT: 0, ppuA: 0, npuT: 0, npuA: 0 }
      if (l.client_type === 'PPU') map[q].ppuA += (l.deal_value || 0)
      else map[q].npuA += (l.deal_value || 0)
    })
    return Object.entries(map).map(([q, v]) => {
      const tot = v.ppuT + v.npuT; const act = v.ppuA + v.npuA
      return [q, rupee(v.ppuT), rupee(v.ppuA), rupee(v.npuT), rupee(v.npuA), rupee(tot), rupee(act), pct(tot ? act / tot * 100 : 0)]
    })
  }, [data])

  const followupRows = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return data.followups.filter(f => f.status === 'Pending').map(f => {
      const lead = data.leads.find(l => l.id === f.lead_id)
      return [f.due_date, managerName(f.sales_manager_id), lead?.client_name || '—', f.due_date < today ? 'Overdue' : 'Pending', f.next_action || '—']
    })
  }, [data, managerName])

  const leadRows = (subset: typeof leads) => subset.map(l => [l.lead_date, managerName(l.sales_manager_id), l.client_name, l.city, l.client_type, l.outlets, l.stage, l.status, rupee(l.deal_value || 0)])

  const tables: Record<string, { headers: string[]; rows: (string | number)[][] }> = {
    summary:   { headers: ['Manager', 'Leads', 'Won', 'PPU Rev', 'NPU Rev', 'Total Rev', 'Conversion'], rows: summaryRows },
    ppu:       { headers: ['Date', 'Manager', 'Client', 'City', 'Type', 'Outlets', 'Stage', 'Status', 'Deal Value'], rows: leadRows(leads.filter(l => l.client_type === 'PPU')) },
    npu:       { headers: ['Date', 'Manager', 'Client', 'City', 'Type', 'Outlets', 'Stage', 'Status', 'Deal Value'], rows: leadRows(leads.filter(l => l.client_type === 'NPU')) },
    targets:   { headers: ['Manager', 'Type', 'Period', 'Target', 'Actual', 'Achievement', 'Variance'], rows: targetRows },
    quarterly: { headers: ['Quarter', 'PPU Target', 'PPU Actual', 'NPU Target', 'NPU Actual', 'Total Target', 'Total Actual', 'Achievement'], rows: quarterRows },
    won:       { headers: ['Date', 'Manager', 'Client', 'City', 'Type', 'Outlets', 'Stage', 'Status', 'Deal Value'], rows: leadRows(leads.filter(l => l.status === 'Won')) },
    lost:      { headers: ['Date', 'Manager', 'Client', 'City', 'Type', 'Outlets', 'Stage', 'Status', 'Deal Value'], rows: leadRows(leads.filter(l => l.status === 'Lost')) },
    pipeline:  { headers: ['Date', 'Manager', 'Client', 'City', 'Type', 'Outlets', 'Stage', 'Status', 'Deal Value'], rows: leadRows(leads.filter(l => l.status === 'Open')) },
    followups: { headers: ['Due Date', 'Manager', 'Client', 'Status', 'Next Action'], rows: followupRows },
  }

  const current = tables[tab]

  return (
    <div className="panel">
      <div className="report-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`report-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="panel-header" style={{ borderTop: 'none' }}>
        <h3>{TABS.find(t => t.id === tab)?.label}</h3>
        <button className="btn btn-secondary btn-sm" onClick={() => exportCsv([current.headers, ...current.rows], `report-${tab}.csv`)}>Export CSV</button>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        <div className="table-wrap">
          {current.rows.length === 0 ? (
            <div className="empty">No data for this report.</div>
          ) : (
            <table>
              <thead><tr>{current.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {current.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>
                        {typeof cell === 'string' && ['PPU', 'NPU', 'Won', 'Lost', 'Open', 'Pending', 'Overdue'].includes(cell)
                          ? <Badge value={cell} />
                          : cell}
                      </td>
                    ))}
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
