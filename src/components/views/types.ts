import type { CRMData, Filters } from '../AppShell'
import type { AppUser, Lead } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SharedProps {
  data: CRMData
  filters: Filters
  setFilters: (f: Filters) => void
  visibleLeads: () => Lead[]
  managerName: (id: string) => string
  isAdmin: boolean
  currentManagerId: string
  profile: AppUser
  refresh: () => Promise<void>
  supabase: SupabaseClient
}
