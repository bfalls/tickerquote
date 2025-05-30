#!/bin/bash

LAMBDA_NAME="GetStockPrice"
ZIP_FILE="lambda_payload.zip"
HANDLER="get_stock_price.lambda_handler"
RUNTIME="python3.13"
ROLE_ARN="arn:aws:lambda:us-east-1:406222517046:function:GetStockPrice"

cd lambda

# Create deployment package
zip -r ../$ZIP_FILE get_stock_price.py > /dev/null

cd ..

# Deploy the zip file to AWS Lambda
echo "🚀 Deploying Lambda function..."

# Check if Lambda function exists
if aws lambda get-function --function-name "$LAMBDA_NAME" > /dev/null 2>&1; then
  echo "✅ Updating existing Lambda function..."
  if aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file fileb://$ZIP_FILE; then
    echo "✅ Lambda function deployed successfully."
    # Clean up zip file
    echo "🧹 Cleaning up..."
    rm -f $ZIP_FILE
    echo "✅ Done."
  else
    echo "❌ Lambda deployment failed!"
    echo "⚠️ Leaving $ZIP_FILE for inspection."
    exit 1
  fi
else
  echo "🚀 Creating new Lambda function..."
  if aws lambda create-function \
    --function-name "$LAMBDA_NAME" \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --handler "$HANDLER" \
    --zip-file fileb://$ZIP_FILE; then
    echo "✅ Lambda function created successfully."
    echo "🧹 Cleaning up..."
    rm -f $ZIP_FILE
    echo "✅ Done."
  else
    echo "❌ Lambda creation failed!"
    echo "⚠️ Leaving $ZIP_FILE for inspection."
    exit 1
  fi
fi
