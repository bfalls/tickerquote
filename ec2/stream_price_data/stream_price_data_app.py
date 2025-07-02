import asyncio
import json
import logging
import os
import sys
from websockets import serve, connect
from websockets.exceptions import ConnectionClosedOK, ConnectionClosedError
import boto3

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
ssm = boto3.client('ssm', region_name=AWS_REGION)

TWELVE_DATA_API_KEY = None
TWELVE_DATA_WS_URL = ''
PORT = int(os.environ.get("PORT", "8080"))

logging.basicConfig(level=logging.INFO)
clients = set()

async def twelve_data_stream(symbol: str, websocket):
    async with connect(TWELVE_DATA_WS_URL) as td_ws:
        await td_ws.send(json.dumps({
            "action": "subscribe",
            "params": {
                "symbols": symbol,
                "apikey": TWELVE_DATA_API_KEY,
            }
        }))
        logging.info(f"Subscribed to {symbol} for client")

        try:
            while True:
                msg = await td_ws.recv()
                await websocket.send(msg)
        except (ConnectionClosedOK, ConnectionClosedError):
            logging.info(f"Client disconnected: {symbol}")
        finally:
            await td_ws.send(json.dumps({
                "action": "unsubscribe",
                "params": {"symbols": symbol}
            }))
            logging.info(f"Unsubscribed from {symbol}")

async def handle_client(websocket):
    try:
        msg = await websocket.recv()
        data = json.loads(msg)
        symbol = data.get("symbol")

        if not symbol:
            await websocket.send(json.dumps({"error": "Missing symbol"}))
            return

        await twelve_data_stream(symbol, websocket)
    except json.JSONDecodeError:
        await websocket.send(json.dumps({"error": "Invalid JSON"}))

async def main():
    async with serve(handle_client, "0.0.0.0", PORT):
        logging.info(f"Streaming server running on port {PORT}")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        TWELVE_DATA_API_KEY = ssm.get_parameter(Name="TWELVE_DATA_API_KEY", WithDecryption=True)["Parameter"]["Value"]
        TWELVE_DATA_WS_URL = "wss://ws.twelvedata.com/v1/quotes/price?apikey={}".format(TWELVE_DATA_API_KEY)
    except Exception as e:
        logging.error("The Twelve Data API key is required")
        sys.exit(1)

    if not TWELVE_DATA_API_KEY:
        logging.error("Error: TWELVE_DATA_API_KEY is empty")
        sys.exit(1)

    asyncio.run(main())
