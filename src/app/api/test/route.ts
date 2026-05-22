import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = createAdminClient()

    // Test 1: Can we connect?
    const { data, error } = await admin
      .from('sales_managers')
      .select('*')
      .limit(5)

    if (error) {
      return NextResponse.json({
        step: 'SELECT sales_managers',
        success: false,
        error: error.message,
        code: error.code,
        hint: error.hint,
      })
    }

    // Test 2: Try inserting a test row
    const testRow = {
      name: '__test__',
      email: `test-${Date.now()}@test.com`,
      active_from: new Date().toISOString().slice(0, 10),
      target_from: new Date().toISOString().slice(0, 10),
      status: 'Active',
    }

    const { data: inserted, error: insertError } = await admin
      .from('sales_managers')
      .insert(testRow)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({
        step: 'INSERT sales_managers',
        success: false,
        error: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        existingRows: data,
      })
    }

    // Test 3: Clean up test row
    await admin.from('sales_managers').delete().eq('id', inserted.id)

    return NextResponse.json({
      success: true,
      message: 'All tests passed — SELECT and INSERT work fine',
      existingManagers: data?.map((m: any) => m.name),
    })
  } catch (e: any) {
    return NextResponse.json({
      step: 'unexpected error',
      success: false,
      error: e.message,
    })
  }
}
