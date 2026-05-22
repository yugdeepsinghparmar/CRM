interface Props { value: string }

const MAP: Record<string, string> = {
  PPU: 'badge-ppu', NPU: 'badge-npu',
  Won: 'badge-won', Lost: 'badge-lost', Open: 'badge-open',
  Done: 'badge-done', Planned: 'badge-planned', Cancelled: 'badge-lost',
  Pending: 'badge-pending', Closed: 'badge-closed', Overdue: 'badge-lost',
}

export default function Badge({ value }: Props) {
  return <span className={`badge ${MAP[value] || 'badge-closed'}`}>{value}</span>
}
