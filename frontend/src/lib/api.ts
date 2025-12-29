import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = Cookies.get('token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
}

async function uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const token = Cookies.get('token');

    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
}

// Auth
export const auth = {
    signup: (email: string, password: string) =>
        request<{ access_token: string }>('/auth/signup', {
            method: 'POST',
            body: { email, password },
        }),

    login: (email: string, password: string) =>
        request<{ access_token: string }>('/auth/login', {
            method: 'POST',
            body: { email, password },
        }),

    me: () => request<User>('/auth/me'),

    // Google OAuth
    googleAuth: (code: string, redirectUri: string) =>
        request<{ access_token: string }>('/auth/google', {
            method: 'POST',
            body: { code, redirect_uri: redirectUri },
        }),

    googleTokenAuth: (idToken: string) =>
        request<{ access_token: string }>('/auth/google/token', {
            method: 'POST',
            body: { id_token: idToken },
        }),

    createApiKey: (name: string) =>
        request<ApiKey>('/auth/api-keys', {
            method: 'POST',
            body: { name },
        }),

    listApiKeys: () => request<ApiKey[]>('/auth/api-keys'),

    deleteApiKey: (id: number) =>
        request<void>(`/auth/api-keys/${id}`, { method: 'DELETE' }),

    forgotPassword: (email: string) =>
        request<{ message: string }>('/auth/forgot-password', {
            method: 'POST',
            body: { email },
        }),

    resetPassword: (token: string, newPassword: string) =>
        request<{ message: string }>('/auth/reset-password', {
            method: 'POST',
            body: { token, new_password: newPassword },
        }),
};

// Projects
export const projects = {
    list: () => request<Project[]>('/projects'),

    get: (id: number) => request<Project>(`/projects/${id}`),

    create: (name: string, description?: string) =>
        request<Project>('/projects', {
            method: 'POST',
            body: { name, description },
        }),

    update: (id: number, data: Partial<Project>) =>
        request<Project>(`/projects/${id}`, {
            method: 'PATCH',
            body: data,
        }),

    delete: (id: number) =>
        request<void>(`/projects/${id}`, { method: 'DELETE' }),

    setAuth: (id: number, authType: string, value: string, headerName?: string) =>
        request<void>(`/projects/${id}/auth`, {
            method: 'POST',
            body: { auth_type: authType, value, header_name: headerName },
        }),

    uploadSpec: (id: number, file: File) =>
        uploadFile<Spec>(`/projects/${id}/spec`, file),

    listSpecs: (id: number) => request<Spec[]>(`/projects/${id}/specs`),

    generateScenario: (projectId: number, specId: number) =>
        request<Scenario>(`/projects/${projectId}/scenario/generate?spec_id=${specId}`, {
            method: 'POST',
        }),

    generateSmartScenarios: (projectId: number, specId: number) =>
        request<SmartScenariosResponse>(`/projects/${projectId}/scenario/generate-smart?spec_id=${specId}`, {
            method: 'POST',
        }),

    listScenarios: (id: number) => request<Scenario[]>(`/projects/${id}/scenarios`),

    updateScenario: (projectId: number, scenarioId: number, data: any) =>
        request<Scenario>(`/projects/${projectId}/scenarios/${scenarioId}`, {
            method: 'PATCH',
            body: data,
        }),

    listSuites: (projectId: number) =>
        request<any[]>(`/projects/${projectId}/suites`),

    getLatestSuite: (projectId: number) =>
        request<any>(`/projects/${projectId}/suites/latest`),
};

// Runs
export const runs = {
    list: (projectId?: number) =>
        request<Run[]>(`/runs${projectId ? `?project_id=${projectId}` : ''}`),

    get: (id: number) => request<Run>(`/runs/${id}`),

    create: (projectId: number, config: RunConfig) =>
        request<Run>(`/runs?project_id=${projectId}`, {
            method: 'POST',
            body: { config },
        }),

    report: (id: number) => request<RunReport>(`/runs/${id}/report`),

    cancel: (id: number) =>
        request<void>(`/runs/${id}`, { method: 'DELETE' }),

    runSuite: (projectId: number, scenarioId: number) =>
        request<SuiteResponse>(`/runs/suite?project_id=${projectId}&scenario_id=${scenarioId}`, {
            method: 'POST',
        }),

    getSuiteResults: (suiteId: string) =>
        request<SuiteResults>(`/runs/suite/${suiteId}`),
};

// Billing
export const billing = {
    getBalance: () => request<CreditBalance>('/billing/balance'),

    getPackages: () => request<PackagesResponse>('/billing/packages'),

    claimFreeCredits: () =>
        request<{ message: string; balance: number }>('/billing/claim-free-credits', {
            method: 'POST',
        }),

    buyCredits: (packageId: string) =>
        request<{ checkout_url: string }>('/billing/buy-credits', {
            method: 'POST',
            body: { package_id: packageId },
        }),

    getTransactions: (limit: number = 20) =>
        request<TransactionsResponse>(`/billing/transactions?limit=${limit}`),

    estimateCredits: (requests: number, durationSeconds: number, vus: number, vusEnd?: number) =>
        request<CreditEstimate>(`/billing/estimate?requests=${requests}&duration_seconds=${durationSeconds}&vus=${vus}${vusEnd ? `&vus_end=${vusEnd}` : ''}`),
};

// Types
export interface User {
    id: number;
    email: string;
    credit_balance: number;
    free_credits_claimed: boolean;
    last_opened_project_id?: number;
    auth_provider: 'email' | 'google';
    full_name?: string;
    avatar_url?: string;
    created_at: string;
}

export interface ApiKey {
    id: number;
    name: string;
    key?: string;
    created_at: string;
    last_used_at?: string;
    is_active: boolean;
}

export interface Project {
    id: number;
    name: string;
    description?: string;
    base_url?: string;
    last_suite_id?: string;  // For dashboard
    created_at: string;
    updated_at: string;
}

export interface Spec {
    id: number;
    filename: string;
    content_hash: string;
    uploaded_at: string;
}

export interface EndpointConfig {
    method: string;
    path: string;
    weight: number;
    body?: any;
    query_params?: Record<string, string>;
    headers?: Record<string, string>;
}

export interface ScenarioConfig {
    endpoints: EndpointConfig[];
    load_profile: string;
    duration: number;
    vus: number;
    rps_limit?: number;
    chaos_latency_ms: number;
    chaos_latency_percent: number;
    chaos_abort_percent: number;
    chaos_burst_enabled: boolean;
    chaos_burst_rps: number;
    chaos_burst_seconds: number;
}

export interface Scenario {
    id: number;
    name: string;
    config: ScenarioConfig;
    created_at: string;
    updated_at: string;
}

export interface RunConfig {
    scenario_id: number;
    load_profile: string;
    duration: number;
    vus: number;
    rps_limit?: number;
    chaos_latency_ms: number;
    chaos_latency_percent: number;
    chaos_abort_percent: number;
    chaos_burst_enabled: boolean;
    chaos_burst_rps: number;
    chaos_burst_seconds: number;
}

export interface Run {
    id: number;
    project_id: number;
    scenario_id?: number;
    status: string;
    started_at?: string;
    finished_at?: string;
    requested_requests: number;
    actual_requests?: number;
    error_message?: string;
    created_at: string;
}

export interface TimeseriesPoint {
    time_bucket: number;
    rps: number;
    error_rate: number;
    p50: number;
    p95: number;
    p99: number;
}

export interface EndpointMetrics {
    method: string;
    path: string;
    count: number;
    avg_latency: number;
    p50: number;
    p95: number;
    p99: number;
    error_rate: number;
    status_codes: Record<string, number>;
}

export interface BottleneckHint {
    type: string;
    message: string;
    recommendation: string;
}

export interface RunReport {
    run_id: number;
    status: string;
    duration_seconds?: number;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    max_stable_rps?: number;
    avg_latency: number;
    p50: number;
    p95: number;
    p99: number;
    error_rate: number;
    timeseries: TimeseriesPoint[];
    endpoint_metrics: EndpointMetrics[];
    status_code_distribution: Record<string, number>;
    bottleneck_hints: BottleneckHint[];
    ai_analysis?: AIAnalysis;
    capacity_insights?: CapacityInsights;
}

// AI Analysis Types
export interface ConcurrentUsersAnalysis {
    current_tested: number;
    estimated_max_safe: number;
    estimated_max_absolute: number;
    explanation: string;
}

export interface LaunchReadiness {
    verdict: 'READY' | 'READY_WITH_WARNINGS' | 'NOT_READY';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reasons: string[];
    blockers: string[];
}

export interface BreakingPoints {
    first_to_break: string;
    why: string;
    at_load: string;
}

export interface Headroom {
    percentage: number;
    explanation: string;
    scale_recommendation: string;
}

export interface FixPriority {
    priority: number;
    issue: string;
    endpoint?: string;
    impact: string;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PerformanceGrade {
    overall: string;
    latency: string;
    reliability: string;
    throughput: string;
}

export interface AIAnalysis {
    ai_generated: boolean;
    executive_summary: string;
    concurrent_users: ConcurrentUsersAnalysis;
    launch_readiness: LaunchReadiness;
    breaking_points: BreakingPoints;
    headroom: Headroom;
    fix_priorities: FixPriority[];
    performance_grade: PerformanceGrade;
}

// Capacity Insights Types
export interface EndpointRanking {
    rank: number;
    endpoint: string;
    p95?: number;
    avg_latency?: number;
    error_rate?: number;
}

export interface EndpointBreakdown {
    endpoint: string;
    method: string;
    path: string;
    score: number;
    p95: number;
    avg_latency: number;
    error_rate: number;
    count: number;
}

export interface EndpointAnalysis {
    first_to_break?: EndpointBreakdown;
    slowest?: Record<string, any>;
    highest_error_rate?: Record<string, any>;
    rankings_by_latency: EndpointRanking[];
    rankings_by_errors: EndpointRanking[];
}

export interface CapacityThreshold {
    users?: number;
    label: string;
    status: 'healthy' | 'warning' | 'error' | 'critical';
}

export interface CapacityThresholds {
    stable: CapacityThreshold;
    degraded: CapacityThreshold;
    unstable: CapacityThreshold;
    broken: CapacityThreshold;
}

export interface ConcurrencyDataPoint {
    time_bucket: number;
    estimated_vus: number;
    p95: number;
    p50: number;
    error_rate: number;
    rps: number;
}

export interface CapacityInsights {
    tested_vus: number;
    max_stable_users: number;
    latency_inflection_users?: number;
    error_onset_users?: number;
    breaking_point_users?: number;
    summary: string;
    endpoint_analysis: EndpointAnalysis;
    thresholds: CapacityThresholds;
    concurrency_data: ConcurrencyDataPoint[];
}

// Smart Scenario Types
export interface SmartScenarioEndpoint {
    method: string;
    path: string;
    weight: number;
}

export interface SmartScenario {
    name: string;
    description: string;
    endpoints: SmartScenarioEndpoint[];
    recommended_profile: string;
}

export interface SmartScenariosResponse {
    scenarios: SmartScenario[];
    ai_generated: boolean;
}

// Suite Types
export interface SuiteResponse {
    suite_id: string;
    run_ids: number[];
    profiles: string[];
    message: string;
}

export interface SuiteProfileResult {
    run_id: number;
    suite_profile: string;
    suite_profile_name: string;
    suite_profile_description: string;
    status: string;
    error_rate: number;
    avg_latency: number;
    p95: number;
    max_stable_rps: number;
    total_requests: number;
    timeseries: { time: number; rps: number; p50: number; p95: number; p99: number; error_rate: number }[];
}

export interface SuiteComparison {
    profiles_tested: number;
    best_performer: string;
    worst_performer: string;
    comparison: Array<{
        profile: string;
        status: string;
        success_rate: string;
        avg_latency: string;
        p95_latency: string;
        max_rps: string;
    }>;
    recommendations: string[];
}

export interface SuiteAISummary {
    ai_generated: boolean;
    executive_summary: string;
    best_profile: { name: string; why: string };
    worst_profile: { name: string; why: string };
    resilience_score: { score: number; grade: string; explanation: string };
    production_readiness: { current_verdict: string; expected_traffic: string; risk_areas: string[] };
    key_findings: string[];
    action_items: Array<{ priority: string; action: string; reason: string }>;
}

export interface SuiteResults {
    suite_id: string;
    status: string;
    total_tests: number;
    completed_tests: number;
    results: SuiteProfileResult[];
    comparison: SuiteComparison;
    ai_summary?: SuiteAISummary;
    scenario_id?: number;
}

// Credit Billing Types
export interface CreditBalance {
    balance: number;
    free_credits_claimed: boolean;
}

export interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    price_per_credit: number;
}

export interface PackagesResponse {
    packages: CreditPackage[];
}

export interface CreditTransaction {
    id: number;
    amount: number;
    balance_after: number;
    type: string;
    description: string | null;
    package_name: string | null;
    run_id: number | null;
    created_at: string;
}

export interface TransactionsResponse {
    transactions: CreditTransaction[];
}

export interface CreditEstimate {
    estimated_credits: number;
    breakdown: {
        requests: number;
        vu_minutes: number;
        credits_from_requests: number;
        credits_from_vu_minutes: number;
        minimum_credits: number;
    };
}

// Demo Types
export interface DemoConfig {
    endpoint: string;
    rps: number;
    duration: number;
}

export interface DemoMetrics {
    total_requests: number;
    successful: number;
    failed: number;
    success_rate: number;
    avg_latency: number;
    p50: number;
    p95: number;
    p99: number;
    max_rps: number;
    error_rate: number;
    timeseries: { time: number; rps: number; latency: number; errors: number }[];
}

export interface DemoResponse {
    status: string;
    message: string;
    metrics?: DemoMetrics;
}

export interface DemoLimits {
    max_rps: number;
    max_duration: number;
    max_requests: number;
    cooldown_minutes: number;
    max_per_hour: number;
    default_endpoint: string;
}

// Demo API (no auth required)
export const demo = {
    run: (config: DemoConfig) =>
        request<DemoResponse>('/demo/run', {
            method: 'POST',
            body: config,
        }),

    getLimits: () => request<DemoLimits>('/demo/limits'),
};
