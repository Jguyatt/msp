const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  'https://skyexizhdrrqunmllkza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreWV4aXpoZHJycXVubWxsa3phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgzNjE4MSwiZXhwIjoyMDc0NDEyMTgxfQ.ZcwAYw9HncDnV3L_jVFifx4wZK114K4xTWIaC91SDsA'
);

async function addSubscriptionFinal() {
  console.log('🚀 Adding Professional plan subscription with service role key...\n');
  
  try {
    // Jacob's user ID
    const userId = 'aa526469-2138-452b-9491-4915583d600f';
    
    console.log('📧 User: Jacob Guyatt (guyattj39@gmail.com)');
    console.log('🆔 User ID:', userId);
    
    // Create subscription record
    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: `cus_${Date.now()}`, // Temporary ID - you can update this later with real Stripe ID
      stripe_subscription_id: `sub_${Date.now()}`, // Temporary ID - you can update this later with real Stripe ID
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
    console.log('- Billing Period: 30 days');

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
    console.log('📅 Current Period End:', new Date(data.current_period_end).toLocaleDateString());
    
    console.log('\n✨ You can now:');
    console.log('- View your plan in Settings page');
    console.log('- See real billing information');
    console.log('- Access Professional features (200 contracts)');
    console.log('- Cancel your subscription');
    console.log('- Download invoices');
    console.log('\n🔄 Refresh your Settings page to see the changes!');
    
    // Verify the subscription was created
    console.log('\n🔍 Verifying subscription...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (verifyError) {
      console.log('⚠️  Could not verify subscription:', verifyError.message);
    } else {
      console.log('✅ Subscription verified successfully!');
      console.log('📋 Plan:', verifyData.plan_name);
      console.log('📊 Status:', verifyData.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addSubscriptionFinal();
