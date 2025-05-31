#!/bin/bash
set -e

LAMBDA_NAME="EvaluateStockStrategy"
ZIP_FILE="lambda_payload.zip"
SRC_DIR="lambda_code"
BUILD_DIR="build_lambda"
HANDLER="evaluate_stock_strategy.lambda_handler"
RUNTIME="python3.11"
ROLE_ARN="arn:aws:iam::406222517046:role/GetStockPrice-role-ewo18gz7"
AWS_REGION="us-east-1"

echo "📦 Cleaning previous build..."
rm -rf $BUILD_DIR $ZIP_FILE
mkdir -p $BUILD_DIR

echo "📥 Installing dependencies..."
python3 -m pip install requests -t $BUILD_DIR

echo "📁 Copying source code..."
cp -r $SRC_DIR/* $BUILD_DIR/

echo "🧵 Zipping Lambda package..."
cd $BUILD_DIR
zip -r ../$ZIP_FILE . > /dev/null
cd ..

echo "🚀 Deploying Lambda function..."

echo "🔍 Checking if function '$LAMBDA_NAME' exists in region '$AWS_REGION'..."

if aws lambda get-function --function-name "$LAMBDA_NAME" --region "$AWS_REGION" > /dev/null 2>&1; then
  echo "✅ Updating existing Lambda function..."
  if aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file fileb://$ZIP_FILE; then
    echo "✅ Lambda function deployed successfully."
    echo "🧹 Cleaning up..."
    rm -rf $ZIP_FILE $BUILD_DIR
    echo "✅ Done."
  else
    echo "❌ Lambda deployment failed!"
    echo "⚠️ Leaving build artifacts for inspection."
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
    rm -rf $ZIP_FILE $BUILD_DIR
    echo "✅ Done."
  else
    echo "❌ Lambda creation failed!"
    echo "⚠️ Leaving build artifacts for inspection."
    exit 1
  fi
fi
