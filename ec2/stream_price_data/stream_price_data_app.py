import asyncio
import logging
import os
import importlib

import boto3
from websockets import serve

from ec2.stream_price_data.client_handler import handle_client_connection

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AWS SSM parameter name for selecting provider
SSM_PROVIDER_PARAM = "/tickerquote/stream_provider"
DEFAULT_PROVIDER = "TwelveData"  # fallback

def get_stream_provider_class():
    """Fetch the provider name from AWS SSM and dynamically import the provider class."""
    ssm = boto3.client("ssm", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    try:
        response = ssm.get_parameter(Name=SSM_PROVIDER_PARAM)
        provider_name = response["Parameter"]["Value"]
    except Exception as e:
        logger.warning(f"Could not fetch provider from SSM: {e}. Using default '{DEFAULT_PROVIDER}'")
        provider_name = DEFAULT_PROVIDER

    module_path = f"ec2.stream_price_data.providers.{provider_name.lower()}_streamer"
    class_name = f"{provider_name}Streamer"

    try:
        module = importlib.import_module(module_path)
        provider_class = getattr(module, class_name)
        logger.info(f"Using provider: {provider_name}")
        return provider_class
    except (ModuleNotFoundError, AttributeError) as e:
        logger.error(f"Failed to load provider '{provider_name}': {e}")
        raise ValueError(f"Invalid provider name: {provider_name}") from e

async def main():
    provider_class = get_stream_provider_class()
    async with serve(
        lambda ws: handle_client_connection(ws, provider_class),
        "0.0.0.0",
        8080,
    ):
        logger.info("Server started on port 8080")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
