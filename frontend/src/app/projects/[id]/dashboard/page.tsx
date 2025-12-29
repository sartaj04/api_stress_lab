'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { projects, runs, Project, billing, CreditBalance, SuiteResults } from '@/lib/api';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ScatterChart,
    Scatter,
    BarChart,
    Bar
} from 'recharts';

export default function ProjectDashboardPage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = parseInt(params.id);

    const [project, setProject] = useState<Project | null>(null);
    const [suite, setSuite] = useState<SuiteResults | null>(null);
    const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [suiteHistory, setSuiteHistory] = useState<any[]>([]);
    const [balance, setBalance] = useState<CreditBalance | null>(null);
    const [rerunning, setRerunning] = useState(false);
    const [profileReports, setProfileReports] = useState<Record<number, any>>({});
    const [loadingSteps, setLoadingSteps] = useState<string[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const loadData = useCallback(async (suiteIdToLoad?: string) => {
        try {
            setLoadingSteps(['Loading project details']);
            const [projectData, historyData, balanceData] = await Promise.all([
                projects.get(projectId),
                projects.listSuites(projectId),
                billing.getBalance().catch(() => null)
            ]);
            setProject(projectData);
            setSuiteHistory(historyData);
            setBalance(balanceData);

            // Determine which suite to load
            const targetSuiteId = suiteIdToLoad || selectedSuiteId || (historyData.length > 0 ? historyData[0].suite_id : null);

            if (targetSuiteId) {
                setLoadingSteps(prev => [...prev, 'Loading test results']);
                const suiteData = await runs.getSuiteResults(targetSuiteId);

                // Get scenario_id from the first run if available
                if (suiteData.results && suiteData.results.length > 0) {
                    try {
                        const firstRun = await runs.get(suiteData.results[0].run_id);
                        suiteData.scenario_id = firstRun.scenario_id;
                    } catch (err) {
                        console.error('Failed to get scenario_id:', err);
                    }
                }

                setSuite(suiteData);
                setSelectedSuiteId(targetSuiteId);

                // Load all profile reports
                if (suiteData.status === 'completed') {
                    setLoadingSteps(prev => [...prev, 'Loading profile reports']);
                    await loadAllProfileReports(suiteData);

                    setLoadingSteps(prev => [...prev, 'Analyzing performance metrics']);
                    await new Promise(resolve => setTimeout(resolve, 200));
                }

                // Poll if not complete
                if (suiteData.status !== 'completed') {
                    setTimeout(() => loadData(targetSuiteId), 3000);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setLoadingSteps([]);
        }
    }, [projectId, selectedSuiteId]);

    useEffect(() => {
        if (user && projectId) {
            loadData();
        }
    }, [user, projectId, loadData]);

    const loadSuite = async (suiteId: string) => {
        setSelectedSuiteId(suiteId);
        setLoading(true);
        try {
            const suiteData = await runs.getSuiteResults(suiteId);

            // Get scenario_id from the first run if available
            if (suiteData.results && suiteData.results.length > 0) {
                try {
                    const firstRun = await runs.get(suiteData.results[0].run_id);
                    suiteData.scenario_id = firstRun.scenario_id;
                } catch (err) {
                    console.error('Failed to get scenario_id:', err);
                }
            }

            setSuite(suiteData);
            setActiveTab('overview');

            // Load all profile reports
            if (suiteData.status === 'completed') {
                await loadAllProfileReports(suiteData);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRerunSuite = async () => {
        if (!suite?.scenario_id) return;

        setRerunning(true);
        try {
            const result = await runs.runSuite(projectId, suite.scenario_id);
            // Reload to show the new suite
            await loadData(result.suite_id);
        } catch (err: any) {
            alert('Failed to start test suite: ' + err.message);
        } finally {
            setRerunning(false);
        }
    };

    const loadAllProfileReports = async (suiteData: SuiteResults) => {
        // Load all completed profile reports on page load
        const completedResults = suiteData.results.filter(r => r.status === 'completed');

        const reportPromises = completedResults.map(async (result) => {
            try {
                const report = await runs.report(result.run_id);
                return { runId: result.run_id, report };
            } catch (err) {
                console.error(`Failed to load profile report for run ${result.run_id}:`, err);
                return null;
            }
        });

        const reports = await Promise.all(reportPromises);
        const reportsMap: Record<number, any> = {};
        reports.forEach(item => {
            if (item) {
                reportsMap[item.runId] = item.report;
            }
        });

        setProfileReports(reportsMap);
    };

    if (authLoading || !user || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
                <div className="max-w-md w-full px-6">
                    {/* Animated spinner */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-emerald-400/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        </div>
                    </div>

                    {/* Loading steps */}
                    {loadingSteps.length > 0 ? (
                        <div className="space-y-3">
                            {loadingSteps.map((step, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 animate-fadeIn"
                                    style={{
                                        animation: 'fadeIn 0.3s ease-out',
                                        animationFillMode: 'both',
                                        animationDelay: `${index * 0.1}s`
                                    }}
                                >
                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                        index === loadingSteps.length - 1
                                            ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                            : 'bg-emerald-500/10 border border-emerald-500/30'
                                    }`}>
                                        {index === loadingSteps.length - 1 ? (
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        ) : (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`text-sm ${
                                        index === loadingSteps.length - 1
                                            ? 'text-white font-medium'
                                            : 'text-white/60'
                                    }`}>
                                        {step}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-white/40 text-sm">Loading...</p>
                        </div>
                    )}

                    <style jsx>{`
                        @keyframes fadeIn {
                            from {
                                opacity: 0;
                                transform: translateY(10px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    `}</style>
                </div>
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
                            <Link href="/pricing" className="text-white/60 hover:text-white text-sm transition">
                                {balance ? `${balance.balance} credits` : 'Buy Credits'}
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
                {!suite && suiteHistory.length === 0 && (
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

                {/* Main Content */}
                {(suite || suiteHistory.length > 0) && (
                    <div className="space-y-6">
                            {suite && (
                                <>
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

                                    {/* Suite Selector and Action Buttons */}
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Suite Dropdown */}
                                        {suiteHistory.length > 0 && (
                                            <div className="flex items-center gap-3">
                                                <label htmlFor="suite-select" className="text-white/50 text-sm whitespace-nowrap">Test Suite:</label>
                                                <select
                                                    id="suite-select"
                                                    value={selectedSuiteId || ''}
                                                    onChange={(e) => loadSuite(e.target.value)}
                                                    className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-white/20"
                                                >
                                                    {suiteHistory.map((s) => {
                                                        const date = new Date(s.created_at);
                                                        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                        const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                                        return (
                                                            <option key={s.suite_id} value={s.suite_id}>
                                                                {formattedDate} at {formattedTime} - {s.status}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/projects/${projectId}`}
                                            className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] hover:border-white/[0.15] font-medium rounded-lg transition"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 20h9" />
                                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                            </svg>
                                            Edit Configuration
                                        </Link>
                                        {suite.status === 'completed' && suite.scenario_id && (
                                            <button
                                                onClick={handleRerunSuite}
                                                disabled={rerunning}
                                                className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 font-medium rounded-lg transition disabled:opacity-50"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="23 4 23 10 17 10" />
                                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                                </svg>
                                                {rerunning ? 'Starting...' : 'Rerun Full Suite'}
                                            </button>
                                        )}
                                    </div>
                                    </div>

                                    {/* Profile Cards */}
                                    <div className="grid lg:grid-cols-4 gap-3">
                                        {suite.results.map((result) => {
                                            // Check if test actually failed (no requests processed)
                                            const testFailed = result.status === 'completed' && result.total_requests === 0;
                                            const displayStatus = testFailed ? 'failed' : result.status;

                                            return (
                                                <button
                                                    key={result.run_id}
                                                    onClick={() => setActiveTab(result.suite_profile)}
                                                    className={`card p-4 text-left transition ${
                                                        activeTab === result.suite_profile
                                                            ? 'border-white/20'
                                                            : 'hover:border-white/15'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-white text-sm">{result.suite_profile_name}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                                            testFailed ? 'bg-red-500/15 text-red-400' :
                                                            result.status === 'completed' ? 'bg-green-500/15 text-green-400' :
                                                            result.status === 'running' ? 'bg-yellow-500/15 text-yellow-400' :
                                                            'bg-white/5 text-white/40'
                                                        }`}>
                                                            {displayStatus}
                                                        </span>
                                                    </div>
                                                    {result.status === 'completed' && (
                                                        <>
                                                            {testFailed ? (
                                                                <div className="text-xs text-red-400/80 mt-2">
                                                                    No requests processed - test failed to execute
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2 mt-2">
                                                                    <div className="text-xs">
                                                                        <div className="text-white/30">Total Requests</div>
                                                                        <div className="text-white">{result.total_requests.toLocaleString()}</div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 text-xs">
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
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex gap-1 border-b border-white/[0.06]">
                                        <button
                                            onClick={() => setActiveTab('overview')}
                                            className={`px-4 py-2 text-sm transition ${
                                                activeTab === 'overview' ? 'text-white border-b border-white' : 'text-white/40 hover:text-white'
                                            }`}
                                        >
                                            Overview
                                        </button>
                                        {suite.results.map(r => (
                                            <button
                                                key={r.suite_profile}
                                                onClick={() => setActiveTab(r.suite_profile)}
                                                className={`px-4 py-2 text-sm transition ${
                                                    activeTab === r.suite_profile ? 'text-white border-b border-white' : 'text-white/40 hover:text-white'
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

                                            {/* Comparison Table */}
                                            {suite.comparison && (
                                                <div className="card p-5">
                                                    <h3 className="font-medium text-white mb-5">Performance Comparison</h3>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b border-white/10">
                                                                    <th className="text-left py-3 px-4 text-white/50 font-medium">Profile</th>
                                                                    <th className="text-right py-3 px-4 text-white/50 font-medium">Status</th>
                                                                    <th className="text-right py-3 px-4 text-white/50 font-medium">Success Rate</th>
                                                                    <th className="text-right py-3 px-4 text-white/50 font-medium">Avg Latency</th>
                                                                    <th className="text-right py-3 px-4 text-white/50 font-medium">P95</th>
                                                                    <th className="text-right py-3 px-4 text-white/50 font-medium">RPS</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {suite.comparison.comparison.map((row: any, i: number) => (
                                                                    <tr key={i} className="border-b border-white/5">
                                                                        <td className="py-3 px-4 text-white font-medium">{row.profile}</td>
                                                                        <td className="py-3 px-4 text-right">
                                                                            <span className={`px-2 py-0.5 rounded text-xs ${
                                                                                row.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                                            }`}>
                                                                                {row.status}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-right text-white">{row.success_rate}</td>
                                                                        <td className="py-3 px-4 text-right text-white">{row.avg_latency}</td>
                                                                        <td className="py-3 px-4 text-right text-white">{row.p95_latency}</td>
                                                                        <td className="py-3 px-4 text-right text-white">{row.max_rps}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {suite.comparison.recommendations.length > 0 && (
                                                        <div className="mt-5 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                                            <h4 className="text-sm font-medium text-white mb-2">Recommendations</h4>
                                                            <ul className="space-y-1 text-sm text-white/60">
                                                                {suite.comparison.recommendations.map((rec: string, i: number) => (
                                                                    <li key={i}>• {rec}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* AI Summary */}
                                            {suite.ai_summary && (
                                                <div className="card p-5">
                                                    <div className="flex items-center gap-3 mb-5">
                                                        <h3 className="text-xl font-semibold text-white">Analysis</h3>
                                                    </div>

                                                    {/* Executive Summary */}
                                                    {suite.ai_summary.executive_summary && (
                                                        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4 mb-5">
                                                            <h4 className="font-medium text-white mb-2">Executive Summary</h4>
                                                            <p className="text-white/60 text-sm">{suite.ai_summary.executive_summary}</p>
                                                        </div>
                                                    )}

                                                    {/* Score Grid */}
                                                    <div className="grid md:grid-cols-3 gap-3 mb-5">
                                                        {/* Resilience Score */}
                                                        <div className="text-center p-4 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                            <div className="text-white/40 text-sm mb-2">Resilience Score</div>
                                                            <div className={`text-5xl font-bold ${
                                                                suite.ai_summary.resilience_score?.grade === 'A' ? 'text-emerald-400' :
                                                                suite.ai_summary.resilience_score?.grade === 'B' ? 'text-blue-400' :
                                                                'text-amber-400'
                                                            }`}>
                                                                {suite.ai_summary.resilience_score?.score || 'N/A'}
                                                            </div>
                                                            <div className="text-white/40 text-xs mt-1">Grade: {suite.ai_summary.resilience_score?.grade || 'N/A'}</div>
                                                        </div>

                                                        {/* Production Ready */}
                                                        <div className={`text-center p-4 rounded-lg border ${
                                                            suite.ai_summary.production_readiness?.current_verdict === 'READY'
                                                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                                                : 'bg-yellow-500/5 border-yellow-500/20'
                                                        }`}>
                                                            <div className="text-white/40 text-sm mb-2">Production Ready?</div>
                                                            <div className={`text-xl font-semibold ${
                                                                suite.ai_summary.production_readiness?.current_verdict === 'READY' ? 'text-green-400' : 'text-yellow-400'
                                                            }`}>
                                                                {suite.ai_summary.production_readiness?.current_verdict?.replace(/_/g, ' ') || 'N/A'}
                                                            </div>
                                                        </div>

                                                        {/* Best/Worst Profiles */}
                                                        <div className="p-4 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                            <div className="text-white/40 text-sm mb-3">Best/Worst Profiles</div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-emerald-400 font-medium text-sm">Best:</span>
                                                                    <span className="text-white text-sm">{suite.ai_summary.best_profile?.name || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-red-400 font-medium text-sm">Worst:</span>
                                                                    <span className="text-white text-sm">{suite.ai_summary.worst_profile?.name || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Key Findings and Action Items Grid */}
                                                    <div className="grid md:grid-cols-2 gap-5 mb-5">
                                                        {/* Key Findings */}
                                                        {suite.ai_summary.key_findings?.length > 0 && (
                                                            <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
                                                                <h4 className="font-medium text-white mb-3">Key Findings</h4>
                                                                <ul className="space-y-3">
                                                                    {suite.ai_summary.key_findings.map((finding: string, i: number) => (
                                                                        <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                                                                            <span className="text-white/40 mt-0.5">•</span>
                                                                            <span className="flex-1">{finding}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* Action Items */}
                                                        {suite.ai_summary.action_items?.length > 0 && (
                                                            <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
                                                                <h4 className="font-medium text-white mb-3">Action Items</h4>
                                                                <div className="space-y-3">
                                                                    {suite.ai_summary.action_items.map((item: any, i: number) => (
                                                                        <div key={i} className="flex gap-3">
                                                                            <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded font-medium ${
                                                                                item.priority === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                                                                                item.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                                                                                'bg-blue-500/10 text-blue-400'
                                                                            }`}>
                                                                                {item.priority}
                                                                            </span>
                                                                            <div className="flex-1">
                                                                                <div className="text-white text-sm font-medium mb-1">{item.action}</div>
                                                                                {item.description && (
                                                                                    <div className="text-white/50 text-xs">{item.description}</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
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
                                                const report = profileReports[result.run_id];
                                                const testFailed = result.total_requests === 0;

                                                // Get profile description
                                                const profileDescriptions: Record<string, string> = {
                                                    'smoke': 'Smoke Test validates basic functionality with minimal load (1-2 users). Tests if your API can handle the lightest possible traffic without errors.',
                                                    'ramp': 'Ramp Up Test gradually increases load from 1 to peak users over time. Identifies how your system behaves as traffic scales up.',
                                                    'spike': 'Spike Test simulates sudden traffic bursts by rapidly jumping from low to very high load. Tests how your system handles unexpected traffic spikes (e.g., viral content, marketing campaigns).',
                                                    'chaos': 'Chaos Test injects random errors and delays to simulate real-world instability. Tests your API\'s resilience and error handling under adverse conditions.'
                                                };

                                                return (
                                                    <>
                                                        {/* Profile Description */}
                                                        <div className="card p-5">
                                                            <div className="flex items-start gap-3">
                                                                <div className="p-2 bg-white/[0.03] rounded">
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                                                                        <circle cx="12" cy="12" r="10" />
                                                                        <line x1="12" y1="16" x2="12" y2="12" />
                                                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h3 className="font-medium text-white mb-1">{result.suite_profile_name}</h3>
                                                                    <p className="text-white/60 text-sm">{profileDescriptions[result.suite_profile] || result.suite_profile_description}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Test Failed Message */}
                                                        {testFailed && (() => {
                                                            // Check if other tests in the suite succeeded
                                                            const otherTestsSucceeded = suite.results.some(r =>
                                                                r.suite_profile !== result.suite_profile && r.total_requests > 0
                                                            );

                                                            // Profile-specific failure messages
                                                            const getFailureMessage = () => {
                                                                if (result.suite_profile === 'spike') {
                                                                    return {
                                                                        title: 'Spike Test Failed',
                                                                        description: 'This test simulates sudden traffic bursts. No requests were processed, which suggests:',
                                                                        reasons: otherTestsSucceeded ? [
                                                                            '• API crashed or became unresponsive under the sudden load spike',
                                                                            '• Rate limiting kicked in and blocked all requests',
                                                                            '• Circuit breaker or load balancer rejected connections due to rapid spike',
                                                                            '• Server ran out of resources (memory, connections) too quickly',
                                                                            '• Auto-scaling didn\'t respond fast enough to handle the burst'
                                                                        ] : [
                                                                            '• API endpoint is unreachable or not responding',
                                                                            '• Authentication credentials are invalid',
                                                                            '• Base URL configuration is incorrect',
                                                                            '• API is completely down or refusing connections'
                                                                        ],
                                                                        nextSteps: otherTestsSucceeded
                                                                            ? 'Your API handles normal load but fails under sudden spikes. Consider: implementing rate limiting with queueing, adding circuit breakers, enabling auto-scaling, or increasing connection pool limits.'
                                                                            : 'Check your API configuration, ensure the endpoint is accessible, and verify authentication credentials.'
                                                                    };
                                                                } else if (result.suite_profile === 'chaos') {
                                                                    return {
                                                                        title: 'Chaos Test Failed',
                                                                        description: 'This test injects random errors and delays. No requests were processed, which suggests:',
                                                                        reasons: otherTestsSucceeded ? [
                                                                            '• API has poor error handling and crashed when errors were injected',
                                                                            '• No retry logic or timeout handling for failed requests',
                                                                            '• Cascading failures caused complete system breakdown',
                                                                            '• Missing circuit breakers or bulkheads to isolate failures'
                                                                        ] : [
                                                                            '• API endpoint is unreachable or not responding',
                                                                            '• Authentication credentials are invalid',
                                                                            '• Base URL configuration is incorrect'
                                                                        ],
                                                                        nextSteps: otherTestsSucceeded
                                                                            ? 'Your API lacks resilience under adverse conditions. Implement proper error handling, add retry logic with exponential backoff, use circuit breakers, and ensure graceful degradation.'
                                                                            : 'Check your API configuration and ensure the endpoint is accessible.'
                                                                    };
                                                                } else if (result.suite_profile === 'ramp') {
                                                                    return {
                                                                        title: 'Ramp Up Test Failed',
                                                                        description: 'This test gradually increases load. No requests were processed, which suggests:',
                                                                        reasons: otherTestsSucceeded ? [
                                                                            '• API couldn\'t handle the gradual load increase',
                                                                            '• Resource exhaustion as load increased',
                                                                            '• Connection pool limits reached',
                                                                            '• Database or backend service became overwhelmed'
                                                                        ] : [
                                                                            '• API endpoint is unreachable or not responding',
                                                                            '• Authentication credentials are invalid',
                                                                            '• Base URL configuration is incorrect'
                                                                        ],
                                                                        nextSteps: otherTestsSucceeded
                                                                            ? 'Your API fails under sustained increasing load. Check resource limits, database connection pools, and ensure your system can scale horizontally.'
                                                                            : 'Check your API configuration and ensure the endpoint is accessible.'
                                                                    };
                                                                } else {
                                                                    // Default for smoke or unknown profiles
                                                                    return {
                                                                        title: 'Test Failed to Execute',
                                                                        description: 'No requests were processed during this test. This indicates:',
                                                                        reasons: [
                                                                            '• API endpoint is unreachable or not responding',
                                                                            '• Network connectivity issues between test runner and your API',
                                                                            '• Authentication credentials are invalid or expired',
                                                                            '• API is completely down or refusing connections',
                                                                            '• Base URL configuration is incorrect'
                                                                        ],
                                                                        nextSteps: 'Verify your API is running, check the base URL in project configuration, and ensure authentication is working properly.'
                                                                    };
                                                                }
                                                            };

                                                            const failureInfo = getFailureMessage();

                                                            return (
                                                                <div className="card p-5 bg-red-500/5 border-red-500/20">
                                                                    <div className="flex items-start gap-3">
                                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 flex-shrink-0">
                                                                            <circle cx="12" cy="12" r="10" />
                                                                            <line x1="15" y1="9" x2="9" y2="15" />
                                                                            <line x1="9" y1="9" x2="15" y2="15" />
                                                                        </svg>
                                                                        <div>
                                                                            <h4 className="font-medium text-red-400 mb-2">{failureInfo.title}</h4>
                                                                            <p className="text-white/70 text-sm mb-3">{failureInfo.description}</p>
                                                                            <ul className="space-y-1 text-sm text-white/60">
                                                                                {failureInfo.reasons.map((reason, i) => (
                                                                                    <li key={i}>{reason}</li>
                                                                                ))}
                                                                            </ul>
                                                                            <div className="mt-4 p-3 bg-white/[0.03] rounded border border-white/[0.06]">
                                                                                <p className="text-xs text-white/50">
                                                                                    <span className="font-medium text-white/70">Next steps:</span> {failureInfo.nextSteps}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Stats - Only show if test succeeded */}
                                                        {!testFailed && (
                                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                                {[
                                                                    { label: 'Total Requests', value: result.total_requests.toLocaleString() },
                                                                    { label: 'Error Rate', value: `${(result.error_rate * 100).toFixed(2)}%`, good: result.error_rate < 0.05 },
                                                                    { label: 'Avg Latency', value: `${result.avg_latency.toFixed(0)}ms` },
                                                                    { label: 'P95 Latency', value: `${result.p95.toFixed(0)}ms` },
                                                                ].map((stat, i) => (
                                                                    <div key={i} className="card p-5">
                                                                        <div className="text-white/40 text-sm mb-1">{stat.label}</div>
                                                                        <div className={`text-2xl font-bold ${
                                                                            stat.good !== undefined ? (stat.good ? 'text-green-400' : 'text-red-400') : 'text-white'
                                                                        }`}>
                                                                            {stat.value}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Timeseries Charts - Split into Latency and RPS */}
                                                        {result.timeseries.length > 0 && (
                                                            <div className="grid md:grid-cols-2 gap-6">
                                                                {/* Latency Over Time */}
                                                                <div className="card p-5">
                                                                    <h3 className="text-sm font-semibold mb-4 text-white">Latency Over Time</h3>
                                                                    <div className="h-64">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <LineChart data={result.timeseries}>
                                                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                                                <XAxis
                                                                                    dataKey="time"
                                                                                    stroke="rgba(255,255,255,0.4)"
                                                                                    tick={{ fontSize: 12 }}
                                                                                />
                                                                                <YAxis
                                                                                    stroke="rgba(255,255,255,0.4)"
                                                                                    tick={{ fontSize: 12 }}
                                                                                    label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.4)', fontSize: 12 } }}
                                                                                />
                                                                                <Tooltip
                                                                                    contentStyle={{
                                                                                        backgroundColor: '#0A0A0B',
                                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                                        fontSize: 12
                                                                                    }}
                                                                                />
                                                                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                                                                <Line type="monotone" dataKey="p50" name="P50" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                                                                <Line type="monotone" dataKey="p95" name="P95" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                                                                <Line type="monotone" dataKey="p99" name="P99" stroke="#ef4444" strokeWidth={2} dot={false} />
                                                                            </LineChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>

                                                                {/* RPS Over Time */}
                                                                <div className="card p-5">
                                                                    <h3 className="text-sm font-semibold mb-4 text-white">RPS Over Time</h3>
                                                                    <div className="h-64">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <LineChart data={result.timeseries}>
                                                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                                                <XAxis
                                                                                    dataKey="time"
                                                                                    stroke="rgba(255,255,255,0.4)"
                                                                                    tick={{ fontSize: 12 }}
                                                                                />
                                                                                <YAxis
                                                                                    stroke="rgba(255,255,255,0.4)"
                                                                                    tick={{ fontSize: 12 }}
                                                                                    label={{ value: 'RPS', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.4)', fontSize: 12 } }}
                                                                                />
                                                                                <Tooltip
                                                                                    contentStyle={{
                                                                                        backgroundColor: '#0A0A0B',
                                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                                        fontSize: 12
                                                                                    }}
                                                                                />
                                                                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                                                                <Line type="monotone" dataKey="rps" name="RPS" stroke="#10b981" strokeWidth={2} dot={false} />
                                                                            </LineChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* System Capacity & Breaking Point */}
                                                        {report && report.capacity_insights && (
                                                            <div className="card p-5">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <div className="p-2 bg-emerald-500/10 rounded">
                                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                                                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                                                            <path d="M2 17l10 5 10-5" />
                                                                            <path d="M2 12l10 5 10-5" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-semibold text-white">System Capacity & Breaking Point</h3>
                                                                        <p className="text-white/50 text-sm">How much load can your system handle?</p>
                                                                    </div>
                                                                    <div className="ml-auto text-right">
                                                                        <div className="text-3xl font-bold text-emerald-400">{report.capacity_insights.tested_vus}</div>
                                                                        <div className="text-xs text-white/40">concurrent users</div>
                                                                    </div>
                                                                </div>

                                                                <p className="text-white/70 text-sm mb-6">{report.capacity_insights.summary}</p>

                                                                {/* Capacity States */}
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                                                <polyline points="22 4 12 14.01 9 11.01" />
                                                                            </svg>
                                                                            <span className="text-white/50 text-xs font-medium uppercase">STABLE</span>
                                                                        </div>
                                                                        <div className="text-2xl font-bold text-white">{report.capacity_insights.max_stable_users} users</div>
                                                                        <div className="text-xs text-white/40 mt-1">Stable up to {report.capacity_insights.max_stable_users} concurrent users</div>
                                                                    </div>
                                                                    {report.capacity_insights.latency_inflection_users && (
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                                                                <span className="text-white/50 text-xs font-medium uppercase">DEGRADED</span>
                                                                            </div>
                                                                            <div className="text-2xl font-bold text-white">—</div>
                                                                            <div className="text-xs text-white/40 mt-1">No latency degradation detected</div>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                                                            <span className="text-white/50 text-xs font-medium uppercase">UNSTABLE</span>
                                                                        </div>
                                                                        <div className="text-2xl font-bold text-white">—</div>
                                                                        <div className="text-xs text-white/40 mt-1">No errors detected under load</div>
                                                                    </div>
                                                                    {report.capacity_insights.breaking_point_users && (
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <span className="w-2 h-2 rounded-full bg-white/40"></span>
                                                                                <span className="text-white/50 text-xs font-medium uppercase">BROKEN</span>
                                                                            </div>
                                                                            <div className="text-2xl font-bold text-white">—</div>
                                                                            <div className="text-xs text-white/40 mt-1">No breaking point reached</div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* First to Break */}
                                                                {report.ai_analysis?.breaking_points && (
                                                                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 mb-6">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <span className="px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded font-medium">FIRST TO BREAK</span>
                                                                        </div>
                                                                        <div className="font-mono text-sm text-white mb-2">{report.ai_analysis.breaking_points.first_to_break}</div>
                                                                        <div className="text-xs text-white/50 mb-1">{report.ai_analysis.breaking_points.why}</div>
                                                                        <div className="text-xs text-amber-400">{report.ai_analysis.breaking_points.at_load}</div>
                                                                    </div>
                                                                )}

                                                                {/* Charts Grid */}
                                                                {report.capacity_insights.concurrency_data && report.capacity_insights.concurrency_data.length > 0 && (
                                                                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                                                                        <div>
                                                                            <h4 className="text-sm font-medium text-white mb-3">Concurrent Users vs Response Time</h4>
                                                                            <p className="text-xs text-white/40 mb-3">How latency changes as load increases</p>
                                                                            <div className="h-64">
                                                                                <ResponsiveContainer width="100%" height="100%">
                                                                                    <ScatterChart>
                                                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                                                        <XAxis
                                                                                            dataKey="concurrent_users"
                                                                                            name="Concurrent Users"
                                                                                            stroke="rgba(255,255,255,0.4)"
                                                                                            label={{ value: 'Concurrent Users', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.4)' }}
                                                                                        />
                                                                                        <YAxis
                                                                                            name="Latency (ms)"
                                                                                            stroke="rgba(255,255,255,0.4)"
                                                                                            label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)' }}
                                                                                        />
                                                                                        <Tooltip
                                                                                            contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)' }}
                                                                                            cursor={{ strokeDasharray: '3 3' }}
                                                                                        />
                                                                                        <Legend />
                                                                                        <Scatter name="P95" data={report.capacity_insights.concurrency_data} dataKey="p95" fill="#f59e0b" />
                                                                                        <Scatter name="Median" data={report.capacity_insights.concurrency_data} dataKey="median_latency" fill="#3b82f6" />
                                                                                    </ScatterChart>
                                                                                </ResponsiveContainer>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-sm font-medium text-white mb-3">Concurrent Users vs Error Rate</h4>
                                                                            <p className="text-xs text-white/40 mb-3">When failures start appearing</p>
                                                                            <div className="h-64">
                                                                                <ResponsiveContainer width="100%" height="100%">
                                                                                    <ScatterChart>
                                                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                                                        <XAxis
                                                                                            dataKey="concurrent_users"
                                                                                            name="Concurrent Users"
                                                                                            stroke="rgba(255,255,255,0.4)"
                                                                                            label={{ value: 'Concurrent Users', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.4)' }}
                                                                                        />
                                                                                        <YAxis
                                                                                            name="Error Rate"
                                                                                            stroke="rgba(255,255,255,0.4)"
                                                                                            label={{ value: 'Error Rate (%)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)' }}
                                                                                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                                                                                        />
                                                                                        <Tooltip
                                                                                            contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)' }}
                                                                                            cursor={{ strokeDasharray: '3 3' }}
                                                                                            formatter={(value: any) => `${(value * 100).toFixed(2)}%`}
                                                                                        />
                                                                                        <Scatter name="Error Rate" data={report.capacity_insights.concurrency_data} dataKey="error_rate" fill="#ef4444" />
                                                                                    </ScatterChart>
                                                                                </ResponsiveContainer>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Summary Metrics */}
                                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                                    <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]">
                                                                        <div className="text-xs text-white/40 mb-1">Total Requests</div>
                                                                        <div className="text-xl font-bold text-white">{report.total_requests.toLocaleString()}</div>
                                                                    </div>
                                                                    <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]">
                                                                        <div className="text-xs text-white/40 mb-1">Success Rate</div>
                                                                        <div className={`text-xl font-bold ${(1 - report.error_rate) >= 0.99 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                                            {((1 - report.error_rate) * 100).toFixed(2)}%
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]">
                                                                        <div className="text-xs text-white/40 mb-1">Avg Latency</div>
                                                                        <div className="text-xl font-bold text-white">{report.avg_latency.toFixed(0)}ms</div>
                                                                    </div>
                                                                    <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]">
                                                                        <div className="text-xs text-white/40 mb-1">P95 Latency</div>
                                                                        <div className="text-xl font-bold text-white">{report.p95.toFixed(0)}ms</div>
                                                                    </div>
                                                                    <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]">
                                                                        <div className="text-xs text-white/40 mb-1">Max Stable RPS</div>
                                                                        <div className="text-xl font-bold text-white">{report.max_stable_rps?.toFixed(1) || 'N/A'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Loading indicator */}
                                                        {!report && result.status === 'completed' && (
                                                            <div className="card p-5 text-center">
                                                                <div className="text-white/40 text-sm">Loading detailed report...</div>
                                                            </div>
                                                        )}

                                                        {/* API Endpoint Breakdown Rankings */}
                                                        {report && report.endpoint_metrics && report.endpoint_metrics.length > 0 && (
                                                            <div className="card p-5">
                                                                <h3 className="font-semibold mb-5 text-white">API Endpoint Breakdown</h3>

                                                                {/* Slowest by P95 Latency */}
                                                                <div className="mb-6">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="w-1 h-4 bg-red-500 rounded"></div>
                                                                        <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider">Slowest by P95 Latency</h4>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {[...report.endpoint_metrics]
                                                                            .sort((a: any, b: any) => b.p95 - a.p95)
                                                                            .slice(0, 5)
                                                                            .map((endpoint: any, i: number) => (
                                                                                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-xs font-medium">
                                                                                            {i + 1}
                                                                                        </span>
                                                                                        <div className="font-mono text-xs text-white truncate">
                                                                                            <span className="text-emerald-400">{endpoint.method}</span> {endpoint.path}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                                                                        <div className="text-right">
                                                                                            <div className="text-white font-semibold">{endpoint.p95.toFixed(0)}ms</div>
                                                                                            <div className="text-white/40 text-xs">P95</div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        }
                                                                    </div>
                                                                </div>

                                                                {/* Highest Error Rate */}
                                                                {report.endpoint_metrics.some((e: any) => e.error_rate > 0) && (
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <div className="w-1 h-4 bg-amber-500 rounded"></div>
                                                                            <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider">Highest Error Rate</h4>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {[...report.endpoint_metrics]
                                                                                .filter((e: any) => e.error_rate > 0)
                                                                                .sort((a: any, b: any) => b.error_rate - a.error_rate)
                                                                                .slice(0, 5)
                                                                                .map((endpoint: any, i: number) => (
                                                                                    <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-medium">
                                                                                                {i + 1}
                                                                                            </span>
                                                                                            <div className="font-mono text-xs text-white truncate">
                                                                                                <span className="text-emerald-400">{endpoint.method}</span> {endpoint.path}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                                                                            <div className="text-right">
                                                                                                <div className="text-amber-400 font-semibold">{(endpoint.error_rate * 100).toFixed(2)}%</div>
                                                                                                <div className="text-white/40 text-xs">Error Rate</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Endpoint Breakdown Bar Chart */}
                                                        {report && report.endpoint_metrics && report.endpoint_metrics.length > 0 && (
                                                            <div className="card p-5">
                                                                <h3 className="font-semibold mb-4 text-white">Endpoint Latency Breakdown</h3>
                                                                <p className="text-white/50 text-sm mb-4">P95 latency comparison across all endpoints</p>
                                                                <div className="h-80">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <BarChart
                                                                            data={[...report.endpoint_metrics]
                                                                                .sort((a: any, b: any) => b.p95 - a.p95)
                                                                                .map((endpoint: any) => ({
                                                                                    name: `${endpoint.method} ${endpoint.path}`,
                                                                                    p95: endpoint.p95,
                                                                                    avg: endpoint.avg_latency
                                                                                }))
                                                                            }
                                                                            layout="vertical"
                                                                            margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                                                                        >
                                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                                            <XAxis
                                                                                type="number"
                                                                                stroke="rgba(255,255,255,0.4)"
                                                                                tick={{ fontSize: 12 }}
                                                                                label={{ value: 'Latency (ms)', position: 'insideBottom', offset: -5, style: { fill: 'rgba(255,255,255,0.4)', fontSize: 12 } }}
                                                                            />
                                                                            <YAxis
                                                                                type="category"
                                                                                dataKey="name"
                                                                                stroke="rgba(255,255,255,0.4)"
                                                                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                                                                                width={140}
                                                                            />
                                                                            <Tooltip
                                                                                contentStyle={{
                                                                                    backgroundColor: '#0A0A0B',
                                                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                                                    fontSize: 12
                                                                                }}
                                                                                formatter={(value: any) => `${value.toFixed(0)}ms`}
                                                                            />
                                                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                                                            <Bar dataKey="p95" name="P95" fill="#f59e0b" />
                                                                            <Bar dataKey="avg" name="Average" fill="#3b82f6" />
                                                                        </BarChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Endpoint Metrics */}
                                                        {report && report.endpoint_metrics && report.endpoint_metrics.length > 0 && (
                                                            <div className="card p-5">
                                                                <h3 className="font-semibold mb-4 text-white">All Endpoint Performance</h3>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="border-b border-white/10">
                                                                                <th className="text-left py-3 px-4 text-white/50 font-medium">Endpoint</th>
                                                                                <th className="text-right py-3 px-4 text-white/50 font-medium">Count</th>
                                                                                <th className="text-right py-3 px-4 text-white/50 font-medium">Avg Latency</th>
                                                                                <th className="text-right py-3 px-4 text-white/50 font-medium">P95</th>
                                                                                <th className="text-right py-3 px-4 text-white/50 font-medium">Error Rate</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {report.endpoint_metrics.map((endpoint: any, i: number) => (
                                                                                <tr key={i} className="border-b border-white/5">
                                                                                    <td className="py-3 px-4 text-white font-mono text-xs">
                                                                                        <span className="text-emerald-400">{endpoint.method}</span> {endpoint.path}
                                                                                    </td>
                                                                                    <td className="py-3 px-4 text-right text-white">{endpoint.count.toLocaleString()}</td>
                                                                                    <td className="py-3 px-4 text-right text-white">{endpoint.avg_latency.toFixed(0)}ms</td>
                                                                                    <td className="py-3 px-4 text-right text-white">{endpoint.p95.toFixed(0)}ms</td>
                                                                                    <td className={`py-3 px-4 text-right ${
                                                                                        endpoint.error_rate < 0.05 ? 'text-emerald-400' : 'text-red-400'
                                                                                    }`}>
                                                                                        {(endpoint.error_rate * 100).toFixed(2)}%
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Status Code Distribution */}
                                                        {report && report.status_code_distribution && Object.keys(report.status_code_distribution).length > 0 && (
                                                            <div className="card p-5">
                                                                <h3 className="font-semibold mb-4 text-white">Status Code Distribution</h3>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                    {Object.entries(report.status_code_distribution).map(([code, count]: [string, any]) => (
                                                                        <div key={code} className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]">
                                                                            <div className={`text-2xl font-bold mb-1 ${
                                                                                code.startsWith('2') ? 'text-emerald-400' :
                                                                                code.startsWith('4') ? 'text-amber-400' :
                                                                                code.startsWith('5') ? 'text-red-400' : 'text-white'
                                                                            }`}>
                                                                                {code}
                                                                            </div>
                                                                            <div className="text-white/60 text-sm">{count.toLocaleString()} requests</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Bottleneck Hints */}
                                                        {report && report.bottleneck_hints && report.bottleneck_hints.length > 0 && (
                                                            <div className="card p-5">
                                                                <h3 className="font-semibold mb-4 text-white">Bottleneck Analysis</h3>
                                                                <div className="space-y-4">
                                                                    {report.bottleneck_hints.map((hint: any, i: number) => (
                                                                        <div key={i} className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]">
                                                                            <div className="flex items-start gap-3">
                                                                                <span className="px-2 py-1 text-xs bg-amber-500/10 text-amber-400 rounded font-medium">
                                                                                    {hint.type}
                                                                                </span>
                                                                                <div className="flex-1">
                                                                                    <div className="text-white font-medium mb-1">{hint.message}</div>
                                                                                    <div className="text-white/60 text-sm">{hint.recommendation}</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Analysis */}
                                                        {report && report.ai_analysis && (
                                                            <div className="card p-5">
                                                                <div className="flex items-center gap-3 mb-5">
                                                                    <h3 className="font-medium text-white">Analysis</h3>
                                                                </div>

                                                                {/* Executive Summary */}
                                                                <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4 mb-5">
                                                                    <h4 className="font-medium text-white mb-2">Executive Summary</h4>
                                                                    <p className="text-white/60 text-sm">{report.ai_analysis.executive_summary}</p>
                                                                </div>

                                                                {/* Performance Grades */}
                                                                {report.ai_analysis.performance_grade && (
                                                                    <div className="grid md:grid-cols-4 gap-3 mb-5">
                                                                        <div className="text-center p-4 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                                            <div className="text-white/40 text-sm mb-2">Overall</div>
                                                                            <div className={`text-3xl font-semibold ${
                                                                                report.ai_analysis.performance_grade.overall === 'A' ? 'text-emerald-400' :
                                                                                report.ai_analysis.performance_grade.overall === 'B' ? 'text-blue-400' :
                                                                                report.ai_analysis.performance_grade.overall === 'C' ? 'text-amber-400' : 'text-red-400'
                                                                            }`}>
                                                                                {report.ai_analysis.performance_grade.overall}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-center p-4 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                                            <div className="text-white/40 text-sm mb-2">Latency</div>
                                                                            <div className={`text-3xl font-semibold ${
                                                                                report.ai_analysis.performance_grade.latency === 'A' ? 'text-emerald-400' :
                                                                                report.ai_analysis.performance_grade.latency === 'B' ? 'text-blue-400' :
                                                                                report.ai_analysis.performance_grade.latency === 'C' ? 'text-amber-400' : 'text-red-400'
                                                                            }`}>
                                                                                {report.ai_analysis.performance_grade.latency}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-center p-4 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                                            <div className="text-white/40 text-sm mb-2">Reliability</div>
                                                                            <div className={`text-3xl font-semibold ${
                                                                                report.ai_analysis.performance_grade.reliability === 'A' ? 'text-emerald-400' :
                                                                                report.ai_analysis.performance_grade.reliability === 'B' ? 'text-blue-400' :
                                                                                report.ai_analysis.performance_grade.reliability === 'C' ? 'text-amber-400' : 'text-red-400'
                                                                            }`}>
                                                                                {report.ai_analysis.performance_grade.reliability}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-center p-4 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                                                            <div className="text-white/40 text-sm mb-2">Throughput</div>
                                                                            <div className={`text-3xl font-semibold ${
                                                                                report.ai_analysis.performance_grade.throughput === 'A' ? 'text-emerald-400' :
                                                                                report.ai_analysis.performance_grade.throughput === 'B' ? 'text-blue-400' :
                                                                                report.ai_analysis.performance_grade.throughput === 'C' ? 'text-amber-400' : 'text-red-400'
                                                                            }`}>
                                                                                {report.ai_analysis.performance_grade.throughput}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Launch Readiness */}
                                                                {report.ai_analysis.launch_readiness && (
                                                                    <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4 mb-5">
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <h4 className="font-medium text-white">Launch Readiness</h4>
                                                                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                                                                                report.ai_analysis.launch_readiness.verdict === 'READY' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                                report.ai_analysis.launch_readiness.verdict === 'READY_WITH_WARNINGS' ? 'bg-amber-500/10 text-amber-400' :
                                                                                'bg-red-500/10 text-red-400'
                                                                            }`}>
                                                                                {report.ai_analysis.launch_readiness.verdict.replace(/_/g, ' ')}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-white/40 mb-3">
                                                                            Confidence: {report.ai_analysis.launch_readiness.confidence}
                                                                        </div>
                                                                        {report.ai_analysis.launch_readiness.reasons && report.ai_analysis.launch_readiness.reasons.length > 0 && (
                                                                            <ul className="space-y-2">
                                                                                {report.ai_analysis.launch_readiness.reasons.map((reason: string, i: number) => (
                                                                                    <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                                                                                        <span>•</span> {reason}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                        {report.ai_analysis.launch_readiness.blockers && report.ai_analysis.launch_readiness.blockers.length > 0 && (
                                                                            <div className="mt-3 pt-3 border-t border-white/[0.06]">
                                                                                <div className="text-xs text-red-400 font-medium mb-2">Blockers:</div>
                                                                                <ul className="space-y-2">
                                                                                    {report.ai_analysis.launch_readiness.blockers.map((blocker: string, i: number) => (
                                                                                        <li key={i} className="flex items-start gap-2 text-sm text-red-400/80">
                                                                                            <span>⚠</span> {blocker}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* User Capacity & Headroom Grid */}
                                                                {(report.ai_analysis.concurrent_users || report.ai_analysis.headroom) && (
                                                                    <div className="grid md:grid-cols-2 gap-5 mb-5">
                                                                        {/* User Capacity */}
                                                                        {report.ai_analysis.concurrent_users && (
                                                                            <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
                                                                                <h4 className="text-sm font-medium text-white mb-3">User Capacity</h4>
                                                                                <div className="mb-3">
                                                                                    <div className="text-xs text-white/40 mb-1">Tested With</div>
                                                                                    <div className="text-2xl font-bold text-white">
                                                                                        {report.ai_analysis.concurrent_users.current_tested}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="mb-3">
                                                                                    <div className="text-xs text-white/40 mb-1">Safe Maximum</div>
                                                                                    <div className="text-xl font-bold text-emerald-400">
                                                                                        {report.ai_analysis.concurrent_users.estimated_max_safe}
                                                                                    </div>
                                                                                </div>
                                                                                {report.ai_analysis.concurrent_users.estimated_max_absolute && (
                                                                                    <div className="mb-3">
                                                                                        <div className="text-xs text-white/40 mb-1">Absolute max (before failures)</div>
                                                                                        <div className="text-lg font-medium text-amber-400">
                                                                                            {report.ai_analysis.concurrent_users.estimated_max_absolute}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                <div className="text-xs text-white/50">
                                                                                    {report.ai_analysis.concurrent_users.explanation}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Headroom */}
                                                                        {report.ai_analysis.headroom && (
                                                                            <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
                                                                                <h4 className="text-sm font-medium text-white mb-3">Headroom</h4>
                                                                                <div className="mb-3">
                                                                                    <div className="flex items-center justify-between mb-2">
                                                                                        <span className="text-xs text-white/40">Capacity Used</span>
                                                                                        <span className="text-lg font-bold text-white">
                                                                                            {report.ai_analysis.headroom.percentage}%
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="w-full bg-white/10 rounded-full h-2">
                                                                                        <div
                                                                                            className={`h-2 rounded-full transition-all ${
                                                                                                report.ai_analysis.headroom.percentage >= 80 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                                                                                                report.ai_analysis.headroom.percentage >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                                                                                                'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                                                                            }`}
                                                                                            style={{ width: `${report.ai_analysis.headroom.percentage}%` }}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="text-xs text-white/40 mt-1">
                                                                                        Can handle up to {100 - report.ai_analysis.headroom.percentage}% more load
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-sm text-white/60 mb-2">
                                                                                    {report.ai_analysis.headroom.explanation}
                                                                                </div>
                                                                                <div className="text-xs text-white/50">
                                                                                    {report.ai_analysis.headroom.scale_recommendation}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Breaking Points */}
                                                                {report.ai_analysis.breaking_points && (
                                                                    <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4 mb-5">
                                                                        <h4 className="text-sm font-medium text-white mb-3">Breaking Points</h4>
                                                                        <div className="mb-2">
                                                                            <span className="text-xs text-white/40">First to Break: </span>
                                                                            <span className="font-mono text-sm text-white">
                                                                                {report.ai_analysis.breaking_points.first_to_break}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-sm text-white/60 mb-2">{report.ai_analysis.breaking_points.why}</div>
                                                                        <div className="text-xs text-amber-400">{report.ai_analysis.breaking_points.at_load}</div>
                                                                    </div>
                                                                )}

                                                                {/* Fix Priorities */}
                                                                {report.ai_analysis.fix_priorities && report.ai_analysis.fix_priorities.length > 0 && (
                                                                    <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
                                                                        <h4 className="text-sm font-medium text-white mb-3">Fix Priorities</h4>
                                                                        <ol className="space-y-3">
                                                                            {report.ai_analysis.fix_priorities.map((fix: any, i: number) => (
                                                                                <li key={i} className="flex gap-3">
                                                                                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                                                                        fix.priority === 1 ? 'bg-red-500/10 text-red-400' :
                                                                                        fix.priority === 2 ? 'bg-amber-500/10 text-amber-400' :
                                                                                        'bg-blue-500/10 text-blue-400'
                                                                                    }`}>
                                                                                        {fix.priority}
                                                                                    </span>
                                                                                    <div className="flex-1">
                                                                                        <div className="text-white text-sm font-medium mb-1">{fix.issue}</div>
                                                                                        {fix.solution && <div className="text-white/60 text-xs mb-1">{fix.solution}</div>}
                                                                                        <div className="text-xs text-white/40">
                                                                                            {fix.effort && `Effort: ${fix.effort}`}
                                                                                            {fix.effort && fix.impact && ' • '}
                                                                                            {fix.impact && `Impact: ${fix.impact}`}
                                                                                        </div>
                                                                                    </div>
                                                                                </li>
                                                                            ))}
                                                                        </ol>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </>
                            )}
                    </div>
                )}
            </div>
        </main>
    );
}
