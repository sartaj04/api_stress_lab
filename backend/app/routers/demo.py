"""Demo endpoint for unauthenticated load testing with strict limits."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Optional
import asyncio
import aiohttp
import time
from datetime import datetime, timedelta
import statistics

router = APIRouter(prefix="/demo", tags=["demo"])

# Rate limiting: track demo runs per IP
demo_rate_limits: dict[str, list[datetime]] = {}
DEMO_COOLDOWN_MINUTES = 2
MAX_DEMOS_PER_HOUR = 10

# Demo limits
DEMO_MAX_RPS = 50
DEMO_MAX_DURATION = 20
DEMO_MAX_REQUESTS = 1000


class DemoConfig(BaseModel):
    endpoint: HttpUrl
    rps: int = 10
    duration: int = 10


class DemoMetrics(BaseModel):
    total_requests: int
    successful: int
    failed: int
    success_rate: float
    avg_latency: float
    p50: float
    p95: float
    p99: float
    max_rps: float
    error_rate: float
    timeseries: list[dict]


class DemoResponse(BaseModel):
    status: str
    message: str
    metrics: Optional[DemoMetrics] = None


def check_rate_limit(client_ip: str) -> bool:
    """Check if client is within rate limits."""
    now = datetime.now()
    cutoff = now - timedelta(hours=1)
    
    # Clean old entries
    if client_ip in demo_rate_limits:
        demo_rate_limits[client_ip] = [
            t for t in demo_rate_limits[client_ip] if t > cutoff
        ]
    
    # Check limit
    runs = demo_rate_limits.get(client_ip, [])
    if len(runs) >= MAX_DEMOS_PER_HOUR:
        return False
    
    # Check cooldown
    if runs and (now - runs[-1]).seconds < DEMO_COOLDOWN_MINUTES * 60:
        return False
    
    return True


def record_demo_run(client_ip: str):
    """Record a demo run for rate limiting."""
    if client_ip not in demo_rate_limits:
        demo_rate_limits[client_ip] = []
    demo_rate_limits[client_ip].append(datetime.now())


def calculate_percentile(data: list[float], percentile: float) -> float:
    """Calculate percentile of a list."""
    if not data:
        return 0.0
    sorted_data = sorted(data)
    index = int(len(sorted_data) * percentile / 100)
    return sorted_data[min(index, len(sorted_data) - 1)]


@router.post("/run", response_model=DemoResponse)
async def run_demo_test(config: DemoConfig, client_ip: str = "unknown"):
    """
    Run a demo load test without authentication.
    
    Limits:
    - Max 50 RPS
    - Max 20 seconds duration
    - Max 1000 total requests
    - Rate limited: 10 demos per hour, 2 minute cooldown between runs
    """
    # Validate and clamp limits
    rps = min(config.rps, DEMO_MAX_RPS)
    duration = min(config.duration, DEMO_MAX_DURATION)
    max_requests = min(rps * duration, DEMO_MAX_REQUESTS)
    
    # Validate endpoint (basic check)
    endpoint = str(config.endpoint)
    if not endpoint.startswith(('http://', 'https://')):
        raise HTTPException(status_code=400, detail="Invalid endpoint URL")
    
    # Run the test
    response_times: list[float] = []
    successful = 0
    failed = 0
    timeseries = []
    
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
        start_time = time.time()
        second_start = start_time
        requests_this_second = 0
        
        while time.time() - start_time < duration and successful + failed < max_requests:
            current_time = time.time()
            
            # Track per-second metrics
            if current_time - second_start >= 1.0:
                timeseries.append({
                    "time": int(current_time - start_time),
                    "rps": requests_this_second,
                    "latency": statistics.mean(response_times[-requests_this_second:]) if response_times else 0,
                    "errors": len([t for t in response_times[-requests_this_second:] if t >= 5000])
                })
                second_start = current_time
                requests_this_second = 0
            
            # Send batch of requests
            batch_size = min(rps, max_requests - (successful + failed))
            tasks = []
            
            for _ in range(batch_size):
                tasks.append(make_request(session, endpoint, response_times))
            
            results = await asyncio.gather(*tasks)
            
            for success in results:
                if success:
                    successful += 1
                else:
                    failed += 1
                requests_this_second += 1
            
            # Wait for remainder of second
            elapsed = time.time() - current_time
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)
    
    # Calculate final metrics
    total_requests = successful + failed
    success_rate = (successful / total_requests * 100) if total_requests > 0 else 0
    avg_latency = statistics.mean(response_times) if response_times else 0
    
    metrics = DemoMetrics(
        total_requests=total_requests,
        successful=successful,
        failed=failed,
        success_rate=success_rate,
        avg_latency=avg_latency,
        p50=calculate_percentile(response_times, 50),
        p95=calculate_percentile(response_times, 95),
        p99=calculate_percentile(response_times, 99),
        max_rps=max(t.get("rps", 0) for t in timeseries) if timeseries else rps,
        error_rate=(failed / total_requests * 100) if total_requests > 0 else 0,
        timeseries=timeseries
    )
    
    return DemoResponse(
        status="completed",
        message=f"Demo test completed: {total_requests} requests in {duration}s",
        metrics=metrics
    )


async def make_request(session: aiohttp.ClientSession, endpoint: str, response_times: list) -> bool:
    """Make a single request and track timing."""
    start = time.time()
    try:
        async with session.get(endpoint) as response:
            elapsed_ms = (time.time() - start) * 1000
            response_times.append(elapsed_ms)
            return response.status < 400
    except Exception:
        response_times.append(5000)  # Timeout value
        return False


@router.get("/limits")
async def get_demo_limits():
    """Get the demo test limits."""
    return {
        "max_rps": DEMO_MAX_RPS,
        "max_duration": DEMO_MAX_DURATION,
        "max_requests": DEMO_MAX_REQUESTS,
        "cooldown_minutes": DEMO_COOLDOWN_MINUTES,
        "max_per_hour": MAX_DEMOS_PER_HOUR,
        "default_endpoint": "https://jsonplaceholder.typicode.com/posts/1"
    }

