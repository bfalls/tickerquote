#!/bin/bash
set -e

# Require ZIP_FILE to be set
if [[ -z "$ZIP_FILE" ]]; then
  echo "❌ Error: ZIP_FILE environment variable is not set."
  SCRIPT_NAME=$(basename "$0")
  echo "Please run the script with: ZIP_FILE=yourfile.zip bash $SCRIPT_NAME"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lambda_utils.sh"

LAMBDA_NAME="TwelveDataProxy"
ZIP_FILE="stream_price_data.zip"
SRC_DIR="lambda_code"
REQS_FILE="lambda_code/requirements/requirements_stream_price_data.txt"
HANDLER="stream_price_data.lambda_handler"
RUNTIME="python3.11"
ROLE_ARN="arn:aws:lambda:us-east-1:406222517046:function:TwelveDataProxy"
AWS_REGION="us-east-1"

zip_lambda $SRC_DIR $ZIP_FILE $REQS_FILE
deploy_lambda $ZIP_FILE $LAMBDA_NAME $AWS_REGION $RUNTIME $ROLE_ARN $HANDLER
