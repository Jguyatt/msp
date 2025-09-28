const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://skyexizhdrrqunmllkza.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreWV4aXpoZHJycXVubWxsa3phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgzNjE4MSwiZXhwIjoyMDc0NDEyMTgxfQ.YourServiceRoleKey'
);

async function addSubscription() {
  try {
    console.log('Adding subscription to Supabase...');
    
    // You'll need to provide these values from your Stripe dashboard
    const userEmail = 'your-email@example.com'; // Replace with your actual email
    const stripeCustomerId = 'cus_xxxxxxxxx'; // Replace with your Stripe customer ID
    const stripeSubscriptionId = 'sub_xxxxxxxxx'; // Replace with your Stripe subscription ID
    
    // Find user by email
    console.log('Looking for user with email:', userEmail);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }

    if (!user) {
      console.error('User not found. Make sure you have signed in and your account is synced to Supabase.');
      return;
    }

    console.log('Found user:', user);

    // Create subscription record
    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      plan_name: 'Professional',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      cancel_at_period_end: false
    };

    console.log('Creating subscription with data:', subscriptionData);

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return;
    }
    
    console.log('✅ Subscription created successfully:', data);
    console.log('Your Professional plan is now active in Supabase!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Instructions for the user
console.log(`
🔧 MANUAL SUBSCRIPTION SETUP

To add your existing Professional plan subscription to Supabase, you need to:

1. Get your Stripe information:
   - Go to https://dashboard.stripe.com/customers
   - Find your customer record
   - Copy the Customer ID (starts with 'cus_')
   - Go to Subscriptions tab and copy the Subscription ID (starts with 'sub_')

2. Update this script:
   - Replace 'your-email@example.com' with your actual email
   - Replace 'cus_xxxxxxxxx' with your Stripe Customer ID
   - Replace 'sub_xxxxxxxxx' with your Stripe Subscription ID

3. Run this script:
   node add-subscription.js

Alternatively, you can run this script as-is and it will show you what to do.
`);

// Run the function
addSubscription();
