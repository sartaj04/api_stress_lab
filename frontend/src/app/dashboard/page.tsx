'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';
import { projects, billing, auth, ProjectWithStats, CreditBalance, UsageStats } from '@/lib/api';

type ViewMode = 'grid' | 'list';

export default function DashboardPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [projectsList, setProjectsList] = useState<ProjectWithStats[]>([]);
    const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
    const [balance, setBalance] = useState<CreditBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [waitlistJoined, setWaitlistJoined] = useState(false);
    const [joiningWaitlist, setJoiningWaitlist] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const purchaseSuccess = searchParams.get('purchase') === 'success';
    const creditsAdded = searchParams.get('credits');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsData, usageData, balanceData, waitlistStatus] = await Promise.all([
                    projects.listWithStats(),
                    projects.getUsageStats().catch(() => null),
                    billing.getBalance().catch(() => null),
                    auth.getWaitlistStatus().catch(() => ({ joined: false, joined_at: null }))
                ]);
                // Sort by created_at descending (newest first)
                const sorted = projectsData.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setProjectsList(sorted);
                setUsageStats(usageData);
                setBalance(balanceData);
                setWaitlistJoined(waitlistStatus.joined);
            } catch (err) {
                console.error('Failed to fetch data', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const handleClaimFreeCredits = async () => {
        try {
            const result = await billing.claimFreeCredits();
            setBalance({ balance: result.balance, free_credits_claimed: true });
        } catch (err) {
            console.error('Failed to claim credits', err);
        }
    };

    const handleJoinWaitlist = async () => {
        if (waitlistJoined || joiningWaitlist) return;
        
        setJoiningWaitlist(true);
        try {
            const result = await auth.joinWaitlist();
            setWaitlistJoined(true);
            setToast({ message: result.message, type: 'success' });
            setTimeout(() => setToast(null), 3000);
        } catch (err: any) {
            console.error('Failed to join waitlist', err);
            setToast({ message: err.message || 'Failed to join waitlist. Please try again.', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setJoiningWaitlist(false);
        }
    };

    const filteredProjects = useMemo(() => {
        if (!searchQuery) return projectsList;
        const query = searchQuery.toLowerCase();
        return projectsList.filter(project =>
            project.name.toLowerCase().includes(query) ||
            project.description?.toLowerCase().includes(query) ||
            project.base_url?.toLowerCase().includes(query)
        );
    }, [projectsList, searchQuery]);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatDuration = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        return `${Math.floor(seconds / 3600)}h`;
    };

    const formatTimeAgo = (dateString: string | null): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
                <div className="text-white/40">Loading...</div>
            </div>
        );
    }

    // Show full loading screen until all data is loaded
    if (loading) {
        return (
            <main className="min-h-screen" style={{ background: '#111113' }}>
                {/* Header */}
                <header className="nav sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <Link href="/dashboard">
                            <Logo size="md" />
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/pricing" className="text-white/60 hover:text-white text-sm transition">
                                Buy Credits
                            </Link>
                            <span className="text-white/40 text-sm">{user.email}</span>
                            <button onClick={logout} className="text-white/40 hover:text-white text-sm transition">
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Loading Content */}
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/40 mb-4"></div>
                        <div className="text-white/40">Loading dashboard...</div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Header */}
            <header className="nav sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/dashboard">
                        <Logo size="md" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/pricing" className="text-white/60 hover:text-white text-sm transition">
                            {balance ? `${balance.balance} credits` : 'Buy Credits'}
                        </Link>
                        <span className="text-white/40 text-sm">{user.email}</span>
                        <button onClick={logout} className="text-white/40 hover:text-white text-sm transition">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Toast Notification */}
                {toast && (
                    <div className={`fixed top-20 right-6 z-50 max-w-md ${
                        toast.type === 'success' 
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    } rounded-lg p-4 shadow-lg flex items-center gap-3 transition-all`}>
                        {toast.type === 'success' ? (
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <p className="text-sm font-medium">{toast.message}</p>
                        <button
                            onClick={() => setToast(null)}
                            className="ml-auto text-current/60 hover:text-current"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Purchase Success Notice */}
                {purchaseSuccess && creditsAdded && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-emerald-400 text-sm mb-6">
                        {creditsAdded} credits added to your account!
                    </div>
                )}

                {/* Free Credits Banner */}
                {balance && !balance.free_credits_claimed && (
                    <div className="card p-4 mb-6 flex items-center justify-between border-emerald-500/30 bg-emerald-500/5">
                        <div>
                            <span className="text-white font-medium">Welcome!</span>
                            <span className="text-white/50 text-sm ml-2">Claim 50 free credits to get started</span>
                        </div>
                        <button
                            onClick={handleClaimFreeCredits}
                            className="btn-primary text-xs"
                        >
                            Claim Free Credits
                        </button>
                    </div>
                )}

                {/* Low Credits Warning */}
                {balance && balance.balance > 0 && balance.balance < 20 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-amber-400 text-sm mb-6 flex items-center justify-between">
                        <span>You have {balance.balance} credits remaining</span>
                        <Link href="/pricing" className="text-amber-300 hover:text-amber-200 underline">
                            Buy more credits
                        </Link>
                    </div>
                )}

                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
                    <div className="flex-1"></div>
                    <div className="flex items-center gap-3 justify-center flex-1 min-w-0">
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 flex-shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded transition ${
                                    viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded transition ${
                                    viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="relative flex-1 min-w-0 max-w-md">
                            <input
                                type="text"
                                placeholder="Search Projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field pl-4 pr-8 w-full"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 p-1 z-10"
                                    type="button"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 flex justify-end">
                        <Link href="/projects/new" className="btn-primary text-sm whitespace-nowrap flex-shrink-0">
                            Add New...
                    </Link>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Usage & Alerts */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Usage Section */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Usage</h2>
                                <span className="text-white/40 text-sm">Last 30 days</span>
                            </div>
                            {usageStats ? (
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white/60 text-sm">Test Runs</span>
                                            <span className="text-white text-sm font-medium">
                                                {formatNumber(usageStats.completed_runs)}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white/60 text-sm">Total Requests</span>
                                            <span className="text-white text-sm font-medium">
                                                {formatNumber(usageStats.total_requests)}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white/60 text-sm">Test Duration</span>
                                            <span className="text-white text-sm font-medium">
                                                {formatDuration(usageStats.total_duration_seconds)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-white/40 text-sm">No usage data</div>
                            )}
                        </div>

                        {/* Alerts Section */}
                        <div className="card p-6 bg-white/5">
                            <h2 className="text-lg font-semibold text-white mb-2">Observability</h2>
                            <p className="text-white/40 text-sm mb-3">
                                Advanced monitoring and alerting
                            </p>
                            <div className="space-y-2 mb-4">
                                <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-white/30 text-xs">
                                        Anomaly detection - automatically detect unusual patterns in API performance
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-white/30 text-xs">
                                        Real-time alerts - get notified when latency spikes or error rates increase
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-white/30 text-xs">
                                        Performance trends - track API health over time with intelligent insights
                                    </p>
                                </div>
                            </div>
                            {waitlistJoined ? (
                                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Joined waitlist - We&apos;ll let you know when available</span>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleJoinWaitlist}
                                    disabled={joiningWaitlist}
                                    className="btn-secondary text-xs w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {joiningWaitlist ? 'Joining...' : 'Join Waitlist'}
                                </button>
                            )}
                        </div>

                        {/* OpenAPI Spec Generation */}
                        <div className="card p-6 bg-white/5">
                            <h2 className="text-lg font-semibold text-white mb-2">Don&apos;t have an OpenAPI spec?</h2>
                            <p className="text-white/40 text-sm mb-4">
                                Generate one using simple steps for your framework.
                            </p>
                            <Link 
                                href="/docs/openapi-generation"
                                className="btn-secondary text-xs w-full inline-flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Learn How to Generate
                            </Link>
                        </div>

                        {/* Support & Links Section */}
                        <div className="card p-6 bg-white/5">
                            <h2 className="text-lg font-semibold text-white mb-4">Support & Resources</h2>
                            <div className="space-y-3">
                                <Link
                                    href="/docs/getting-started"
                                    className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition group"
                                >
                                    <svg className="w-4 h-4 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>Getting Started Guide</span>
                                </Link>
                                <Link
                                    href="/docs"
                                    className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition group"
                                >
                                    <svg className="w-4 h-4 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <span>Documentation</span>
                                </Link>
                                <a 
                                    href="mailto:contact@apistresslab.com?subject=Support Request"
                                    className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition group"
                                >
                                    <svg className="w-4 h-4 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <span>Contact Support</span>
                                </a>
                                <a 
                                    href={`mailto:contact@apistresslab.com?subject=Feedback&body=Hi API Stress Lab team,%0D%0A%0D%0A`}
                                    className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition group"
                                >
                                    <svg className="w-4 h-4 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                    <span>Send Feedback</span>
                                </a>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Projects */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-semibold text-white">Projects</h1>
                        </div>

                        {filteredProjects.length === 0 ? (
                            <div className="card p-12 text-center">
                                <p className="text-white/40 mb-4">
                                    {searchQuery ? 'No projects found matching your search' : 'No projects yet'}
                                </p>
                                {searchQuery ? (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="btn-primary text-sm"
                                    >
                                        Clear search
                                    </button>
                                ) : (
                                    <Link href="/projects/new" className="btn-primary text-sm inline-block">
                                        Create your first project
                                    </Link>
                                )}
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredProjects.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}/dashboard`}
                                        className="card p-5 hover:border-white/15 transition group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-white font-medium mb-1 group-hover:text-white/90">
                                                    {project.name}
                                                </h3>
                                                {project.base_url && (
                                                    <p className="text-white/40 text-xs mb-1 truncate">
                                                        {project.base_url}
                                                    </p>
                                                )}
                                                {project.latest_suite && (
                                                    <p className="text-white/30 text-xs truncate">
                                                        {project.latest_suite.commit_message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="ml-2">
                                                <svg className="w-5 h-5 text-white/20 group-hover:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                            <span className="text-white/30 text-xs">
                                                {project.latest_run_at ? formatTimeAgo(project.latest_run_at) : 'Never'}
                                            </span>
                                            <span className="text-white/40 text-xs">
                                                {project.total_runs} {project.total_runs === 1 ? 'run' : 'runs'}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                                {filteredProjects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}/dashboard`}
                                        className="card p-5 flex justify-between items-center hover:border-white/15 transition group"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-white font-medium group-hover:text-white/90">
                                                    {project.name}
                                                </h3>
                                                {project.latest_suite && (
                                                    <span className={`badge ${
                                                        project.latest_suite.status === 'completed' ? 'badge-success' :
                                                        project.latest_suite.status === 'running' ? 'badge-warning' :
                                                        'badge-error'
                                                    }`}>
                                                        {project.latest_suite.status}
                                                    </span>
                                                )}
                                            </div>
                                            {project.base_url && (
                                                <p className="text-white/40 text-sm mb-1">
                                                    {project.base_url}
                                                </p>
                                            )}
                                            {project.latest_suite && (
                                                <p className="text-white/30 text-xs">
                                                    {project.latest_suite.commit_message}
                                                </p>
                                            )}
                                            <p className="text-white/30 text-xs mt-2">
                                                {project.latest_run_at ? formatTimeAgo(project.latest_run_at) : 'Never'} on main
                                    </p>
                                </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-white/40 text-xs mb-1">
                                                    {project.total_runs} {project.total_runs === 1 ? 'run' : 'runs'}
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-white/20 group-hover:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                            </svg>
                                        </div>
                            </Link>
                        ))}
                    </div>
                )}
                    </div>
                </div>
            </div>
        </main>
    );
}
