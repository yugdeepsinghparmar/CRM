interface Props {
  label: string
  value: string | number
  note?: string
  accent?: boolean
}

export default function KpiCard({ label, value, note, accent }: Props) {
  return (
    <div className="panel kpi-card" style={accent ? { borderTop: '3px solid var(--accent)' } : {}}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {note && <div className="kpi-note">{note}</div>}
    </div>
  )
}
