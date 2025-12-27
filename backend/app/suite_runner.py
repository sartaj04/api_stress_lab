"""
Full Suite Runner - Automated test execution for all profiles.
Runs smoke, ramp, spike, and chaos tests automatically with comparison.
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class SuiteProfile(str, Enum):
    SMOKE = "smoke"          # Low load baseline: 5 VUs, 30s
    RAMP = "ramp"            # Gradual increase: 1->20 VUs over 60s
    SPIKE = "spike"          # Burst traffic: 50 VUs spike at 30s
    CHAOS = "chaos"          # Chaos engineering with errors/latency


@dataclass
class ProfileConfig:
    """Configuration for each test profile in the suite."""
    name: str
    description: str
    vus: int
    duration: int
    load_profile: str
    chaos_latency_ms: int = 0
    chaos_latency_percent: float = 0
    chaos_abort_percent: float = 0
    chaos_burst_enabled: bool = False
    chaos_burst_rps: int = 0
    chaos_burst_seconds: int = 0


SUITE_PROFILES: Dict[SuiteProfile, ProfileConfig] = {
    SuiteProfile.SMOKE: ProfileConfig(
        name="Smoke Test",
        description="Low load baseline to verify system health",
        vus=3,
        duration=15,
        load_profile="constant"
    ),
    SuiteProfile.RAMP: ProfileConfig(
        name="Ramp Up Test", 
        description="Gradual load increase to find breaking point",
        vus=8,
        duration=20,
        load_profile="ramp"
    ),
    SuiteProfile.SPIKE: ProfileConfig(
        name="Spike Test",
        description="Sudden traffic burst to test resilience",
        vus=10,
        duration=15,
        load_profile="spike"
    ),
    SuiteProfile.CHAOS: ProfileConfig(
        name="Chaos Test",
        description="Chaos engineering with latency and error injection", 
        vus=5,
        duration=20,
        load_profile="constant",
        chaos_latency_ms=200,
        chaos_latency_percent=20,
        chaos_abort_percent=5,
        chaos_burst_enabled=True,
        chaos_burst_rps=20,
        chaos_burst_seconds=3
    )
}


def get_suite_run_configs(scenario_id: int) -> List[Dict[str, Any]]:
    """Generate run configurations for all suite profiles."""
    configs = []
    
    for profile_type, profile in SUITE_PROFILES.items():
        config = {
            "scenario_id": scenario_id,
            "load_profile": profile.load_profile,
            "duration": profile.duration,
            "vus": profile.vus,
            "rps_limit": None,
            "chaos_latency_ms": profile.chaos_latency_ms,
            "chaos_latency_percent": profile.chaos_latency_percent,
            "chaos_abort_percent": profile.chaos_abort_percent,
            "chaos_burst_enabled": profile.chaos_burst_enabled,
            "chaos_burst_rps": profile.chaos_burst_rps,
            "chaos_burst_seconds": profile.chaos_burst_seconds,
            "suite_profile": profile_type.value,
            "suite_profile_name": profile.name,
            "suite_profile_description": profile.description
        }
        configs.append(config)
    
    return configs


def generate_suite_comparison_summary(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate a comparison summary across all suite profiles."""
    if not results:
        return {"error": "No results to compare"}
    
    summary = {
        "profiles_tested": len(results),
        "best_performer": None,
        "worst_performer": None,
        "comparison": [],
        "recommendations": []
    }
    
    # Find best and worst by success rate
    successful_results = [r for r in results if r.get("status") == "completed"]
    
    if successful_results:
        best = max(successful_results, key=lambda x: 1 - x.get("error_rate", 1))
        worst = min(successful_results, key=lambda x: 1 - x.get("error_rate", 1))
        
        summary["best_performer"] = best.get("suite_profile_name", "Unknown")
        summary["worst_performer"] = worst.get("suite_profile_name", "Unknown")
        
        # Build comparison table
        for result in results:
            comparison_entry = {
                "profile": result.get("suite_profile_name", "Unknown"),
                "status": result.get("status", "unknown"),
                "success_rate": f"{(1 - result.get('error_rate', 0)) * 100:.1f}%",
                "avg_latency": f"{result.get('avg_latency', 0):.0f}ms",
                "p95_latency": f"{result.get('p95', 0):.0f}ms",
                "max_rps": f"{result.get('max_stable_rps', 0):.1f}"
            }
            summary["comparison"].append(comparison_entry)
        
        # Generate recommendations
        chaos_result = next((r for r in results if "chaos" in r.get("suite_profile", "").lower()), None)
        smoke_result = next((r for r in results if "smoke" in r.get("suite_profile", "").lower()), None)
        
        if chaos_result and smoke_result:
            chaos_error = chaos_result.get("error_rate", 0)
            smoke_error = smoke_result.get("error_rate", 0)
            
            if chaos_error > smoke_error * 2:
                summary["recommendations"].append(
                    "High sensitivity to chaos conditions - improve error handling and timeouts"
                )
            else:
                summary["recommendations"].append(
                    "Good resilience under chaos conditions"
                )
        
        # Check latency degradation under load
        ramp_result = next((r for r in results if "ramp" in r.get("suite_profile", "").lower()), None)
        if ramp_result and smoke_result:
            ramp_p95 = ramp_result.get("p95", 0)
            smoke_p95 = smoke_result.get("p95", 0)
            
            if smoke_p95 > 0 and ramp_p95 > smoke_p95 * 3:
                summary["recommendations"].append(
                    "Significant latency degradation under load - consider scaling or caching"
                )
    
    return summary
