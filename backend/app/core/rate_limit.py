"""
Krishi Drishti - Production Rate Limiter & Abuse Prevention (P22).
Enforces sliding-window rate limiting backed by Redis with in-memory fallback.
Limits:
- Login: 5 attempts per minute
- Uploads / Disease Detection: 20 attempts per minute
- Voice Queries: 10 attempts per minute
"""

import time
from typing import Dict, List
from collections import defaultdict
from fastapi import Request
from app.core.redis import get_redis_client
from app.core.errors import AppException
from app.core.logging import logger

# In-memory sliding window fallback
_memory_windows: Dict[str, List[float]] = defaultdict(list)


def check_rate_limit(request: Request, key_prefix: str, max_requests: int, window_seconds: int = 60):
    """
    Checks and increments rate limit for a client IP or authenticated user identifier.
    Raises HTTP 429 if the threshold is exceeded.
    """
    # Prefer client IP from X-Forwarded-For if behind reverse proxy, else request.client.host
    client_ip = request.headers.get("x-forwarded-for")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    elif request.client:
        client_ip = request.client.host
    else:
        client_ip = "127.0.0.1"

    now = time.time()
    rate_key = f"ratelimit:{key_prefix}:{client_ip}"

    # 1. Try Redis sliding window
    try:
        redis = get_redis_client()
        pipe = redis.pipeline()
        pipe.zremrangebyscore(rate_key, 0, now - window_seconds)
        pipe.zadd(rate_key, {str(now): now})
        pipe.zcard(rate_key)
        pipe.expire(rate_key, window_seconds + 5)
        results = pipe.execute()
        req_count = results[2]

        if req_count > max_requests:
            logger.warning(f"Rate limit exceeded for {rate_key}: {req_count} > {max_requests}")
            raise AppException(
                code="RATE_LIMIT_EXCEEDED",
                message=f"Too many requests. Limit is {max_requests} per {window_seconds}s. Please wait a moment.",
                status_code=429
            )
        return
    except AppException:
        raise
    except Exception as e:
        logger.debug(f"Redis rate limiter fallback to in-memory: {e}")

    # 2. In-memory sliding window fallback
    timestamps = _memory_windows[rate_key]
    # Prune expired timestamps
    _memory_windows[rate_key] = [t for t in timestamps if t > now - window_seconds]
    _memory_windows[rate_key].append(now)

    if len(_memory_windows[rate_key]) > max_requests:
        logger.warning(f"In-memory rate limit exceeded for {rate_key}: {len(_memory_windows[rate_key])} > {max_requests}")
        raise AppException(
            code="RATE_LIMIT_EXCEEDED",
            message=f"Too many requests. Limit is {max_requests} per {window_seconds}s. Please wait a moment.",
            status_code=429
        )


def rate_limit_login(request: Request):
    check_rate_limit(request, "login", max_requests=5, window_seconds=60)


def rate_limit_uploads(request: Request):
    check_rate_limit(request, "uploads", max_requests=20, window_seconds=60)


def rate_limit_voice(request: Request):
    check_rate_limit(request, "voice", max_requests=10, window_seconds=60)
