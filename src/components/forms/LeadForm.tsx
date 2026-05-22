'use client'
import { useState } from 'react'
import type { Lead, SalesManager } from '@/lib/types'
import { STAGES, STATUSES, CLIENT_TYPES, MEETING_TYPES, LEAD_SOURCES, CITIES } from '@/lib/constants'
import { todayIso, calcDealValue } from '@/lib/utils'
import { db } from '@/lib/api'

interface Props {
  lead?: Lead
  managers: SalesManager[]
  isAdmin: boolean
  currentManagerId: string
  onSaved: () => void
}

export default function LeadForm({ lead, managers, isAdmin, currentManagerId, onSaved }: Props) {
  const today = todayIso()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    lead_date: lead?.lead_date || today,
    sales_manager_id: lead?.sales_manager_id || (isAdmin ? (managers[0]?.id || '') : currentManagerId),
    client_name: lead?.client_name || '',
    brand_name: lead?.brand_name || '',
    city: lead?.city || 'Delhi',
    contact_person: lead?.contact_person || '',
    contact_number: lead?.contact_number || '',
    client_type: lead?.client_type || 'PPU',
    outlets: lead?.outlets || 1,
    lead_source: lead?.lead_source || 'Referral',
    meeting_type: lead?.meeting_type || 'Physical',
    stage: lead?.stage || 'Lead',
    status: lead?.status || 'Open',
    follow_up_date: lead?.follow_up_date || today,
    expected_closure_date: lead?.expected_closure_date || today,
    remarks: lead?.remarks || '',
    next_action: lead?.next_action || '',
  })

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))
  const dealValue = calcDealValue(Number(form.outlets), form.client_type)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_name.trim()) { setError('Client name is required.'); return }
    setSaving(true); setError('')
    const payload = {
      ...form,
      outlets: Number(form.outlets),
      sales_manager_id: isAdmin ? form.sales_manager_id : currentManagerId,
      updated_at: new Date().toISOString(),
    }
    const { error: err } = lead?.id
      ? await db.update('leads', lead.id, payload)
      : await db.insert('leads', payload)
    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Date</label>
          <input type="date" value={form.lead_date} onChange={e => set('lead_date', e.target.value)} required />
        </div>
        <div className="field">
          <label>Sales Manager</label>
          <select value={form.sales_manager_id} onChange={e => set('sales_manager_id', e.target.value)} disabled={!isAdmin}>
            {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="field span2">
          <label>Client / Restaurant Name</label>
          <input type="text" value={form.client_name} onChange={e => set('client_name', e.target.value)} required placeholder="e.g. Tikka Junction" />
        </div>
        <div className="field span2">
          <label>Brand Name</label>
          <input type="text" value={form.brand_name} onChange={e => set('brand_name', e.target.value)} placeholder="Brand name if different" />
        </div>
        <div className="field">
          <label>City</label>
          <select value={form.city} onChange={e => set('city', e.target.value)}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Contact Person</label>
          <input type="text" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} />
        </div>
        <div className="field">
          <label>Contact Number</label>
          <input type="tel" value={form.contact_number} onChange={e => set('contact_number', e.target.value)} />
        </div>
        <div className="field">
          <label>Client Type</label>
          <select value={form.client_type} onChange={e => set('client_type', e.target.value)}>
            {CLIENT_TYPES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Number of Outlets</label>
          <input type="number" min={1} value={form.outlets} onChange={e => set('outlets', e.target.value)} />
        </div>
        <div className="field">
          <label>Deal Value ₹ (auto)</label>
          <input type="number" value={dealValue} readOnly style={{ background: '#f7f9fc' }} />
        </div>
        <div className="field">
          <label>Lead Source</label>
          <select value={form.lead_source} onChange={e => set('lead_source', e.target.value)}>
            {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Meeting Type</label>
          <select value={form.meeting_type} onChange={e => set('meeting_type', e.target.value)}>
            {MEETING_TYPES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Stage</label>
          <select value={form.stage} onChange={e => set('stage', e.target.value)}>
            {STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Follow-up Date</label>
          <input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
        </div>
        <div className="field">
          <label>Expected Closure Date</label>
          <input type="date" value={form.expected_closure_date} onChange={e => set('expected_closure_date', e.target.value)} />
        </div>
        <div className="field span2">
          <label>Remarks</label>
          <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} />
        </div>
        <div className="field span2">
          <label>Next Action</label>
          <textarea value={form.next_action} onChange={e => set('next_action', e.target.value)} />
        </div>
        <div className="field span4 form-actions">
          <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : lead?.id ? 'Update Lead' : 'Save Lead'}</button>
          <button className="btn btn-secondary" type="button" onClick={onSaved}>Cancel</button>
        </div>
      </div>
    </form>
  )
}
