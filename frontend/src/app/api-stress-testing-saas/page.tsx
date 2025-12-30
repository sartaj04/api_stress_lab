'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Logo from '@/components/Logo';
import DemoTest from '@/components/DemoTest';

export default function ApiStressTestingSaas() {
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
                        <Link href="#features" className="text-white/60 hover:text-white text-sm transition">
                            Features
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
                                href="#features"
                                className="block text-white/60 hover:text-white text-sm transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Features
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

            {/* Hero - SaaS/Enterprise focused */}
            <section className="pt-32 pb-12 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-block px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full mb-6">
                        Built for Production SaaS
                    </div>
                    <h1 className="text-5xl md:text-6xl font-semibold text-white mb-6" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                        Scale your SaaS without downtime or panic
                    </h1>
                    <p className="text-lg text-white/50 mb-8 max-w-2xl mx-auto">
                        Production-grade API stress testing for growing SaaS companies. Know your capacity limits, plan infrastructure scaling, and prevent revenue-killing outages before they happen.
                    </p>
                    <div className="flex gap-4 justify-center mb-4">
                        <Link href="#demo" className="btn-primary">
                            Test your capacity
                        </Link>
                        <Link href="#features" className="btn-secondary">
                            See features
                        </Link>
                    </div>
                    <p className="text-sm text-emerald-400/80">
                        Volume pricing available • Enterprise support
                    </p>
                </div>
            </section>

            {/* SaaS Stats */}
            <section className="pb-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-emerald-400 mb-2">Capacity planning</div>
                            <div className="text-white/50 text-sm">Scale infrastructure with confidence</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-emerald-400 mb-2">Continuous testing</div>
                            <div className="text-white/50 text-sm">Regression testing for every release</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-emerald-400 mb-2">Pay per test</div>
                            <div className="text-white/50 text-sm">No fixed subscriptions</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Demo Test */}
            <DemoTest />

            {/* Divider */}
            <div className="divider" />

            {/* Feature Section 1 - SaaS Challenges */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Text */}
                        <div>
                            <span className="inline-block px-3 py-1 text-xs font-medium bg-white/10 text-white/70 rounded-full mb-4">
                                Enterprise-Grade Testing
                            </span>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4" style={{ lineHeight: '1.2' }}>
                                SaaS challenges we solve<br />
                                <span className="text-white/60">for growing teams</span>
                            </h2>
                            <p className="text-white/50 leading-relaxed mb-6">
                                As your SaaS grows, infrastructure questions become business-critical. Can we handle Black Friday traffic?
                                Should we upgrade our database? How much headroom do we have? Get data-driven answers.
                            </p>
                            <p className="text-xs text-white/40 italic">
                                Used by SaaS companies scaling from 100 to 10,000+ concurrent users.
                            </p>
                        </div>

                        {/* Right - Challenges Card */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Capacity planning</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">Know when to scale before users experience slowdowns</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Release confidence</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">Test every major release under production load</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Infrastructure ROI</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">Justify upgrades with concrete data, not guesses</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Customer SLAs</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">Verify you can meet uptime and performance commitments</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Section 2 - Enterprise Features */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Text with features */}
                        <div>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4" style={{ lineHeight: '1.2' }}>
                                Production-grade features for SaaS teams
                            </h2>
                            <p className="text-white/50 mb-8">
                                Everything you need to test, scale, and maintain high-performance APIs in production environments.
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <h4 className="text-white font-medium mb-1">Multi-region load generation</h4>
                                    <p className="text-white/40 text-sm">Test from multiple AWS regions to simulate global user base</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Historical trend analysis</h4>
                                    <p className="text-white/40 text-sm">Track performance metrics over time to spot regressions</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Custom authentication flows</h4>
                                    <p className="text-white/40 text-sm">Support for complex OAuth, JWT refresh, and custom headers</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Team collaboration</h4>
                                    <p className="text-white/40 text-sm">Share test results, compare runs, and plan capacity together</p>
                                </div>
                            </div>
                        </div>

                        {/* Right - Performance Metrics Preview */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                            {/* Terminal header */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08]">
                                <span className="w-3 h-3 rounded-full bg-red-400/80"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-400/80"></span>
                                <span className="w-3 h-3 rounded-full bg-green-400/80"></span>
                                <span className="text-white/40 text-xs ml-2">Capacity Report</span>
                            </div>
                            {/* Terminal content */}
                            <div className="p-5 font-mono text-sm space-y-3">
                                <div className="text-emerald-400">📊 Current Capacity</div>
                                <div className="text-white/40 pl-3">→ Max stable: 850 concurrent users</div>
                                <div className="text-white/40 pl-3">→ Current peak: 320 users</div>
                                <div className="text-white/40 pl-3">→ Headroom: 165% above peak</div>

                                <div className="text-yellow-400 mt-4">⚠️ Bottleneck Identified</div>
                                <div className="text-white/40 pl-3">→ Database CPU at 72% during peak</div>
                                <div className="text-white/40 pl-3">→ Projected max: 1,100 users</div>

                                <div className="text-emerald-400 mt-4">💡 Scaling Recommendation</div>
                                <div className="text-white/40 pl-3">→ Upgrade DB: db.t3.large → db.r5.xlarge</div>
                                <div className="text-white/40 pl-3">→ New capacity: 2,500+ users</div>
                                <div className="text-white/40 pl-3">→ Cost: +$180/mo</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="divider" />

            {/* Use Cases for SaaS */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-semibold text-white mb-12 text-center">Common SaaS use cases</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-2">Before Black Friday / Peak Season</h3>
                                    <p className="text-white/60 text-sm">
                                        Test if your infrastructure can handle expected peak traffic. Plan scaling 2-4 weeks in advance.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-2">Before Major Releases</h3>
                                    <p className="text-white/60 text-sm">
                                        Verify new features don&apos;t degrade performance. Catch regressions before customers do.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-2">Infrastructure ROI Decisions</h3>
                                    <p className="text-white/60 text-sm">
                                        Should we upgrade the database? Add read replicas? Get concrete data to justify costs.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-2">After Performance Incidents</h3>
                                    <p className="text-white/60 text-sm">
                                        Verify fixes worked. Ensure the same issue won&apos;t happen again at higher scale.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-2">Enterprise Customer Onboarding</h3>
                                    <p className="text-white/60 text-sm">
                                        Large customer coming onboard? Test if your API can handle their expected usage patterns.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-2">Quarterly Capacity Reviews</h3>
                                    <p className="text-white/60 text-sm">
                                        Regular testing to track capacity trends and plan infrastructure budget for next quarter.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing for SaaS */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl p-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Flexible pricing for growing SaaS teams</h3>
                        <p className="text-white/60 text-sm mb-6">
                            Pay-as-you-go testing with volume discounts. No fixed subscriptions. Scale your testing as your business grows.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-4 text-center">
                                <div className="text-emerald-400 font-semibold text-lg mb-1">Free Tier</div>
                                <div className="text-white/40 text-xs">5 test runs/month</div>
                            </div>
                            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-4 text-center">
                                <div className="text-emerald-400 font-semibold text-lg mb-1">Pay-as-you-go</div>
                                <div className="text-white/40 text-xs">$10-20 per test run</div>
                            </div>
                            <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-4 text-center">
                                <div className="text-emerald-400 font-semibold text-lg mb-1">Volume Pricing</div>
                                <div className="text-white/40 text-xs">Contact for custom rates</div>
                            </div>
                        </div>
                        <div className="text-center">
                            <Link href="/pricing" className="btn-primary inline-block">
                                View detailed pricing
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-semibold text-white mb-12 text-center">Production-ready testing in 3 steps</h2>

                    <div className="space-y-8">
                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">01</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Upload your OpenAPI spec</h3>
                                <p className="text-white/40 text-sm">AI analyzes your production API and generates realistic user traffic patterns.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">02</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Configure test scenarios</h3>
                                <p className="text-white/40 text-sm">Choose baseline, ramp, spike, or custom scenarios. Set concurrent user targets and duration.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">03</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Get capacity insights</h3>
                                <p className="text-white/40 text-sm">Breaking point analysis, bottleneck identification, and infrastructure recommendations.</p>
                            </div>
                        </div>
                    </div>

                    {/* Resource Links */}
                    <div className="mt-12 grid md:grid-cols-2 gap-4">
                        <Link
                            href="/blog/api-performance-bottlenecks"
                            className="flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg p-4 transition"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 flex-shrink-0">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <div>
                                <div className="text-white text-sm font-medium">Performance bottlenecks</div>
                                <div className="text-white/40 text-xs">Common issues & fixes</div>
                            </div>
                        </Link>
                        <Link
                            href="/blog/load-testing-vs-stress-testing"
                            className="flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg p-4 transition"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 flex-shrink-0">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <div>
                                <div className="text-white text-sm font-medium">Testing methodology</div>
                                <div className="text-white/40 text-xs">Load vs stress testing</div>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold text-white mb-4">Know your limits. Scale with confidence.</h2>
                    <p className="text-white/40 mb-8">Start with 5 free test runs. Pay-as-you-go after that. Volume pricing available for teams.</p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/signup" className="btn-primary">
                            Start testing free
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
                        <Link href="/blog/api-performance-bottlenecks" className="hover:text-white/50 transition">
                            Performance Bottlenecks
                        </Link>
                        <Link href="/blog/load-testing-vs-stress-testing" className="hover:text-white/50 transition">
                            Load vs Stress Testing
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
