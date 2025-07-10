from abc import ABC, abstractmethod
from typing import Protocol, Callable, Awaitable


class WebSocketLike(Protocol):
    """Defines the minimal WebSocket interface expected by providers."""
    async def send(self, data: str) -> None: ...
    async def recv(self) -> str: ...
    async def close(self, code: int = ..., reason: str = ...) -> None: ...


class BasePriceStreamer(ABC):
    """
    Abstract base class for price streaming adapters.

    All providers must implement this interface so they can be used
    interchangeably by the server without needing to know the
    specifics of the third-party API.

    This ensures that the outbound message format to the frontend
    remains consistent and decoupled from the provider's API structure.
    """

    @abstractmethod
    async def stream(self, symbol: str, websocket: WebSocketLike) -> None:
        """
        Starts streaming prices for a given symbol to the provided WebSocket client.

        Implementations must:
        - Connect to the third-party WebSocket
        - Subscribe to the given symbol
        - Forward each price update in a consistent message format

        The outgoing message format MUST follow:
        {
            "event": "price",
            "symbol": "AAPL",
            "price": 123.45,
            "source": "providername"
        }
        """
        pass
    
    @abstractmethod
    async def connect(self) -> None:
        """Establish the connection to the streaming provider."""
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """Tear down the connection to the streaming provider."""
        pass

    @abstractmethod
    async def subscribe(self, symbol: str, callback: Callable[[dict], Awaitable[None]]) -> None:
        """Subscribe to price updates for a given symbol."""
        pass

    @abstractmethod
    async def unsubscribe(self, symbol: str) -> None:
        """Unsubscribe from price updates for a given symbol."""
        pass