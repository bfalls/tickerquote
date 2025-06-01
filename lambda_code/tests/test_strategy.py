from evaluate_strategy import evaluate_strategy

def test_evaluate_strategy_rsi():
    result = evaluate_strategy("AAPL", "RSI_DIP")
    assert isinstance(result, dict)
    assert "signal" in result
    assert result["strategy"] == "RSI_DIP"

