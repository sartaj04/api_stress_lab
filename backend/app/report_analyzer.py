from typing import Dict, Any, List, Optional
import statistics


def detect_latency_inflection(timeseries: List[Dict[str, Any]], vus: int) -> Optional[int]:
    """
    Detect where latency starts increasing sharply.
    Returns the estimated concurrent user count at inflection point.
    """
    if len(timeseries) < 3:
        return None
    
    p95_values = [t["p95"] for t in timeseries]
    
    # Calculate rate of change between points
    deltas = []
    for i in range(1, len(p95_values)):
        delta = p95_values[i] - p95_values[i-1]
        deltas.append(delta)
    
    if not deltas:
        return None
    
    avg_delta = sum(deltas) / len(deltas)
    
    # Find first point where delta exceeds 2x average (sharp increase)
    for i, delta in enumerate(deltas):
        if delta > max(avg_delta * 2, 50):  # At least 50ms jump
            # Estimate VUs at this point based on test progression
            progress = (i + 1) / len(timeseries)
            return int(vus * progress)
    
    return None


def detect_error_onset(timeseries: List[Dict[str, Any]], vus: int) -> Optional[int]:
    """
    Detect where errors first appear (>1% error rate).
    Returns the estimated concurrent user count at error onset.
    """
    if not timeseries:
        return None
    
    for i, t in enumerate(timeseries):
        if t["error_rate"] > 0.01:  # 1% threshold
            progress = (i + 1) / len(timeseries)
            return int(vus * progress)
    
    return None


def detect_breaking_point(timeseries: List[Dict[str, Any]], vus: int) -> Optional[int]:
    """
    Detect where system effectively breaks (high errors or timeouts).
    Returns the estimated concurrent user count at breaking point.
    """
    if not timeseries:
        return None
    
    for i, t in enumerate(timeseries):
        # Breaking point: >10% errors OR p99 > 5000ms (timeout territory)
        if t["error_rate"] > 0.1 or t.get("p99", 0) > 5000:
            progress = (i + 1) / len(timeseries)
            return int(vus * progress)
    
    return None


def calculate_stable_capacity(timeseries: List[Dict[str, Any]], vus: int) -> int:
    """
    Calculate max concurrent users with stable performance.
    Stable = <1% errors AND p95 < 500ms
    """
    if not timeseries:
        return vus
    
    stable_count = 0
    for t in timeseries:
        if t["error_rate"] < 0.01 and t["p95"] < 500:
            stable_count += 1
    
    # Estimate stable capacity based on proportion of stable points
    if len(timeseries) > 0:
        stable_ratio = stable_count / len(timeseries)
        return int(vus * stable_ratio)
    
    return vus


def rank_endpoints_by_performance(endpoint_metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Rank endpoints by latency and error rate.
    Returns first-to-break, slowest, and most error-prone endpoints.
    """
    if not endpoint_metrics:
        return {
            "first_to_break": None,
            "slowest": None,
            "highest_error_rate": None,
            "rankings_by_latency": [],
            "rankings_by_errors": []
        }
    
    # Sort by P95 latency (slowest first)
    by_latency = sorted(endpoint_metrics, key=lambda x: x.get("p95", 0), reverse=True)
    
    # Sort by error rate (highest first)
    by_errors = sorted(endpoint_metrics, key=lambda x: x.get("error_rate", 0), reverse=True)
    
    # Find first to break (highest combination of latency and errors)
    # Score = normalized_latency + normalized_error_rate
    max_p95 = max(e.get("p95", 1) for e in endpoint_metrics) or 1
    max_error = max(e.get("error_rate", 0) for e in endpoint_metrics) or 0.01
    
    scored = []
    for e in endpoint_metrics:
        latency_score = e.get("p95", 0) / max_p95
        error_score = e.get("error_rate", 0) / max_error if max_error > 0 else 0
        combined_score = latency_score + error_score
        scored.append({
            "endpoint": f"{e.get('method')} {e.get('path')}",
            "method": e.get("method"),
            "path": e.get("path"),
            "score": combined_score,
            "p95": e.get("p95", 0),
            "avg_latency": e.get("avg_latency", 0),
            "error_rate": e.get("error_rate", 0),
            "count": e.get("count", 0)
        })
    
    scored.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "first_to_break": scored[0] if scored else None,
        "slowest": by_latency[0] if by_latency else None,
        "highest_error_rate": by_errors[0] if by_errors and by_errors[0].get("error_rate", 0) > 0 else None,
        "rankings_by_latency": [
            {
                "rank": i + 1,
                "endpoint": f"{e.get('method')} {e.get('path')}",
                "p95": e.get("p95", 0),
                "avg_latency": e.get("avg_latency", 0)
            }
            for i, e in enumerate(by_latency[:5])
        ],
        "rankings_by_errors": [
            {
                "rank": i + 1,
                "endpoint": f"{e.get('method')} {e.get('path')}",
                "error_rate": e.get("error_rate", 0)
            }
            for i, e in enumerate(by_errors[:5]) if by_errors[i].get("error_rate", 0) > 0
        ]
    }


def generate_capacity_summary(
    vus: int,
    stable_capacity: int,
    latency_inflection: Optional[int],
    error_onset: Optional[int],
    breaking_point: Optional[int],
    avg_error_rate: float,
    avg_p95: float,
    first_to_break: Optional[Dict]
) -> str:
    """
    Generate a plain-English summary of system capacity.
    """
    parts = []
    
    # Main capacity statement
    if stable_capacity >= vus * 0.9:
        parts.append(f"The system handles approximately {stable_capacity} concurrent users reliably.")
    else:
        parts.append(f"The system can handle up to {stable_capacity} concurrent users with stable performance.")
    
    # Latency inflection
    if latency_inflection:
        parts.append(f"Latency increases rapidly beyond {latency_inflection} concurrent users.")
    
    # Error onset
    if error_onset:
        parts.append(f"Errors begin appearing at around {error_onset} concurrent users.")
    
    # Breaking point
    if breaking_point:
        parts.append(f"The system effectively breaks at {breaking_point} concurrent users.")
    
    # First to break endpoint
    if first_to_break:
        endpoint_name = first_to_break.get("endpoint", "Unknown endpoint")
        parts.append(f"The {endpoint_name} endpoint shows signs of stress first.")
    
    # Overall health
    if avg_error_rate < 0.01 and avg_p95 < 300:
        parts.append("Overall, the API performs well under tested load conditions.")
    elif avg_error_rate < 0.05 and avg_p95 < 1000:
        parts.append("Performance is acceptable but shows room for optimization.")
    else:
        parts.append("Performance issues detected that should be addressed before scaling.")
    
    return " ".join(parts)


def analyze_results(
    timeseries: List[Dict[str, Any]],
    endpoint_metrics: List[Dict[str, Any]],
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """Analyze test results and generate comprehensive capacity insights."""
    
    hints = []
    vus = config.get("vus", 10)
    
    # Calculate overall stats
    if not timeseries:
        return {
            "hints": hints,
            "max_stable_rps": None,
            "capacity_insights": None
        }
    
    total_rps = sum(t["rps"] for t in timeseries)
    avg_rps = total_rps / len(timeseries) if timeseries else 0
    
    total_error_rate = sum(t["error_rate"] for t in timeseries)
    avg_error_rate = total_error_rate / len(timeseries) if timeseries else 0
    
    avg_p95 = sum(t["p95"] for t in timeseries) / len(timeseries) if timeseries else 0
    avg_p99 = sum(t["p99"] for t in timeseries) / len(timeseries) if timeseries else 0
    
    # Find max stable RPS (where error_rate < 1% and p95 < 1000ms)
    max_stable_rps = 0
    for t in timeseries:
        if t["error_rate"] < 0.01 and t["p95"] < 1000:
            max_stable_rps = max(max_stable_rps, t["rps"])
    
    # === NEW: Capacity threshold detection ===
    stable_capacity = calculate_stable_capacity(timeseries, vus)
    latency_inflection = detect_latency_inflection(timeseries, vus)
    error_onset = detect_error_onset(timeseries, vus)
    breaking_point = detect_breaking_point(timeseries, vus)
    
    # Endpoint analysis
    endpoint_analysis = rank_endpoints_by_performance(endpoint_metrics)
    
    # Generate plain-English summary
    capacity_summary = generate_capacity_summary(
        vus=vus,
        stable_capacity=stable_capacity,
        latency_inflection=latency_inflection,
        error_onset=error_onset,
        breaking_point=breaking_point,
        avg_error_rate=avg_error_rate,
        avg_p95=avg_p95,
        first_to_break=endpoint_analysis.get("first_to_break")
    )
    
    # Build capacity insights
    capacity_insights = {
        "tested_vus": vus,
        "max_stable_users": stable_capacity,
        "latency_inflection_users": latency_inflection,
        "error_onset_users": error_onset,
        "breaking_point_users": breaking_point,
        "summary": capacity_summary,
        "endpoint_analysis": endpoint_analysis,
        "thresholds": {
            "stable": {
                "users": stable_capacity,
                "label": f"Stable up to {stable_capacity} concurrent users",
                "status": "healthy"
            },
            "degraded": {
                "users": latency_inflection,
                "label": f"Latency increases after {latency_inflection} users" if latency_inflection else "No latency degradation detected",
                "status": "warning" if latency_inflection else "healthy"
            },
            "unstable": {
                "users": error_onset,
                "label": f"Failures begin at {error_onset} users" if error_onset else "No errors detected under load",
                "status": "error" if error_onset else "healthy"
            },
            "broken": {
                "users": breaking_point,
                "label": f"System breaks at {breaking_point} users" if breaking_point else "No breaking point reached",
                "status": "critical" if breaking_point else "healthy"
            }
        },
        # Concurrency data for charting
        "concurrency_data": [
            {
                "time_bucket": t["time_bucket"],
                "estimated_vus": int(vus * ((i + 1) / len(timeseries))),
                "p95": t["p95"],
                "p50": t["p50"],
                "error_rate": t["error_rate"],
                "rps": t["rps"]
            }
            for i, t in enumerate(timeseries)
        ]
    }
    
    # === Existing hint generation ===
    
    # Analyze latency trend
    if len(timeseries) >= 3:
        first_third_p95 = sum(t["p95"] for t in timeseries[:len(timeseries)//3]) / (len(timeseries)//3)
        last_third_p95 = sum(t["p95"] for t in timeseries[-len(timeseries)//3:]) / (len(timeseries)//3)
        
        if last_third_p95 > first_third_p95 * 2 and avg_rps > 10:
            hints.append({
                "type": "saturation",
                "message": "Latency increases significantly under load",
                "recommendation": "Consider adding caching, optimizing database queries, or scaling horizontally. Check for connection pool exhaustion."
            })
    
    # Analyze error rate
    if avg_error_rate > 0.1:
        hints.append({
            "type": "high_errors",
            "message": f"High error rate: {avg_error_rate*100:.1f}%",
            "recommendation": "Check server logs for error details. Common causes: database connection limits, memory pressure, unhandled exceptions."
        })
    elif avg_error_rate > 0.01:
        hints.append({
            "type": "moderate_errors",
            "message": f"Moderate error rate: {avg_error_rate*100:.2f}%",
            "recommendation": "Review error responses to identify patterns. Consider implementing circuit breakers and retry logic."
        })
    
    # Analyze endpoint-specific issues
    if endpoint_metrics:
        # Find slowest endpoint
        slowest = max(endpoint_metrics, key=lambda x: x["p95"])
        if slowest["p95"] > 1000:
            hints.append({
                "type": "slow_endpoint",
                "message": f"Slow endpoint: {slowest['method']} {slowest['path']} (p95: {slowest['p95']:.0f}ms)",
                "recommendation": "Optimize this endpoint: add caching, reduce payload size, optimize database queries, or consider async processing."
            })
        
        # Find highest error endpoint
        highest_error = max(endpoint_metrics, key=lambda x: x["error_rate"])
        if highest_error["error_rate"] > 0.05:
            hints.append({
                "type": "error_endpoint",
                "message": f"High error endpoint: {highest_error['method']} {highest_error['path']} ({highest_error['error_rate']*100:.1f}% errors)",
                "recommendation": "Investigate this endpoint specifically. Check for validation issues, missing resources, or authentication problems."
            })
    
    # Analyze status code distribution
    status_codes = {}
    for ep in endpoint_metrics:
        for code, count in ep.get("status_codes", {}).items():
            status_codes[code] = status_codes.get(code, 0) + count
    
    total_requests = sum(status_codes.values())
    if total_requests > 0:
        five_xx = sum(v for k, v in status_codes.items() if k.startswith("5"))
        four_xx = sum(v for k, v in status_codes.items() if k.startswith("4"))
        
        if five_xx / total_requests > 0.1:
            hints.append({
                "type": "server_errors",
                "message": f"High 5xx error rate: {five_xx/total_requests*100:.1f}%",
                "recommendation": "Server-side issues detected. Check application logs, database connections, memory usage, and upstream dependencies."
            })
        
        if four_xx / total_requests > 0.2:
            hints.append({
                "type": "client_errors",
                "message": f"High 4xx error rate: {four_xx/total_requests*100:.1f}%",
                "recommendation": "Many client errors. Check authentication, request validation, and ensure test data is valid."
            })
    
    # High latency in general
    if avg_p95 > 2000:
        hints.append({
            "type": "high_latency",
            "message": f"High overall latency (p95: {avg_p95:.0f}ms)",
            "recommendation": "Consider: database query optimization, connection pooling, caching frequently accessed data, reducing response payload sizes."
        })
    
    # Timeout-like behavior
    if avg_p99 > 5000:
        hints.append({
            "type": "timeouts",
            "message": f"Very high tail latency (p99: {avg_p99:.0f}ms) suggests timeouts",
            "recommendation": "Investigate slow queries, external API calls, or resource contention. Consider implementing request timeouts and circuit breakers."
        })
    
    # No issues found
    if not hints:
        hints.append({
            "type": "healthy",
            "message": "No significant performance issues detected",
            "recommendation": "API appears healthy under this load. Consider increasing load to find breaking points."
        })
    
    return {
        "hints": hints,
        "max_stable_rps": max_stable_rps if max_stable_rps > 0 else None,
        "capacity_insights": capacity_insights
    }
