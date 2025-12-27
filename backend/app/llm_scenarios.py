"""
LLM-powered scenario generator using OpenAI GPT.
Analyzes OpenAPI specs and generates intelligent test scenarios.
"""
import json
from typing import List, Dict, Any, Optional
from openai import OpenAI

from .config import settings


def get_openai_client() -> Optional[OpenAI]:
    """Get OpenAI client if API key is configured."""
    if not settings.openai_api_key:
        return None
    return OpenAI(api_key=settings.openai_api_key)


def generate_smart_scenarios(spec_content: dict, spec_filename: str) -> List[Dict[str, Any]]:
    """
    Use GPT to analyze an OpenAPI spec and generate intelligent test scenarios.
    
    Returns a list of scenario configurations with:
    - name: Scenario name
    - description: What this scenario tests
    - endpoints: List of {method, path, weight} configs
    - recommended_profile: smoke, ramp, or spike
    """
    client = get_openai_client()
    if not client:
        # Fallback to rule-based generation if no API key
        return generate_fallback_scenarios(spec_content)
    
    # Extract endpoint summary for the prompt
    endpoints = []
    paths = spec_content.get("paths", {})
    for path, methods in paths.items():
        for method, details in methods.items():
            if method.upper() in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
                endpoints.append({
                    "method": method.upper(),
                    "path": path,
                    "summary": details.get("summary", ""),
                    "operationId": details.get("operationId", "")
                })
    
    prompt = f"""Analyze this API and generate 4 distinct load test scenarios.

API Title: {spec_content.get('info', {}).get('title', 'Unknown API')}
Description: {spec_content.get('info', {}).get('description', 'No description')}

Endpoints:
{json.dumps(endpoints, indent=2)}

Generate exactly 4 test scenarios as JSON:

1. "Heavy Read" - Focus on GET endpoints (higher weights for reads)
2. "Write Stress" - Focus on POST/PUT/DELETE endpoints  
3. "Realistic Mix" - Balanced weights based on typical usage patterns (80% reads, 20% writes is common)
4. "Critical Path" - Focus on the most important user-facing endpoints

For each scenario, provide:
- name: Short name
- description: What this tests and why it's useful (2-3 sentences)
- endpoints: Array of {{method, path, weight}} where weight is 0.0-2.0 (1.0 = normal)
- recommended_profile: "smoke" for baseline, "ramp" for capacity, "spike" for resilience

Return ONLY valid JSON array, no markdown or explanation:
[
  {{
    "name": "...",
    "description": "...",
    "endpoints": [...],
    "recommended_profile": "..."
  }}
]"""

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are an API performance testing expert. Generate practical, actionable load test scenarios. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        # Clean up potential markdown formatting
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        scenarios = json.loads(content)
        return scenarios
        
    except Exception as e:
        print(f"LLM scenario generation failed: {e}")
        return generate_fallback_scenarios(spec_content)


def generate_fallback_scenarios(spec_content: dict) -> List[Dict[str, Any]]:
    """Fallback rule-based scenario generation when LLM is unavailable."""
    endpoints = []
    paths = spec_content.get("paths", {})
    
    for path, methods in paths.items():
        for method, details in methods.items():
            if method.upper() in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
                endpoints.append({
                    "method": method.upper(),
                    "path": path,
                    "weight": 1.0
                })
    
    get_endpoints = [e for e in endpoints if e["method"] == "GET"]
    write_endpoints = [e for e in endpoints if e["method"] != "GET"]
    
    scenarios = []
    
    # Heavy Read scenario
    heavy_read_endpoints = []
    for e in endpoints:
        weight = 2.0 if e["method"] == "GET" else 0.3
        heavy_read_endpoints.append({**e, "weight": weight})
    
    scenarios.append({
        "name": "Heavy Read",
        "description": "Tests read-heavy workload typical of content-serving applications. Good for testing cache efficiency and database read performance.",
        "endpoints": heavy_read_endpoints,
        "recommended_profile": "ramp"
    })
    
    # Write Stress scenario
    write_stress_endpoints = []
    for e in endpoints:
        weight = 2.0 if e["method"] != "GET" else 0.3
        write_stress_endpoints.append({**e, "weight": weight})
    
    scenarios.append({
        "name": "Write Stress",
        "description": "Tests write-heavy workload. Useful for testing database write performance, transaction handling, and data consistency under load.",
        "endpoints": write_stress_endpoints,
        "recommended_profile": "spike"
    })
    
    # Realistic Mix scenario
    realistic_endpoints = []
    for e in endpoints:
        weight = 1.5 if e["method"] == "GET" else 0.5
        realistic_endpoints.append({**e, "weight": weight})
    
    scenarios.append({
        "name": "Realistic Mix",
        "description": "Simulates typical production traffic with ~75% reads and ~25% writes. Best scenario for baseline performance assessment.",
        "endpoints": realistic_endpoints,
        "recommended_profile": "smoke"
    })
    
    # All Endpoints scenario
    scenarios.append({
        "name": "Full Coverage",
        "description": "Equal weight on all endpoints to ensure complete API coverage. Useful for regression testing and identifying weak spots.",
        "endpoints": endpoints,
        "recommended_profile": "ramp"
    })
    
    return scenarios
