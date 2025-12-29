'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { runs, Run, RunReport as RunReportType, CapacityInsights, EndpointBreakdown } from '@/lib/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Demo mode detection (user not logged in or viewing demo results)
const isDemoMode = (user: any) => !user;

export default function RunDetailPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const runId = parseInt(params.id);

    const [run, setRun] = useState<Run | null>(null);
    const [report, setReport] = useState<RunReportType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        try {
            const runData = await runs.get(runId);
            setRun(runData);

            if (runData.status === 'completed' || runData.status === 'failed') {
                try {
                    const reportData = await runs.report(runId);
                    setReport(reportData);
                } catch (e) {
                    // Report might not be ready yet
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [runId]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, loadData]);

    // Poll for updates if run is pending or running
    useEffect(() => {
        if (run && (run.status === 'pending' || run.status === 'running')) {
            const interval = setInterval(loadData, 3000);
            return () => clearInterval(interval);
        }
    }, [run, loadData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!run) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
                <div className="text-center">
                    <h1 className="text-xl font-medium text-white mb-4">Run not found</h1>
                    <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'running': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'failed': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-white/40 bg-white/10 border-white/10';
        }
    };

    const formatLatency = (ms: number) => {
        if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
        return `${ms.toFixed(0)}ms`;
    };

    const getThresholdIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-400">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                );
            case 'error':
            case 'critical':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-400">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                );
            default:
                return null;
        }
    };

    // Prepare chart data
    const statusCodeData = report ? Object.entries(report.status_code_distribution).map(([code, count]) => ({
        name: code,
        value: count
    })) : [];

    const endpointData = report?.endpoint_metrics.map(e => ({
        name: `${e.method} ${e.path.slice(0, 30)}`,
        p95: e.p95,
        errorRate: e.error_rate * 100
    })) || [];

    // Concurrency vs Performance chart data
    const concurrencyData = report?.capacity_insights?.concurrency_data || [];

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Header */}
            <header className="nav sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-white/40 hover:text-white transition text-sm">
                                Back
                            </Link>
                            <h1 className="text-lg font-medium text-white">Run #{run.id}</h1>
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(run.status)}`}>
                                {run.status}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm mb-6">
                        {error}
                    </div>
                )}

                {/* Status for pending/running */}
                {(run.status === 'pending' || run.status === 'running') && (
                    <div className="card p-12 text-center mb-6">
                        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
                        <h2 className="text-xl font-medium text-white mb-2">
                            {run.status === 'pending' ? 'Preparing Test...' : 'Test Running...'}
                        </h2>
                        <p className="text-white/40 text-sm">
                            {run.status === 'pending'
                                ? 'Setting up the load test environment'
                                : 'Executing load test. Results will appear when complete.'}
                        </p>
                    </div>
                )}

                {/* Error message for failed runs */}
                {run.status === 'failed' && run.error_message && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-5 mb-6">
                        <h3 className="text-base font-medium text-red-400 mb-2">Test Failed</h3>
                        <p className="text-red-300 text-sm">{run.error_message}</p>
                    </div>
                )}

                {/* Report for completed runs */}
                {report && (
                    <>
                        {/* PRIMARY INSIGHT CARD: System Capacity & Breaking Point */}
                        {report.capacity_insights && (
                            <div className="mb-6">
                                <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.1] rounded-2xl overflow-hidden">
                                    {/* Header */}
                                    <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                                    <path d="M2 17l10 5 10-5" />
                                                    <path d="M2 12l10 5 10-5" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-white">System Capacity & Breaking Point</h2>
                                                <p className="text-xs text-white/40">How much load can your system handle?</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-emerald-400">
                                                {report.capacity_insights.max_stable_users}
                                            </div>
                                            <div className="text-xs text-white/40">concurrent users</div>
                                        </div>
                                    </div>

                                    {/* Plain-English Summary */}
                                    <div className="px-6 py-5 bg-white/[0.02] border-b border-white/[0.06]">
                                        <p className="text-white/80 leading-relaxed">
                                            {report.capacity_insights.summary}
                                        </p>
                                    </div>

                                    {/* Threshold Indicators */}
                                    <div className="grid grid-cols-2 md:grid-cols-4">
                                        {Object.entries(report.capacity_insights.thresholds).map(([key, threshold]) => (
                                            <div key={key} className="px-5 py-4 border-r border-b border-white/[0.06] last:border-r-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {getThresholdIcon(threshold.status)}
                                                    <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                                                        {key}
                                                    </span>
                                                </div>
                                                <div className="text-lg font-semibold text-white mb-1">
                                                    {threshold.users !== null ? `${threshold.users} users` : '—'}
                                                </div>
                                                <p className="text-xs text-white/40 line-clamp-2">
                                                    {threshold.label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* First to Break Endpoint */}
                                    {report.capacity_insights.endpoint_analysis.first_to_break && (
                                        <div className="px-6 py-4 bg-red-500/[0.03] border-t border-red-500/10">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                            <line x1="12" y1="9" x2="12" y2="13" />
                                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                                        </svg>
                                                        <span className="text-xs font-medium text-red-400/80">FIRST TO BREAK</span>
                                                    </div>
                                                    <div className="font-mono text-white">
                                                        {report.capacity_insights.endpoint_analysis.first_to_break.endpoint}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-amber-400 text-sm">
                                                        P95: {formatLatency(report.capacity_insights.endpoint_analysis.first_to_break.p95)}
                                                    </div>
                                                    <div className="text-red-400 text-sm">
                                                        {(report.capacity_insights.endpoint_analysis.first_to_break.error_rate * 100).toFixed(2)}% errors
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Concurrency Charts - 2 columns */}
                        {concurrencyData.length > 0 && (
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                {/* Concurrent Users vs Response Time */}
                                <div className="card p-5">
                                    <h3 className="text-sm font-medium text-white mb-1">Concurrent Users vs Response Time</h3>
                                    <p className="text-xs text-white/40 mb-4">How latency changes as load increases</p>
                                    <ResponsiveContainer width="100%" height={240}>
                                        <ComposedChart data={concurrencyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                            <XAxis 
                                                dataKey="estimated_vus" 
                                                stroke="rgba(255,255,255,0.3)" 
                                                fontSize={11}
                                                label={{ value: 'Concurrent Users', position: 'bottom', offset: -5, fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                            />
                                            <YAxis 
                                                stroke="rgba(255,255,255,0.3)" 
                                                fontSize={11}
                                                label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                labelStyle={{ color: '#fff' }}
                                                formatter={(value: number, name: string) => [
                                                    `${value.toFixed(0)}ms`,
                                                    name === 'p50' ? 'Median' : 'P95'
                                                ]}
                                                labelFormatter={(value) => `${value} users`}
                                            />
                                            <Legend />
                                            <Area type="monotone" dataKey="p95" fill="#f59e0b" fillOpacity={0.1} stroke="#f59e0b" strokeWidth={2} name="P95" />
                                            <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} dot={false} name="Median" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Concurrent Users vs Error Rate */}
                                <div className="card p-5">
                                    <h3 className="text-sm font-medium text-white mb-1">Concurrent Users vs Error Rate</h3>
                                    <p className="text-xs text-white/40 mb-4">When failures start appearing</p>
                                    <ResponsiveContainer width="100%" height={240}>
                                        <AreaChart data={concurrencyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                            <XAxis 
                                                dataKey="estimated_vus" 
                                                stroke="rgba(255,255,255,0.3)" 
                                                fontSize={11}
                                                label={{ value: 'Concurrent Users', position: 'bottom', offset: -5, fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                            />
                                            <YAxis 
                                                stroke="rgba(255,255,255,0.3)" 
                                                fontSize={11} 
                                                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                                label={{ value: 'Error Rate', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Error Rate']}
                                                labelFormatter={(value) => `${value} users`}
                                            />
                                            <Area type="monotone" dataKey="error_rate" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Error Rate" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            {[
                                { label: 'Total Requests', value: report.total_requests.toLocaleString() },
                                { label: 'Success Rate', value: `${((1 - report.error_rate) * 100).toFixed(2)}%`, color: report.error_rate < 0.01 ? 'text-emerald-400' : 'text-amber-400' },
                                { label: 'Avg Latency', value: formatLatency(report.avg_latency) },
                                { label: 'P95 Latency', value: formatLatency(report.p95), color: report.p95 > 1000 ? 'text-amber-400' : undefined },
                                { label: 'Max Stable RPS', value: report.max_stable_rps?.toFixed(1) || 'N/A' }
                            ].map((stat, i) => (
                                <div key={i} className="card p-4">
                                    <div className="text-white/40 text-xs mb-1">{stat.label}</div>
                                    <div className={`text-xl font-bold text-white ${stat.color || ''}`}>{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* API-Level Breakdown Card */}
                        {report.capacity_insights?.endpoint_analysis && (
                            <div className="card p-5 mb-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="text-sm font-medium text-white">API Endpoint Breakdown</h3>
                                        <p className="text-xs text-white/40 mt-0.5">Performance ranking by latency and error rate</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Slowest Endpoints */}
                                    <div>
                                        <h4 className="text-xs font-medium text-amber-400/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            Slowest by P95 Latency
                                        </h4>
                                        <div className="space-y-2">
                                            {report.capacity_insights.endpoint_analysis.rankings_by_latency.map((ep, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        i === 0 ? 'bg-amber-500/20 text-amber-400' :
                                                        i === 1 ? 'bg-white/10 text-white/60' :
                                                        'bg-white/5 text-white/40'
                                                    }`}>
                                                        {ep.rank}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-mono text-sm text-white truncate">{ep.endpoint}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-amber-400 font-mono text-sm">{formatLatency(ep.p95 || 0)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {report.capacity_insights.endpoint_analysis.rankings_by_latency.length === 0 && (
                                                <p className="text-white/30 text-sm">No endpoint data available</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Highest Error Rate */}
                                    <div>
                                        <h4 className="text-xs font-medium text-red-400/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="15" y1="9" x2="9" y2="15" />
                                                <line x1="9" y1="9" x2="15" y2="15" />
                                            </svg>
                                            Highest Error Rate
                                        </h4>
                                        <div className="space-y-2">
                                            {report.capacity_insights.endpoint_analysis.rankings_by_errors.length > 0 ? (
                                                report.capacity_insights.endpoint_analysis.rankings_by_errors.map((ep, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg">
                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                            i === 0 ? 'bg-red-500/20 text-red-400' :
                                                            i === 1 ? 'bg-white/10 text-white/60' :
                                                            'bg-white/5 text-white/40'
                                                        }`}>
                                                            {ep.rank}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-mono text-sm text-white truncate">{ep.endpoint}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-red-400 font-mono text-sm">{((ep.error_rate || 0) * 100).toFixed(2)}%</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                        <polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                    <span className="text-emerald-400 text-sm">All endpoints returned successfully</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Charts Row 1 */}
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            {/* Latency Over Time */}
                            <div className="card p-5">
                                <h3 className="text-sm font-medium text-white mb-4">Latency Over Time</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={report.timeseries}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="time_bucket" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="p50" stroke="#10b981" name="P50" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="p95" stroke="#f59e0b" name="P95" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="p99" stroke="#ef4444" name="P99" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* RPS Over Time */}
                            <div className="card p-5">
                                <h3 className="text-sm font-medium text-white mb-4">RPS Over Time</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={report.timeseries}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="time_bucket" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        />
                                        <Area type="monotone" dataKey="rps" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="RPS" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Charts Row 2 */}
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            {/* Status Code Distribution */}
                            <div className="card p-5">
                                <h3 className="text-sm font-medium text-white mb-4">Status Code Distribution</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={statusCodeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={90}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {statusCodeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Error Rate Over Time */}
                            <div className="card p-5">
                                <h3 className="text-sm font-medium text-white mb-4">Error Rate Over Time</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={report.timeseries}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="time_bucket" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                                        />
                                        <Area type="monotone" dataKey="error_rate" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Error Rate" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Endpoint Breakdown */}
                        <div className="card p-5 mb-4">
                            <h3 className="text-sm font-medium text-white mb-4">Endpoint Breakdown</h3>
                            <ResponsiveContainer width="100%" height={Math.max(280, endpointData.length * 40)}>
                                <BarChart data={endpointData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" width={200} fontSize={11} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        formatter={(value: number, name: string) => [
                                            name === 'p95' ? `${value.toFixed(0)}ms` : `${value.toFixed(2)}%`,
                                            name === 'p95' ? 'P95 Latency' : 'Error Rate'
                                        ]}
                                    />
                                    <Legend />
                                    <Bar dataKey="p95" fill="#f59e0b" name="P95 (ms)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Endpoint Table */}
                        <div className="card p-5 mb-4">
                            <h3 className="text-sm font-medium text-white mb-4">Detailed Endpoint Metrics</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-white/10 text-left">
                                        <tr className="text-white/40">
                                            <th className="pb-3">Endpoint</th>
                                            <th className="pb-3 text-right">Requests</th>
                                            <th className="pb-3 text-right">P50</th>
                                            <th className="pb-3 text-right">P95</th>
                                            <th className="pb-3 text-right">P99</th>
                                            <th className="pb-3 text-right">Error Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.endpoint_metrics.map((ep, i) => (
                                            <tr key={i} className="border-b border-white/5">
                                                <td className="py-3">
                                                    <span className={`px-2 py-0.5 text-xs font-mono rounded mr-2 ${ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        ep.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                                                            'bg-white/10 text-white/60'
                                                        }`}>
                                                        {ep.method}
                                                    </span>
                                                    <span className="font-mono text-white/70">{ep.path}</span>
                                                </td>
                                                <td className="py-3 text-right text-white">{ep.count.toLocaleString()}</td>
                                                <td className="py-3 text-right text-white">{formatLatency(ep.p50)}</td>
                                                <td className="py-3 text-right text-white">{formatLatency(ep.p95)}</td>
                                                <td className="py-3 text-right text-white">{formatLatency(ep.p99)}</td>
                                                <td className={`py-3 text-right ${ep.error_rate > 0.01 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {(ep.error_rate * 100).toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Bottleneck Hints */}
                        <div className="card p-5 mb-4">
                            <h3 className="text-sm font-medium text-white mb-4">Performance Insights</h3>
                            <div className="space-y-3">
                                {report.bottleneck_hints.map((hint, i) => (
                                    <div key={i} className={`p-4 rounded-lg border ${hint.type === 'healthy' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                        hint.type.includes('error') || hint.type === 'server_errors' ? 'bg-red-500/5 border-red-500/20' :
                                            'bg-amber-500/5 border-amber-500/20'
                                        }`}>
                                        <div className="text-sm font-medium text-white mb-1">{hint.message}</div>
                                        <div className="text-xs text-white/50">{hint.recommendation}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Analysis Section */}
                        {report.ai_analysis && (
                            <div className="card p-5 mb-4">
                                <div className="flex items-center gap-3 mb-5">
                                    <h3 className="text-sm font-medium text-white">AI-Powered Analysis</h3>
                                    {report.ai_analysis.ai_generated && (
                                        <span className="px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded">
                                            AI Powered
                                        </span>
                                    )}
                                </div>

                                {/* Executive Summary */}
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 mb-5">
                                    <h4 className="text-sm font-medium text-white mb-2">Executive Summary</h4>
                                    <p className="text-sm text-white/60 leading-relaxed">{report.ai_analysis.executive_summary}</p>
                                </div>

                                {/* Performance Grade */}
                                <div className="grid grid-cols-4 gap-3 mb-5">
                                    {[
                                        { label: 'Overall', grade: report.ai_analysis.performance_grade.overall },
                                        { label: 'Latency', grade: report.ai_analysis.performance_grade.latency },
                                        { label: 'Reliability', grade: report.ai_analysis.performance_grade.reliability },
                                        { label: 'Throughput', grade: report.ai_analysis.performance_grade.throughput }
                                    ].map((item, i) => (
                                        <div key={i} className="text-center p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                            <div className="text-white/40 text-xs mb-1">{item.label}</div>
                                            <div className={`text-2xl font-bold ${item.grade === 'A' ? 'text-emerald-400' :
                                                item.grade === 'B' ? 'text-blue-400' :
                                                    item.grade === 'C' ? 'text-amber-400' :
                                                        item.grade === 'D' ? 'text-orange-400' : 'text-red-400'
                                                }`}>{item.grade}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Launch Readiness */}
                                <div className={`rounded-lg p-4 mb-5 border ${report.ai_analysis.launch_readiness.verdict === 'READY'
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : report.ai_analysis.launch_readiness.verdict === 'READY_WITH_WARNINGS'
                                        ? 'bg-amber-500/5 border-amber-500/20'
                                        : 'bg-red-500/5 border-red-500/20'
                                    }`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium text-white">Launch Readiness</h4>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${report.ai_analysis.launch_readiness.verdict === 'READY'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : report.ai_analysis.launch_readiness.verdict === 'READY_WITH_WARNINGS'
                                                ? 'bg-amber-500/10 text-amber-400'
                                                : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {report.ai_analysis.launch_readiness.verdict.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="text-xs text-white/40 mb-2">
                                        Confidence: {report.ai_analysis.launch_readiness.confidence}
                                    </div>
                                    <ul className="space-y-1 text-sm text-white/60">
                                        {report.ai_analysis.launch_readiness.reasons.map((reason, i) => (
                                            <li key={i}>• {reason}</li>
                                        ))}
                                    </ul>
                                    {report.ai_analysis.launch_readiness.blockers.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-red-500/20">
                                            <div className="text-red-400 text-xs font-medium mb-1">Blockers:</div>
                                            <ul className="text-red-300 text-sm space-y-1">
                                                {report.ai_analysis.launch_readiness.blockers.map((blocker, i) => (
                                                    <li key={i}>• {blocker}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Key Questions Grid */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Concurrent Users */}
                                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-white mb-3">User Capacity</h4>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <div className="text-white/40 text-xs">Tested With</div>
                                                <div className="text-xl font-bold text-white">{report.ai_analysis.concurrent_users.current_tested}</div>
                                            </div>
                                            <div>
                                                <div className="text-white/40 text-xs">Safe Maximum</div>
                                                <div className="text-xl font-bold text-emerald-400">
                                                    {report.ai_analysis.concurrent_users.estimated_max_safe}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-white/40 text-xs mb-2">
                                            Absolute max (before failures): {report.ai_analysis.concurrent_users.estimated_max_absolute}
                                        </div>
                                        <p className="text-xs text-white/50">{report.ai_analysis.concurrent_users.explanation}</p>
                                    </div>

                                    {/* Headroom */}
                                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-white mb-3">Headroom</h4>
                                        <div className="mb-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-white/40">Capacity Used</span>
                                                <span className="text-white">{100 - report.ai_analysis.headroom.percentage}%</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${report.ai_analysis.headroom.percentage > 50 ? 'bg-emerald-500' :
                                                        report.ai_analysis.headroom.percentage > 20 ? 'bg-amber-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${100 - report.ai_analysis.headroom.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-white mb-2">
                                            {report.ai_analysis.headroom.scale_recommendation}
                                        </div>
                                        <p className="text-xs text-white/50">{report.ai_analysis.headroom.explanation}</p>
                                    </div>

                                    {/* Breaking Points */}
                                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-white mb-3">Breaking Points</h4>
                                        <div className="font-mono text-amber-400 text-sm mb-2">
                                            {report.ai_analysis.breaking_points.first_to_break}
                                        </div>
                                        <p className="text-xs text-white/50 mb-2">{report.ai_analysis.breaking_points.why}</p>
                                        <div className="text-xs">
                                            <span className="text-white/40">Expected at: </span>
                                            <span className="text-orange-400">{report.ai_analysis.breaking_points.at_load}</span>
                                        </div>
                                    </div>

                                    {/* Fix Priorities */}
                                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-white mb-3">Fix Priorities</h4>
                                        <div className="space-y-2">
                                            {report.ai_analysis.fix_priorities.slice(0, 3).map((fix, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-red-500/10 text-red-400' :
                                                        i === 1 ? 'bg-amber-500/10 text-amber-400' :
                                                            'bg-blue-500/10 text-blue-400'
                                                        }`}>{fix.priority}</span>
                                                    <div className="flex-1">
                                                        <div className="text-sm text-white">{fix.issue}</div>
                                                        <div className="text-xs text-white/40">
                                                            {fix.endpoint && <span className="font-mono">{fix.endpoint} • </span>}
                                                            Effort: {fix.effort}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
