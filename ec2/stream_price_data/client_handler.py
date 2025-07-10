import json
import logging
from ec2.stream_price_data.providers.base_provider import BasePriceStreamer

logger = logging.getLogger(__name__)

class ClientConnectionHandler:
    def __init__(self, websocket, streamer: BasePriceStreamer):
        self.websocket = websocket
        self.streamer = streamer
        self.subscribed_symbols: set[str] = set()

    async def handle(self):
        try:
            async for message in self.websocket:
                if isinstance(message, bytes):
                    message = message.decode("utf-8")

                await self.process_message(message)
        except Exception as e:
            logger.error(f"Error handling client: {e}")
        finally:
            await self.cleanup()

    async def process_message(self, message: str):
        try:
            data = json.loads(message)
            action = data.get("action")

            if action == "subscribe":
                params = data.get("params", {})
                symbols = params.get("symbols", "").split(",")
                for symbol in symbols:
                    symbol = symbol.strip().upper()
                    if symbol:
                        self.subscribed_symbols.add(symbol)
                        await self.streamer.subscribe(symbol, self.send_update)

            elif action == "unsubscribe":
                params = data.get("params", {})
                symbols = params.get("symbols", "").split(",")
                for symbol in symbols:
                    symbol = symbol.strip().upper()
                    if symbol in self.subscribed_symbols:
                        self.subscribed_symbols.remove(symbol)
                        await self.streamer.unsubscribe(symbol)

        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON received: {message}")

    async def send_update(self, update: dict):
        try:
            await self.websocket.send(json.dumps(update))
        except Exception as e:
            logger.warning(f"Failed to send update to client: {e}")

    async def cleanup(self):
        logger.info("Cleaning up client subscriptions")
        for symbol in self.subscribed_symbols:
            await self.streamer.unsubscribe(symbol)
        self.subscribed_symbols.clear()

async def handle_client_connection(websocket, streamer: BasePriceStreamer) -> None:
    handler = ClientConnectionHandler(websocket, streamer)
    await handler.handle()
