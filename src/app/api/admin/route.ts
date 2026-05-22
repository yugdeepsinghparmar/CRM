import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Universal admin API — handles all table writes using service role key.
// Middleware ensures only authenticated users reach this endpoint.
// Body: { action: 'insert'|'update'|'delete', table: string, data?: object, id?: string }

export async function POST(req: NextRequest) {
  const { action, table, data, id } = await req.json()

  // Whitelist allowed tables
  const allowed = ['sales_managers', 'leads', 'targets', 'meetings', 'activities', 'followups', 'revenue', 'users']
  if (!allowed.includes(table)) {
    return NextResponse.json({ error: `Table '${table}' not allowed` }, { status: 400 })
  }

  const admin = createAdminClient()
  let result

  if (action === 'insert') {
    result = await admin.from(table).insert(data).select().single()
  } else if (action === 'update') {
    if (!id) return NextResponse.json({ error: 'Missing id for update' }, { status: 400 })
    result = await admin.from(table).update(data).eq('id', id).select().single()
  } else if (action === 'delete') {
    if (!id) return NextResponse.json({ error: 'Missing id for delete' }, { status: 400 })
    result = await admin.from(table).delete().eq('id', id)
  } else {
    return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 })
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ data: result.data })
}
