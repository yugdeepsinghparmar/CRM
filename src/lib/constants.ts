export const APP_NAME = 'Enterprise Sales Control Tower'
export const PPU_RATE = 5000
export const NPU_RATE = 30000

export const STAGES = [
  'Lead', 'Qualified', 'Demo Scheduled', 'Demo Done',
  'Negotiation', 'Closed Won', 'Closed Lost',
] as const

export const STATUSES = ['Open', 'Won', 'Lost'] as const
export const CLIENT_TYPES = ['PPU', 'NPU'] as const
export const MEETING_TYPES = ['Physical', 'Virtual', 'Call'] as const
export const LEAD_SOURCES = ['Referral', 'Inbound', 'Outbound', 'Partner', 'Event', 'Walk-in'] as const
export const CITIES = ['Delhi', 'Gurgaon', 'Noida', 'Mumbai', 'Bengaluru', 'Other'] as const

export const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',          icon: '⌂' },
  { id: 'leads',       label: 'Lead Management',     icon: '＋' },
  { id: 'meetings',    label: 'Meeting Tracking',    icon: '◎' },
  { id: 'activities',  label: 'Daily Activity',      icon: '◷' },
  { id: 'ppu',         label: 'PPU Tracking',        icon: 'P' },
  { id: 'npu',         label: 'NPU Tracking',        icon: 'N' },
  { id: 'targets',     label: 'Target Management',   icon: '◎' },
  { id: 'revenue',     label: 'Revenue Tracking',    icon: '₹' },
  { id: 'followups',   label: 'Follow-ups',          icon: '↗' },
  { id: 'reports',     label: 'Reports',             icon: '⇩' },
  { id: 'settings',    label: 'Settings',            icon: '⚙' },
] as const
