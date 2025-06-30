# stream_price_data_app.py

import asyncio
import websockets
import json
import boto3
import os
import signal
import sys

running = True

def handle_signal(sig, frame):
    global running
    print(f"Received signal {sig}, shutting down...")
    running = False

signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)

def get_api_key():
    ssm = boto3.client("ssm", region_name="us-east-1")
    response = ssm.get_parameter(
        Name='TWELVE_DATA_API_KEY',
        WithDecryption=True
    )
    return response['Parameter']['Value']

async def stream_price(symbol, api_key):
    url = f"wss://ws.twelvedata.com/v1/quotes/price?apikey={api_key}"
    async with websockets.connect(url) as ws:
        await ws.send(json.dumps({
            "action": "subscribe",
            "params": {
                "symbols": symbol
            }
        }))
        print(f"Subscribed to {symbol}")

        while running:
            try:
                message = await asyncio.wait_for(ws.recv(), timeout=30)
                data = json.loads(message)
                if data.get("event") == "price":
                    print(f"[{data['symbol']}] ${data['price']}")
            except asyncio.TimeoutError:
                print("Still alive...")
            except Exception as e:
                print("WebSocket error:", e)
                break

async def main():
    symbol = os.environ.get("SYMBOL")
    if not symbol:
        print("Environment variable SYMBOL is required.")
        sys.exit(1)

    api_key = get_api_key()
    while running:
        await stream_price(symbol, api_key)
        await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
