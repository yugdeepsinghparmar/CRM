'use client'
import { useMemo } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2'
import type { Lead, SalesManager, Target } from '@/lib/types'
import { rupee } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

const COLORS = ['#087f8c', '#d94f30', '#18875a', '#2364aa', '#b66b00', '#8b5cf6', '#ec4899']
const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const } } }

interface Props { leads: Lead[]; managers: SalesManager[]; targets: Target[] }

export default function DashboardCharts({ leads, managers, targets }: Props) {
  const managerChart = useMemo(() => {
    const labels = managers.map(m => m.name)
    const achieved = managers.map(m => leads.filter(l => l.sales_manager_id === m.id && l.status === 'Won').reduce((s, l) => s + (l.deal_value || 0), 0))
    const targeted = managers.map(m => targets.filter(t => t.sales_manager_id === m.id).reduce((s, t) => s + t.target_value, 0))
    return { labels, datasets: [{ label: 'Target', data: targeted, backgroundColor: '#d8dee8' }, { label: 'Achieved', data: achieved, backgroundColor: '#087f8c' }] }
  }, [leads, managers, targets])

  const typeChart = useMemo(() => {
    const ppu = leads.filter(l => l.client_type === 'PPU' && l.status === 'Won').reduce((s, l) => s + (l.deal_value || 0), 0)
    const npu = leads.filter(l => l.client_type === 'NPU' && l.status === 'Won').reduce((s, l) => s + (l.deal_value || 0), 0)
    return { labels: ['PPU', 'NPU'], datasets: [{ data: [ppu, npu], backgroundColor: ['#087f8c', '#d94f30'] }] }
  }, [leads])

  const stageChart = useMemo(() => {
    const stages = ['Lead', 'Qualified', 'Demo Scheduled', 'Demo Done', 'Negotiation', 'Closed Won', 'Closed Lost']
    const counts = stages.map(s => leads.filter(l => l.stage === s).length)
    return { labels: stages, datasets: [{ label: 'Leads', data: counts, backgroundColor: COLORS }] }
  }, [leads])

  const cityChart = useMemo(() => {
    const cities: Record<string, number> = {}
    leads.forEach(l => { cities[l.city] = (cities[l.city] || 0) + 1 })
    const sorted = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 6)
    return { labels: sorted.map(e => e[0]), datasets: [{ data: sorted.map(e => e[1]), backgroundColor: COLORS }] }
  }, [leads])

  const sourceChart = useMemo(() => {
    const src: Record<string, number> = {}
    leads.forEach(l => { if (l.lead_source) src[l.lead_source] = (src[l.lead_source] || 0) + 1 })
    const sorted = Object.entries(src).sort((a, b) => b[1] - a[1])
    return { labels: sorted.map(e => e[0]), datasets: [{ label: 'Leads', data: sorted.map(e => e[1]), backgroundColor: COLORS }] }
  }, [leads])

  const trendChart = useMemo(() => {
    const months: Record<string, number> = {}
    leads.filter(l => l.status === 'Won').forEach(l => {
      const m = l.lead_date.slice(0, 7)
      months[m] = (months[m] || 0) + (l.deal_value || 0)
    })
    const sorted = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
    return { labels: sorted.map(e => e[0]), datasets: [{ label: 'Revenue', data: sorted.map(e => e[1]), borderColor: '#087f8c', backgroundColor: 'rgba(8,127,140,.15)', fill: true, tension: 0.4 }] }
  }, [leads])

  const h = 220

  return (
    <div className="chart-grid">
      <div className="panel chart-card">
        <div className="chart-title">Manager — Target vs Achievement</div>
        <div style={{ height: h }}><Bar data={managerChart} options={opts} /></div>
      </div>
      <div className="panel chart-card">
        <div className="chart-title">PPU vs NPU Revenue</div>
        <div style={{ height: h }}><Doughnut data={typeChart} options={opts} /></div>
      </div>
      <div className="panel chart-card">
        <div className="chart-title">Revenue Trend (Won)</div>
        <div style={{ height: h }}><Line data={trendChart} options={opts} /></div>
      </div>
      <div className="panel chart-card">
        <div className="chart-title">Sales Funnel by Stage</div>
        <div style={{ height: h }}><Bar data={stageChart} options={{ ...opts, indexAxis: 'y' as const }} /></div>
      </div>
      <div className="panel chart-card">
        <div className="chart-title">City-wise Prospects</div>
        <div style={{ height: h }}><Pie data={cityChart} options={opts} /></div>
      </div>
      <div className="panel chart-card">
        <div className="chart-title">Lead Source Performance</div>
        <div style={{ height: h }}><Bar data={sourceChart} options={opts} /></div>
      </div>
    </div>
  )
}
