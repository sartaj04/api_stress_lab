'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { projects, Project, Spec } from '@/lib/api';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const router = useRouter();
    const projectId = parseInt(params.id);

    const [project, setProject] = useState<Project | null>(null);
    const [specs, setSpecs] = useState<Spec[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [baseUrl, setBaseUrl] = useState('');
    const [authType, setAuthType] = useState<'bearer' | 'api_key'>('bearer');
    const [authValue, setAuthValue] = useState('');
    const [headerName, setHeaderName] = useState('X-API-Key');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [runningSpec, setRunningSpec] = useState<number | null>(null);
    const [deletingSpec, setDeletingSpec] = useState<number | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [projectData, specsData] = await Promise.all([
                projects.get(projectId),
                projects.listSpecs(projectId)
            ]);
            setProject(projectData);
            setSpecs(specsData);
            setBaseUrl(projectData.base_url || '');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, loadData]);

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await projects.update(projectId, { base_url: baseUrl });
            if (authValue) {
                await projects.setAuth(projectId, authType, authValue, authType === 'api_key' ? headerName : undefined);
            }
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUploadSpec = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');

        try {
            await projects.uploadSpec(projectId, file);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteSpec = async (specId: number, filename: string) => {
        if (!confirm(`Delete ${filename}? This action cannot be undone.`)) {
            return;
        }

        setDeletingSpec(specId);
        setError('');

        try {
            await projects.deleteSpec(projectId, specId);
            await loadData(); // Reload the specs list
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeletingSpec(null);
        }
    };

    const handleRunFullSuite = async (specId: number) => {
        setRunningSpec(specId);
        setError('');

        try {
            // First generate a scenario from the spec
            const scenario = await projects.generateScenario(projectId, specId);

            // Then run the full suite
            const { runs } = await import('@/lib/api');
            const result = await runs.runSuite(projectId, scenario.id);

            // Redirect to project dashboard with the suite ID
            router.push(`/projects/${projectId}/dashboard?suite=${result.suite_id}`);
        } catch (err: any) {
            setError(err.message);
            setRunningSpec(null);
        }
    };

    if (loading) {
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

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Header */}
            <header className="nav sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-white/40 hover:text-white transition text-sm">
                                ← Projects
                            </Link>
                            <span className="text-white/20">|</span>
                            <h1 className="text-lg font-medium text-white">{project.name}</h1>
                            <span className="text-xs text-white/40 bg-white/[0.03] px-2 py-1 rounded">Configuration</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href={`/projects/${projectId}/dashboard`} className="text-white/60 hover:text-white text-sm transition">
                                Results Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                {/* Quick Navigation */}
                <div className="flex justify-end">
                    <Link
                        href={`/projects/${projectId}/dashboard`}
                        className="text-white/60 hover:text-white text-sm transition"
                    >
                        View Results Dashboard →
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Configuration */}
                <section className="card p-5">
                    <div className="flex items-start justify-between mb-5">
                        <h2 className="text-base font-medium text-white">API Configuration</h2>
                        <div className="card p-2 px-3 bg-amber-500/5 border-amber-500/20">
                            <p className="text-amber-400 text-xs">Remember to save after changes!</p>
                        </div>
                    </div>
                    <form onSubmit={handleSaveConfig} className="space-y-4">
                        <div>
                            <label htmlFor="baseUrl" className="block text-white/50 text-sm mb-2">Base URL</label>
                            <input
                                id="baseUrl"
                                type="url"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20 text-sm"
                                placeholder="https://api.example.com"
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label className="block text-white/50 text-sm mb-2">Authentication Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input
                                        type="radio"
                                        name="authType"
                                        value="bearer"
                                        checked={authType === 'bearer'}
                                        onChange={() => setAuthType('bearer')}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-white/70">Bearer Token</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input
                                        type="radio"
                                        name="authType"
                                        value="api_key"
                                        checked={authType === 'api_key'}
                                        onChange={() => setAuthType('api_key')}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-white/70">API Key Header</span>
                                </label>
                            </div>
                        </div>

                        {authType === 'api_key' && (
                            <div>
                                <label htmlFor="headerName" className="block text-white/50 text-sm mb-2">Header Name</label>
                                <input
                                    id="headerName"
                                    type="text"
                                    value={headerName}
                                    onChange={(e) => setHeaderName(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20 text-sm"
                                    placeholder="X-API-Key"
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="authValue" className="block text-white/50 text-sm mb-2">
                                {authType === 'bearer' ? 'Token' : 'API Key Value'}
                            </label>
                            <input
                                id="authValue"
                                type="password"
                                value={authValue}
                                onChange={(e) => setAuthValue(e.target.value)}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20 text-sm"
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                            <p className="text-white/30 text-xs mt-1">Credentials are encrypted at rest</p>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </form>
                </section>

                {/* OpenAPI Specs - Simplified */}
                <section className="card p-5">
                    <h2 className="text-base font-medium text-white mb-5">OpenAPI Specs</h2>

                    <div className="mb-5">
                        <label className="block">
                            <span className="btn-secondary inline-block cursor-pointer text-sm">
                                {uploading ? 'Uploading...' : 'Upload Spec'}
                            </span>
                            <input
                                type="file"
                                accept=".json,.yaml,.yml"
                                onChange={handleUploadSpec}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                        <p className="text-white/30 text-xs mt-2">Supports OpenAPI 3.x JSON or YAML</p>
                    </div>

                    {specs.length === 0 ? (
                        <p className="text-white/40 text-sm">No specs uploaded yet</p>
                    ) : (
                        <>
                            <div className="space-y-3 mb-5">
                                {specs.map((spec) => (
                                    <div key={spec.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                        <div className="flex-1">
                                            <div className="text-white text-sm font-medium">{spec.filename}</div>
                                            <div className="text-white/30 text-xs mt-1">
                                                Uploaded {new Date(spec.uploaded_at).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleRunFullSuite(spec.id)}
                                                disabled={runningSpec === spec.id}
                                                className="btn-primary px-6 py-2.5 disabled:opacity-50"
                                            >
                                                {runningSpec === spec.id ? 'Starting...' : 'Run Full Suite'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSpec(spec.id, spec.filename)}
                                                disabled={deletingSpec === spec.id}
                                                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition disabled:opacity-50"
                                                title="Delete spec"
                                            >
                                                {deletingSpec === spec.id ? (
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Info about what Run Full Suite does */}
                            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg mb-4">
                                <p className="text-white/40 text-sm mb-3">
                                    <span className="text-white/60 font-medium">Run Full Suite</span> automatically tests your API with 4 load profiles: Smoke (baseline), Ramp (gradual load), Spike (traffic burst), and Chaos (error injection). Results include AI-powered analysis.
                                </p>
                                <Link
                                    href={`/projects/${projectId}/run`}
                                    className="text-white/50 hover:text-white text-sm transition"
                                >
                                    Advanced: Configure manual test with custom settings
                                </Link>
                            </div>

                            {/* Important warnings */}
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <div className="flex gap-3">
                                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-amber-400 font-medium text-sm mb-2">Important: Use Non-Production Endpoints</p>
                                        <p className="text-amber-400/80 text-sm">
                                            Running the full suite will simulate different scenarios with varying numbers of concurrent users and request patterns. Your API will experience significant load. Always test against staging or development environments, never production.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}
