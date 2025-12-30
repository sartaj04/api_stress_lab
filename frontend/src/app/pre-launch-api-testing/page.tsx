'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Logo from '@/components/Logo';
import DemoTest from '@/components/DemoTest';

export default function PreLaunchApiTesting() {
    const { user } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Navigation */}
            <nav className="nav fixed top-0 left-0 right-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/">
                        <Logo size="md" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="#demo" className="text-emerald-400/80 hover:text-emerald-400 text-sm transition font-medium">
                            Try Demo
                        </Link>
                        <Link href="#checklist" className="text-white/60 hover:text-white text-sm transition">
                            Launch Checklist
                        </Link>
                        <Link href="/blog" className="text-white/60 hover:text-white text-sm transition">
                            Blog
                        </Link>
                        <Link href="/pricing" className="text-white/60 hover:text-white text-sm transition">
                            Pricing
                        </Link>
                        {user ? (
                            <Link href="/dashboard" className="btn-primary text-sm">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-white/60 hover:text-white text-sm transition">
                                    Login
                                </Link>
                                <Link href="/signup" className="btn-primary text-sm">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-white/60 hover:text-white transition"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-white/[0.06]" style={{ background: 'rgba(10, 10, 11, 0.98)' }}>
                        <div className="px-6 py-4 space-y-4">
                            <Link
                                href="#demo"
                                className="block text-emerald-400/80 hover:text-emerald-400 text-sm font-medium transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Try Demo
                            </Link>
                            <Link
                                href="#checklist"
                                className="block text-white/60 hover:text-white text-sm transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Launch Checklist
                            </Link>
                            <Link
                                href="/blog"
                                className="block text-white/60 hover:text-white text-sm transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Blog
                            </Link>
                            <Link
                                href="/pricing"
                                className="block text-white/60 hover:text-white text-sm transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Pricing
                            </Link>
                            {user ? (
                                <Link
                                    href="/dashboard"
                                    className="block btn-primary text-sm text-center"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="block text-white/60 hover:text-white text-sm transition py-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="block btn-primary text-sm text-center"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero - Pre-launch focused */}
            <section className="pt-32 pb-12 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-block px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full mb-6">
                        Pre-Launch Confidence
                    </div>
                    <h1 className="text-5xl md:text-6xl font-semibold text-white mb-6" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                        Launch with confidence. Test your API before users do.
                    </h1>
                    <p className="text-lg text-white/50 mb-8 max-w-2xl mx-auto">
                        Launching next week? Test your API under realistic load today. Find critical bottlenecks, verify your infrastructure can handle launch traffic, and fix issues before they become disasters.
                    </p>
                    <div className="flex gap-4 justify-center mb-4">
                        <Link href="#demo" className="btn-primary">
                            Test before launch
                        </Link>
                        <Link href="#checklist" className="btn-secondary">
                            See checklist
                        </Link>
                    </div>
                    <p className="text-sm text-emerald-400/80">
                        Results in 5 minutes • Free tier available
                    </p>
                </div>
            </section>

            {/* Launch Stats */}
            <section className="pb-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-red-400 mb-2">64%</div>
                            <div className="text-white/50 text-sm">of launches have performance issues</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-yellow-400 mb-2">2-8 hours</div>
                            <div className="text-white/50 text-sm">Average downtime if untested</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-emerald-400 mb-2">5 minutes</div>
                            <div className="text-white/50 text-sm">To find critical issues</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Demo Test */}
            <DemoTest />

            {/* Divider */}
            <div className="divider" />

            {/* Pre-Launch Checklist Section */}
            <section id="checklist" className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-semibold text-white mb-4 text-center">
                        The pre-launch testing checklist
                    </h2>
                    <p className="text-white/50 text-center mb-12 max-w-2xl mx-auto">
                        We automatically test all these scenarios. Check them off your launch prep list in 5 minutes.
                    </p>

                    <div className="space-y-4">
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 flex gap-4">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Can you handle expected launch traffic?</h3>
                                <p className="text-white/50 text-sm">We simulate your estimated signups and tell you if your system can handle it.</p>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 flex gap-4">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">What if you get 10x more traffic than expected?</h3>
                                <p className="text-white/50 text-sm">Spike testing reveals if viral growth will crash your app or scale gracefully.</p>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 flex gap-4">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Where will your system break first?</h3>
                                <p className="text-white/50 text-sm">Database? CPU? Memory? We identify the bottleneck before users hit it.</p>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 flex gap-4">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Are your error messages helpful?</h3>
                                <p className="text-white/50 text-sm">We test error scenarios to ensure users get proper feedback, not 500 errors.</p>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 flex gap-4">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Does your API recover from failures?</h3>
                                <p className="text-white/50 text-sm">Chaos testing injects random failures to verify graceful degradation.</p>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 flex gap-4">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Are response times acceptable under load?</h3>
                                <p className="text-white/50 text-sm">We measure P50, P95, P99 latency to ensure users get fast responses.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <Link
                            href="/blog/mvp-launch-checklist"
                            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                        >
                            Read the complete MVP launch checklist
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Feature Section - What You Get */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Text */}
                        <div>
                            <span className="inline-block px-3 py-1 text-xs font-medium bg-white/10 text-white/70 rounded-full mb-4">
                                Launch Day Insurance
                            </span>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4" style={{ lineHeight: '1.2' }}>
                                What you get from<br />
                                <span className="text-white/60">pre-launch testing</span>
                            </h2>
                            <p className="text-white/50 leading-relaxed mb-6">
                                Stop guessing if your API will survive launch day. Get concrete answers about your infrastructure limits, performance bottlenecks, and exactly what to fix before going live.
                            </p>
                        </div>

                        {/* Right - Benefits Card */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Your exact breaking point</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">&quot;Crashes at 150 concurrent users&quot;</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">What to fix first</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">&quot;Increase database connection pool to 50&quot;</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Performance metrics</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">P50, P95, P99 latency, error rates, throughput</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Launch confidence</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">Sleep easy knowing your system can handle it</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="divider" />

            {/* Real launch disaster stories */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-semibold text-white mb-8 text-center">
                        Don&apos;t let this be your launch story
                    </h2>

                    <div className="space-y-6">
                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-2">The Product Hunt Crash</h3>
                                    <p className="text-white/60 text-sm mb-3">
                                        Hit #1 on Product Hunt at 9am. API crashed by 9:15am. Database connection pool maxed out at just 50 users.
                                        Took 3 hours to fix. Dropped to #8 by then. Lost 500+ potential signups.
                                    </p>
                                    <p className="text-xs text-red-400">Could have been prevented with 5 minutes of testing</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-2">The Slow Death</h3>
                                    <p className="text-white/60 text-sm mb-3">
                                        API stayed up during launch but response times went from 200ms to 8 seconds. Users assumed it was broken and left.
                                        Issue: Missing database indexes on user queries.
                                    </p>
                                    <p className="text-xs text-yellow-400">Load testing would have caught this immediately</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-2">The Success Story</h3>
                                    <p className="text-white/60 text-sm mb-3">
                                        Tested 2 weeks before launch. Found connection pool, caching, and autoscaling issues. Fixed them all.
                                        Launch day: 847 signups, zero downtime, sub-500ms response times throughout.
                                    </p>
                                    <p className="text-xs text-emerald-400">Pre-launch testing prevents disasters</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-semibold text-white mb-12 text-center">Launch-ready in 3 steps</h2>

                    <div className="space-y-8">
                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">01</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Upload your OpenAPI spec</h3>
                                <p className="text-white/40 text-sm">AI analyzes your API and generates realistic launch day traffic patterns.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">02</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Run launch simulations</h3>
                                <p className="text-white/40 text-sm">4 test scenarios: baseline, expected traffic, spike, and chaos. Takes 5 minutes.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">03</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Fix issues before launch</h3>
                                <p className="text-white/40 text-sm">Get specific recommendations and launch with confidence knowing your limits.</p>
                            </div>
                        </div>
                    </div>

                    {/* Resource Links */}
                    <div className="mt-12 grid md:grid-cols-2 gap-4">
                        <Link
                            href="/blog/test-api-before-launch-guide"
                            className="flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg p-4 transition"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 flex-shrink-0">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <div>
                                <div className="text-white text-sm font-medium">Complete testing guide</div>
                                <div className="text-white/40 text-xs">How to test before launch</div>
                            </div>
                        </Link>
                        <Link
                            href="/docs/openapi-generation"
                            className="flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg p-4 transition"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 flex-shrink-0">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <div>
                                <div className="text-white text-sm font-medium">Generate OpenAPI spec</div>
                                <div className="text-white/40 text-xs">For your framework</div>
                            </div>
                        </Link>
                    </div>

                    <div className="mt-8 text-center">
                        <Link href="/docs/getting-started" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition">
                            Read the Getting Started Guide
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold text-white mb-4">Test before you launch. Sleep easy on launch day.</h2>
                    <p className="text-white/40 mb-8">5 free test runs per month. Get your pre-launch results in 5 minutes. No credit card required.</p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/signup" className="btn-primary">
                            Test your API now
                        </Link>
                        <Link href="/pricing" className="btn-secondary">
                            View pricing
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-white/[0.06]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="text-white/30 text-sm">API Stress Lab</span>
                    <div className="flex flex-wrap gap-4 md:gap-6 text-white/30 text-sm justify-center">
                        <Link href="/blog" className="hover:text-white/50 transition">
                            Blog
                        </Link>
                        <Link href="/blog/mvp-launch-checklist" className="hover:text-white/50 transition">
                            MVP Launch Checklist
                        </Link>
                        <Link href="/blog/test-api-before-launch-guide" className="hover:text-white/50 transition">
                            Testing Guide
                        </Link>
                        <Link href="/docs" className="hover:text-white/50 transition">
                            Documentation
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
