import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://skyexizhdrrqunmllkza.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreWV4aXpoZHJycXVubWxsa3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzYxODEsImV4cCI6MjA3NDQxMjE4MX0.MKs-c_vUxw-QiEqwqhgBt0KptbIqh8mXspPlocsdGZQ'

export const supabase = createClient(supabaseUrl, supabaseKey)
