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

# Check if Lambda function exists
if aws lambda get-function --function-name "$LAMBDA_NAME" > /dev/null 2>&1; then
  echo "✅ Updating existing Lambda function..."
  aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file fileb://$ZIP_FILE
else
  echo "🚀 Creating new Lambda function..."
  aws lambda create-function \
    --function-name "$LAMBDA_NAME" \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --handler "$HANDLER" \
    --zip-file fileb://$ZIP_FILE
fi

echo "✅ Done."
