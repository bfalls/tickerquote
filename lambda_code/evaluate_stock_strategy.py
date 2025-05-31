import json
from lambda_code.evaluate_strategy import evaluate_strategy
import os

API_KEY = os.environ['ALPHA_VANTAGE_KEY']

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        tickers = body.get("tickers", [])
        strategies = body.get("strategies", [])

        results = []

        for ticker in tickers:
            try:
                evaluations = []
                for strategy_code in strategies:
                    evaluation = evaluate_strategy(ticker, strategy_code)
                    evaluations.append(evaluation)
                results.append({
                    "ticker": ticker,
                    "evaluations": evaluations
                })
            except Exception as e:
                results.append({
                    "ticker": ticker,
                    "error": str(e)
                })

        return {
            "statusCode": 200,
            "body": json.dumps({"results": results}),
            "headers": {
                "Access-Control-Allow-Origin": "*"
            }
        }

    except Exception as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": str(e)})
        }
    