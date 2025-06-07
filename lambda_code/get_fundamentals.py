import os
import json
import time
import requests
import boto3
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

def save_to_s3(symbol_data):
    symbol = symbol_data["symbol"]
    key = f"fundamentals/{symbol}.json"
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=json.dumps(symbol_data),
        ContentType="application/json"
    )
    print(f"Uploaded {symbol} fundamentals to s3://{S3_BUCKET}/{key}")

def handler(event=None, context=None):
    for symbol in DJIA_TICKERS:
        data = fetch_fundamentals(symbol)
        if data:
            save_to_s3(data)
        time.sleep(1.2)  # Stay under Finnhub's 60/min free tier limit

if __name__ == "__main__":
    handler()
