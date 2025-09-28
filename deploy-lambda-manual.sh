#!/bin/bash

echo "🚀 Deploying Lambda function manually using AWS CLI..."

# Add AWS CLI to PATH
export PATH="$PATH:/Users/jacobguyatt/Library/Python/3.9/bin"

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p lambda-package
cp eventbridge-handler.js lambda-package/
cd lambda-package

# Install dependencies
npm init -y
npm install @supabase/supabase-js

# Create zip file
zip -r ../lambda-deployment.zip .

cd ..

# Create Lambda function
echo "🔧 Creating Lambda function..."
aws lambda create-function \
  --function-name stripe-eventbridge-handler \
  --runtime nodejs18.x \
  --role arn:aws:iam::566299596109:role/lambda-execution-role \
  --handler eventbridge-handler.handler \
  --zip-file fileb://lambda-deployment.zip \
  --region us-east-2 \
  --timeout 30 \
  --memory-size 256

if [ $? -eq 0 ]; then
    echo "✅ Lambda function created successfully!"
    echo ""
    echo "🎉 Your Stripe EventBridge integration is now live!"
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
else
    echo "❌ Lambda function creation failed. You may need additional IAM permissions."
    echo "💡 Try creating a Lambda execution role with the necessary permissions."
fi
