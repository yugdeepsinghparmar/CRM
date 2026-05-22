'use client'
import { STAGES, CLIENT_TYPES, CITIES } from '@/lib/constants'
import type { SalesManager } from '@/lib/types'
import type { Filters } from '../AppShell'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  managers: SalesManager[]
  isAdmin: boolean
}

export default function FiltersBar({ filters, onChange, managers, isAdmin }: Props) {
  const set = (key: keyof Filters, val: string) => onChange({ ...filters, [key]: val })

  return (
    <div className="panel filters">
      <div className="field">
        <label>From</label>
        <input type="date" value={filters.from} onChange={e => set('from', e.target.value)} />
      </div>
      <div className="field">
        <label>To</label>
        <input type="date" value={filters.to} onChange={e => set('to', e.target.value)} />
      </div>
      <div className="field">
        <label>Sales Person</label>
        <select value={filters.manager} onChange={e => set('manager', e.target.value)} disabled={!isAdmin}>
          <option value="All">All Managers</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label>City</label>
        <select value={filters.city} onChange={e => set('city', e.target.value)}>
          <option value="All">All Cities</option>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label>PPU / NPU</label>
        <select value={filters.type} onChange={e => set('type', e.target.value)}>
          <option value="All">All Types</option>
          {CLIENT_TYPES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Stage</label>
        <select value={filters.stage} onChange={e => set('stage', e.target.value)}>
          <option value="All">All Stages</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
    </div>
  )
}
