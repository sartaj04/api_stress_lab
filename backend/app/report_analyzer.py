from typing import Dict, Any, List


def analyze_results(
    timeseries: List[Dict[str, Any]],
    endpoint_metrics: List[Dict[str, Any]],
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """Analyze test results and generate bottleneck hints."""
    
    hints = []
    
    # Calculate overall stats
    if not timeseries:
        return {"hints": hints, "max_stable_rps": None}
    
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
        "max_stable_rps": max_stable_rps if max_stable_rps > 0 else None
    }
