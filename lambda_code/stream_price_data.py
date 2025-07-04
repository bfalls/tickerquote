import asyncio
import websockets
import json
import boto3
import os

# Use SSM Parameter Store for API keys to avoid hard-coding secrets
# and to allow for secure, centralized management and rotation of sensitive credentials.
ssm = boto3.client("ssm")

async def stream_twelve_data_price(symbol, api_key):
    # Use Twelve Data's websocket endpoint for real-time price streaming.
    # Websockets are preferred for low-latency updates and push-based data, which is essential for streaming price feeds.
    # ??? I may turn this into an adapter so that different streaming services can be used
    url = f"wss://ws.twelvedata.com/v1/quotes/price?apikey={api_key}"
    async with websockets.connect(url) as ws:
        # Subscribe to price updates for the requested symbol.
        # Subscription model allows multiple symbols and more flexible future expansion.
        await ws.send(json.dumps({
            "action": "subscribe",
            "params": {
                "symbols": symbol
            }
        }))
        print(f"Subscribed to {symbol}")

        # Listen for incoming price messages.
        # Using 'async for' to efficiently process streaming updates without blocking the event loop.
        async for message in ws:
            data = json.loads(message)
            if data.get("event") == "price":
                # Print and break on the first price event. (Single update is enough for a Lambda invocation.)
                # This avoids keeping the Lambda function running indefinitely, which could incur unnecessary costs.
                print(f"[{data['symbol']}] ${data['price']}")
                break

def lambda_handler(event, context):
    # Retrieve the API key securely at runtime to support credential rotation and avoid storing secrets in code.
    response = ssm.get_parameter(
        Name='TWELVE_DATA_API_KEY',
        WithDecryption=True
    )
    api_key = response['Parameter']['Value']
    
    # Lambda expects the symbol to be provided in the body for flexibility with API Gateway payloads.
    body = event.get('body')
    if not body:
        # Fast fail for missing payloads to simplify client troubleshooting.
        return {
            "statusCode": 400,
            "body": "Missing body"
        }

    payload = json.loads(body)
    symbol = payload.get('symbol')
    if not symbol:
        # Require 'symbol' param to ensure clear invocation semantics and avoid unnecessary API calls.
        return {
            "statusCode": 400,
            "body": "Missing required parameter: 'symbol'"
        }

    try:
        # Use asyncio event loop to allow the Lambda to interact with the async websocket API.
        # This pattern is necessary since AWS Lambda does not natively support async handlers.
        asyncio.get_event_loop().run_until_complete(
            stream_twelve_data_price(symbol, api_key)
        )

        # Return success after first price message is received, minimizing function run time.
        # The streaming service on the free-tier can aggregate updates, slowing it down and causing timeouts.
        return {
            "statusCode": 200,
            "body": f"Price stream for {symbol} started"
        }
    except Exception as e:
        # Log and return errors for operational visibility and easier troubleshooting.
        return {
            "statusCode": 500,
            "body": f"Internal server error: {str(e)}"
        }