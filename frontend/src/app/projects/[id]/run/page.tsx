'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { projects, runs, Project, Scenario, EndpointConfig } from '@/lib/api';

export default function RunConfigPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = parseInt(params.id);
    const preselectedScenarioId = searchParams.get('scenario');

    const [project, setProject] = useState<Project | null>(null);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [starting, setStarting] = useState(false);

    const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
    const [loadProfile, setLoadProfile] = useState('smoke');
    const [duration, setDuration] = useState(60);
    const [vus, setVus] = useState(10);
    const [rpsLimit, setRpsLimit] = useState<number | undefined>();

    // Chaos toggles
    const [chaosLatencyMs, setChaosLatencyMs] = useState(0);
    const [chaosLatencyPercent, setChaosLatencyPercent] = useState(0);
    const [chaosAbortPercent, setChaosAbortPercent] = useState(0);
    const [chaosBurstEnabled, setChaosBurstEnabled] = useState(false);
    const [chaosBurstRps, setChaosBurstRps] = useState(100);
    const [chaosBurstSeconds, setChaosBurstSeconds] = useState(5);

    const [endpoints, setEndpoints] = useState<EndpointConfig[]>([]);

    const loadData = useCallback(async () => {
        try {
            const [projectData, scenariosData] = await Promise.all([
                projects.get(projectId),
                projects.listScenarios(projectId)
            ]);
            setProject(projectData);
            setScenarios(scenariosData);

            if (preselectedScenarioId) {
                const scenarioId = parseInt(preselectedScenarioId);
                setSelectedScenarioId(scenarioId);
                const scenario = scenariosData.find(s => s.id === scenarioId);
                if (scenario) {
                    setEndpoints(scenario.config.endpoints || []);
                    setLoadProfile(scenario.config.load_profile || 'smoke');
                    setDuration(scenario.config.duration || 60);
                    setVus(scenario.config.vus || 10);
                }
            } else if (scenariosData.length > 0) {
                setSelectedScenarioId(scenariosData[0].id);
                setEndpoints(scenariosData[0].config.endpoints || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId, preselectedScenarioId]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, loadData]);

    useEffect(() => {
        if (selectedScenarioId) {
            const scenario = scenarios.find(s => s.id === selectedScenarioId);
            if (scenario) {
                setEndpoints(scenario.config.endpoints || []);
            }
        }
    }, [selectedScenarioId, scenarios]);

    const updateEndpointWeight = (index: number, weight: number) => {
        const updated = [...endpoints];
        updated[index] = { ...updated[index], weight };
        setEndpoints(updated);
    };

    const handleStartRun = async () => {
        if (!selectedScenarioId) return;

        setStarting(true);
        setError('');

        try {
            const run = await runs.create(projectId, {
                scenario_id: selectedScenarioId,
                load_profile: loadProfile,
                duration,
                vus,
                rps_limit: rpsLimit,
                chaos_latency_ms: chaosLatencyMs,
                chaos_latency_percent: chaosLatencyPercent,
                chaos_abort_percent: chaosAbortPercent,
                chaos_burst_enabled: chaosBurstEnabled,
                chaos_burst_rps: chaosBurstRps,
                chaos_burst_seconds: chaosBurstSeconds
            });
            router.push(`/runs/${run.id}`);
        } catch (err: any) {
            setError(err.message);
            setStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Header */}
            <header className="nav sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={`/projects/${projectId}`} className="text-white/40 hover:text-white transition text-sm">
                                Back
                            </Link>
                            <h1 className="text-lg font-medium text-white">Configure Test Run</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {!project?.base_url && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-amber-400 text-sm">
                        Warning: Base URL not configured. Please configure it in project settings first.
                    </div>
                )}

                {scenarios.length === 0 && (
                    <div className="card p-6 text-center">
                        <p className="text-white/50 mb-4">No scenarios available. Please upload an OpenAPI spec and run the Full Suite first to generate scenarios.</p>
                        <Link href={`/projects/${projectId}`} className="btn-primary">
                            Go to Project
                        </Link>
                    </div>
                )}

                {scenarios.length > 0 && (
                    <>
                        {/* Scenario Selection */}
                        <section className="card p-5">
                            <h2 className="text-base font-medium text-white mb-4">Select Scenario</h2>
                            <select
                                value={selectedScenarioId || ''}
                                onChange={(e) => setSelectedScenarioId(parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-white/20 text-sm"
                            >
                                {scenarios.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </section>

                        {/* Endpoints */}
                        <section className="card p-5">
                            <h2 className="text-base font-medium text-white mb-2">Endpoint Weights</h2>
                            <p className="text-white/40 text-xs mb-4">
                                Adjust weights to control how often each endpoint is called
                            </p>

                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {endpoints.map((ep, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                        <span className={`px-2 py-0.5 text-xs font-mono rounded ${ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' :
                                            ep.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                                                ep.method === 'PUT' ? 'bg-amber-500/10 text-amber-400' :
                                                    ep.method === 'DELETE' ? 'bg-red-500/10 text-red-400' :
                                                        'bg-white/10 text-white/60'
                                            }`}>
                                            {ep.method}
                                        </span>
                                        <span className="flex-1 font-mono text-sm text-white/70 truncate">{ep.path}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={ep.weight}
                                            onChange={(e) => updateEndpointWeight(i, parseFloat(e.target.value))}
                                            className="w-16 bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-1 text-center text-white text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Load Profile */}
                        <section className="card p-5">
                            <h2 className="text-base font-medium text-white mb-4">Load Profile</h2>

                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {[
                                    { id: 'smoke', name: 'Smoke', desc: 'Constant low load' },
                                    { id: 'ramp', name: 'Ramp', desc: 'Gradual increase' },
                                    { id: 'spike', name: 'Spike', desc: 'Sudden bursts' }
                                ].map((profile) => (
                                    <button
                                        key={profile.id}
                                        onClick={() => setLoadProfile(profile.id)}
                                        className={`p-3 rounded-lg border text-left transition-all ${loadProfile === profile.id
                                            ? 'border-white/30 bg-white/[0.05]'
                                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                                            }`}
                                    >
                                        <div className="text-sm font-medium text-white">{profile.name}</div>
                                        <div className="text-xs text-white/40">{profile.desc}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-white/50 text-xs mb-2">Duration (seconds)</label>
                                    <input
                                        type="number"
                                        min="10"
                                        max="600"
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/50 text-xs mb-2">Virtual Users</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="200"
                                        value={vus}
                                        onChange={(e) => setVus(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/50 text-xs mb-2">RPS Limit (optional)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={rpsLimit || ''}
                                        onChange={(e) => setRpsLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm placeholder-white/30"
                                        placeholder="No limit"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Chaos Toggles */}
                        <section className="card p-5">
                            <h2 className="text-base font-medium text-white mb-2">Chaos Toggles</h2>
                            <p className="text-white/40 text-xs mb-5">
                                Inject failures and delays to test resilience
                            </p>

                            <div className="space-y-4">
                                {/* Latency Injection */}
                                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                    <div className="text-sm font-medium text-white mb-3">Latency Injection</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-white/50 text-xs mb-2">Added Latency (ms)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="5000"
                                                value={chaosLatencyMs}
                                                onChange={(e) => setChaosLatencyMs(parseInt(e.target.value))}
                                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-white/50 text-xs mb-2">Apply to % of requests</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={chaosLatencyPercent}
                                                onChange={(e) => setChaosLatencyPercent(parseFloat(e.target.value))}
                                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Abort Injection */}
                                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                    <div className="text-sm font-medium text-white mb-3">Random Abort</div>
                                    <div>
                                        <label className="block text-white/50 text-xs mb-2">Abort % of requests</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            value={chaosAbortPercent}
                                            onChange={(e) => setChaosAbortPercent(parseFloat(e.target.value))}
                                            className="w-1/2 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Burst Mode */}
                                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-sm font-medium text-white">Burst Mode</div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={chaosBurstEnabled}
                                                onChange={(e) => setChaosBurstEnabled(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white/30"></div>
                                        </label>
                                    </div>
                                    {chaosBurstEnabled && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-white/50 text-xs mb-2">Burst RPS</label>
                                                <input
                                                    type="number"
                                                    min="10"
                                                    max="1000"
                                                    value={chaosBurstRps}
                                                    onChange={(e) => setChaosBurstRps(parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-white/50 text-xs mb-2">Burst Duration (seconds)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={chaosBurstSeconds}
                                                    onChange={(e) => setChaosBurstSeconds(parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Start Button */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleStartRun}
                                disabled={starting || !selectedScenarioId || !project?.base_url}
                                className="btn-primary flex-1 py-3 disabled:opacity-50"
                            >
                                {starting ? 'Starting...' : 'Start Load Test'}
                            </button>
                            <Link href={`/projects/${projectId}`} className="btn-secondary">
                                Cancel
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
