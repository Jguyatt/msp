const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with your credentials
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();

// Middleware to parse raw body for Stripe webhooks
app.use('/webhook', express.raw({ type: 'application/json' }));

// Stripe webhook endpoint
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Stripe webhook:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

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

// For manual subscription creation (if you need to add your existing subscription)
async function createManualSubscription(userEmail, stripeCustomerId, stripeSubscriptionId, planName = 'Professional') {
  try {
    // Find user by email
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
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      plan_name: planName,
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

    if (error) throw error;
    
    console.log('Manual subscription created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating manual subscription:', error);
    throw error;
  }
}

module.exports = { app, createManualSubscription };

// If running this file directly
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Stripe webhook server running on port ${PORT}`);
  });
}