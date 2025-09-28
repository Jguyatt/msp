const ngrok = require('ngrok');

async function startWebhookTunnel() {
  try {
    console.log('🚀 Starting ngrok tunnel for webhook server...\n');
    
    // Start ngrok tunnel on port 4000 (webhook server port)
    const url = await ngrok.connect({
      addr: 4000,
      proto: 'http',
      authtoken: undefined // Use free ngrok without auth token
    });
    
    console.log('✅ Webhook tunnel is ready!');
    console.log('🌐 Public URL:', url);
    console.log('📡 Webhook endpoint:', url + '/webhook');
    console.log('\n📋 Next steps:');
    console.log('1. Copy this webhook URL:', url + '/webhook');
    console.log('2. Go to Stripe Dashboard → Webhooks');
    console.log('3. Add endpoint with this URL');
    console.log('4. Select these events:');
    console.log('   - checkout.session.completed');
    console.log('   - customer.subscription.created');
    console.log('   - customer.subscription.updated');
    console.log('   - customer.subscription.deleted');
    console.log('   - invoice.payment_succeeded');
    console.log('   - invoice.payment_failed');
    console.log('5. Copy the webhook secret and update webhook-handler.js');
    console.log('\n⚠️  Keep this terminal open - closing will stop the tunnel');
    console.log('🔄 The tunnel will stay active until you press Ctrl+C\n');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping ngrok tunnel...');
      await ngrok.disconnect();
      await ngrok.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error starting ngrok tunnel:', error);
    process.exit(1);
  }
}

startWebhookTunnel();
