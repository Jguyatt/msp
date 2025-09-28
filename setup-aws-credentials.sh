#!/bin/bash

echo "🔧 Setting up AWS credentials for Stripe EventBridge..."

# Add AWS CLI to PATH
export PATH="$PATH:/Users/jacobguyatt/Library/Python/3.9/bin"

echo "📋 Please provide your AWS credentials:"
echo ""

# Get AWS Access Key ID
read -p "Enter your AWS Access Key ID: " AWS_ACCESS_KEY_ID
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ AWS Access Key ID is required"
    exit 1
fi

# Get AWS Secret Access Key
read -p "Enter your AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ AWS Secret Access Key is required"
    exit 1
fi

echo ""
echo "🔧 Configuring AWS CLI..."

# Configure AWS CLI
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region us-east-2
aws configure set output json

echo "✅ AWS CLI configured successfully!"

# Test AWS connection
echo "🧪 Testing AWS connection..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS connection successful!"
    echo ""
    echo "🚀 Ready to deploy Lambda function!"
    echo "Run: ./deploy-lambda.sh"
else
    echo "❌ AWS connection failed. Please check your credentials."
    exit 1
fi
