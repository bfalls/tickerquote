#!/bin/bash

echo "$(date '+%Y-%m-%d %H:%M:%S') Starting Dynu IP update..."

# Load Dynu secrets from SSM
PARAM_JSON=$(aws ssm get-parameters \
  --names "DYNU_API_KEY" "DYNU_USERNAME" "DYNU_PASSWORD" \
  --with-decryption \
  --region us-east-1)

DYNU_API_KEY=$(echo "$PARAM_JSON" | jq -r '.Parameters[] | select(.Name=="DYNU_API_KEY") | .Value')
DYNU_USERNAME=$(echo "$PARAM_JSON" | jq -r '.Parameters[] | select(.Name=="DYNU_USERNAME") | .Value')
DYNU_PASSWORD=$(echo "$PARAM_JSON" | jq -r '.Parameters[] | select(.Name=="DYNU_PASSWORD") | .Value')

if [[ -z "$DYNU_API_KEY" || -z "$DYNU_USERNAME" || -z "$DYNU_PASSWORD" ]]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ Missing required Dynu credentials"
  exit 1
fi

DOMAIN="stock-strategy.ddnsfree.com"

# Get public IP using IMDSv2
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
CURRENT_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)
echo "$(date '+%Y-%m-%d %H:%M:%S') Current public IP: $CURRENT_IP"

# Send IP update to Dynu
AUTH_HEADER=$(printf "%s:%s" "$DYNU_USERNAME" "$DYNU_PASSWORD" | base64)
RESPONSE=$(curl -s "https://api.dynu.com/nic/update?hostname=$DOMAIN&myip=$CURRENT_IP" \
  -H "Authorization: Basic $AUTH_HEADER")
echo "$(date '+%Y-%m-%d %H:%M:%S') Dynu update response: $RESPONSE"
