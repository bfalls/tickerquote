from .rsi_dip import evaluate as evaluate_rsi_dip
from .sma_crossover import evaluate as evaluate_sma_crossover

STRATEGY_MAP = {
    "RSI_DIP": evaluate_rsi_dip,
    "SMA_CROSSOVER": evaluate_sma_crossover
}
