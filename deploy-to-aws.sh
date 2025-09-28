#!/bin/bash

echo "🚀 Deploying Stripe Webhook to AWS Lambda..."

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework not found. Installing..."
    npm install -g serverless
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Check for webhook secret
if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "⚠️  STRIPE_WEBHOOK_SECRET not set. Please set it:"
    echo "export STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install serverless-offline --save-dev

# Deploy to AWS
echo "🚀 Deploying to AWS..."
serverless deploy

# Get the webhook URL
echo "📡 Getting webhook URL..."
WEBHOOK_URL=$(serverless info --verbose | grep -o 'https://[^/]*/webhook')

echo ""
echo "🎉 Deployment successful!"
echo "📡 Webhook URL: $WEBHOOK_URL"
echo ""
echo "📋 Next steps:"
echo "1. Go to Stripe Dashboard → Webhooks"
echo "2. Add endpoint: $WEBHOOK_URL"
echo "3. Select these events:"
echo "   - checkout.session.completed"
echo "   - customer.subscription.created"
echo "   - customer.subscription.updated"
echo "   - customer.subscription.deleted"
echo "   - invoice.payment_succeeded"
echo "   - invoice.payment_failed"
echo "4. Copy the webhook secret and update your environment"
echo ""
echo "🧪 Test your webhook:"
echo "curl -X POST $WEBHOOK_URL \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'stripe-signature: test' \\"
echo "  -d '{\"type\": \"test.event\"}'"
