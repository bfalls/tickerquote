#!/bin/bash

# This script should only run from CI (.github/workflows/deploy-frontend.yml)
# that defaults to the stock-strategy-app/ path already, that should be the CWD.

set -e
ENV_FILE=".env.production"

if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI not found"
  exit 1
fi

echo "# Generated $ENV_FILE" > $ENV_FILE

for key in VITE_OHLCV_API_URL VITE_WEBSOCKET_URL; do
  value=$(aws ssm get-parameter --name "/stock-strategy-app/$key" --with-decryption --query "Parameter.Value" --output text)
  echo "$key=$value" >> $ENV_FILE
done

echo ""
echo "✅ Generated $ENV_FILE populated from AWS SSM."
