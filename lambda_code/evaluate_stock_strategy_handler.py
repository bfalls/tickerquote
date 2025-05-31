import json
from lambda_code.evaluate_strategy import evaluate_strategy

def lambda_handler(event, context):
    body = json.loads(event.get("body", "{}"))
    tickers = body.get("tickers", [])
    strategies = body.get("strategies", [])

    results = []

    for ticker in tickers:
        try:
            ticker_result = {"ticker": ticker, "evaluations": []}
            for strategy_code in strategies:
                evaluation = evaluate_strategy(ticker, strategy_code)
                ticker_result["evaluations"].append(evaluation)
            results.append(ticker_result)
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
