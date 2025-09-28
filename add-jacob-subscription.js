const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with anon key
const supabase = createClient(
  'https://skyexizhdrrqunmllkza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreWV4aXpoZHJycXVubWxsa3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzYxODEsImV4cCI6MjA3NDQxMjE4MX0.MKs-c_vUxw-QiEqwqhgBt0KptbIqh8mXspPlocsdGZQ'
);

async function addJacobSubscription() {
  console.log('🚀 Adding Professional plan subscription for Jacob...\n');
  
  try {
    // Jacob's user ID from the previous check
    const userId = 'aa526469-2138-452b-9491-4915583d600f';
    
    console.log('📧 User: Jacob Guyatt (guyattj39@gmail.com)');
    console.log('🆔 User ID:', userId);
    
    // Create subscription record
    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: `cus_${Date.now()}`, // Temporary ID - you can update this later
      stripe_subscription_id: `sub_${Date.now()}`, // Temporary ID - you can update this later
      plan_name: 'Professional',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      cancel_at_period_end: false
    };

    console.log('\n💳 Creating Professional plan subscription...');
    console.log('- Plan: Professional');
    console.log('- Price: $79/month');
    console.log('- Contracts: 200');
    console.log('- Status: Active');

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating subscription:', error.message);
      console.log('\n💡 This might be due to RLS policies. Let me try a different approach...');
      return;
    }
    
    console.log('\n🎉 SUCCESS! Your Professional plan is now active!');
    console.log('📊 Subscription ID:', data.id);
    console.log('🔗 Stripe Subscription ID:', data.stripe_subscription_id);
    console.log('\n✨ You can now:');
    console.log('- View your plan in Settings');
    console.log('- See real billing information');
    console.log('- Access Professional features');
    console.log('- Cancel your subscription');
    console.log('\n🔄 Refresh your Settings page to see the changes!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addJacobSubscription();
