#!/bin/bash

# Usage: zip_lambda <source_file> <zip_name> <requirements_path>
zip_lambda() {
  local SRC_DIR=$1
  local ZIP_NAME=$2
  local REQS_FILE=$3
  local BUILD_DIR="lambda_build"

  echo "Zipping $SRC_DIR → $ZIP_NAME"
  rm -rf ${BUILD_DIR}
  mkdir -p ${BUILD_DIR}
  python3 -m pip install -r "$REQS_FILE" -t ${BUILD_DIR}/ >/dev/null
  rsync -av --exclude='__pycache__' $SRC_DIR/ ${BUILD_DIR}/
  cd ${BUILD_DIR} && zip -r ../$ZIP_NAME . >/dev/null
  cd ..
  rm -rf ${BUILD_DIR}
}

# Usage: deploy_lambda <zip_name> <lambda_function_name> <aws_region> <runtime_version> <arn_role> <handler>
deploy_lambda() {
    local ZIP_FILE=$1
    local LAMBDA_NAME=$2
    local AWS_REGION=$3
    local RUNTIME=$4
    local ROLE_ARN=$5
    local HANDLER=$6

    echo "🚀 Deploying Lambda function..."
    echo "🔍 Checking if function '$LAMBDA_NAME' exists in region '$AWS_REGION'..."
    if aws lambda get-function --function-name "$LAMBDA_NAME" --region "$AWS_REGION" > /dev/null 2>&1; then
        echo "✅ Updating existing Lambda function..."
        if aws lambda update-function-code \
            --function-name "$LAMBDA_NAME" \
            --zip-file fileb://$ZIP_FILE; then
            echo "✅ Lambda function deployed successfully."
            echo "✅ Done."
        else
            echo "❌ Lambda deployment failed!"
            echo "⚠️ Leaving build artifacts for inspection."
            exit 1
        fi
    else
    echo "🚀 Lambda function does not exist. Creating..."
        if aws lambda create-function \
            --function-name "$LAMBDA_NAME" \
            --runtime "$RUNTIME" \
            --role "$ROLE_ARN" \
            --handler "$HANDLER" \
            --zip-file fileb://$ZIP_FILE; then
            echo "✅ Lambda function created successfully."
            echo "✅ Done."
        else
            echo "❌ Lambda creation failed!"
            echo "⚠️ Leaving build artifacts for inspection."
            exit 1
        fi
    fi
}
