import os
import json
import requests
import boto3

# Use SSM Parameter Store instead of environment variables for the API key.
# This allows for safer secrets management and enables key rotation without redeploying code.
ssm = boto3.client('ssm')

def lambda_handler(event, context):
    # Extract symbol and interval from query parameters, using "1day" as a default interval.
    symbol = event.get("queryStringParameters", {}).get("symbol")
    interval = event.get("queryStringParameters", {}).get("interval", "1day")

    if not symbol:
        # Fast fail for missing required arguments, returning a clear error for easier client debugging.
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Missing required parameter: symbol"})
        }

    # Retrieve the API key securely from AWS SSM Parameter Store.
    # This pattern avoids storing sensitive data in Lambda environment variables or code.
    try:
        api_key = ssm.get_parameter(Name="TWELVE_DATA_API_KEY", WithDecryption=True)["Parameter"]["Value"]
    except Exception as e:
        # If SSM is misconfigured or the key is missing, return a 500 to signal a server-side configuration issue.
        return {"statusCode": 500, "body": json.dumps({"error": f"SSM error: {str(e)}"})}

    # Prepare the request to the external OHLCV data provider.
    # Parameters are kept minimal to avoid hitting API rate limits and to simplify downstream parsing.
    url = f"https://api.twelvedata.com/time_series"
    params = {
        "symbol": symbol,
        "interval": interval,
        "outputsize": 100,  # Limit to 100 data points for performance and rate limiting reasons.
        "apikey": api_key,
    }

    try:
        # Make the external API call. No retry logic here—fail fast and surface the error upstream.
        response = requests.get(url, params=params)
        data = response.json()
        # Always return the full response, even on API error; downstream handling can decide what to do.
        return {
            "statusCode": 200,
            "body": json.dumps(data)
        }
    except Exception as e:
        # Catch network or unexpected issues separately for observability.
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"API call failed: {str(e)}"})
        }