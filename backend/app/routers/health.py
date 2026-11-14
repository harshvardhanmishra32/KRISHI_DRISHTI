import datetime
from fastapi import APIRouter, Response, status
from app.db.session import check_db_connection
from app.core.redis import check_redis_connection

router = APIRouter(tags=["System"])


@router.get("/health", summary="System Health Check")
def health_check(response: Response):
    """
    Checks the status of the PostgreSQL + PostGIS database and Redis cache separately.
    Returns HTTP 200 if all services are operational, or 503 if any service is down.
    """
    db_connected, db_details = check_db_connection()
    redis_connected, redis_details = check_redis_connection()

    all_healthy = db_connected and redis_connected
    if not all_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "healthy" if all_healthy else "degraded",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "services": {
            "database": {
                "status": "up" if db_connected else "down",
                "details": db_details
            },
            "redis": {
                "status": "up" if redis_connected else "down",
                "details": redis_details
            }
        }
    }
