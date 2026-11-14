import logging
import redis
from app.core.config import settings

logger = logging.getLogger("krishi_drishti.redis")

_redis_client: redis.Redis | None = None


def get_redis_client() -> redis.Redis:
    """Returns a singleton Redis client connected to the configured Redis instance."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.get_redis_url(),
            decode_responses=True,
            socket_timeout=3.0,
            socket_connect_timeout=3.0
        )
    return _redis_client


def check_redis_connection() -> tuple[bool, str]:
    """
    Pings the Redis server to verify connectivity.
    Returns (is_connected: bool, status_details: str).
    """
    try:
        client = get_redis_client()
        pong = client.ping()
        if pong:
            return True, "PONG (Connected)"
        return False, "Failed to receive PONG"
    except Exception as exc:
        logger.error(f"Redis connection error: {exc}")
        return False, str(exc)
