'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface DemoMetrics {
    requestsSent: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
    currentRps: number;
}

interface DemoResults {
    totalRequests: number;
    successRate: number;
    avgLatency: number;
    p50: number;
    p95: number;
    p99: number;
    maxRps: number;
    errorRate: number;
    timeseries: { time: number; rps: number; latency: number; errors: number }[];
}

type DemoState = 'idle' | 'running' | 'completed';

const DEMO_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts/1';

export default function DemoTest() {
    const [endpoint, setEndpoint] = useState(DEMO_ENDPOINT);
    const [rps, setRps] = useState(10);
    const [duration, setDuration] = useState(10);
    const [state, setState] = useState<DemoState>('idle');
    const [metrics, setMetrics] = useState<DemoMetrics>({
        requestsSent: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        currentRps: 0,
    });
    const [results, setResults] = useState<DemoResults | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [error, setError] = useState<string | null>(null);
    
    const abortRef = useRef(false);
    const startTimeRef = useRef<number>(0);
    const responseTimesRef = useRef<number[]>([]);
    const timeseriesRef = useRef<{ time: number; rps: number; latency: number; errors: number }[]>([]);

    const runDemoTest = async () => {
        setError(null);
        setState('running');
        setElapsed(0);
        setMetrics({
            requestsSent: 0,
            successful: 0,
            failed: 0,
            avgResponseTime: 0,
            currentRps: 0,
        });
        setResults(null);
        abortRef.current = false;
        responseTimesRef.current = [];
        timeseriesRef.current = [];
        startTimeRef.current = Date.now();

        const targetEndpoint = endpoint || DEMO_ENDPOINT;
        const interval = 1000 / rps;
        let requestsSent = 0;
        let successful = 0;
        let failed = 0;
        let lastSecondRequests = 0;
        let lastSecondTime = Date.now();
        let currentSecond = 0;

        const makeRequest = async () => {
            const start = performance.now();
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(targetEndpoint, {
                    method: 'GET',
                    signal: controller.signal,
                    mode: 'cors',
                });
                clearTimeout(timeout);
                
                const responseTime = performance.now() - start;
                responseTimesRef.current.push(responseTime);
                
                if (response.ok) {
                    successful++;
                } else {
                    failed++;
                }
            } catch {
                failed++;
                responseTimesRef.current.push(5000); // Timeout
            }
            requestsSent++;
            lastSecondRequests++;
        };

        const updateMetrics = () => {
            const now = Date.now();
            const elapsedMs = now - startTimeRef.current;
            const elapsedSec = Math.floor(elapsedMs / 1000);
            setElapsed(elapsedSec);

            // Calculate RPS for the last second
            if (now - lastSecondTime >= 1000) {
                const currentRps = lastSecondRequests;
                const times = responseTimesRef.current;
                const avgTime = times.length > 0 
                    ? times.reduce((a, b) => a + b, 0) / times.length 
                    : 0;
                
                // Add to timeseries
                if (currentSecond < duration) {
                    timeseriesRef.current.push({
                        time: currentSecond,
                        rps: currentRps,
                        latency: avgTime,
                        errors: failed,
                    });
                }
                
                setMetrics({
                    requestsSent,
                    successful,
                    failed,
                    avgResponseTime: avgTime,
                    currentRps,
                });
                
                lastSecondRequests = 0;
                lastSecondTime = now;
                currentSecond++;
            }
        };

        // Run the test
        const endTime = Date.now() + duration * 1000;
        
        while (Date.now() < endTime && !abortRef.current) {
            const batchStart = Date.now();
            
            // Send requests in parallel for this interval
            const promises = [];
            for (let i = 0; i < Math.min(rps, 50); i++) {
                promises.push(makeRequest());
            }
            await Promise.all(promises);
            
            updateMetrics();
            
            // Wait for the remainder of the second
            const elapsed = Date.now() - batchStart;
            if (elapsed < 1000) {
                await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
            }
        }

        if (abortRef.current) {
            setState('idle');
            return;
        }

        // Calculate final results
        const times = responseTimesRef.current;
        times.sort((a, b) => a - b);
        
        const p50 = times[Math.floor(times.length * 0.5)] || 0;
        const p95 = times[Math.floor(times.length * 0.95)] || 0;
        const p99 = times[Math.floor(times.length * 0.99)] || 0;
        const avgLatency = times.length > 0 
            ? times.reduce((a, b) => a + b, 0) / times.length 
            : 0;
        
        setResults({
            totalRequests: requestsSent,
            successRate: requestsSent > 0 ? (successful / requestsSent) * 100 : 0,
            avgLatency,
            p50,
            p95,
            p99,
            maxRps: Math.max(...timeseriesRef.current.map(t => t.rps), rps),
            errorRate: requestsSent > 0 ? (failed / requestsSent) * 100 : 0,
            timeseries: timeseriesRef.current,
        });
        
        setState('completed');
    };

    const stopTest = () => {
        abortRef.current = true;
    };

    const formatLatency = (ms: number) => {
        if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
        return `${ms.toFixed(0)}ms`;
    };

    return (
        <section id="demo" className="py-16 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full mb-4">
                        Try it now
                    </span>
                    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3" style={{ lineHeight: '1.2' }}>
                        See how your API behaves under realistic traffic
                    </h2>
                    <p className="text-white/50 max-w-lg mx-auto">
                        Experience realistic load scenarios instantly. No signup required.
                    </p>
                </div>

                {/* Demo Card */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
                    {/* Config Section */}
                    <div className="p-6 md:p-8 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            <span className="text-xs font-medium text-amber-400/80 uppercase tracking-wider">
                                Sandbox Mode
                            </span>
                        </div>

                        <div className="space-y-6">
                            {/* Endpoint Input */}
                            <div>
                                <label className="block text-sm text-white/60 mb-2">
                                    API Endpoint
                                </label>
                                <input
                                    type="url"
                                    value={endpoint}
                                    onChange={(e) => setEndpoint(e.target.value)}
                                    placeholder="https://api.example.com/endpoint"
                                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-white/[0.25] transition disabled:opacity-50"
                                    disabled={state === 'running'}
                                />
                                <p className="text-xs text-white/30 mt-2">
                                    Demo uses JSONPlaceholder by default. Enter any public GET endpoint.
                                </p>
                            </div>

                            {/* RPS Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm text-white/60">
                                        Requests per Second
                                    </label>
                                    <span className="text-sm font-mono text-white bg-white/[0.06] px-3 py-1 rounded">
                                        {rps} RPS
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    value={rps}
                                    onChange={(e) => setRps(parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
                                    disabled={state === 'running'}
                                />
                                <div className="flex justify-between text-xs text-white/30 mt-1">
                                    <span>5</span>
                                    <span className="text-amber-400/60">Demo limit: 50</span>
                                    <span>50</span>
                                </div>
                            </div>

                            {/* Duration Dropdown */}
                            <div>
                                <label className="block text-sm text-white/60 mb-2">
                                    Test Duration
                                </label>
                                <div className="flex gap-3">
                                    {[10, 15, 20].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDuration(d)}
                                            disabled={state === 'running'}
                                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                                                duration === d
                                                    ? 'bg-white text-black'
                                                    : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] border border-white/[0.08]'
                                            } disabled:opacity-50`}
                                        >
                                            {d}s
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-amber-400/60 mt-2">
                                    Demo limit: 20 seconds max
                                </p>
                            </div>
                        </div>

                        {/* Run Button */}
                        <div className="mt-8">
                            {state === 'idle' && (
                                <button
                                    onClick={runDemoTest}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
                                    </svg>
                                    Run Demo Test
                                </button>
                            )}
                            {state === 'running' && (
                                <button
                                    onClick={stopTest}
                                    className="w-full py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl transition border border-red-500/30"
                                >
                                    Stop Test
                                </button>
                            )}
                            {state === 'completed' && (
                                <button
                                    onClick={() => {
                                        setState('idle');
                                        setResults(null);
                                    }}
                                    className="w-full py-4 bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold rounded-xl transition border border-white/[0.08]"
                                >
                                    Run Another Test
                                </button>
                            )}
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
                        )}
                    </div>

                    {/* Real-time Metrics */}
                    {state === 'running' && (
                        <div className="p-6 md:p-8 bg-white/[0.01]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-sm text-white/60">Running...</span>
                                </div>
                                <span className="text-sm font-mono text-white/40">
                                    {elapsed}s / {duration}s
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-white/[0.06] rounded-full mb-6 overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                                    style={{ width: `${(elapsed / duration) * 100}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/[0.03] rounded-lg p-4">
                                    <div className="text-xs text-white/40 mb-1">Requests Sent</div>
                                    <div className="text-2xl font-bold text-white font-mono">
                                        {metrics.requestsSent.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-white/[0.03] rounded-lg p-4">
                                    <div className="text-xs text-white/40 mb-1">Success / Failed</div>
                                    <div className="text-2xl font-bold font-mono">
                                        <span className="text-emerald-400">{metrics.successful}</span>
                                        <span className="text-white/20"> / </span>
                                        <span className="text-red-400">{metrics.failed}</span>
                                    </div>
                                </div>
                                <div className="bg-white/[0.03] rounded-lg p-4">
                                    <div className="text-xs text-white/40 mb-1">Avg Response</div>
                                    <div className="text-2xl font-bold text-white font-mono">
                                        {formatLatency(metrics.avgResponseTime)}
                                    </div>
                                </div>
                                <div className="bg-white/[0.03] rounded-lg p-4">
                                    <div className="text-xs text-white/40 mb-1">Current RPS</div>
                                    <div className="text-2xl font-bold text-white font-mono">
                                        {metrics.currentRps}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {state === 'completed' && results && (
                        <div className="p-6 md:p-8 bg-white/[0.01]">
                            {/* Primary Capacity Insight - Demo Version */}
                            <div className="mb-6">
                                <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                                    <path d="M2 17l10 5 10-5" />
                                                    <path d="M2 12l10 5 10-5" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-white">Estimated Capacity</h3>
                                                <p className="text-xs text-white/40">Demo mode • Ranges shown</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-emerald-400">
                                                {results.successRate >= 99 ? `${Math.round(rps * 0.8)}-${Math.round(rps * 1.2)}` : 
                                                 results.successRate >= 95 ? `${Math.round(rps * 0.5)}-${Math.round(rps * 0.8)}` : 
                                                 `<${Math.round(rps * 0.5)}`} 
                                            </div>
                                            <div className="text-xs text-white/40">concurrent users (est.)</div>
                                        </div>
                                    </div>
                                    
                                    {/* Simple capacity summary */}
                                    <p className="text-sm text-white/70 mb-4">
                                        {results.successRate >= 99 
                                            ? `The endpoint handles approximately ${rps} RPS reliably with ${formatLatency(results.avgLatency)} average response time.`
                                            : results.successRate >= 95 
                                            ? `The endpoint shows some strain at ${rps} RPS. Performance may degrade under higher load.`
                                            : `The endpoint struggles at ${rps} RPS with ${(100 - results.successRate).toFixed(1)}% of requests failing.`
                                        }
                                    </p>

                                    {/* Threshold indicators (simplified) */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white/[0.05] rounded-lg p-3">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className={`w-2 h-2 rounded-full ${results.successRate >= 99 ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                                                <span className="text-xs text-white/50">Reliability</span>
                                            </div>
                                            <div className={`text-sm font-semibold ${
                                                results.successRate >= 99 ? 'text-emerald-400' : 
                                                results.successRate >= 95 ? 'text-amber-400' : 'text-red-400'
                                            }`}>
                                                {results.successRate >= 99 ? 'Stable' : results.successRate >= 95 ? 'Some Errors' : 'Unstable'}
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.05] rounded-lg p-3">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className={`w-2 h-2 rounded-full ${results.avgLatency < 200 ? 'bg-emerald-400' : results.avgLatency < 500 ? 'bg-amber-400' : 'bg-red-400'}`}></div>
                                                <span className="text-xs text-white/50">Latency</span>
                                            </div>
                                            <div className={`text-sm font-semibold ${
                                                results.avgLatency < 200 ? 'text-emerald-400' : 
                                                results.avgLatency < 500 ? 'text-amber-400' : 'text-red-400'
                                            }`}>
                                                {results.avgLatency < 200 ? 'Fast' : results.avgLatency < 500 ? 'Moderate' : 'Slow'}
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.05] rounded-lg p-3">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                <span className="text-xs text-white/50">Throughput</span>
                                            </div>
                                            <div className="text-sm font-semibold text-blue-400">
                                                {results.maxRps} RPS
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Basic Metrics - Visible */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    Test Complete
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white/[0.03] rounded-lg p-4">
                                        <div className="text-xs text-white/40 mb-1">Total Requests</div>
                                        <div className="text-2xl font-bold text-white font-mono">
                                            {results.totalRequests.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-lg p-4">
                                        <div className="text-xs text-white/40 mb-1">Success Rate</div>
                                        <div className={`text-2xl font-bold font-mono ${
                                            results.successRate >= 99 ? 'text-emerald-400' : 
                                            results.successRate >= 95 ? 'text-amber-400' : 'text-red-400'
                                        }`}>
                                            {results.successRate.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-lg p-4">
                                        <div className="text-xs text-white/40 mb-1">Avg Latency</div>
                                        <div className="text-2xl font-bold text-white font-mono">
                                            {formatLatency(results.avgLatency)}
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-lg p-4">
                                        <div className="text-xs text-white/40 mb-1">Max RPS</div>
                                        <div className="text-2xl font-bold text-white font-mono">
                                            {results.maxRps}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Metrics - Blurred */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111113]/60 to-[#111113] z-10 flex items-end justify-center pb-8">
                                    <div className="text-center max-w-md">
                                        <div className="inline-flex items-center gap-2 bg-white/[0.06] backdrop-blur-sm border border-white/[0.1] rounded-full px-4 py-2 mb-4">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                            <span className="text-sm text-white/60">Full insights locked</span>
                                        </div>
                                        <div>
                                            <Link 
                                                href="/signup"
                                                className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-black font-semibold px-6 py-3 rounded-xl transition"
                                            >
                                                Sign up to unlock full report
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/40">
                                            <div className="flex items-center gap-1.5 justify-center">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400/60">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                                Exact capacity limits
                                            </div>
                                            <div className="flex items-center gap-1.5 justify-center">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400/60">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                                Breaking point detection
                                            </div>
                                            <div className="flex items-center gap-1.5 justify-center">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400/60">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                                Bottleneck identification
                                            </div>
                                            <div className="flex items-center gap-1.5 justify-center">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400/60">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                                AI-powered traffic modeling
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Blurred Content */}
                                <div className="blur-sm select-none pointer-events-none opacity-60">
                                    {/* Capacity Thresholds Preview */}
                                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-6">
                                        <h4 className="text-sm font-medium text-white/60 mb-4">System Capacity & Breaking Point</h4>
                                        <div className="grid grid-cols-4 gap-3">
                                            <div className="bg-white/[0.03] rounded-lg p-3">
                                                <div className="text-xs text-white/40 mb-1">Stable</div>
                                                <div className="text-lg font-bold text-emerald-400">XXX users</div>
                                            </div>
                                            <div className="bg-white/[0.03] rounded-lg p-3">
                                                <div className="text-xs text-white/40 mb-1">Degraded</div>
                                                <div className="text-lg font-bold text-amber-400">XXX users</div>
                                            </div>
                                            <div className="bg-white/[0.03] rounded-lg p-3">
                                                <div className="text-xs text-white/40 mb-1">Unstable</div>
                                                <div className="text-lg font-bold text-orange-400">XXX users</div>
                                            </div>
                                            <div className="bg-white/[0.03] rounded-lg p-3">
                                                <div className="text-xs text-white/40 mb-1">Breaking</div>
                                                <div className="text-lg font-bold text-red-400">XXX users</div>
                                            </div>
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-medium text-white/60 mb-4">Detailed Performance Metrics</h4>
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-white/[0.03] rounded-lg p-4">
                                            <div className="text-xs text-white/40 mb-1">P50 Latency</div>
                                            <div className="text-xl font-bold text-white font-mono">
                                                {formatLatency(results.p50)}
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.03] rounded-lg p-4">
                                            <div className="text-xs text-white/40 mb-1">P95 Latency</div>
                                            <div className="text-xl font-bold text-white font-mono">
                                                {formatLatency(results.p95)}
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.03] rounded-lg p-4">
                                            <div className="text-xs text-white/40 mb-1">P99 Latency</div>
                                            <div className="text-xl font-bold text-white font-mono">
                                                {formatLatency(results.p99)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fake Chart Placeholder */}
                                    <div className="bg-white/[0.03] rounded-lg p-4 h-48">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-xs text-white/40">Concurrent Users vs Latency</span>
                                        </div>
                                        <div className="h-32 flex items-end gap-1">
                                            {Array.from({ length: 20 }).map((_, i) => (
                                                <div 
                                                    key={i}
                                                    className="flex-1 bg-emerald-500/30 rounded-t"
                                                    style={{ height: `${30 + Math.random() * 60}%` }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* AI Insights Placeholder */}
                                    <div className="mt-6 bg-white/[0.03] rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">AI</span>
                                            <span className="text-sm text-white/60">Capacity Analysis</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-white/[0.06] rounded w-full"></div>
                                            <div className="h-4 bg-white/[0.06] rounded w-4/5"></div>
                                            <div className="h-4 bg-white/[0.06] rounded w-3/5"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom CTA */}
                {state === 'idle' && (
                    <div className="mt-8 text-center space-y-3">
                        <p className="text-white/50 text-sm">
                            The demo uses simplified scenarios. Full tests use AI-generated traffic patterns that mimic real user behavior and production usage.
                        </p>
                        <p className="text-white/40 text-xs">
                            Full reports include breaking point detection, traffic headroom, bottleneck analysis, and fix recommendations.
                        </p>
                        <p className="text-white/40 text-sm pt-2">
                            Want to test your own APIs?{' '}
                            <Link href="/signup" className="text-white hover:underline">
                                Create a free account →
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

