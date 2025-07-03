import asyncio
import websockets
import json
import boto3
import os

ssm = boto3.client("ssm")

async def stream_twelve_data_price(symbol, api_key):
    url = f"wss://ws.twelvedata.com/v1/quotes/price?apikey={api_key}"
    async with websockets.connect(url) as ws:
        await ws.send(json.dumps({
            "action": "subscribe",
            "params": {
                "symbols": symbol
            }
        }))
        print(f"Subscribed to {symbol}")

        async for message in ws:
            data = json.loads(message)
            if data.get("event") == "price":
                print(f"[{data['symbol']}] ${data['price']}")
                break

def lambda_handler(event, context):
    # Get API key from SSM
    response = ssm.get_parameter(
        Name='TWELVE_DATA_API_KEY',
        WithDecryption=True
    )
    api_key = response['Parameter']['Value']
    
    body = event.get('body')
    if not body:
       return {
            "statusCode": 400,
            "body": "Missing body"
        }

    payload = json.loads(body)
    symbol = payload.get('symbol')
    if not symbol:
        return {
            "statusCode": 400,
            "body": "Missing required parameter: 'symbol'"
        }

    try:
        asyncio.get_event_loop().run_until_complete(
            stream_twelve_data_price(symbol, api_key)
        )

        return {
            "statusCode": 200,
            "body": f"Price stream for {symbol} started"
        }
    except Exception as e:
        print("Error:", str(e))
        return {
            "statusCode": 500,
            "body": f"Internal server error: {str(e)}"
        }
    