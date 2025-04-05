import { createClient } from '@supabase/supabase-js'

// For client-side usage, we need to use the exact values
const supabaseUrl = 'https://wtipjjnspufnhzhzsmrl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aXBqam5zcHVmbmh6aHpzbXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzNzU2NDMsImV4cCI6MjA1ODk1MTY0M30.IqeSV1mhgYT1_T_kFCDzsLKCnhQx7SAXIKdawM44iHY'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aXBqam5zcHVmbmh6aHpzbXJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzM3NTY0MywiZXhwIjoyMDU4OTUxNjQzfQ.iwp3fko2yky-f_xiktf9uIJmOj-KnsSpI8uVFFXsOsI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})