from evaluate_strategy import evaluate_strategy

def test_evaluate_strategy_rsi():
    result = evaluate_strategy("AAPL", "RSI_DIP")
    assert "decision" in result
