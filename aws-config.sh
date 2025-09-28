#!/bin/bash

# AWS Configuration for Stripe EventBridge
# Replace the placeholder values with your actual AWS credentials

export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY_HERE"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY_HERE"
export AWS_DEFAULT_REGION="us-east-2"
export AWS_DEFAULT_OUTPUT="json"

# Add AWS CLI to PATH
export PATH="$PATH:/Users/jacobguyatt/Library/Python/3.9/bin"

echo "🔧 AWS Configuration loaded"
echo "📋 Please edit this file with your actual AWS credentials:"
echo "   - Replace YOUR_ACCESS_KEY_HERE with your AWS Access Key ID"
echo "   - Replace YOUR_SECRET_KEY_HERE with your AWS Secret Access Key"
echo ""
echo "Then run: source aws-config.sh && ./deploy-lambda.sh"
