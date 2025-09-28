const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Initialize Stripe with your live secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// AWS Lambda handler
exports.handler = async (event, context) => {
  console.log('Received Stripe webhook:', JSON.stringify(event, null, 2));
  
  try {
    // Parse the webhook event
    const stripeEvent = event;
    
    // Handle different event types
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

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
};

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id);
  
  try {
    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Find user by email (assuming email is passed in metadata)
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

    // Determine plan name from price ID or metadata
    const planName = getPlanNameFromSubscription(subscription);

    // Create subscription record
    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: session.customer,
      stripe_subscription_id: subscription.id,
      plan_name: planName,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
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

// Helper function to determine plan name from subscription
function getPlanNameFromSubscription(subscription) {
  // Map Stripe price IDs to plan names
  const priceIdToPlan = {
    // Add your actual Stripe price IDs here
    'price_starter_monthly': 'Starter',
    'price_professional_monthly': 'Professional',
    'price_enterprise_monthly': 'Enterprise'
  };

  if (subscription.items && subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id;
    return priceIdToPlan[priceId] || 'Unknown';
  }

  // Fallback to metadata or default
  return subscription.metadata?.plan_name || 'Professional';
}