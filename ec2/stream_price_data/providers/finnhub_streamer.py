import asyncio
import json
import logging
import os
import boto3
from typing import Callable, Awaitable, cast
from websockets import connect
# from websockets.client import ClientConnection

from providers.base_provider import BasePriceStreamer, WebSocketLike

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

class FinnhubStreamer(BasePriceStreamer):
    def __init__(self):
        self.api_key = self._get_api_key()
        self.ws_url = f"wss://ws.finnhub.io?token={self.api_key}"
        # self.connection: ClientConnection | None = None
        self.connection: WebSocketLike | None = None
        self.callback = None
        
    async def _listen(self):
        if self.connection is None:
            return
        
        try:
            while True:
                message = await self.connection.recv()
                data = json.loads(message)
                if data.get("type") == "trade":
                    for trade in data.get("data", []):
                        update = {
                            "symbol": trade.get("s"),
                            "price": trade.get("p"),
                            "timestamp": trade.get("t") // 1_000_000,  # nanoseconds to ms
                            "volume": trade.get("v")
                        }
                        if self.callback:
                            await self.callback(update)
        except Exception as e:
            # Log errors here
            pass
        
    async def connect(self):
        self.connection = cast(WebSocketLike, await connect(self.ws_url))

    async def subscribe(self, symbol: str, callback: Callable[[dict], Awaitable[None]]) -> None:
        if self.connection is None:
            await self.connect()

        assert self.connection is not None
        self.callback = callback
        await self.connection.send(json.dumps({
            "type": "subscribe",
            "symbol": symbol
        }))
        asyncio.create_task(self._listen())
        
    def _get_api_key(self) -> str:
        ssm = boto3.client("ssm", region_name=AWS_REGION)
        try:
            response = ssm.get_parameter(
                Name="FINNHUB_API_KEY",
                WithDecryption=True
            )
            return response["Parameter"]["Value"]
        except Exception as e:
            logging.error("Failed to retrieve Finnhub API key: %s", e)
            raise

    async def stream_price(self, symbol: str, websocket) -> None:
        async with connect(self.ws_url) as provider_ws:
            await provider_ws.send(json.dumps({
                "type": "subscribe",
                "symbol": symbol
            }))
            logging.info(f"Subscribed to {symbol} on Finnhub")

            try:
                while True:
                    msg = await provider_ws.recv()
                    payload = json.loads(msg)

                    if payload.get("type") == "trade" and "data" in payload:
                        for trade in payload["data"]:
                            await websocket.send(json.dumps({
                                "symbol": trade["s"],
                                "price": trade["p"],
                                "volume": trade["v"],
                                "timestamp": int(trade["t"]),  # already in ms
                            }))
            except Exception as e:
                logging.error(f"Streaming error for {symbol} on Finnhub: {e}")

    async def unsubscribe(self, symbol: str) -> None:
        if self.connection is None:
            return

        await self.connection.send(json.dumps({
            "type": "unsubscribe",
            "symbol": symbol
        }))

    async def disconnect(self) -> None:
        if self.connection:
            await self.connection.close()
            self.connection = None
