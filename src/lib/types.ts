export type Role = 'admin' | 'sales_manager'

export interface AppUser {
  id: string
  auth_user_id: string
  full_name: string
  email: string
  role: Role
  created_at: string
  updated_at: string | null
  avatar_url: string | null
  account_id: string | null
  account_role: string | null
}

export interface SalesManager {
  id: string
  user_id: string | null
  name: string
  email: string
  active_from: string
  target_from: string
  status: string
  created_at: string
}

export type LeadStage =
  | 'Lead' | 'Qualified' | 'Demo Scheduled' | 'Demo Done'
  | 'Negotiation' | 'Closed Won' | 'Closed Lost'

export type LeadStatus = 'Open' | 'Won' | 'Lost'
export type ClientType = 'PPU' | 'NPU'
export type MeetingType = 'Physical' | 'Virtual' | 'Call'

export interface Lead {
  id: string
  lead_date: string
  sales_manager_id: string
  client_name: string
  brand_name: string | null
  city: string
  contact_person: string | null
  contact_number: string | null
  client_type: ClientType
  outlets: number
  lead_source: string | null
  meeting_type: MeetingType | null
  stage: LeadStage
  status: LeadStatus
  deal_value: number
  follow_up_date: string | null
  expected_closure_date: string | null
  remarks: string | null
  next_action: string | null
  updated_at: string
  created_at: string
}

export interface Meeting {
  id: string
  lead_id: string
  sales_manager_id: string
  meeting_date: string
  meeting_type: MeetingType
  status: 'Planned' | 'Done' | 'Cancelled'
  notes: string | null
  created_at: string
}

export interface Activity {
  id: string
  sales_manager_id: string
  lead_id: string | null
  activity_date: string
  type: string
  summary: string | null
  created_at: string
}

export interface Target {
  id: string
  sales_manager_id: string
  period_type: 'Monthly' | 'Quarterly'
  period_start: string
  client_type: ClientType
  outlet_target: number
  brand_target: number
  target_value: number
  created_at: string
}

export interface Revenue {
  id: string
  lead_id: string
  sales_manager_id: string
  client_type: ClientType
  amount: number
  revenue_date: string
  created_at: string
}

export interface Followup {
  id: string
  lead_id: string
  sales_manager_id: string
  due_date: string
  status: 'Pending' | 'Closed' | 'Overdue'
  next_action: string | null
  created_at: string
}

export interface DashboardMetrics {
  totalLeads: number
  totalMeetings: number
  ppuMeetings: number
  npuMeetings: number
  totalPipeline: number
  wonRevenue: number
  ppuRevenue: number
  npuRevenue: number
  monthlyTarget: number
  quarterlyTarget: number
  achievement: number
  remaining: number
  conversion: number
}
