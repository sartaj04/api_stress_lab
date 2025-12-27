'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { projects, billing, Project, CreditBalance } from '@/lib/api';

export default function DashboardPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [projectsList, setProjectsList] = useState<Project[]>([]);
    const [balance, setBalance] = useState<CreditBalance | null>(null);
    const [loading, setLoading] = useState(true);

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
                const [projectsData, balanceData] = await Promise.all([
                    projects.list(),
                    billing.getBalance().catch(() => null)
                ]);
                // Sort by created_at descending (newest first)
                const sorted = projectsData.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setProjectsList(sorted);
                setBalance(balanceData);
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

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
                <div className="text-white/40">Loading...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Header */}
            <header className="nav sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/dashboard" className="text-lg font-semibold text-white">
                        API Stress Lab
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
            <div className="max-w-6xl mx-auto px-6 py-8">
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

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-semibold text-white">Projects</h1>
                    <Link href="/projects/new" className="btn-primary text-sm">
                        New Project
                    </Link>
                </div>

                {/* Projects */}
                {loading ? (
                    <div className="text-white/40">Loading projects...</div>
                ) : projectsList.length === 0 ? (
                    <div className="card p-12 text-center">
                        <p className="text-white/40 mb-4">No projects yet</p>
                        <Link href="/projects/new" className="btn-primary text-sm">
                            Create your first project
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {projectsList.map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="card p-5 flex justify-between items-center block hover:border-white/15 transition"
                            >
                                <div>
                                    <h3 className="text-white font-medium">{project.name}</h3>
                                    <p className="text-white/30 text-sm mt-1">
                                        Created {new Date(project.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="text-white/30 text-sm">View →</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
