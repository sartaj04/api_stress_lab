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

    const handleRunFullSuite = async (specId: number) => {
        setRunningSpec(specId);
        setError('');

        try {
            // First generate a scenario from the spec
            const scenario = await projects.generateScenario(projectId, specId);

            // Then run the full suite
            const { runs } = await import('@/lib/api');
            const result = await runs.runSuite(projectId, scenario.id);

            // Redirect to suite results page
            router.push(`/suites/${result.suite_id}`);
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
                        <Link href={`/projects/${projectId}/dashboard`} className="btn-secondary text-sm">
                            View Results
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Configuration */}
                <section className="card p-5">
                    <h2 className="text-base font-medium text-white mb-5">API Configuration</h2>
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
                        <div className="space-y-3">
                            {specs.map((spec) => (
                                <div key={spec.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                    <div>
                                        <div className="text-white text-sm font-medium">{spec.filename}</div>
                                        <div className="text-white/30 text-xs mt-1">
                                            Uploaded {new Date(spec.uploaded_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRunFullSuite(spec.id)}
                                        disabled={runningSpec === spec.id}
                                        className="btn-primary text-sm disabled:opacity-50"
                                    >
                                        {runningSpec === spec.id ? 'Starting...' : 'Run Full Suite'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Info about what Run Full Suite does */}
                <section className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                    <p className="text-white/40 text-sm mb-3">
                        <span className="text-white/60 font-medium">Run Full Suite</span> automatically tests your API with 4 load profiles: Smoke (baseline), Ramp (gradual load), Spike (traffic burst), and Chaos (error injection). Results include AI-powered analysis.
                    </p>
                    <Link
                        href={`/projects/${projectId}/run`}
                        className="text-white/50 hover:text-white text-sm transition"
                    >
                        Advanced: Configure manual test with custom settings
                    </Link>
                </section>
            </div>
        </main>
    );
}
