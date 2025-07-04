import os
import json
import time
import requests
import boto3
import botocore.exceptions
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # Don't fail if dotenv isn't present; Lambda uses environment variables differently.

# Environment Variables
FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY")
S3_BUCKET = os.environ.get("FUNDAMENTALS_S3_BUCKET_NAME", "tickerquote-fundamentals-bucket")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# S3 client
s3 = boto3.client("s3", region_name=AWS_REGION)

def fetch_fundamentals(symbol: str):
    # Fetch all available metrics for a given symbol to minimize API calls and ensure comprehensive snapshots.
    url = "https://finnhub.io/api/v1/stock/metric"
    params = {"symbol": symbol, "metric": "all", "token": FINNHUB_API_KEY}
    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"Error fetching data for {symbol}: {response.text}")
        return None
    data = response.json()
    # Attach metadata for traceability and downstream freshness checks.
    data["symbol"] = symbol
    data["updated"] = datetime.utcnow().isoformat()
    return data

def handler(event=None, context=None):
    US_INDEX_CONSTITUENTS_FILE='us_index_constituents.json'
    try:
        # The index constituent file is stored in S3 to decouple symbol lists from code deployments.
        # This enables index updates without redeploying Lambda.
        # May expand to other markets later but gotta keep it low-cost for now.
        boto3data = s3.get_object(Bucket=S3_BUCKET, Key=US_INDEX_CONSTITUENTS_FILE)
        constituents = json.load(boto3data['Body'])
        companies = constituents['companies']
        # Only process Dow Jones symbols for now, to keep API usage within free tier and focus on core index.
        djia_symbols = [c['Symbol'] for c in companies if 'Dow Jones' in c.get('indexes', [])]

    except botocore.exceptions.ClientError as e:
        # Logging and fallback: If the constituent file is missing or access fails, the function should not crash.
        print(f"S3 access error: {e.response['Error']['Message']}")
        djia_symbols = []

    except json.JSONDecodeError:
        # Defensive: The file on S3 could be corrupted, so fail gracefully.
        print("Failed to decode JSON from S3 object body.")
        djia_symbols = []

    except Exception as e:
        # Catch-all for any unexpected issues to avoid Lambda failures.
        print(f"Unexpected error: {e}")
        djia_symbols = []

    fundamentals = {}
    for symbol in djia_symbols:
        print(f"Fetching {symbol}")
        fundamentals[symbol] = fetch_fundamentals(symbol)
        # Finnhub free tier enforces a rate limit; this sleep ensures we stay under 60 requests/min.
        time.sleep(1.2)

    try:
        # Store the full result set in S3 as a single JSON for efficient downstream access and atomic updates.
        s3.put_object(
            Bucket=S3_BUCKET,
            Key='djia_fundamentals.json',
            Body=json.dumps(fundamentals),
            ContentType='application/json')
        print(f"Uploaded djia_fundamentals.json with {len(fundamentals)} entries")
        return {"statusCode": 200, "body": f"{len(fundamentals)} symbols uploaded"}

    except Exception as e:
        # Defensive: S3 upload can fail (e.g., permissions, network); log errors for observability.
        print(f"Error uploading to S3: {e}")
        return {"statusCode": 500, "body": "Upload failed"}

if __name__ == "__main__":
    handler()