import json
from typing import Dict, Any, List


def generate_k6_script(
    base_url: str,
    endpoints: List[Dict[str, Any]],
    auth_type: str = None,
    auth_value: str = None,
    auth_header: str = None,
    load_profile: str = "smoke",
    duration: int = 60,
    vus: int = 10,
    rps_limit: int = None,
    chaos_latency_ms: int = 0,
    chaos_latency_percent: float = 0.0,
    chaos_abort_percent: float = 0.0,
    chaos_burst_enabled: bool = False,
    chaos_burst_rps: int = 100,
    chaos_burst_seconds: int = 5
) -> str:
    """Generate a k6 load test script."""
    
    # Build options based on load profile
    if load_profile == "smoke":
        stages = f"""
    stages: [
      {{ duration: '30s', target: {vus} }},
      {{ duration: '{duration - 30}s', target: {vus} }},
    ],"""
    elif load_profile == "ramp":
        step_duration = duration // 4
        stages = f"""
    stages: [
      {{ duration: '{step_duration}s', target: {vus // 4 or 1} }},
      {{ duration: '{step_duration}s', target: {vus // 2 or 1} }},
      {{ duration: '{step_duration}s', target: {vus} }},
      {{ duration: '{step_duration}s', target: {vus // 2 or 1} }},
    ],"""
    elif load_profile == "spike":
        stages = f"""
    stages: [
      {{ duration: '10s', target: {vus // 4 or 1} }},
      {{ duration: '10s', target: {vus * 2} }},
      {{ duration: '10s', target: {vus // 4 or 1} }},
      {{ duration: '{duration - 30}s', target: {vus} }},
    ],"""
    else:
        stages = f"""
    stages: [
      {{ duration: '{duration}s', target: {vus} }},
    ],"""
    
    # RPS limiting
    rate_limit = ""
    if rps_limit:
        rate_limit = f"""
    rps: {rps_limit},"""
    
    # Build auth headers
    auth_headers = ""
    if auth_type == "bearer" and auth_value:
        auth_headers = f"'Authorization': 'Bearer {auth_value}',"
    elif auth_type == "api_key" and auth_header and auth_value:
        auth_headers = f"'{auth_header}': '{auth_value}',"
    
    # Build endpoint functions
    endpoint_functions = []
    endpoint_weights = []
    
    for i, ep in enumerate(endpoints):
        method = ep["method"].lower()
        path = ep["path"]
        weight = ep.get("weight", 1.0)
        body = ep.get("body")
        query_params = ep.get("query_params", {})
        headers = ep.get("headers", {})
        
        # Build query string
        query_string = ""
        if query_params:
            params = "&".join([f"{k}={v}" for k, v in query_params.items()])
            query_string = f"?{params}"
        
        # Build headers
        header_entries = [auth_headers] if auth_headers else []
        header_entries.append("'Content-Type': 'application/json',")
        for k, v in headers.items():
            header_entries.append(f"'{k}': '{v}',")
        headers_str = "\n        ".join(header_entries)
        
        # Build body
        body_str = ""
        if body:
            body_str = f"body: JSON.stringify({json.dumps(body)}),"
        
        func_name = f"endpoint_{i}"
        func = f"""
function {func_name}() {{
    const url = BASE_URL + '{path}{query_string}';
    const params = {{
        headers: {{
            {headers_str}
        }},
        {body_str}
        tags: {{ endpoint: '{method.upper()} {path}' }},
    }};
    
    const res = http.{method}(url, {f'params.body, ' if body else ''}params);
    
    check(res, {{
        'status is 2xx': (r) => r.status >= 200 && r.status < 300,
        'response time < 2000ms': (r) => r.timings.duration < 2000,
    }});
    
    return res;
}}"""
        endpoint_functions.append(func)
        endpoint_weights.append((func_name, weight))
    
    # Build weighted selection
    total_weight = sum(w for _, w in endpoint_weights)
    weighted_selection = ""
    cumulative = 0
    for func_name, weight in endpoint_weights:
        prob = weight / total_weight
        cumulative += prob
        weighted_selection += f"""
    if (rand < {cumulative:.4f}) {{
        return {func_name}();
    }}"""
    
    # Chaos injection code
    chaos_code = ""
    if chaos_latency_ms > 0 and chaos_latency_percent > 0:
        chaos_code += f"""
    // Chaos: Artificial latency
    if (Math.random() < {chaos_latency_percent / 100}) {{
        sleep({chaos_latency_ms / 1000});
    }}
"""
    
    if chaos_abort_percent > 0:
        chaos_code += f"""
    // Chaos: Random abort
    if (Math.random() < {chaos_abort_percent / 100}) {{
        return;
    }}
"""
    
    # Burst mode
    burst_code = ""
    if chaos_burst_enabled:
        burst_code = f"""
    // Chaos: Burst mode
    if (__ITER % 100 === 0) {{
        for (let i = 0; i < {chaos_burst_rps}; i++) {{
            selectAndRunEndpoint();
        }}
    }}
"""
    
    script = f"""import http from 'k6/http';
import {{ check, sleep }} from 'k6';
import {{ Rate, Trend }} from 'k6/metrics';

const BASE_URL = '{base_url}';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {{{stages}{rate_limit}
    thresholds: {{
        'http_req_duration': ['p(95)<2000'],
        'errors': ['rate<0.1'],
    }},
}};

{''.join(endpoint_functions)}

function selectAndRunEndpoint() {{
    const rand = Math.random();
{weighted_selection}
    // Fallback to first endpoint
    return endpoint_0();
}}

export default function() {{
{chaos_code}
    const res = selectAndRunEndpoint();
    
    if (res) {{
        errorRate.add(res.status >= 400);
        responseTime.add(res.timings.duration);
    }}
{burst_code}
    sleep(0.1 + Math.random() * 0.1);
}}
"""
    
    return script
