'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Logo from '@/components/Logo';
import DemoTest from '@/components/DemoTest';

export default function ApiLoadTestingTools() {
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
                        <Link href="#comparison" className="text-white/60 hover:text-white text-sm transition">
                            vs Traditional Tools
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
                                href="#comparison"
                                className="block text-white/60 hover:text-white text-sm transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                vs Traditional Tools
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

            {/* Hero - Tool comparison focused */}
            <section className="pt-32 pb-12 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-block px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full mb-6">
                        Next-Generation Load Testing
                    </div>
                    <h1 className="text-5xl md:text-6xl font-semibold text-white mb-6" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                        API load testing without the scripting pain
                    </h1>
                    <p className="text-lg text-white/50 mb-8 max-w-2xl mx-auto">
                        Skip the k6/JMeter learning curve. Upload your OpenAPI spec and get AI-generated, realistic load tests in 5 minutes. No scripting, no infrastructure, no headaches.
                    </p>
                    <div className="flex gap-4 justify-center mb-4">
                        <Link href="#demo" className="btn-primary">
                            Try it free
                        </Link>
                        <Link href="#comparison" className="btn-secondary">
                            Compare tools
                        </Link>
                    </div>
                    <p className="text-sm text-emerald-400/80">
                        Free tier • No credit card required
                    </p>
                </div>
            </section>

            {/* Tool Comparison Stats */}
            <section className="pb-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-emerald-400 mb-2">95% faster</div>
                            <div className="text-white/50 text-sm">Setup time vs k6/JMeter</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-emerald-400 mb-2">Zero code</div>
                            <div className="text-white/50 text-sm">No scripting required</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-emerald-400 mb-2">AI-powered</div>
                            <div className="text-white/50 text-sm">Realistic traffic patterns</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Demo Test */}
            <DemoTest />

            {/* Divider */}
            <div className="divider" />

            {/* Comparison Table - Traditional vs AI-Powered */}
            <section id="comparison" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-semibold text-white mb-12 text-center">
                        Traditional load testing vs AI-powered
                    </h2>

                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.08]">
                                    <th className="text-left p-4 text-white/60 font-medium text-sm">Feature</th>
                                    <th className="text-center p-4 text-white/40 font-medium text-sm">k6 / JMeter / Locust</th>
                                    <th className="text-center p-4 text-emerald-400 font-medium text-sm">API Stress Lab</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr className="border-b border-white/[0.08]">
                                    <td className="p-4 text-white/70">Setup time</td>
                                    <td className="p-4 text-center text-white/40">2-8 hours (write scripts)</td>
                                    <td className="p-4 text-center text-emerald-400">5 minutes (upload spec)</td>
                                </tr>
                                <tr className="border-b border-white/[0.08]">
                                    <td className="p-4 text-white/70">Scripting required</td>
                                    <td className="p-4 text-center text-white/40">Yes (JavaScript/Groovy/Python)</td>
                                    <td className="p-4 text-center text-emerald-400">No</td>
                                </tr>
                                <tr className="border-b border-white/[0.08]">
                                    <td className="p-4 text-white/70">Realistic traffic patterns</td>
                                    <td className="p-4 text-center text-white/40">Manual (hard to get right)</td>
                                    <td className="p-4 text-center text-emerald-400">AI-generated</td>
                                </tr>
                                <tr className="border-b border-white/[0.08]">
                                    <td className="p-4 text-white/70">Infrastructure</td>
                                    <td className="p-4 text-center text-white/40">Self-hosted or expensive SaaS</td>
                                    <td className="p-4 text-center text-emerald-400">Fully managed</td>
                                </tr>
                                <tr className="border-b border-white/[0.08]">
                                    <td className="p-4 text-white/70">Results interpretation</td>
                                    <td className="p-4 text-center text-white/40">Raw metrics (you figure it out)</td>
                                    <td className="p-4 text-center text-emerald-400">AI insights + recommendations</td>
                                </tr>
                                <tr className="border-b border-white/[0.08]">
                                    <td className="p-4 text-white/70">Maintenance</td>
                                    <td className="p-4 text-center text-white/40">Update scripts when API changes</td>
                                    <td className="p-4 text-center text-emerald-400">Auto-updates from spec</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-white/70">Pricing</td>
                                    <td className="p-4 text-center text-white/40">Free (DIY) or $100+/mo (SaaS)</td>
                                    <td className="p-4 text-center text-emerald-400">Pay per test (from $0)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Feature Section 1 - What You Get */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Text */}
                        <div>
                            <span className="inline-block px-3 py-1 text-xs font-medium bg-white/10 text-white/70 rounded-full mb-4">
                                Everything you need
                            </span>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4" style={{ lineHeight: '1.2' }}>
                                Load testing built for<br />
                                <span className="text-white/60">modern engineering teams</span>
                            </h2>
                            <p className="text-white/50 leading-relaxed mb-6">
                                Our AI understands your OpenAPI spec and generates realistic user journeys automatically. No more manual scripting, no more guessing at traffic patterns, no more infrastructure headaches.
                            </p>
                        </div>

                        {/* Right - Benefits Card */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Automatic test generation</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">AI creates realistic scenarios from your API spec</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">4 test types included</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">Baseline, ramp, spike, and chaos testing</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Actionable insights</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">Not just metrics — specific recommendations</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Always up-to-date</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">Tests auto-update when your API changes</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Section 2 - Technical Details */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Text with features */}
                        <div>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4" style={{ lineHeight: '1.2' }}>
                                The technical details that matter
                            </h2>
                            <p className="text-white/50 mb-8">
                                Built on industry-standard tools (k6 under the hood) with AI orchestration on top. You get the power of k6 without the complexity.
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <h4 className="text-white font-medium mb-1">Distributed load generation</h4>
                                    <p className="text-white/40 text-sm">Multi-region testing from AWS infrastructure</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Real HTTP(S) traffic</h4>
                                    <p className="text-white/40 text-sm">Actual requests to your API, not simulated</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Performance metrics</h4>
                                    <p className="text-white/40 text-sm">P50, P95, P99 latency, RPS, error rates, and more</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">API authentication</h4>
                                    <p className="text-white/40 text-sm">Supports API keys, Bearer tokens, OAuth, and custom auth</p>
                                </div>
                            </div>
                        </div>

                        {/* Right - Terminal Preview */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                            {/* Terminal header */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08]">
                                <span className="w-3 h-3 rounded-full bg-red-400/80"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-400/80"></span>
                                <span className="w-3 h-3 rounded-full bg-green-400/80"></span>
                            </div>
                            {/* Terminal content */}
                            <div className="p-5 font-mono text-sm space-y-3">
                                <div className="text-emerald-400">📊 Performance Metrics</div>
                                <div className="text-white/40 pl-3">→ P50 latency: 145ms</div>
                                <div className="text-white/40 pl-3">→ P95 latency: 380ms</div>
                                <div className="text-white/40 pl-3">→ P99 latency: 720ms</div>
                                <div className="text-white/40 pl-3">→ Max RPS: 245</div>

                                <div className="text-yellow-400 mt-4">⚡ Bottleneck Detected</div>
                                <div className="text-white/40 pl-3">→ Database connection pool</div>
                                <div className="text-white/40 pl-3">→ Latency spikes at 85 users</div>

                                <div className="text-emerald-400 mt-4">💡 Recommendation</div>
                                <div className="text-white/40 pl-3">→ Increase pool: 10 → 50</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="divider" />

            {/* Migration from other tools */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl p-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Migrating from k6, JMeter, or Locust?</h3>
                        <p className="text-white/60 text-sm mb-6">
                            You already know the value of load testing. We just make it 10x easier. Keep your existing knowledge,
                            skip the scripting. If you have an OpenAPI spec, you can run your first test in under 5 minutes.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Link
                                href="/blog/load-testing-vs-stress-testing"
                                className="flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg p-4 transition"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 flex-shrink-0">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <div>
                                    <div className="text-white text-sm font-medium">Testing methodology guide</div>
                                    <div className="text-white/40 text-xs">Load vs stress vs spike testing</div>
                                </div>
                            </Link>
                            <Link
                                href="/docs/getting-started"
                                className="flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg p-4 transition"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 flex-shrink-0">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <div>
                                    <div className="text-white text-sm font-medium">Getting started</div>
                                    <div className="text-white/40 text-xs">Run your first test in 5 minutes</div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-semibold text-white mb-12 text-center">From OpenAPI spec to results in 3 steps</h2>

                    <div className="space-y-8">
                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">01</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Upload your OpenAPI spec (YAML or JSON)</h3>
                                <p className="text-white/40 text-sm">Our AI parses your endpoints, parameters, and schemas to understand your API structure.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">02</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">AI generates realistic test scenarios</h3>
                                <p className="text-white/40 text-sm">User journeys, traffic patterns, and data flows modeled from your spec. No scripting required.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">03</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Get actionable insights in 5 minutes</h3>
                                <p className="text-white/40 text-sm">Breaking point, bottlenecks, and specific recommendations to improve performance.</p>
                            </div>
                        </div>
                    </div>

                    {/* OpenAPI Generation CTA */}
                    <div className="mt-12 text-center space-y-4">
                        <Link
                            href="/docs/openapi-generation"
                            className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] hover:border-white/[0.15] font-medium px-5 py-2.5 rounded-lg transition text-sm"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            How to generate an OpenAPI spec
                        </Link>
                        <div>
                            <Link href="/docs/getting-started" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition">
                                Read the Getting Started Guide
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold text-white mb-4">Try it free — no scripting required</h2>
                    <p className="text-white/40 mb-8">Upload your OpenAPI spec and run your first load test in 5 minutes. Free tier includes 5 test runs.</p>
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
                        <Link href="/blog/load-testing-vs-stress-testing" className="hover:text-white/50 transition">
                            Load vs Stress Testing
                        </Link>
                        <Link href="/docs" className="hover:text-white/50 transition">
                            Documentation
                        </Link>
                        <Link href="/docs/openapi-generation" className="hover:text-white/50 transition">
                            Generate OpenAPI Spec
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
