from lambda_code.strategies import STRATEGY_MAP

def evaluate_strategy(ticker: str, strategy_code: str) -> dict:
    strategy_fn = STRATEGY_MAP.get(strategy_code)
    if not strategy_fn:
        raise ValueError(f"Unsupported strategy: {strategy_code}")
    return strategy_fn(ticker)
