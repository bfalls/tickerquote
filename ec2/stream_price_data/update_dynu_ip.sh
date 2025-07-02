#!/bin/bash

echo "[`date`] Starting Dynu IP update..."

# Load Dynu API key securely from SSM
API_KEY=$(aws ssm get-parameter \
  --name "DYNU_API_KEY" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text \
  --region us-east-1)

DOMAIN="stock-strategy.ddnsfree.com"

# Get public IP using IMDSv2
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
CURRENT_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)
echo "[`date`] Current public IP: $CURRENT_IP"

# Send IP update to Dynu
RESPONSE=$(curl -s -X POST "https://api.dynu.com/nic/update?hostname=$DOMAIN&myip=$CURRENT_IP" -H "Auth-Token: $API_KEY")
echo "[`date`] Dynu response: $RESPONSE" 
