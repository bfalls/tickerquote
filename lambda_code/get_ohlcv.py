import os
import json
import requests
import boto3

ssm = boto3.client('ssm')

def lambda_handler(event, context):
    symbol = event.get("queryStringParameters", {}).get("symbol")
    interval = event.get("queryStringParameters", {}).get("interval", "1day")

    if not symbol:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Missing required parameter: symbol"})
        }

    # Get API key from SSM
    try:
        api_key = ssm.get_parameter(Name="TWELVE_DATA_API_KEY", WithDecryption=True)["Parameter"]["Value"]
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": f"SSM error: {str(e)}"})}

    # Request OHLCV data
    url = f"https://api.twelvedata.com/time_series"
    params = {
        "symbol": symbol,
        "interval": interval,
        "outputsize": 100,
        "apikey": api_key,
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()
        return {
            "statusCode": 200,
            "body": json.dumps(data)
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"API call failed: {str(e)}"})
        }
