import requests
import os

API_KEY = os.environ['ALPHA_VANTAGE_KEY']
BASE_URL = "https://www.alphavantage.co/query"

def evaluate(ticker: str) -> dict:
    # Placeholder logic
    return {
        "strategy": "SMA_CROSSOVER",
        "signal": "HOLD",
        "confidence": 0.5,
        "indicators": {
            "sma_50": 180.0,
            "sma_200": 185.0
        }
    }
