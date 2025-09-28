const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key
const supabase = createClient(
  'https://skyexizhdrrqunmllkza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreWV4aXpoZHJycXVubWxsa3phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgzNjE4MSwiZXhwIjoyMDc0NDEyMTgxfQ.YourServiceRoleKey'
);

async function quickAddSubscription() {
  console.log('🚀 QUICK SUBSCRIPTION SETUP\n');
  
  // Get user input
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  try {
    console.log('📧 What email address did you use to sign up?');
    const email = await question('Email: ');
    
    console.log('\n🔍 Looking for your account in Supabase...');
    
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.log('❌ User not found. Make sure you have:');
      console.log('1. Signed in to your app at least once');
      console.log('2. Your account is synced to Supabase');
      console.log('3. Used the correct email address');
      rl.close();
      return;
    }

    console.log(`✅ Found user: ${user.full_name} (${user.email})`);
    
    console.log('\n💳 Adding Professional plan subscription...');
    
    // Create a simple subscription record
    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: `cus_${Date.now()}`, // Temporary ID
      stripe_subscription_id: `sub_${Date.now()}`, // Temporary ID
      plan_name: 'Professional',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      cancel_at_period_end: false
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating subscription:', error.message);
      rl.close();
      return;
    }
    
    console.log('\n🎉 SUCCESS! Your Professional plan is now active!');
    console.log('📊 Subscription ID:', data.id);
    console.log('\n✨ You can now:');
    console.log('- View your plan in Settings');
    console.log('- See real billing information');
    console.log('- Access Professional features');
    console.log('\n🔄 Refresh your Settings page to see the changes!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

quickAddSubscription();
