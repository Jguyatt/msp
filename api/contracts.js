import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://skyexizhdrrqunmllkza.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

  // Check if Supabase is properly configured
  if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  if (req.method === 'POST') {
    try {
      console.log('Contract creation request received:', { body: req.body })
      const { contractData, userEmail } = req.body

      if (!contractData || !userEmail) {
        console.error('Missing required fields:', { contractData: !!contractData, userEmail: !!userEmail })
        return res.status(400).json({ error: 'Missing required fields' })
      }

      console.log('Looking up user:', userEmail)
      // First get the user to find their company
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('company_id, id')
        .eq('email', userEmail)
        .single()

      if (userError) {
        console.error('User lookup error:', userError)
        return res.status(400).json({ error: `User lookup failed: ${userError.message}` })
      }

      if (!user) {
        console.error('User not found in database:', userEmail)
        return res.status(400).json({ error: 'User not found in database' })
      }

      console.log('User found:', { id: user.id, company_id: user.company_id })

      // Add company_id and created_by to contract data
      const contractWithCompany = {
        ...contractData,
        company_id: user.company_id,
        created_by: user.id
      }

      console.log('Creating contract with data:', contractWithCompany)
      const { data, error } = await supabase
        .from('contracts')
        .insert([contractWithCompany])
        .select()
        .single()

      if (error) {
        console.error('Contract creation error:', error)
        return res.status(500).json({ error: `Failed to create contract: ${error.message}` })
      }

      console.log('Contract created successfully:', data)

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
