from dotenv import load_dotenv
load_dotenv()

import json
from lambda_code.evaluate_stock_strategy_handler import lambda_handler

event = {
    "body": json.dumps({
        "tickers": ["AAPL"],
        "strategies": ["RSI_DIP"]
    })
}

response = lambda_handler(event, None)
print(json.dumps(response, indent=2))
