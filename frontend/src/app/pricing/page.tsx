'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { billing, CreditPackage, CreditBalance } from '@/lib/api';

export default function PricingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [packages, setPackages] = useState<CreditPackage[]>([]);
    const [balance, setBalance] = useState<CreditBalance | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        billing.getPackages()
            .then((res) => setPackages(res.packages))
            .catch(console.error);

        if (user) {
            billing.getBalance()
                .then(setBalance)
                .catch(console.error);
        }
    }, [user]);

    const handleBuyCredits = async (packageId: string) => {
        if (!user) {
            router.push('/signup');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { checkout_url } = await billing.buyCredits(packageId);
            window.location.href = checkout_url;
        } catch (err: any) {
            setError(err.message || 'Failed to start checkout');
            setLoading(false);
        }
    };

    const handleClaimFreeCredits = async () => {
        if (!user) {
            router.push('/signup');
            return;
        }

        setLoading(true);
        try {
            const result = await billing.claimFreeCredits();
            setBalance({ balance: result.balance, free_credits_claimed: true });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Header */}
            <header className="nav sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="text-lg font-semibold text-white">
                        API Stress Lab
                    </Link>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link href="/dashboard" className="text-white/40 hover:text-white text-sm transition">
                                    Dashboard
                                </Link>
                                <span className="text-white/60 text-sm">
                                    {balance?.balance ?? 0} credits
                                </span>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-white/40 hover:text-white text-sm transition">
                                    Login
                                </Link>
                                <Link href="/signup" className="btn-primary text-sm">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-16">
                {/* Hero */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Pay As You Go</h1>
                    <p className="text-white/50 text-lg max-w-xl mx-auto">
                        Buy credits once, use them anytime. No subscriptions, no monthly fees.
                    </p>
                </div>

                {/* Free Credits Banner */}
                {user && balance && !balance.free_credits_claimed && (
                    <div className="card p-6 mb-8 text-center border-emerald-500/30 bg-emerald-500/5">
                        <h3 className="text-white font-semibold mb-2">Welcome! Claim your free credits</h3>
                        <p className="text-white/50 text-sm mb-4">
                            Get 50 free credits to try API Stress Lab — no credit card required.
                        </p>
                        <button
                            onClick={handleClaimFreeCredits}
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Claiming...' : 'Claim 50 Free Credits'}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm text-center mb-8">
                        {error}
                    </div>
                )}

                {/* Credit Packages */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {packages.map((pkg, index) => (
                        <div
                            key={pkg.id}
                            className={`card p-6 relative ${index === 2 ? 'border-white/20' : ''}`}
                        >
                            {index === 2 && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-xs font-medium rounded-full">
                                    Best Value
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">{pkg.name}</h3>
                                    <p className="text-white/40 text-sm mt-1">{pkg.credits.toLocaleString()} credits</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-bold text-white">${pkg.price}</span>
                                    <p className="text-white/40 text-xs">${pkg.price_per_credit.toFixed(3)}/credit</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleBuyCredits(pkg.id)}
                                disabled={loading}
                                className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${index === 2
                                        ? 'btn-primary'
                                        : 'bg-white/10 text-white hover:bg-white/15'
                                    }`}
                            >
                                {loading ? 'Loading...' : 'Buy Credits'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* How Credits Work */}
                <div className="card p-8 mb-12">
                    <h2 className="text-xl font-semibold text-white mb-6">How Credits Work</h2>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-white font-medium mb-2">Simple pricing formula</h4>
                            <p className="text-white/50 text-sm mb-3">
                                Credits are calculated based on the larger of requests or compute time:
                            </p>
                            <div className="bg-white/5 rounded-lg p-4 font-mono text-sm text-white/70">
                                credits = max(requests ÷ 10,000, VU-minutes ÷ 50)
                                <br />
                                minimum = 5 credits per test
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-medium mb-3">Example costs</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-white/60">
                                    <span>Smoke test (2 min, 20 VUs, ~6k requests)</span>
                                    <span className="text-white">5 credits</span>
                                </div>
                                <div className="flex justify-between text-white/60">
                                    <span>Ramp test (10 min, 10→100 VUs, ~120k requests)</span>
                                    <span className="text-white">12 credits</span>
                                </div>
                                <div className="flex justify-between text-white/60">
                                    <span>Heavy load (15 min, 300 VUs, ~1.2M requests)</span>
                                    <span className="text-white">120 credits</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Balance */}
                {user && balance && (
                    <div className="text-center text-white/40 text-sm">
                        Your balance: <span className="text-white font-medium">{balance.balance} credits</span>
                    </div>
                )}

                {/* FAQ */}
                <div className="mt-16">
                    <h2 className="text-2xl font-semibold text-white text-center mb-8">Questions</h2>
                    <div className="max-w-2xl mx-auto space-y-4">
                        {[
                            {
                                q: 'Do credits expire?',
                                a: 'No! Your credits never expire and can be used anytime.'
                            },
                            {
                                q: 'Can I get a refund?',
                                a: 'Unused credits can be refunded within 30 days of purchase. Contact support.'
                            },
                            {
                                q: 'What payment methods do you accept?',
                                a: 'All major credit cards via Stripe. Secure and PCI compliant.'
                            },
                            {
                                q: 'What if a test fails?',
                                a: 'If a test fails due to our error, credits are automatically refunded.'
                            }
                        ].map((faq, i) => (
                            <div key={i} className="card p-5">
                                <h3 className="text-white font-medium mb-1">{faq.q}</h3>
                                <p className="text-white/50 text-sm">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
