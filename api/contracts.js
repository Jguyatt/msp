import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://skyexizhdrrqunmllkza.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreWV4aXpoZHJycXVubWxsa3phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgzNjE4MSwiZXhwIjoyMDc0NDEyMTgxfQ.YourServiceRoleKeyHere'

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'POST') {
    try {
      const { contractData, userEmail } = req.body

      if (!contractData || !userEmail) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // First get the user to find their company
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('company_id, id')
        .eq('email', userEmail)
        .single()

      if (userError) {
        console.error('User lookup error:', userError)
        return res.status(400).json({ error: 'User not found' })
      }

      if (!user) {
        return res.status(400).json({ error: 'User not found' })
      }

      // Add company_id and created_by to contract data
      const contractWithCompany = {
        ...contractData,
        company_id: user.company_id,
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('contracts')
        .insert([contractWithCompany])
        .select()
        .single()

      if (error) {
        console.error('Contract creation error:', error)
        return res.status(500).json({ error: 'Failed to create contract' })
      }

      // Create audit log entry
      await supabase
        .from('audit_logs')
        .insert([{
          contract_id: data.id,
          user_id: user.id,
          action: 'contract_created',
          details: `Contract created: ${data.vendor} - ${data.contract_name}`,
          changes: {
            vendor: data.vendor,
            contract_name: data.contract_name,
            end_date: data.end_date,
            value: data.value
          }
        }])

      res.status(201).json(data)
    } catch (error) {
      console.error('Server error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'GET') {
    try {
      const { userEmail } = req.query

      if (!userEmail) {
        return res.status(400).json({ error: 'User email required' })
      }

      // First get the user to find their company
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('email', userEmail)
        .single()

      if (userError || !user) {
        return res.status(400).json({ error: 'User not found' })
      }

      // Get contracts for the company
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          reminders (
            id,
            reminder_type,
            days_before_expiry,
            sent_at,
            status
          )
        `)
        .eq('company_id', user.company_id)
        .order('end_date', { ascending: true })

      if (error) {
        console.error('Contracts fetch error:', error)
        return res.status(500).json({ error: 'Failed to fetch contracts' })
      }

      res.status(200).json(data)
    } catch (error) {
      console.error('Server error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
