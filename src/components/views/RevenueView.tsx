'use client'
import { useMemo } from 'react'
import type { SharedProps } from './types'
import Badge from '../ui/Badge'
import KpiCard from '../ui/KpiCard'
import { rupee } from '@/lib/utils'

export default function RevenueView({ data, managerName }: SharedProps) {
  const rows = useMemo(() => data.revenue.map(r => {
    const lead = data.leads.find(l => l.id === r.lead_id)
    return { ...r, clientName: lead?.client_name || '—', managerName: managerName(r.sales_manager_id) }
  }), [data, managerName])

  const total = data.revenue.reduce((s, r) => s + r.amount, 0)
  const ppu = data.revenue.filter(r => r.client_type === 'PPU').reduce((s, r) => s + r.amount, 0)
  const npu = data.revenue.filter(r => r.client_type === 'NPU').reduce((s, r) => s + r.amount, 0)

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Total Revenue ₹" value={rupee(total)} note="All closed won" accent />
        <KpiCard label="PPU Revenue ₹" value={rupee(ppu)} note="₹5,000 per outlet" />
        <KpiCard label="NPU Revenue ₹" value={rupee(npu)} note="₹30,000 per outlet" />
        <KpiCard label="Revenue Entries" value={rows.length} note="Closed won records" />
      </div>
      <div className="panel">
        <div className="panel-header"><h3>Revenue Tracking ({rows.length})</h3></div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            {rows.length === 0 ? <div className="empty">No revenue recorded yet.</div> : (
              <table>
                <thead><tr>{['Date', 'Manager', 'Client', 'Type', 'Amount'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>{r.revenue_date}</td>
                      <td>{r.managerName}</td>
                      <td>{r.clientName}</td>
                      <td><Badge value={r.client_type} /></td>
                      <td><strong>{rupee(r.amount)}</strong></td>
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
