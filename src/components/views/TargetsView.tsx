'use client'
import { useState } from 'react'
import type { SharedProps } from './types'
import type { Target } from '@/lib/types'
import Badge from '../ui/Badge'
import { rupee, pct, todayIso } from '@/lib/utils'
import { db } from '@/lib/api'

export default function TargetsView({ data, managerName, isAdmin, refresh }: SharedProps) {
  const [editing, setEditing] = useState<Target | null | 'new'>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const today = todayIso()

  const targets = data.targets

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      sales_manager_id: fd.get('sales_manager_id') as string,
      period_type: fd.get('period_type') as string,
      period_start: fd.get('period_start') as string,
      client_type: fd.get('client_type') as string,
      outlet_target: Number(fd.get('outlet_target')),
      brand_target: Number(fd.get('brand_target')),
      target_value: Number(fd.get('target_value')),
    }
    setSaving(true); setError('')
    const { error: err } = editing && editing !== 'new'
      ? await db.update('targets', editing.id, payload)
      : await db.insert('targets', payload)
    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false); setEditing(null); refresh()
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Target Management</h3>
        {isAdmin && <button className="btn btn-sm" onClick={() => setEditing('new')}>+ Add Target</button>}
      </div>
      <div className="panel-body">
        {isAdmin && editing !== null && (
          <form onSubmit={handleSave} style={{ marginBottom: 24 }}>
            {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
            <div className="form-grid">
              <input type="hidden" name="id" defaultValue={editing !== 'new' ? editing.id : ''} />
              <div className="field">
                <label>Sales Manager</label>
                <select name="sales_manager_id" defaultValue={editing !== 'new' ? editing.sales_manager_id : data.managers[0]?.id}>
                  {data.managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Period Type</label>
                <select name="period_type" defaultValue={editing !== 'new' ? editing.period_type : 'Monthly'}>
                  <option>Monthly</option><option>Quarterly</option>
                </select>
              </div>
              <div className="field">
                <label>Period Start</label>
                <input type="date" name="period_start" defaultValue={editing !== 'new' ? editing.period_start : today} />
              </div>
              <div className="field">
                <label>Client Type</label>
                <select name="client_type" defaultValue={editing !== 'new' ? editing.client_type : 'PPU'}>
                  <option>PPU</option><option>NPU</option>
                </select>
              </div>
              <div className="field">
                <label>Outlet Target</label>
                <input type="number" name="outlet_target" defaultValue={editing !== 'new' ? editing.outlet_target : ''} min={0} required />
              </div>
              <div className="field">
                <label>Brand Target</label>
                <input type="number" name="brand_target" defaultValue={editing !== 'new' ? editing.brand_target : ''} min={0} required />
              </div>
              <div className="field">
                <label>Target Value ₹</label>
                <input type="number" name="target_value" defaultValue={editing !== 'new' ? editing.target_value : ''} min={0} required />
              </div>
              <div className="field form-actions" style={{ alignSelf: 'end' }}>
                <button className="btn btn-sm" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </form>
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{['Manager', 'Period', 'Type', 'Outlet Target', 'Brand Target', 'Target ₹', 'Achieved ₹', 'Achievement', 'Variance', isAdmin ? 'Action' : ''].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {targets.map(t => {
                const achieved = data.leads.filter(l => l.sales_manager_id === t.sales_manager_id && l.client_type === t.client_type && l.status === 'Won').reduce((s, l) => s + (l.deal_value || 0), 0)
                const achPct = t.target_value ? (achieved / t.target_value) * 100 : 0
                const variance = achieved - t.target_value
                return (
                  <tr key={t.id}>
                    <td>{managerName(t.sales_manager_id)}</td>
                    <td style={{ fontSize: 12 }}>{t.period_type}<br />{t.period_start}</td>
                    <td><Badge value={t.client_type} /></td>
                    <td>{t.outlet_target}</td>
                    <td>{t.brand_target}</td>
                    <td>{rupee(t.target_value)}</td>
                    <td>
                      {rupee(achieved)}
                      <div className="progress"><div className="progress-bar" style={{ width: `${Math.min(achPct, 100)}%` }} /></div>
                    </td>
                    <td>{pct(achPct)}</td>
                    <td style={{ color: variance >= 0 ? 'var(--green)' : 'var(--red)' }}>{rupee(variance)}</td>
                    {isAdmin && <td><button className="btn btn-secondary btn-sm" onClick={() => setEditing(t)}>Edit</button></td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
