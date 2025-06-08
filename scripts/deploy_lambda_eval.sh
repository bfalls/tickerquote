#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lambda_utils.sh"

LAMBDA_NAME="EvaluateStockStrategy"
ZIP_FILE="evaluate_lambda.zip"
SRC_DIR="lambda_code"
REQS_FILE="lambda_code/requirements.txt"
HANDLER="evaluate_stock_strategy.lambda_handler"
RUNTIME="python3.11"
ROLE_ARN="arn:aws:iam::406222517046:role/service-role/GetStockPrice-role-ewo18gz7"
AWS_REGION="us-east-1"

zip_lambda $SRC_DIR $ZIP_FILE $REQS_FILE
deploy_lambda $ZIP_FILE $LAMBDA_NAME $AWS_REGION $RUNTIME $ROLE_ARN $HANDLER
