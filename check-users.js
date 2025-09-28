const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key
const supabase = createClient(
  'https://skyexizhdrrqunmllkza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreWV4aXpoZHJycXVubWxsa3phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgzNjE4MSwiZXhwIjoyMDc0NDEyMTgxfQ.YourServiceRoleKey'
);

async function checkUsers() {
  console.log('🔍 Checking users in Supabase...\n');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in Supabase.');
      console.log('💡 Make sure you have signed in to your app at least once.');
      return;
    }

    console.log(`✅ Found ${users.length} user(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || 'No name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}\n`);
    });

    // Check for existing subscriptions
    console.log('🔍 Checking existing subscriptions...\n');
    
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_name, status, created_at');

    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError.message);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('❌ No subscriptions found.');
      console.log('💡 This is why your Settings page shows "No active subscription found".');
    } else {
      console.log(`✅ Found ${subscriptions.length} subscription(s):\n`);
      
      subscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. Plan: ${sub.plan_name}`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   User ID: ${sub.user_id}`);
        console.log(`   Created: ${new Date(sub.created_at).toLocaleString()}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();
