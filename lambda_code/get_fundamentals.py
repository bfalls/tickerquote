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
    pass  # It's fine if dotenv isn't installed in Lambda

# Environment Variables
FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY")
S3_BUCKET = os.environ.get("FUNDAMENTALS_S3_BUCKET_NAME", "tickerquote-fundamentals-bucket")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# S3 client
s3 = boto3.client("s3", region_name=AWS_REGION)

# DJIA ticker list
DJIA_TICKERS = [
    "AAPL", "AMGN", "AXP", "BA", "CAT", "CRM", "CSCO", "CVX", "DIS", "DOW",
    "GS", "HD", "HON", "IBM", "INTC", "JNJ", "JPM", "KO", "MCD", "MMM",
    "MRK", "MSFT", "NKE", "PG", "TRV", "UNH", "V", "VZ", "WBA", "WMT"
]

def fetch_fundamentals(symbol: str):
    url = "https://finnhub.io/api/v1/stock/metric"
    params = {"symbol": symbol, "metric": "all", "token": FINNHUB_API_KEY}
    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"Error fetching data for {symbol}: {response.text}")
        return None
    data = response.json()
    data["symbol"] = symbol
    data["updated"] = datetime.utcnow().isoformat()
    return data

def handler(event=None, context=None):
    US_INDEX_CONSTITUENTS_FILE='us_index_constituents.json'
    try:
        boto3data = s3.get_object(Bucket=S3_BUCKET, Key=US_INDEX_CONSTITUENTS_FILE)
        constituents = json.load(boto3data['Body'])
        companies = constituents['companies']
        djia_symbols = [c['Symbol'] for c in companies if 'Dow Jones' in c.get('indexes', [])]

    except botocore.exceptions.ClientError as e:
        print(f"S3 access error: {e.response['Error']['Message']}")
        djia_symbols = []

    except json.JSONDecodeError:
        print("Failed to decode JSON from S3 object body.")
        djia_symbols = []

    except Exception as e:
        print(f"Unexpected error: {e}")
        djia_symbols = []

    fundamentals = {}
    for symbol in djia_symbols:
        print(f"Fetching {symbol}")
        fundamentals[symbol] = fetch_fundamentals(symbol)
        time.sleep(1.2)  # Stay under Finnhub's 60/min free tier limit

    try:
        s3.put_object(
            Bucket=S3_BUCKET,
            Key='djia_fundamentals.json',
            Body=json.dumps(fundamentals),
            ContentType='application/json')
        print(f"Uploaded djia_fundamentals.json with {len(fundamentals)} entries")
        return {"statusCode": 200, "body": f"{len(fundamentals)} symbols uploaded"}

    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return {"statusCode": 500, "body": "Upload failed"}

if __name__ == "__main__":
    handler()
