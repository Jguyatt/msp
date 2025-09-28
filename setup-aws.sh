#!/bin/bash

echo "🚀 Setting up AWS deployment for Stripe EventBridge integration..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo ""
    echo "Option 1 - Using Homebrew:"
    echo "  brew install awscli"
    echo ""
    echo "Option 2 - Download from AWS:"
    echo "  https://aws.amazon.com/cli/"
    echo ""
    echo "After installing, run this script again."
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run:"
    echo "  aws configure"
    echo ""
    echo "Enter your:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region: us-east-2"
    echo "  - Default output format: json"
    echo ""
    echo "After configuring, run this script again."
    exit 1
fi

echo "✅ AWS CLI is installed and configured"

# Check current region
CURRENT_REGION=$(aws configure get region)
if [ "$CURRENT_REGION" != "us-east-2" ]; then
    echo "⚠️  Current region is $CURRENT_REGION, but Stripe is configured for us-east-2"
    echo "Setting region to us-east-2..."
    aws configure set region us-east-2
fi

echo "✅ Region set to us-east-2"

# Deploy Lambda function
echo "🚀 Deploying Lambda function to AWS..."
npx serverless deploy --config eventbridge-serverless.yml

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Your Stripe EventBridge integration is now live!"
    echo ""
    echo "📋 What happens now:"
    echo "1. User buys Professional plan → Stripe sends event to EventBridge"
    echo "2. EventBridge → Triggers your Lambda function"
    echo "3. Lambda → Creates subscription in Supabase"
    echo "4. User sees plan → Settings page shows Professional plan"
    echo ""
    echo "🧪 Test it:"
    echo "1. Go to your app: http://localhost:3000"
    echo "2. Buy the Professional plan using your Stripe link"
    echo "3. Check your Supabase subscriptions table"
    echo "4. Check your app's Settings page"
    echo ""
    echo "📊 Monitor:"
    echo "- AWS CloudWatch Logs for Lambda execution"
    echo "- Stripe Dashboard for event delivery"
    echo "- Supabase Dashboard for subscription data"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi
