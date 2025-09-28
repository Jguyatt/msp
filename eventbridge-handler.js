const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  'https://skyexizhdrrqunmllkza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreWV4aXpoZHJycXVubWxsa3phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgzNjE4MSwiZXhwIjoyMDc0NDEyMTgxfQ.ZcwAYw9HncDnV3L_jVFifx4wZK114K4xTWIaC91SDsA'
);

// AWS Lambda handler for EventBridge events
exports.handler = async (event, context) => {
  console.log('Received EventBridge event:', JSON.stringify(event, null, 2));
  
  try {
    // Process each record from EventBridge
    for (const record of event.Records) {
      const stripeEvent = JSON.parse(record.body);
      console.log('Processing Stripe event:', stripeEvent.type);
      
      await handleStripeEvent(stripeEvent);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ processed: event.Records.length })
    };

  } catch (error) {
    console.error('Error processing EventBridge event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Event processing failed' })
    };
  }
};

// Handle Stripe events
async function handleStripeEvent(stripeEvent) {
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(stripeEvent.data.object);
      break;
    
    case 'customer.subscription.created':
      await handleSubscriptionCreated(stripeEvent.data.object);
      break;
    
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(stripeEvent.data.object);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(stripeEvent.data.object);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(stripeEvent.data.object);
      break;
    
    case 'invoice.payment_failed':
      await handlePaymentFailed(stripeEvent.data.object);
      break;
    
    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`);
  }
}

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id);
  
  try {
    // Find user by email
    const userEmail = session.customer_email || session.metadata?.email;
    if (!userEmail) {
      throw new Error('No email found in checkout session');
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      throw new Error(`User not found for email: ${userEmail}`);
    }

    // Create subscription record
    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      plan_name: 'Professional', // Default plan
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      cancel_at_period_end: false
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert([subscriptionData], {
        onConflict: 'stripe_subscription_id'
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log('Subscription created successfully:', data);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  console.log('Processing subscription created:', subscription.id);
  // This is handled by checkout.session.completed in most cases
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  console.log('Processing subscription updated:', subscription.id);
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select()
      .single();

    if (error) throw error;
    console.log('Subscription updated successfully:', data);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  console.log('Processing subscription deleted:', subscription.id);
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select()
      .single();

    if (error) throw error;
    console.log('Subscription canceled successfully:', data);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice) {
  console.log('Processing payment succeeded:', invoice.id);
  
  if (invoice.subscription) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', invoice.subscription)
        .select()
        .single();

      if (error) throw error;
      console.log('Payment succeeded, subscription activated:', data);
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
      throw error;
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  console.log('Processing payment failed:', invoice.id);
  
  if (invoice.subscription) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', invoice.subscription)
        .select()
        .single();

      if (error) throw error;
      console.log('Payment failed, subscription marked as past due:', data);
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }
}
