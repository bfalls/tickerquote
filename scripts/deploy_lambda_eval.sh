#!/bin/bash
set -e

# Require ZIP_FILE to be set
if [[ -z "$ZIP_FILE" ]]; then
  echo "❌ Error: ZIP_FILE environment variable is not set."
  echo "Please run the script with: ZIP_FILE=yourfile.zip bash scripts/deploy_lambda_eval.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lambda_utils.sh"

LAMBDA_NAME="EvaluateStockStrategy"
ZIP_FILE="evaluate_lambda.zip"
SRC_DIR="lambda_code"
REQS_FILE="lambda_code/requirements/requirements_evaluate_stock.txt"
HANDLER="evaluate_stock_strategy.lambda_handler"
RUNTIME="python3.11"
ROLE_ARN="arn:aws:iam::406222517046:role/service-role/GetStockPrice-role-ewo18gz7"
AWS_REGION="us-east-1"
# Use ZIP_FILE from env or fallback
# ZIP=${ZIP_FILE:-evaluate_lambda.zip}

zip_lambda $SRC_DIR $ZIP_FILE $REQS_FILE
deploy_lambda $ZIP_FILE $LAMBDA_NAME $AWS_REGION $RUNTIME $ROLE_ARN $HANDLER
