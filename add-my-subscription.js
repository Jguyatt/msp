const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  'https://skyexizhdrrqunmllkza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreWV4aXpoZHJycXVubWxsa3phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgzNjE4MSwiZXhwIjoyMDc0NDEyMTgxfQ.YourServiceRoleKey'
);

async function addMySubscription() {
  try {
    console.log('🔧 Adding your Professional plan subscription to Supabase...\n');
    
    // Replace these with your actual values
    const userEmail = 'your-email@example.com'; // Your Clerk email
    const stripeCustomerId = 'cus_xxxxxxxxx'; // From Stripe dashboard
    const stripeSubscriptionId = 'sub_xxxxxxxxx'; // From Stripe dashboard
    
    console.log('📧 Looking for user with email:', userEmail);
    
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('❌ Error finding user:', userError.message);
      console.log('\n💡 Make sure you have:');
      console.log('1. Signed in to your app at least once');
      console.log('2. Your account is synced to Supabase');
      console.log('3. Used the correct email address');
      return;
    }

    if (!user) {
      console.error('❌ User not found. Make sure you have signed in and your account is synced to Supabase.');
      return;
    }

    console.log('✅ Found user:', user.full_name, `(${user.email})`);

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

    console.log('\n💳 Creating subscription with data:');
    console.log('- Plan: Professional');
    console.log('- Status: Active');
    console.log('- Price: $79/month');
    console.log('- Contracts: 200');

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating subscription:', error.message);
      return;
    }
    
    console.log('\n🎉 SUCCESS! Your Professional plan is now active in Supabase!');
    console.log('📊 Subscription ID:', data.id);
    console.log('🔗 Stripe Subscription ID:', data.stripe_subscription_id);
    console.log('\n✨ You can now:');
    console.log('- View your plan in Settings');
    console.log('- Cancel your subscription');
    console.log('- See real billing information');
    console.log('- Track payment history');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

console.log(`
🚀 PROFESSIONAL PLAN SETUP

To add your existing Professional plan subscription to Supabase:

1. 📋 Get your Stripe information:
   - Go to https://dashboard.stripe.com/customers
   - Find your customer record
   - Copy the Customer ID (starts with 'cus_')
   - Go to Subscriptions tab and copy the Subscription ID (starts with 'sub_')

2. ✏️  Update this script:
   - Replace 'your-email@example.com' with your actual email
   - Replace 'cus_xxxxxxxxx' with your Stripe Customer ID  
   - Replace 'sub_xxxxxxxxx' with your Stripe Subscription ID

3. 🏃 Run this script:
   node add-my-subscription.js

This will add your subscription to Supabase so it shows up in your Settings page!
`);

// Run the function
addMySubscription();
