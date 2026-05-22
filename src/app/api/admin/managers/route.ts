import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// All routes here use the service role key — middleware already ensures only
// authenticated users reach these endpoints.

// GET — list all sales managers
export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('sales_managers').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — create a new sales manager
export async function POST(req: NextRequest) {
  const body = await req.json()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('sales_managers')
    .insert(body)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — update an existing sales manager
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('sales_managers')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
