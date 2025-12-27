'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { runs, SuiteResults } from '@/lib/api';

export default function SuiteResultsPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const router = useRouter();
    const suiteId = params.id;

    const [results, setResults] = useState<SuiteResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;

        const loadResults = async () => {
            try {
                const data = await runs.getSuiteResults(suiteId);
                setResults(data);

                // Poll if not complete
                if (data.status !== 'completed') {
                    setTimeout(loadResults, 3000);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadResults();
    }, [user, suiteId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/40 text-sm">Loading suite results...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
                <div className="text-center">
                    <h1 className="text-xl font-medium mb-4 text-red-400">Error</h1>
                    <p className="text-white/40 mb-4">{error}</p>
                    <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    if (!results) return null;

    const isComplete = results.status === 'completed';
    const progress = (results.completed_tests / results.total_tests) * 100;

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Header */}
            <header className="nav sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-white/40 hover:text-white transition text-sm">
                                Back
                            </Link>
                            <h1 className="text-lg font-medium text-white">Full Suite Results</h1>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${isComplete ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                            {isComplete ? 'Complete' : 'Running...'}
                        </span>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {/* Progress */}
                {!isComplete && (
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-white/50 text-sm">Progress</span>
                            <span className="text-white text-sm">{results.completed_tests} / {results.total_tests} tests</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-white transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Test Profile Results */}
                <section className="card p-5">
                    <h2 className="text-base font-medium text-white mb-5">Test Profile Results</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {results.results.map((result, i) => (
                            <div
                                key={result.run_id}
                                className={`p-4 rounded-lg border ${result.status === 'completed'
                                    ? result.error_rate < 0.05
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : result.error_rate < 0.1
                                            ? 'bg-amber-500/5 border-amber-500/20'
                                            : 'bg-red-500/5 border-red-500/20'
                                    : result.status === 'failed'
                                        ? 'bg-red-500/5 border-red-500/20'
                                        : 'bg-white/[0.02] border-white/[0.06]'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-white text-sm font-medium">{result.suite_profile_name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${result.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                        result.status === 'running' ? 'bg-amber-500/10 text-amber-400' :
                                            result.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                                'bg-white/10 text-white/50'
                                        }`}>
                                        {result.status}
                                    </span>
                                </div>
                                <p className="text-xs text-white/40 mb-3">{result.suite_profile_description}</p>

                                {result.status === 'completed' && (
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-white/40">Error Rate</span>
                                            <span className={result.error_rate < 0.05 ? 'text-emerald-400' : 'text-red-400'}>
                                                {(result.error_rate * 100).toFixed(2)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/40">Avg Latency</span>
                                            <span className="text-white">{result.avg_latency.toFixed(0)}ms</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/40">P95</span>
                                            <span className="text-white">{result.p95.toFixed(0)}ms</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/40">RPS</span>
                                            <span className="text-white">{result.max_stable_rps.toFixed(1)}</span>
                                        </div>
                                        <Link
                                            href={`/runs/${result.run_id}`}
                                            className="block text-center mt-3 text-white/50 hover:text-white text-xs transition"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                )}

                                {result.status === 'running' && (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Comparison Table */}
                {isComplete && results.comparison && (
                    <section className="card p-5">
                        <h2 className="text-base font-medium text-white mb-5">Performance Comparison</h2>
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
                                    {results.comparison.comparison.map((row, i) => (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-3 px-4 text-white font-medium">{row.profile}</td>
                                            <td className="py-3 px-4 text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs ${row.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
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

                        {results.comparison.recommendations.length > 0 && (
                            <div className="mt-5 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                <h3 className="text-sm font-medium text-white mb-2">Recommendations</h3>
                                <ul className="space-y-1 text-sm text-white/60">
                                    {results.comparison.recommendations.map((rec, i) => (
                                        <li key={i}>• {rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                )}

                {/* AI Summary */}
                {isComplete && results.ai_summary && (
                    <section className="card p-5">
                        <h2 className="text-base font-medium text-white mb-5">Analysis</h2>

                        {/* Executive Summary */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 mb-5">
                            <h3 className="text-sm font-medium text-white mb-2">Executive Summary</h3>
                            <p className="text-sm text-white/60">{results.ai_summary.executive_summary}</p>
                        </div>

                        {/* Resilience Score & Verdict */}
                        <div className="grid md:grid-cols-3 gap-4 mb-5">
                            <div className="text-center p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                <div className="text-white/40 text-xs mb-2">Resilience Score</div>
                                <div className={`text-3xl font-bold ${results.ai_summary.resilience_score.grade === 'A' ? 'text-emerald-400' :
                                    results.ai_summary.resilience_score.grade === 'B' ? 'text-blue-400' :
                                        results.ai_summary.resilience_score.grade === 'C' ? 'text-amber-400' :
                                            'text-red-400'
                                    }`}>
                                    {results.ai_summary.resilience_score.score}
                                </div>
                                <div className="text-xs text-white/50 mt-1">Grade: {results.ai_summary.resilience_score.grade}</div>
                            </div>

                            <div className={`text-center p-4 rounded-lg border ${results.ai_summary.production_readiness.current_verdict === 'READY'
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : results.ai_summary.production_readiness.current_verdict === 'NEEDS_WORK'
                                    ? 'bg-amber-500/5 border-amber-500/20'
                                    : 'bg-red-500/5 border-red-500/20'
                                }`}>
                                <div className="text-white/40 text-xs mb-2">Production Ready?</div>
                                <div className={`text-xl font-bold ${results.ai_summary.production_readiness.current_verdict === 'READY' ? 'text-emerald-400' :
                                    results.ai_summary.production_readiness.current_verdict === 'NEEDS_WORK' ? 'text-amber-400' :
                                        'text-red-400'
                                    }`}>
                                    {results.ai_summary.production_readiness.current_verdict.replace(/_/g, ' ')}
                                </div>
                                <div className="text-xs mt-1 text-white/40">{results.ai_summary.production_readiness.expected_traffic}</div>
                            </div>

                            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                <div className="text-white/40 text-xs mb-2">Best/Worst Profiles</div>
                                <div className="text-sm">
                                    <span className="text-emerald-400">Best: </span>
                                    <span className="text-white">{results.ai_summary.best_profile.name}</span>
                                </div>
                                <div className="text-sm mt-1">
                                    <span className="text-red-400">Worst: </span>
                                    <span className="text-white">{results.ai_summary.worst_profile.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Key Findings & Action Items */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                                <h3 className="text-sm font-medium text-white mb-3">Key Findings</h3>
                                <ul className="space-y-2 text-sm text-white/60">
                                    {results.ai_summary.key_findings.map((finding, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-white/40">•</span>
                                            {finding}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                                <h3 className="text-sm font-medium text-white mb-3">Action Items</h3>
                                <ul className="space-y-3">
                                    {results.ai_summary.action_items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded ${item.priority === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                                                item.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-blue-500/10 text-blue-400'
                                                }`}>
                                                {item.priority}
                                            </span>
                                            <div>
                                                <div className="text-sm text-white">{item.action}</div>
                                                <div className="text-xs text-white/40">{item.reason}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
