#!/bin/bash

echo "🔧 Configuring AWS CLI for Stripe EventBridge integration..."

# Add AWS CLI to PATH
export PATH="$PATH:/Users/jacobguyatt/Library/Python/3.9/bin"

echo "📋 You need to provide your AWS credentials:"
echo ""
echo "1. AWS Access Key ID"
echo "2. AWS Secret Access Key"
echo "3. Default region: us-east-2 (Ohio) - this matches your Stripe configuration"
echo "4. Default output format: json"
echo ""

echo "Please run the following command to configure AWS:"
echo "aws configure"
echo ""
echo "When prompted, enter:"
echo "- AWS Access Key ID: [Your Access Key]"
echo "- AWS Secret Access Key: [Your Secret Key]"
echo "- Default region name: us-east-2"
echo "- Default output format: json"
echo ""

echo "After configuring, run: ./deploy-lambda.sh"
