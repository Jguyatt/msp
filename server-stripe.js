const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Initialize Stripe with your live secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Cancel subscription endpoint
app.post('/api/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId, cancelAtPeriodEnd = true } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    console.log(`Canceling subscription: ${subscriptionId}`);

    // Check if subscription exists in Stripe first
    let canceledSubscription;
    try {
      canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd
      });
      console.log('Subscription canceled in Stripe:', canceledSubscription.id);
    } catch (stripeError) {
      if (stripeError.code === 'resource_missing') {
        console.log('Subscription not found in Stripe, updating Supabase only');
        // Update Supabase to mark as canceled even if not in Stripe
        const { data, error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId)
          .select()
          .single();

        if (error) {
          console.error('Error updating Supabase:', error);
          return res.status(500).json({ error: 'Failed to update subscription in database' });
        }

        return res.json({
          success: true,
          message: 'Subscription was not found in Stripe but has been marked as canceled in our system',
          subscription: data
        });
      } else {
        throw stripeError;
      }
    }

    // Update subscription in Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: cancelAtPeriodEnd ? 'active' : 'canceled', // If cancel_at_period_end, status stays active until period ends
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating Supabase:', error);
      return res.status(500).json({ error: 'Failed to update subscription in database' });
    }

    console.log('Subscription updated in Supabase:', data);

    res.json({
      success: true,
      subscription: canceledSubscription,
      message: cancelAtPeriodEnd 
        ? 'Subscription will be canceled at the end of the billing period'
        : 'Subscription has been canceled immediately'
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error.message 
    });
  }
});

// Reactivate subscription endpoint
app.post('/api/reactivate-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    console.log(`Reactivating subscription: ${subscriptionId}`);

    // Reactivate subscription in Stripe
    const reactivatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });

    console.log('Subscription reactivated in Stripe:', reactivatedSubscription.id);

    // Update subscription in Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating Supabase:', error);
      return res.status(500).json({ error: 'Failed to update subscription in database' });
    }

    console.log('Subscription updated in Supabase:', data);

    res.json({
      success: true,
      subscription: reactivatedSubscription,
      message: 'Subscription has been reactivated'
    });

  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ 
      error: 'Failed to reactivate subscription',
      details: error.message 
    });
  }
});

// Get subscription details endpoint
app.get('/api/subscription/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    res.json({
      success: true,
      subscription: subscription
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subscription',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'stripe-api',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Stripe API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Cancel subscription: POST http://localhost:${PORT}/api/cancel-subscription`);
  console.log(`Reactivate subscription: POST http://localhost:${PORT}/api/reactivate-subscription`);
});

module.exports = app;