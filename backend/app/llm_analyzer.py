"""
LLM-powered results analyzer using OpenAI GPT.
Generates human-readable insights and recommendations from load test results.
"""
import json
from typing import Dict, Any, Optional, List
from openai import OpenAI

from .config import settings


def get_openai_client() -> Optional[OpenAI]:
    """Get OpenAI client if API key is configured."""
    if not settings.openai_api_key:
        return None
    return OpenAI(api_key=settings.openai_api_key)


def analyze_results_with_llm(
    run_config: dict,
    total_requests: int,
    successful_requests: int,
    avg_latency: float,
    p95: float,
    p99: float,
    error_rate: float,
    duration_seconds: float,
    endpoint_metrics: List[dict],
    status_distribution: dict,
    max_stable_rps: Optional[float] = None,
    is_suite_run: bool = False,
    suite_comparison: Optional[dict] = None
) -> Dict[str, Any]:
    """
    Use GPT to analyze load test results and generate human-readable insights.
    
    Returns a structured analysis answering key questions:
    - How many concurrent users can the platform support?
    - Is this safe to launch?
    - What breaks first?
    - How much headroom do I have?
    - What should I fix first?
    """
    client = get_openai_client()
    if not client:
        return generate_fallback_analysis(
            run_config, total_requests, successful_requests, avg_latency,
            p95, p99, error_rate, duration_seconds, endpoint_metrics,
            status_distribution, max_stable_rps
        )
    
    # Prepare metrics summary
    vus = run_config.get("vus", 10)
    duration = run_config.get("duration", 60)
    rps = total_requests / duration_seconds if duration_seconds > 0 else 0
    
    # Find slowest and most error-prone endpoints
    sorted_by_latency = sorted(endpoint_metrics, key=lambda x: x.get("p95", 0), reverse=True)
    sorted_by_errors = sorted(endpoint_metrics, key=lambda x: x.get("error_rate", 0), reverse=True)
    
    slowest_endpoints = sorted_by_latency[:3] if sorted_by_latency else []
    error_endpoints = [e for e in sorted_by_errors if e.get("error_rate", 0) > 0][:3]
    
    prompt = f"""Analyze these API load test results and provide actionable insights.

## Test Configuration
- Virtual Users (VUs): {vus}
- Test Duration: {duration_seconds:.1f} seconds
- Load Profile: {run_config.get('load_profile', 'smoke')}

## Results Summary
- Total Requests: {total_requests:,}
- Successful: {successful_requests:,} ({(1-error_rate)*100:.1f}%)
- Failed: {total_requests - successful_requests:,} ({error_rate*100:.1f}%)
- Requests per Second: {rps:.1f}
- Average Latency: {avg_latency:.1f}ms
- P95 Latency: {p95:.1f}ms
- P99 Latency: {p99:.1f}ms
{f"- Max Stable RPS: {max_stable_rps:.1f}" if max_stable_rps else ""}

## Status Code Distribution
{json.dumps(status_distribution, indent=2)}

## Slowest Endpoints (by P95)
{json.dumps(slowest_endpoints[:3], indent=2)}

## Endpoints with Errors
{json.dumps(error_endpoints, indent=2) if error_endpoints else "None - all endpoints returned successfully"}

{f"## Suite Comparison Data" + chr(10) + json.dumps(suite_comparison, indent=2) if suite_comparison else ""}

---

Provide a comprehensive analysis in this EXACT JSON format:
{{
  "executive_summary": "2-3 sentence high-level summary of API health and readiness",
  
  "concurrent_users": {{
    "current_tested": {vus},
    "estimated_max_safe": <number - estimate based on latency degradation>,
    "estimated_max_absolute": <number - before likely failure>,
    "explanation": "How you calculated this and confidence level"
  }},
  
  "launch_readiness": {{
    "verdict": "READY" | "READY_WITH_WARNINGS" | "NOT_READY",
    "confidence": "HIGH" | "MEDIUM" | "LOW",
    "reasons": ["list", "of", "reasons"],
    "blockers": ["critical issues that must be fixed"] or []
  }},
  
  "breaking_points": {{
    "first_to_break": "Which endpoint/component would fail first under higher load",
    "why": "Technical explanation",
    "at_load": "Estimated VUs/RPS where failure would occur"
  }},
  
  "headroom": {{
    "percentage": <number 0-100 representing how much capacity buffer exists>,
    "explanation": "Current load vs estimated capacity",
    "scale_recommendation": "Can handle Nx current load"
  }},
  
  "fix_priorities": [
    {{
      "priority": 1,
      "issue": "What to fix",
      "endpoint": "Affected endpoint if applicable",
      "impact": "What improvement to expect",
      "effort": "LOW" | "MEDIUM" | "HIGH"
    }}
  ],
  
  "performance_grade": {{
    "overall": "A" | "B" | "C" | "D" | "F",
    "latency": "A" | "B" | "C" | "D" | "F",
    "reliability": "A" | "B" | "C" | "D" | "F",
    "throughput": "A" | "B" | "C" | "D" | "F"
  }}
}}

Be specific, quantitative, and actionable. Base estimates on the data provided."""

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a senior performance engineer analyzing load test results. Provide specific, actionable insights. Be direct about problems. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        # Clean up potential markdown
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        analysis = json.loads(content)
        analysis["ai_generated"] = True
        return analysis
        
    except Exception as e:
        print(f"LLM analysis failed: {e}")
        return generate_fallback_analysis(
            run_config, total_requests, successful_requests, avg_latency,
            p95, p99, error_rate, duration_seconds, endpoint_metrics,
            status_distribution, max_stable_rps
        )


def generate_fallback_analysis(
    run_config: dict,
    total_requests: int,
    successful_requests: int,
    avg_latency: float,
    p95: float,
    p99: float,
    error_rate: float,
    duration_seconds: float,
    endpoint_metrics: List[dict],
    status_distribution: dict,
    max_stable_rps: Optional[float] = None
) -> Dict[str, Any]:
    """Fallback rule-based analysis when LLM is unavailable."""
    vus = run_config.get("vus", 10)
    rps = total_requests / duration_seconds if duration_seconds > 0 else 0
    
    # Simple heuristics
    latency_grade = "A" if p95 < 100 else "B" if p95 < 300 else "C" if p95 < 1000 else "D" if p95 < 3000 else "F"
    reliability_grade = "A" if error_rate < 0.01 else "B" if error_rate < 0.05 else "C" if error_rate < 0.1 else "D" if error_rate < 0.25 else "F"
    
    # Estimate max users (very rough)
    if error_rate < 0.01 and p95 < 500:
        estimated_max = int(vus * 5)
    elif error_rate < 0.05 and p95 < 1000:
        estimated_max = int(vus * 2)
    else:
        estimated_max = vus
    
    # Determine verdict
    if error_rate < 0.01 and p95 < 300:
        verdict = "READY"
    elif error_rate < 0.05 and p95 < 1000:
        verdict = "READY_WITH_WARNINGS"
    else:
        verdict = "NOT_READY"
    
    # Find issues
    fix_priorities = []
    sorted_by_latency = sorted(endpoint_metrics, key=lambda x: x.get("p95", 0), reverse=True)
    
    if sorted_by_latency and sorted_by_latency[0].get("p95", 0) > 500:
        fix_priorities.append({
            "priority": 1,
            "issue": f"High latency on {sorted_by_latency[0].get('method')} {sorted_by_latency[0].get('path')}",
            "endpoint": f"{sorted_by_latency[0].get('method')} {sorted_by_latency[0].get('path')}",
            "impact": "Reduce P95 latency by optimizing database queries or adding caching",
            "effort": "MEDIUM"
        })
    
    error_endpoints = [e for e in endpoint_metrics if e.get("error_rate", 0) > 0.01]
    for ep in error_endpoints[:2]:
        fix_priorities.append({
            "priority": len(fix_priorities) + 1,
            "issue": f"Errors on {ep.get('method')} {ep.get('path')} ({ep.get('error_rate', 0)*100:.1f}% error rate)",
            "endpoint": f"{ep.get('method')} {ep.get('path')}",
            "impact": "Improve reliability and user experience",
            "effort": "MEDIUM"
        })
    
    return {
        "ai_generated": False,
        "executive_summary": f"API handled {total_requests:,} requests at {rps:.1f} RPS with {error_rate*100:.1f}% error rate. P95 latency was {p95:.0f}ms. {'Performance is acceptable for production.' if verdict == 'READY' else 'Some issues need attention before scaling.'}",
        
        "concurrent_users": {
            "current_tested": vus,
            "estimated_max_safe": estimated_max,
            "estimated_max_absolute": estimated_max * 2,
            "explanation": "Estimate based on observed error rates and latency. Run tests with higher VUs for more accurate estimates."
        },
        
        "launch_readiness": {
            "verdict": verdict,
            "confidence": "MEDIUM",
            "reasons": [
                f"Error rate: {error_rate*100:.2f}%",
                f"P95 latency: {p95:.0f}ms",
                f"Sustained {rps:.1f} RPS"
            ],
            "blockers": [f"High error rate ({error_rate*100:.1f}%)"] if error_rate > 0.05 else []
        },
        
        "breaking_points": {
            "first_to_break": sorted_by_latency[0].get("path", "Unknown") if sorted_by_latency else "Unknown",
            "why": "Highest P95 latency indicates this endpoint is under most strain",
            "at_load": f"~{estimated_max * 2} VUs"
        },
        
        "headroom": {
            "percentage": max(0, min(100, int((1 - error_rate) * (1 - p95/3000) * 100))),
            "explanation": f"Currently using {vus} VUs, estimated safe capacity is {estimated_max} VUs",
            "scale_recommendation": f"Can likely handle {estimated_max // vus}x current load"
        },
        
        "fix_priorities": fix_priorities if fix_priorities else [{
            "priority": 1,
            "issue": "No critical issues found",
            "endpoint": "N/A",
            "impact": "Continue monitoring as traffic grows",
            "effort": "LOW"
        }],
        
        "performance_grade": {
            "overall": latency_grade if reliability_grade >= latency_grade else reliability_grade,
            "latency": latency_grade,
            "reliability": reliability_grade,
            "throughput": "A" if rps > 100 else "B" if rps > 50 else "C" if rps > 10 else "D"
        }
    }


def generate_suite_ai_summary(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate an AI-powered summary comparing all suite profile results."""
    client = get_openai_client()
    
    if not client:
        # Fallback summary without AI
        return generate_fallback_suite_summary(results)
    
    prompt = f"""Analyze these load test suite results comparing different test profiles.

## Test Results Summary
{json.dumps(results, indent=2)}

The suite tested the same API with:
1. **Smoke Test** - Low load baseline (5 VUs)
2. **Ramp Test** - Gradual load increase (up to 20 VUs)
3. **Spike Test** - Sudden traffic burst (30 VUs)
4. **Chaos Test** - Error/latency injection (10 VUs with chaos)

---

Provide a comprehensive comparison in this JSON format:
{{
  "executive_summary": "3-4 sentence overall assessment of API resilience across all conditions",
  
  "best_profile": {{
    "name": "Which profile the API handled best",
    "why": "Explanation"
  }},
  
  "worst_profile": {{
    "name": "Which profile exposed the most problems",
    "why": "What broke and why"
  }},
  
  "resilience_score": {{
    "score": <1-100>,
    "grade": "A" | "B" | "C" | "D" | "F",
    "explanation": "How well the API adapts to different conditions"
  }},
  
  "production_readiness": {{
    "current_verdict": "READY" | "NEEDS_WORK" | "NOT_READY",
    "expected_traffic": "What traffic level this API can handle",
    "risk_areas": ["list of concerns"]
  }},
  
  "key_findings": [
    "Finding 1",
    "Finding 2", 
    "Finding 3"
  ],
  
  "action_items": [
    {{
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "action": "What to do",
      "reason": "Why this matters"
    }}
  ]
}}

Be direct, quantitative, and focus on actionable insights."""

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a senior performance engineer comparing load test results across different conditions. Be specific and actionable. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        summary = json.loads(content)
        summary["ai_generated"] = True
        return summary
        
    except Exception as e:
        print(f"Suite AI summary failed: {e}")
        return generate_fallback_suite_summary(results)


def generate_fallback_suite_summary(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Fallback summary when AI is unavailable."""
    if not results:
        return {"error": "No results to summarize"}
    
    # Find best/worst by success rate
    completed = [r for r in results if r.get("status") == "completed"]
    
    best = min(completed, key=lambda x: x.get("error_rate", 1)) if completed else None
    worst = max(completed, key=lambda x: x.get("error_rate", 0)) if completed else None
    
    avg_error = sum(r.get("error_rate", 0) for r in completed) / len(completed) if completed else 1
    
    return {
        "ai_generated": False,
        "executive_summary": f"Suite ran {len(results)} test profiles. Average error rate: {avg_error*100:.1f}%. Best performance under {best.get('suite_profile_name', 'unknown') if best else 'N/A'} conditions.",
        
        "best_profile": {
            "name": best.get("suite_profile_name", "Unknown") if best else "N/A",
            "why": f"Lowest error rate ({best.get('error_rate', 0)*100:.2f}%)" if best else "No completed tests"
        },
        
        "worst_profile": {
            "name": worst.get("suite_profile_name", "Unknown") if worst else "N/A",
            "why": f"Highest error rate ({worst.get('error_rate', 0)*100:.2f}%)" if worst else "No completed tests"
        },
        
        "resilience_score": {
            "score": max(0, int((1 - avg_error) * 100)),
            "grade": "A" if avg_error < 0.01 else "B" if avg_error < 0.05 else "C" if avg_error < 0.1 else "D" if avg_error < 0.25 else "F",
            "explanation": "Based on average error rate across all profiles"
        },
        
        "production_readiness": {
            "current_verdict": "READY" if avg_error < 0.01 else "NEEDS_WORK" if avg_error < 0.1 else "NOT_READY",
            "expected_traffic": "Low to moderate traffic",
            "risk_areas": [
                r.get("suite_profile_name", "Unknown") 
                for r in results if r.get("error_rate", 0) > 0.05
            ]
        },
        
        "key_findings": [
            f"Tested {len(results)} different load profiles",
            f"Average error rate: {avg_error*100:.1f}%",
            f"Best performance: {best.get('suite_profile_name', 'N/A')}" if best else "No completed tests"
        ],
        
        "action_items": [
            {
                "priority": "HIGH" if avg_error > 0.05 else "MEDIUM",
                "action": "Review error rates and optimize slow endpoints",
                "reason": "Improve reliability before scaling"
            }
        ]
    }
