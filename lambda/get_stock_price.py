import json
import urllib.request
import os

API_KEY = os.environ['ALPHA_VANTAGE_KEY']

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        symbol = body.get('symbol', '').upper()

        if not symbol:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing 'symbol' in request body"})
            }

        url = f'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={API_KEY}'
        with urllib.request.urlopen(url) as response:
            data = json.load(response)

        if 'Global Quote' not in data or '05. price' not in data['Global Quote']:
            return {
                "statusCode": 404,
                "body": json.dumps({"error": f"No data found for symbol: {symbol}"})
            }

        price = data['Global Quote']['05. price']

        return {
            "statusCode": 200,
            "body": json.dumps({
                "symbol": symbol,
                "price": price
            }),
            "headers": {
                "Access-Control-Allow-Origin": "*"
            }
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
