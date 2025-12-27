'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { projects, Project } from '@/lib/api';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface SuiteResult {
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
    timeseries: { time: number; rps: number; p50: number; p95: number; error_rate: number }[];
}

interface LatestSuite {
    suite_id: string;
    status: string;
    total_tests: number;
    completed_tests: number;
    results: SuiteResult[];
    comparison: any;
    ai_summary: any;
}

export default function ProjectDashboardPage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const projectId = parseInt(params.id);

    const [project, setProject] = useState<Project | null>(null);
    const [suite, setSuite] = useState<LatestSuite | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [suiteHistory, setSuiteHistory] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && projectId) {
            loadData();
        }
    }, [user, projectId]);

    const loadData = async () => {
        try {
            const [projectData, suiteData, historyData] = await Promise.all([
                projects.get(projectId),
                projects.getLatestSuite(projectId),
                projects.listSuites(projectId)
            ]);
            setProject(projectData);
            setSuiteHistory(historyData);

            if (suiteData.status !== 'no_suite') {
                setSuite(suiteData);
                // Poll if not complete
                if (suiteData.status !== 'completed') {
                    setTimeout(loadData, 3000);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
                <div className="text-white/40">Loading...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
                <div className="text-center">
                    <h1 className="text-xl font-medium text-white mb-4">Project not found</h1>
                    <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    // Combine timeseries from all profiles for overview chart
    const combinedData = suite?.results.flatMap(r =>
        r.timeseries.map(t => ({
            time: t.time,
            [`${r.suite_profile}_rps`]: t.rps,
            [`${r.suite_profile}_p95`]: t.p95,
        }))
    ) || [];

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Header */}
            <header className="nav sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-white/40 hover:text-white transition text-sm">
                                ← Projects
                            </Link>
                            <span className="text-white/20">|</span>
                            <h1 className="text-lg font-medium text-white">{project.name}</h1>
                            {suite && (
                                <span className={suite.status === 'completed' ? 'badge-success' : 'badge-warning'}>
                                    {suite.status === 'completed' ? 'Complete' : 'Running'}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href={`/projects/${projectId}`} className="text-white/40 hover:text-white text-sm">
                                Settings
                            </Link>
                            <button onClick={logout} className="text-white/40 hover:text-white text-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* No Suite Yet */}
                {!suite && (
                    <div className="card p-12 text-center">
                        <h2 className="text-xl font-medium text-white mb-3">No Test Results Yet</h2>
                        <p className="text-white/40 mb-6 max-w-md mx-auto">
                            Upload an OpenAPI spec to run tests and see results here.
                        </p>
                        <Link href={`/projects/${projectId}`} className="btn-primary">
                            Configure Project
                        </Link>
                    </div>
                )}

                {/* Suite Results */}
                {suite && (
                    <div className="space-y-6">
                        {/* Progress Bar if Running */}
                        {suite.status !== 'completed' && (
                            <div className="card p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white/40 text-sm">Test Progress</span>
                                    <span className="text-white font-medium text-sm">{suite.completed_tests} / {suite.total_tests}</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-white transition-all"
                                        style={{ width: `${(suite.completed_tests / suite.total_tests) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Profile Cards */}
                        <div className="grid lg:grid-cols-4 gap-3">
                            {suite.results.map((result) => (
                                <button
                                    key={result.run_id}
                                    onClick={() => setActiveTab(result.suite_profile)}
                                    className={`card p-4 text-left transition ${activeTab === result.suite_profile
                                        ? 'border-white/20'
                                        : 'hover:border-white/15'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-white text-sm">{result.suite_profile_name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${result.status === 'completed' ? 'bg-green-500/15 text-green-400' :
                                            result.status === 'running' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-white/5 text-white/40'
                                            }`}>
                                            {result.status}
                                        </span>
                                    </div>
                                    {result.status === 'completed' && (
                                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                            <div>
                                                <div className="text-white/30">Error Rate</div>
                                                <div className={result.error_rate < 0.05 ? 'text-green-400' : 'text-red-400'}>
                                                    {(result.error_rate * 100).toFixed(2)}%
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-white/30">Avg RPS</div>
                                                <div className="text-white">{result.max_stable_rps.toFixed(1)}</div>
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 border-b border-white/[0.06]">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 text-sm transition ${activeTab === 'overview' ? 'text-white border-b border-white' : 'text-white/40 hover:text-white'
                                    }`}
                            >
                                Overview
                            </button>
                            {suite.results.map(r => (
                                <button
                                    key={r.suite_profile}
                                    onClick={() => setActiveTab(r.suite_profile)}
                                    className={`px-4 py-2 text-sm transition ${activeTab === r.suite_profile ? 'text-white border-b border-white' : 'text-white/40 hover:text-white'
                                        }`}
                                >
                                    {r.suite_profile_name}
                                </button>
                            ))}
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Comparison Chart */}
                                <div className="card p-5">
                                    <h3 className="font-medium text-white mb-4">Performance Comparison</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={suite.results.filter(r => r.status === 'completed')}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="suite_profile_name" stroke="rgba(255,255,255,0.4)" />
                                                <YAxis stroke="rgba(255,255,255,0.4)" />
                                                <Tooltip contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                <Legend />
                                                <Line type="monotone" dataKey="avg_latency" name="Avg Latency (ms)" stroke="#3b82f6" strokeWidth={2} />
                                                <Line type="monotone" dataKey="max_stable_rps" name="Avg RPS" stroke="#10b981" strokeWidth={2} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* AI Summary */}
                                {suite.ai_summary && (
                                    <div className="card p-5">
                                        <div className="flex items-center gap-3 mb-5">
                                            <h3 className="font-medium text-white">AI Insights</h3>
                                            <span className="px-2 py-0.5 text-xs bg-white/5 text-white/50 rounded">
                                                GPT
                                            </span>
                                        </div>

                                        {/* Score */}
                                        <div className="grid md:grid-cols-3 gap-3 mb-5">
                                            <div className="text-center p-4 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                <div className="text-white/40 text-sm mb-2">Resilience Score</div>
                                                <div className={`text-3xl font-semibold ${suite.ai_summary.resilience_score?.grade === 'A' ? 'text-green-400' :
                                                    suite.ai_summary.resilience_score?.grade === 'B' ? 'text-blue-400' :
                                                        'text-yellow-400'
                                                    }`}>
                                                    {suite.ai_summary.resilience_score?.score || 'N/A'}
                                                </div>
                                                <div className="text-white/40 text-xs mt-1">Grade: {suite.ai_summary.resilience_score?.grade || 'N/A'}</div>
                                            </div>

                                            <div className={`text-center p-4 rounded-lg border ${suite.ai_summary.production_readiness?.current_verdict === 'READY'
                                                ? 'bg-green-500/5 border-green-500/20'
                                                : 'bg-yellow-500/5 border-yellow-500/20'
                                                }`}>
                                                <div className="text-white/40 text-sm mb-2">Production Ready?</div>
                                                <div className={`text-xl font-semibold ${suite.ai_summary.production_readiness?.current_verdict === 'READY' ? 'text-green-400' : 'text-yellow-400'
                                                    }`}>
                                                    {suite.ai_summary.production_readiness?.current_verdict?.replace(/_/g, ' ') || 'N/A'}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                <div className="text-white/40 text-sm mb-2">Best/Worst</div>
                                                <div className="text-sm">
                                                    <span className="text-green-400">Best: </span>{suite.ai_summary.best_profile?.name || 'N/A'}
                                                </div>
                                                <div className="text-sm mt-1">
                                                    <span className="text-red-400">Worst: </span>{suite.ai_summary.worst_profile?.name || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Executive Summary */}
                                        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4 mb-4">
                                            <h4 className="font-medium text-white mb-2">Executive Summary</h4>
                                            <p className="text-white/50 text-sm">{suite.ai_summary.executive_summary}</p>
                                        </div>

                                        {/* Action Items */}
                                        {suite.ai_summary.action_items?.length > 0 && (
                                            <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
                                                <h4 className="font-medium text-white mb-3">Action Items</h4>
                                                <ul className="space-y-2">
                                                    {suite.ai_summary.action_items.map((item: any, i: number) => (
                                                        <li key={i} className="flex items-start gap-3">
                                                            <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded ${item.priority === 'HIGH' ? 'bg-red-500/15 text-red-400' :
                                                                item.priority === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-blue-500/15 text-blue-400'
                                                                }`}>
                                                                {item.priority}
                                                            </span>
                                                            <span className="text-white/60 text-sm">{item.action}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Suite History */}
                                {suiteHistory.length > 1 && (
                                    <div className="card p-5">
                                        <h3 className="font-medium text-white mb-4">Previous Suites</h3>
                                        <div className="space-y-2">
                                            {suiteHistory.slice(0, 5).map((s) => (
                                                <Link
                                                    key={s.suite_id}
                                                    href={`/suites/${s.suite_id}`}
                                                    className="block p-3 bg-white/[0.02] rounded-lg border border-white/[0.06] hover:border-white/15 transition"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono text-sm text-white">{s.suite_id}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                                                            }`}>
                                                            {s.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-white/30 mt-1">
                                                        {new Date(s.created_at).toLocaleString()} • {s.total_tests} tests
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Profile Detail Tabs */}
                        {activeTab !== 'overview' && suite.results.find(r => r.suite_profile === activeTab) && (
                            <div className="space-y-6">
                                {(() => {
                                    const result = suite.results.find(r => r.suite_profile === activeTab)!;
                                    return (
                                        <>
                                            {/* Stats */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Total Requests', value: result.total_requests.toLocaleString() },
                                                    { label: 'Error Rate', value: `${(result.error_rate * 100).toFixed(2)}%`, good: result.error_rate < 0.05 },
                                                    { label: 'Avg Latency', value: `${result.avg_latency.toFixed(0)}ms` },
                                                    { label: 'P95 Latency', value: `${result.p95.toFixed(0)}ms` },
                                                ].map((stat, i) => (
                                                    <div key={i} className="glass-card p-5">
                                                        <div className="text-dark-400 text-sm mb-1">{stat.label}</div>
                                                        <div className={`text-2xl font-bold ${stat.good !== undefined ? (stat.good ? 'text-green-400' : 'text-red-400') : ''}`}>
                                                            {stat.value}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Timeseries Chart */}
                                            {result.timeseries.length > 0 && (
                                                <div className="glass-card p-6">
                                                    <h3 className="font-semibold mb-4">Performance Over Time</h3>
                                                    <div className="h-80">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={result.timeseries}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                                <XAxis dataKey="time" stroke="#666" />
                                                                <YAxis yAxisId="left" stroke="#666" />
                                                                <YAxis yAxisId="right" orientation="right" stroke="#666" />
                                                                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
                                                                <Legend />
                                                                <Line yAxisId="left" type="monotone" dataKey="rps" name="RPS" stroke="#10b981" strokeWidth={2} dot={false} />
                                                                <Line yAxisId="right" type="monotone" dataKey="p50" name="P50 (ms)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                                                <Line yAxisId="right" type="monotone" dataKey="p95" name="P95 (ms)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            )}

                                            <Link
                                                href={`/runs/${result.run_id}`}
                                                className="btn-primary inline-block"
                                            >
                                                View Full Report →
                                            </Link>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
