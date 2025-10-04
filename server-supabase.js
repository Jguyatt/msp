const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Mailgun configuration
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'mg.renlu.com';
const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'noreply@mg.renlu.com';
const MAILGUN_BASE_URL = process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net/v3';

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('build')); // Serve React build files

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Configure multer for CSV uploads
const csvUpload = multer({
  dest: 'uploads/csv/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Initialize database tables
async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    
    // Create renewal_packets table
    const { error: packetsError } = await supabase.rpc('create_renewal_packets_table');
    if (packetsError && !packetsError.message.includes('already exists')) {
      console.error('Error creating renewal_packets table:', packetsError);
    } else {
      console.log('renewal_packets table already exists');
    }

    // Create renewal_packet_templates table
    const { error: templatesError } = await supabase.rpc('create_renewal_packet_templates_table');
    if (templatesError && !templatesError.message.includes('already exists')) {
      console.error('Error creating renewal_packet_templates table:', templatesError);
    } else {
      console.log('renewal_packet_templates table already exists');
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'renewal-guard-backend'
  });
});

// Stripe Webhook Endpoint
app.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Stripe webhook received:', event.type);

  // Handle subscription updates
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    
    try {
      console.log('Processing subscription update:', {
        id: subscription.id,
        status: subscription.status,
        customer: subscription.customer
      });

      // Update subscription in database
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Error updating subscription in database:', error);
      } else {
        console.log('✅ Subscription updated successfully in database');
      }
  } catch (error) {
      console.error('Error processing subscription webhook:', error);
    }
  }

  // Handle new subscriptions
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object;
    
    try {
      console.log('Processing new subscription:', subscription.id);
      
      // You might want to create a new subscription record here
      // For now, we'll just log it
      console.log('New subscription created:', subscription.id);
    } catch (error) {
      console.error('Error processing new subscription:', error);
    }
  }

  res.json({received: true});
});

// Cancel Subscription
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId, cancelAtPeriodEnd = true } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }
    
    console.log('Subscription cancellation requested:', {
      subscriptionId,
      cancelAtPeriodEnd,
      timestamp: new Date().toISOString()
    });
    
    // Real Stripe integration
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    if (stripe) {
      try {
        // Cancel the subscription in Stripe
        const stripeSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: cancelAtPeriodEnd
        });
        
        console.log('Stripe subscription updated:', {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end
        });
        
        res.json({ 
          success: true, 
          message: 'Subscription cancellation processed in Stripe',
          cancelAtPeriodEnd,
          stripeStatus: stripeSubscription.status
        });
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError);
        
        // If subscription is already canceled, that's actually success
        if (stripeError.message.includes('A canceled subscription can only update its cancellation_details')) {
          console.log('Subscription already canceled in Stripe, treating as success');
          res.json({ 
            success: true, 
            message: 'Subscription was already canceled in Stripe',
            cancelAtPeriodEnd: true,
            stripeStatus: 'canceled'
          });
        } else {
          res.status(500).json({ 
            error: 'Failed to cancel subscription in Stripe',
            details: stripeError.message 
          });
        }
      }
    } else {
      console.warn('Stripe secret key not configured, skipping Stripe API call');
      res.json({ 
        success: true, 
        message: 'Subscription cancellation logged (Stripe not configured)',
        cancelAtPeriodEnd 
      });
    }
    
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Upload Contract PDF
app.post('/api/upload-contract-pdf', upload.single('contract_pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('PDF upload request:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Extract text from PDF using pdf-parse
    const pdfParse = require('pdf-parse');
    
    try {
      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(pdfBuffer);
      
      console.log('PDF text extracted successfully:', {
        pages: pdfData.numpages,
        textLength: pdfData.text.length
      });

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        text: pdfData.text,
        pages: pdfData.numpages,
        info: pdfData.info
      });

    } catch (parseError) {
      console.error('Error extracting PDF text:', parseError);
      
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        error: 'Error extracting text from PDF',
        details: parseError.message 
      });
    }

  } catch (error) {
    console.error('PDF upload error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Error processing PDF upload' });
  }
});

// Upload CSV Contracts
app.post('/api/contracts/upload', csvUpload.single('contracts_csv'), async (req, res) => {
  try {
  if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const { userEmail } = req.body;
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    console.log('CSV upload request:', {
      filename: req.file.originalname,
      size: req.file.size,
      userEmail
    });

    // Parse CSV file
  const contracts = [];
  const errors = [];
  
    return new Promise((resolve) => {
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      // Validate required fields
          if (!row.contract_name || !row.vendor_name) {
            errors.push(`Row ${contracts.length + 1}: Missing required fields (contract_name, vendor_name)`);
        return;
      }
      
          // Parse dates
          let startDate, endDate;
          try {
            startDate = row.start_date ? new Date(row.start_date).toISOString() : null;
            endDate = row.end_date ? new Date(row.end_date).toISOString() : null;
          } catch (dateError) {
            errors.push(`Row ${contracts.length + 1}: Invalid date format`);
        return;
      }
      
      contracts.push({
            contract_name: row.contract_name,
            vendor_name: row.vendor_name,
            start_date: startDate,
            end_date: endDate,
            contract_value: row.contract_value ? parseFloat(row.contract_value.replace(/[$,]/g, '')) : null,
            renewal_date: endDate,
            status: row.status || 'active',
            user_email: userEmail,
            created_at: new Date().toISOString()
      });
    })
    .on('end', async () => {
      // Clean up uploaded file
          fs.unlinkSync(req.file.path);
      
          if (contracts.length === 0) {
        return res.status(400).json({ 
              error: 'No valid contracts found in CSV',
              details: errors 
            });
          }

          // Check contract limits
          const contractLimits = {
            'Free': 2,
            'Starter': 50,
            'Professional': 200,
            'Enterprise': -1 // -1 means unlimited
          };

          // Get user's current plan (simplified - you might want to get this from database)
          const userPlan = 'Free'; // TODO: Get actual plan from subscription service
          const limit = contractLimits[userPlan] || contractLimits['Free'];

          // Get current contract count
        const { data: existingContracts, error: countError } = await supabase
          .from('contracts')
            .select('id')
            .eq('user_email', userEmail);

        if (countError) {
            console.error('Error getting contract count:', countError);
            return res.status(500).json({ error: 'Error checking contract limits' });
          }

          const currentContractCount = existingContracts ? existingContracts.length : 0;

          // Check if adding these contracts would exceed the limit
        if (limit !== -1 && (currentContractCount + contracts.length) > limit) {
            return res.status(400).json({
              error: 'Contract limit exceeded',
              current: currentContractCount,
            limit: limit,
              attempting: contracts.length,
              plan: userPlan
          });
        }

          // Insert contracts into database
        const { data, error } = await supabase
          .from('contracts')
            .insert(contracts);

        if (error) {
            console.error('Error inserting contracts:', error);
            return res.status(500).json({ error: 'Error saving contracts to database' });
          }

        res.json({ 
            success: true,
            contractsCreated: contracts.length,
            errors: errors,
            contracts: data
          });

          resolve();
    })
    .on('error', (err) => {
      console.error('CSV parsing error:', err);
      res.status(500).json({ error: 'Error parsing CSV file' });
          resolve();
        });
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: 'Error processing CSV upload' });
  }
});

// Create Contract
app.post('/api/contracts', async (req, res) => {
  try {
    const { 
      contractName, 
      vendorName, 
      startDate, 
      endDate, 
      contractValue, 
      status, 
      userEmail 
    } = req.body;

    if (!contractName || !vendorName || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check contract limits
    const contractLimits = {
      'Free': 2,
      'Starter': 50,
      'Professional': 200,
      'Enterprise': -1 // -1 means unlimited
    };

    // Get user's current plan (simplified - you might want to get this from database)
    const userPlan = 'Free'; // TODO: Get actual plan from subscription service
    const limit = contractLimits[userPlan] || contractLimits['Free'];

    // Get current contract count
    const { data: existingContracts, error: countError } = await supabase
      .from('contracts')
      .select('id')
      .eq('user_email', userEmail);

    if (countError) {
      console.error('Error getting contract count:', countError);
      return res.status(500).json({ error: 'Error checking contract limits' });
    }

    const currentContractCount = existingContracts ? existingContracts.length : 0;

    // Check if adding this contract would exceed the limit
    if (limit !== -1 && currentContractCount >= limit) {
      return res.status(400).json({
        error: 'Contract limit reached',
        current: currentContractCount,
        limit: limit,
        plan: userPlan
      });
    }

    const contractData = {
      contract_name: contractName,
      vendor_name: vendorName,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      renewal_date: endDate ? new Date(endDate).toISOString() : null,
      contract_value: contractValue ? parseFloat(contractValue) : null,
      status: status || 'active',
      user_email: userEmail,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('contracts')
      .insert([contractData])
      .select();

    if (error) {
      console.error('Error creating contract:', error);
      return res.status(500).json({ error: 'Error creating contract' });
    }

    res.json({ success: true, contract: data[0] });

  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Error creating contract' });
  }
});

// Get Contracts
app.get('/api/contracts', async (req, res) => {
  try {
    const { userEmail } = req.query;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      return res.status(500).json({ error: 'Error fetching contracts' });
    }

    res.json({ contracts: data || [] });

  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Error fetching contracts' });
  }
});

// Update Contract
app.put('/api/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('contracts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating contract:', error);
      return res.status(500).json({ error: 'Error updating contract' });
    }

    res.json({ success: true, contract: data[0] });

  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ error: 'Error updating contract' });
  }
});

// Delete Contract
app.delete('/api/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting contract:', error);
      return res.status(500).json({ error: 'Error deleting contract' });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ error: 'Error deleting contract' });
  }
});

// AI Contract Extraction
app.post('/api/extract-contract', async (req, res) => {
  try {
    const { text, contractName } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    // OpenAI API integration
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Extract contract information from the following text and return it as a JSON object with these fields:
    - contract_name: The name/title of the contract
    - vendor_name: The vendor/company name
    - start_date: Contract start date (ISO format)
    - end_date: Contract end date (ISO format)
    - contract_value: The monetary value (number only)
    - status: Contract status (active, expired, pending, etc.)
    
    Text to analyze: ${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
        messages: [
          {
          role: "system",
          content: "You are a contract analysis expert. Extract contract information accurately and return only valid JSON."
          },
          {
          role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
    });

    const extractedData = JSON.parse(completion.choices[0].message.content);

    res.json({ 
      success: true, 
      data: extractedData
    });

  } catch (error) {
    console.error('Error extracting contract data:', error);
    res.status(500).json({ error: 'Error extracting contract data' });
  }
});

// Send Test Email
app.post('/api/send-test-email', async (req, res) => {
  try {
    const { to, subject = 'Test Email from Renlu', type = 'html' } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    if (!MAILGUN_API_KEY) {
      return res.status(500).json({ error: 'Mailgun API key not configured' });
    }

    console.log('Sending email with Mailgun config:', {
      domain: MAILGUN_DOMAIN,
      fromEmail: MAILGUN_FROM_EMAIL,
      baseUrl: MAILGUN_BASE_URL,
      to,
      subject
    });

    const formData = new URLSearchParams();
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('from', MAILGUN_FROM_EMAIL);
    
    if (type === 'html') {
      formData.append('html', `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Test Email from Renlu Contract Management</h2>
        <p>This is a test email to verify that Mailgun is working correctly.</p>
        <p>If you received this email, the email service is functioning properly!</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Sent from Renlu Contract Management System</p>
          </body>
        </html>
      `);
    } else {
    const text = 'Test Email from Renlu Contract Management\n\nThis is a test email to verify that Mailgun is working correctly.\n\nIf you received this email, the email service is functioning properly!';
      formData.append('text', text);
    }

    formData.append('from', MAILGUN_FROM_EMAIL);

    const response = await fetch(`${MAILGUN_BASE_URL}/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Mailgun API error:', responseData);
      throw new Error(`Mailgun API error: ${responseData.message || 'Unknown error'}`);
    }

    res.json({
      success: true,
      message: 'Test email sent successfully',
      mailgunId: responseData.id
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message || 'Error sending test email' });
  }
});

// Send Test Email (Text)
app.post('/api/send-test-email-text', async (req, res) => {
  try {
    const { to, subject = 'Test Email from Renlu (Text)' } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    if (!MAILGUN_API_KEY) {
      return res.status(500).json({ error: 'Mailgun API key not configured' });
    }

    const formData = new URLSearchParams();
    formData.append('to', to);
    formData.append('subject', subject);
    const text = 'Test Email from Renlu Contract Management\n\nThis is a test email to verify that Mailgun is working correctly.\n\nIf you received this email, the email service is functioning properly!';
    formData.append('text', text);
    formData.append('from', MAILGUN_FROM_EMAIL);

    const response = await fetch(`${MAILGUN_BASE_URL}/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Mailgun test email error:', responseData);
      throw new Error(`Mailgun API error: ${responseData.message || 'Unknown error'}`);
      }

      res.json({ 
        success: true, 
      message: 'Test email (text) sent successfully',
      mailgunId: responseData.id
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message || 'Error sending test email' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log('Connected to Supabase database');
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
