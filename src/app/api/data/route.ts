import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Middleware ensures only authenticated users reach this endpoint.
// Service role client bypasses RLS so all data is returned regardless of user role.
export async function GET() {
  const admin = createAdminClient()

  const [managers, leads, targets, meetings, activities, followups, revenue, users] = await Promise.all([
    admin.from('sales_managers').select('*').order('name'),
    admin.from('leads').select('*').order('lead_date', { ascending: false }),
    admin.from('targets').select('*'),
    admin.from('meetings').select('*').order('meeting_date', { ascending: false }),
    admin.from('activities').select('*').order('activity_date', { ascending: false }),
    admin.from('followups').select('*').order('due_date'),
    admin.from('revenue').select('*').order('revenue_date', { ascending: false }),
    admin.from('users').select('*').order('full_name'),
  ])

  return NextResponse.json({
    managers: managers.data || [],
    leads: leads.data || [],
    targets: targets.data || [],
    meetings: meetings.data || [],
    activities: activities.data || [],
    followups: followups.data || [],
    revenue: revenue.data || [],
    users: users.data || [],
  })
}
