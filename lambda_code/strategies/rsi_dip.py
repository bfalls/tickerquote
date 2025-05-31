import requests
import os

API_KEY = os.environ["ALPHA_VANTAGE_KEY"]
BASE_URL = "https://www.alphavantage.co/query"

def evaluate(ticker: str) -> dict:
    url = f"{BASE_URL}?function=RSI&symbol={ticker}&interval=daily&time_period=14&series_type=close&apikey={API_KEY}"
    response = requests.get(url)
    data = response.json()

    rsi_data = data.get("Technical Analysis: RSI", {})
    if not rsi_data:
        raise ValueError(f"No RSI data for {ticker}: {data.get('Note') or data}")

    latest_date = sorted(rsi_data.keys())[-1]
    rsi_value = float(rsi_data[latest_date]["RSI"])

    signal = "BUY" if rsi_value < 30 else "HOLD"
    confidence = round(max(0.5, (30 - rsi_value) / 30), 2) if rsi_value < 30 else 0.5

    return {
        "strategy": "RSI_DIP",
        "signal": signal,
        "confidence": confidence,
        "indicators": {
            "rsi": rsi_value
        }
    }
