import json
import logging
import os
import boto3
from websockets import connect

from ec2.stream_price_data.providers.base_provider import BasePriceStreamer

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

class FinnhubStreamer(BasePriceStreamer):
    def __init__(self):
        self.api_key = self._get_api_key()
        self.ws_url = f"wss://ws.finnhub.io?token={self.api_key}"

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
