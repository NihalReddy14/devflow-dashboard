#!/bin/bash

# Script to set up Amplify secrets for GitHub OAuth

echo "Setting up Amplify secrets for DevFlow Dashboard"
echo "================================================"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "Found .env.local file. Reading values..."
    source .env.local
    echo "✓ Loaded environment variables from .env.local"
else
    echo "⚠️  No .env.local file found. Please create one first."
    exit 1
fi

echo ""
echo "Current configuration:"
echo "- GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}"
echo "- GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET:0:10}... (hidden)"
echo "- NEXTAUTH_URL: ${NEXTAUTH_URL}"
echo "- NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}... (hidden)"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local environment=$3
    
    if [ -z "$environment" ]; then
        echo "Setting $secret_name for sandbox..."
        echo "$secret_value" | npx ampx sandbox secret set "$secret_name"
    else
        echo "Setting $secret_name for $environment branch..."
        echo "$secret_value" | npx ampx sandbox secret set "$secret_name" --branch "$environment"
    fi
}

# Ask user what to do
echo "What would you like to do?"
echo "1. Set up secrets for local sandbox"
echo "2. Set up secrets for production (main branch)"
echo "3. Set up secrets for both"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Setting up sandbox secrets..."
        set_secret "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID"
        set_secret "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET"
        echo "✓ Sandbox secrets configured!"
        ;;
    2)
        echo ""
        echo "Setting up production secrets..."
        echo "⚠️  Make sure you have created a production GitHub OAuth app first!"
        echo ""
        read -p "Enter production GITHUB_CLIENT_ID: " PROD_CLIENT_ID
        read -s -p "Enter production GITHUB_CLIENT_SECRET: " PROD_CLIENT_SECRET
        echo ""
        read -p "Enter production URL (e.g., https://your-app.amplifyapp.com): " PROD_URL
        
        set_secret "GITHUB_CLIENT_ID" "$PROD_CLIENT_ID" "main"
        set_secret "GITHUB_CLIENT_SECRET" "$PROD_CLIENT_SECRET" "main"
        
        # Also need to set these as environment variables in Amplify Console
        echo ""
        echo "✓ Production secrets configured!"
        echo ""
        echo "⚠️  Don't forget to also set these environment variables in AWS Amplify Console:"
        echo "   - NEXTAUTH_URL=$PROD_URL"
        echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
        ;;
    3)
        echo ""
        echo "Setting up both sandbox and production secrets..."
        
        # Sandbox
        echo "Setting up sandbox secrets..."
        set_secret "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID"
        set_secret "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET"
        
        # Production
        echo ""
        echo "Setting up production secrets..."
        echo "⚠️  Make sure you have created a production GitHub OAuth app first!"
        echo ""
        read -p "Enter production GITHUB_CLIENT_ID: " PROD_CLIENT_ID
        read -s -p "Enter production GITHUB_CLIENT_SECRET: " PROD_CLIENT_SECRET
        echo ""
        read -p "Enter production URL (e.g., https://your-app.amplifyapp.com): " PROD_URL
        
        set_secret "GITHUB_CLIENT_ID" "$PROD_CLIENT_ID" "main"
        set_secret "GITHUB_CLIENT_SECRET" "$PROD_CLIENT_SECRET" "main"
        
        echo ""
        echo "✓ All secrets configured!"
        echo ""
        echo "⚠️  Don't forget to also set these environment variables in AWS Amplify Console:"
        echo "   - NEXTAUTH_URL=$PROD_URL"
        echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "Setup complete! 🎉"