// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Store session in localStorage (persists across tabs)
    persistSession: true,
    // Auto refresh token before it expires
    autoRefreshToken: true,
    // Detect session from URL (for OAuth/magic link callbacks)
    detectSessionInUrl: true,
  },
})