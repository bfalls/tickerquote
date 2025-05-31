from evaluate_strategy import evaluate_strategy

def test_evaluate_strategy_rsi():
    result = evaluate_strategy("AAPL", "rsi_dip")
    assert "decision" in result
