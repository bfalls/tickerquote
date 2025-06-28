#!/bin/bash
set -e

# Require ZIP_FILE to be set
if [[ -z "$ZIP_FILE" ]]; then
  echo "❌ Error: ZIP_FILE environment variable is not set."
  echo "Please run the script with: ZIP_FILE=yourfile.zip bash scripts/deploy_lambda_get_ohlcv.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lambda_utils.sh"

LAMBDA_NAME="TwelveDataOhlcvFetcher"
ZIP_FILE="get_ohlcv_lambda.zip"
SRC_DIR="lambda_code"
REQS_FILE="lambda_code/requirements/requirements_get_ohlcv.txt"
HANDLER="get_ohlcv.handler"
RUNTIME="python3.11"
ROLE_ARN="arn:aws:lambda:us-east-1:406222517046:function:TwelveDataOhlcvFetcher"
AWS_REGION="us-east-1"

zip_lambda $SRC_DIR $ZIP_FILE $REQS_FILE
deploy_lambda $ZIP_FILE $LAMBDA_NAME $AWS_REGION $RUNTIME $ROLE_ARN $HANDLER
