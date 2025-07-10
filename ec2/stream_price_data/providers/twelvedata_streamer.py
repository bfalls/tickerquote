import json
import logging
import os
import boto3
from websockets import connect

from ec2.stream_price_data.providers.base_provider import BasePriceStreamer

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

class TwelveDataStreamer(BasePriceStreamer):
    def __init__(self):
        self.api_key = self._get_api_key()
        self.ws_url = f"wss://ws.twelvedata.com/v1/quotes/price?apikey={self.api_key}"

    def _get_api_key(self) -> str:
        ssm = boto3.client("ssm", region_name=AWS_REGION)
        try:
            response = ssm.get_parameter(
                Name="TWELVE_DATA_API_KEY",
                WithDecryption=True
            )
            return response["Parameter"]["Value"]
        except Exception as e:
            logging.error("Failed to retrieve Twelve Data API key: %s", e)
            raise

    async def stream_price(self, symbol: str, websocket) -> None:
        async with connect(self.ws_url) as provider_ws:
            await provider_ws.send(json.dumps({
                "action": "subscribe",
                "params": { "symbols": symbol }
            }))
            logging.info(f"Subscribed to {symbol} on Twelve Data")

            try:
                while True:
                    message = await provider_ws.recv()
                    data = json.loads(message)

                    if data.get("event") == "price":
                        # Normalize to a fixed frontend format (timestamp in ms)
                        normalized = {
                            "symbol": data["symbol"],
                            "price": data["price"],
                            "volume": data.get("day_volume"),
                            "timestamp": data["timestamp"] * 1000,
                        }
                        await websocket.send(json.dumps(normalized))
            except Exception as e:
                logging.error("Error in stream for %s: %s", symbol, e)
