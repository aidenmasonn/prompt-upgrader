import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
  )
}

// Server-side client using the service role key.
// Only use this in API routes (server-side), never expose to the browser.
export const supabase = createClient(supabaseUrl, supabaseKey)
