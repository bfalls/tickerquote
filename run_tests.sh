#!/bin/bash
set -e

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Add lambda_code to PYTHONPATH
export PYTHONPATH="$PYTHONPATH:$(pwd)/lambda_code"

# Run pytest
python3 -m pytest lambda_code/tests
