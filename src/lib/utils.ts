import { PPU_RATE, NPU_RATE } from './constants'
import type { Lead, Target, DashboardMetrics } from './types'

export function rupee(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(value || 0)
}

export function pct(value: number): string {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.round(value)}%`
}

export function calcDealValue(outlets: number, clientType: string): number {
  return outlets * (clientType === 'PPU' ? PPU_RATE : NPU_RATE)
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

export function quarterLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const q = Math.floor(d.getMonth() / 3) + 1
  return `Q${q} ${d.getFullYear()}`
}

export function getMetrics(
  leads: Lead[],
  targets: Target[],
  role: string,
  managerId?: string
): DashboardMetrics {
  const targetScope = role === 'admin'
    ? targets
    : targets.filter(t => t.sales_manager_id === managerId)

  const totalPipeline = leads
    .filter(l => l.status === 'Open')
    .reduce((s, l) => s + (l.deal_value || 0), 0)

  const won = leads.filter(l => l.status === 'Won')
  const wonRevenue = won.reduce((s, l) => s + (l.deal_value || 0), 0)
  const ppuRevenue = won.filter(l => l.client_type === 'PPU').reduce((s, l) => s + (l.deal_value || 0), 0)
  const npuRevenue = won.filter(l => l.client_type === 'NPU').reduce((s, l) => s + (l.deal_value || 0), 0)

  const monthlyTarget = targetScope
    .filter(t => t.period_type === 'Monthly')
    .reduce((s, t) => s + t.target_value, 0)
  const quarterlyTarget = targetScope
    .filter(t => t.period_type === 'Quarterly')
    .reduce((s, t) => s + t.target_value, 0)
  const totalTarget = monthlyTarget + quarterlyTarget

  return {
    totalLeads: leads.length,
    totalMeetings: 0,
    ppuMeetings: 0,
    npuMeetings: 0,
    totalPipeline,
    wonRevenue,
    ppuRevenue,
    npuRevenue,
    monthlyTarget,
    quarterlyTarget,
    achievement: totalTarget ? (wonRevenue / totalTarget) * 100 : 0,
    remaining: Math.max(totalTarget - wonRevenue, 0),
    conversion: leads.length ? (won.length / leads.length) * 100 : 0,
  }
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
