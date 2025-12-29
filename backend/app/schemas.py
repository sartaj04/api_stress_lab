from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    credit_balance: int
    free_credits_claimed: bool
    last_opened_project_id: Optional[int] = None
    auth_provider: str = "email"
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ApiKeyResponse(BaseModel):
    id: int
    name: str
    key: Optional[str] = None  # Only returned on creation
    created_at: datetime
    last_used_at: Optional[datetime]
    is_active: bool
    
    class Config:
        from_attributes = True


# Project schemas
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    base_url: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    base_url: Optional[str]
    last_suite_id: Optional[str] = None  # Latest suite run for dashboard
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProjectAuthConfig(BaseModel):
    auth_type: str = Field(..., pattern="^(bearer|api_key)$")
    value: str
    header_name: Optional[str] = None  # Required for api_key type


# Spec schemas
class SpecResponse(BaseModel):
    id: int
    filename: str
    content_hash: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


# Scenario schemas
class EndpointConfig(BaseModel):
    method: str
    path: str
    weight: float = 1.0
    body: Optional[Dict[str, Any]] = None
    query_params: Optional[Dict[str, str]] = None
    headers: Optional[Dict[str, str]] = None


class ScenarioConfig(BaseModel):
    endpoints: List[EndpointConfig]
    load_profile: str = "smoke"  # smoke, ramp, spike
    duration: int = 60  # seconds
    vus: int = 10
    rps_limit: Optional[int] = None
    
    # Chaos toggles
    chaos_latency_ms: int = 0
    chaos_latency_percent: float = 0.0
    chaos_abort_percent: float = 0.0
    chaos_burst_enabled: bool = False
    chaos_burst_rps: int = 100
    chaos_burst_seconds: int = 5


class ScenarioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    config: ScenarioConfig


class ScenarioUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    config: Optional[ScenarioConfig] = None


class ScenarioResponse(BaseModel):
    id: int
    name: str
    config: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Run schemas
class RunConfig(BaseModel):
    scenario_id: int
    load_profile: str = "smoke"
    duration: int = 60
    vus: int = 10
    rps_limit: Optional[int] = None
    run_mode: str = "single"  # single, full_suite, chaos_suite
    
    # Chaos toggles
    chaos_latency_ms: int = 0
    chaos_latency_percent: float = 0.0
    chaos_abort_percent: float = 0.0
    chaos_burst_enabled: bool = False
    chaos_burst_rps: int = 100
    chaos_burst_seconds: int = 5


class RunCreate(BaseModel):
    config: RunConfig


class RunResponse(BaseModel):
    id: int
    project_id: int
    scenario_id: Optional[int]
    status: str
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    requested_requests: int
    actual_requests: Optional[int]
    error_message: Optional[str]
    run_type: str = "single"
    parent_run_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TimeseriesPoint(BaseModel):
    time_bucket: int
    rps: float
    error_rate: float
    p50: float
    p95: float
    p99: float


class EndpointMetrics(BaseModel):
    method: str
    path: str
    count: int
    avg_latency: float
    p50: float
    p95: float
    p99: float
    error_rate: float
    status_codes: Dict[str, int]


class BottleneckHint(BaseModel):
    type: str
    message: str
    recommendation: str


# AI Analysis schemas
class ConcurrentUsersAnalysis(BaseModel):
    current_tested: int
    estimated_max_safe: int
    estimated_max_absolute: int
    explanation: str


class LaunchReadiness(BaseModel):
    verdict: str  # READY, READY_WITH_WARNINGS, NOT_READY
    confidence: str  # HIGH, MEDIUM, LOW
    reasons: List[str]
    blockers: List[str]


class BreakingPoints(BaseModel):
    first_to_break: str
    why: str
    at_load: str


class Headroom(BaseModel):
    percentage: int
    explanation: str
    scale_recommendation: str


class FixPriority(BaseModel):
    priority: int
    issue: str
    endpoint: Optional[str]
    impact: str
    effort: str  # LOW, MEDIUM, HIGH


class PerformanceGrade(BaseModel):
    overall: str
    latency: str
    reliability: str
    throughput: str


# Capacity Insights schemas
class EndpointRanking(BaseModel):
    rank: int
    endpoint: str
    p95: Optional[float] = None
    avg_latency: Optional[float] = None
    error_rate: Optional[float] = None


class EndpointBreakdown(BaseModel):
    endpoint: str
    method: str
    path: str
    score: float
    p95: float
    avg_latency: float
    error_rate: float
    count: int


class EndpointAnalysis(BaseModel):
    first_to_break: Optional[EndpointBreakdown] = None
    slowest: Optional[Dict[str, Any]] = None
    highest_error_rate: Optional[Dict[str, Any]] = None
    rankings_by_latency: List[EndpointRanking] = []
    rankings_by_errors: List[EndpointRanking] = []


class CapacityThreshold(BaseModel):
    users: Optional[int] = None
    label: str
    status: str  # healthy, warning, error, critical


class CapacityThresholds(BaseModel):
    stable: CapacityThreshold
    degraded: CapacityThreshold
    unstable: CapacityThreshold
    broken: CapacityThreshold


class ConcurrencyDataPoint(BaseModel):
    time_bucket: int
    estimated_vus: int
    p95: float
    p50: float
    error_rate: float
    rps: float


class CapacityInsights(BaseModel):
    tested_vus: int
    max_stable_users: int
    latency_inflection_users: Optional[int] = None
    error_onset_users: Optional[int] = None
    breaking_point_users: Optional[int] = None
    summary: str
    endpoint_analysis: EndpointAnalysis
    thresholds: CapacityThresholds
    concurrency_data: List[ConcurrencyDataPoint]


class AIAnalysis(BaseModel):
    ai_generated: bool = False
    executive_summary: str
    concurrent_users: ConcurrentUsersAnalysis
    launch_readiness: LaunchReadiness
    breaking_points: BreakingPoints
    headroom: Headroom
    fix_priorities: List[FixPriority]
    performance_grade: PerformanceGrade


class RunReport(BaseModel):
    run_id: int
    status: str
    duration_seconds: Optional[float]
    total_requests: int
    successful_requests: int
    failed_requests: int
    max_stable_rps: Optional[float]
    avg_latency: float
    p50: float
    p95: float
    p99: float
    error_rate: float
    timeseries: List[TimeseriesPoint]
    endpoint_metrics: List[EndpointMetrics]
    status_code_distribution: Dict[str, int]
    bottleneck_hints: List[BottleneckHint]
    ai_analysis: Optional[AIAnalysis] = None
    capacity_insights: Optional[CapacityInsights] = None


# Smart Scenario schemas
class SmartScenarioEndpoint(BaseModel):
    method: str
    path: str
    weight: float


class SmartScenario(BaseModel):
    name: str
    description: str
    endpoints: List[SmartScenarioEndpoint]
    recommended_profile: str


class SmartScenariosResponse(BaseModel):
    scenarios: List[SmartScenario]
    ai_generated: bool
