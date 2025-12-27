import yaml
import json
from typing import Any, Dict, List, Optional
from openapi_spec_validator import validate
from openapi_spec_validator.readers import read_from_filename
import hashlib


def parse_openapi_spec(content: bytes, filename: str) -> Dict[str, Any]:
    """Parse an OpenAPI spec from bytes content."""
    content_str = content.decode("utf-8")
    
    if filename.endswith(".yaml") or filename.endswith(".yml"):
        spec = yaml.safe_load(content_str)
    else:
        spec = json.loads(content_str)
    
    # Validate the spec
    validate(spec)
    
    return spec


def generate_sample_value(schema: Dict[str, Any], depth: int = 0) -> Any:
    """Generate a sample value from a JSON schema."""
    if depth > 5:
        return None
    
    schema_type = schema.get("type", "string")
    
    if "enum" in schema:
        return schema["enum"][0] if schema["enum"] else None
    
    if "default" in schema:
        return schema["default"]
    
    if "example" in schema:
        return schema["example"]
    
    if schema_type == "string":
        format_ = schema.get("format", "")
        if format_ == "email":
            return "test@example.com"
        elif format_ == "uuid":
            return "550e8400-e29b-41d4-a716-446655440000"
        elif format_ == "date":
            return "2024-01-01"
        elif format_ == "date-time":
            return "2024-01-01T00:00:00Z"
        elif format_ == "uri":
            return "https://example.com"
        return "string"
    
    elif schema_type == "integer":
        return schema.get("minimum", 1)
    
    elif schema_type == "number":
        return schema.get("minimum", 1.0)
    
    elif schema_type == "boolean":
        return True
    
    elif schema_type == "array":
        items = schema.get("items", {})
        return [generate_sample_value(items, depth + 1)]
    
    elif schema_type == "object":
        properties = schema.get("properties", {})
        required = schema.get("required", [])
        result = {}
        for prop_name, prop_schema in properties.items():
            if prop_name in required or len(result) < 3:
                result[prop_name] = generate_sample_value(prop_schema, depth + 1)
        return result
    
    return None


def resolve_ref(spec: Dict[str, Any], ref: str) -> Dict[str, Any]:
    """Resolve a $ref in the spec."""
    if not ref.startswith("#/"):
        return {}
    
    parts = ref[2:].split("/")
    result = spec
    for part in parts:
        if isinstance(result, dict) and part in result:
            result = result[part]
        else:
            return {}
    return result


def get_request_body_schema(spec: Dict[str, Any], operation: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Get the request body schema for an operation."""
    request_body = operation.get("requestBody", {})
    if "$ref" in request_body:
        request_body = resolve_ref(spec, request_body["$ref"])
    
    content = request_body.get("content", {})
    json_content = content.get("application/json", {})
    schema = json_content.get("schema", {})
    
    if "$ref" in schema:
        schema = resolve_ref(spec, schema["$ref"])
    
    return schema if schema else None


def generate_scenario_from_spec(spec: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a load test scenario from an OpenAPI spec."""
    endpoints = []
    
    paths = spec.get("paths", {})
    
    for path, path_item in paths.items():
        for method in ["get", "post", "put", "patch", "delete"]:
            if method not in path_item:
                continue
            
            operation = path_item[method]
            
            # Skip deprecated endpoints
            if operation.get("deprecated", False):
                continue
            
            # Skip endpoints with complex security requirements we can't handle
            security = operation.get("security", spec.get("security", []))
            
            endpoint = {
                "method": method.upper(),
                "path": path,
                "weight": 1.0,
                "body": None,
                "query_params": {},
                "headers": {}
            }
            
            # Generate query parameters
            parameters = operation.get("parameters", []) + path_item.get("parameters", [])
            for param in parameters:
                if "$ref" in param:
                    param = resolve_ref(spec, param["$ref"])
                
                if param.get("in") == "query":
                    schema = param.get("schema", {"type": "string"})
                    if "$ref" in schema:
                        schema = resolve_ref(spec, schema["$ref"])
                    endpoint["query_params"][param["name"]] = str(generate_sample_value(schema))
            
            # Generate request body
            if method in ["post", "put", "patch"]:
                body_schema = get_request_body_schema(spec, operation)
                if body_schema:
                    endpoint["body"] = generate_sample_value(body_schema)
            
            # Assign weights based on heuristics
            # List endpoints get higher weight
            if method == "get":
                if "{" not in path:  # Collection endpoint
                    endpoint["weight"] = 3.0
                else:
                    endpoint["weight"] = 2.0
            elif method == "post":
                endpoint["weight"] = 1.5
            else:
                endpoint["weight"] = 1.0
            
            endpoints.append(endpoint)
    
    # Sort by weight descending
    endpoints.sort(key=lambda x: x["weight"], reverse=True)
    
    return {
        "endpoints": endpoints,
        "load_profile": "smoke",
        "duration": 60,
        "vus": 10,
        "rps_limit": None,
        "chaos_latency_ms": 0,
        "chaos_latency_percent": 0.0,
        "chaos_abort_percent": 0.0,
        "chaos_burst_enabled": False,
        "chaos_burst_rps": 100,
        "chaos_burst_seconds": 5
    }


def compute_content_hash(content: bytes) -> str:
    """Compute SHA256 hash of content."""
    return hashlib.sha256(content).hexdigest()
