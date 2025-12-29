'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Logo from '@/components/Logo';
import DemoTest from '@/components/DemoTest';

export default function Home() {
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

            {/* Hero - Clean and minimal */}
            <section className="pt-32 pb-12 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-semibold text-white mb-6" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                        Know exactly where your API breaks before users do
                    </h1>
                    <p className="text-lg text-white/50 mb-8 max-w-2xl mx-auto">
                        Our AI models real-world traffic patterns from your OpenAPI spec, runs realistic load scenarios, and tells you where your system fails, why it fails, and what to fix before launch.
                    </p>
                    <div className="flex gap-4 justify-center mb-4">
                        <Link href="#demo" className="btn-primary">
                            Run a demo
                        </Link>
                        <Link href="#how-it-works" className="btn-secondary">
                            See how it works
                        </Link>
                    </div>
                    <p className="text-sm text-emerald-400/80">
                        No signup required
                    </p>
                </div>
            </section>

            {/* Interactive Demo Test */}
            <DemoTest />

            {/* Divider */}
            <div className="divider" />

            {/* Feature Section 1 - What You Learn Before Launch */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Text */}
                        <div>
                            <span className="inline-block px-3 py-1 text-xs font-medium bg-white/10 text-white/70 rounded-full mb-4">
                                AI-Generated Scenarios
                            </span>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4" style={{ lineHeight: '1.2' }}>
                                What you learn<br />
                                <span className="text-white/60">before you launch</span>
                            </h2>
                            <p className="text-white/50 leading-relaxed mb-6">
                                AI analyzes your OpenAPI spec to generate realistic traffic scenarios. Each test reveals critical insights about where and why your API fails under real-world conditions.
                            </p>
                            <p className="text-xs text-white/40 italic">
                                These insights are derived from AI-generated, real-world traffic scenarios — not synthetic scripts.
                            </p>
                        </div>

                        {/* Right - Outcomes Card */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Breaking Point</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">The exact traffic level where latency or errors spike</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Primary Bottleneck</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">Database, CPU, memory, or upstream dependency</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Traffic Headroom</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">How much real-world growth your system can handle</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Fix Priority</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">What to change first to safely scale</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Section 2 - Test Methodology */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Text with features */}
                        <div>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4" style={{ lineHeight: '1.2' }}>
                                Four test scenarios that reveal how your API performs
                            </h2>
                            <p className="text-white/50 mb-8">
                                Every test suite runs four distinct scenarios automatically. Each one stresses your API differently to uncover specific failure modes and performance characteristics.
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <h4 className="text-white font-medium mb-1">Baseline Performance</h4>
                                    <p className="text-white/40 text-sm">Establishes normal behavior under light load to catch basic issues</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Traffic Ramp</h4>
                                    <p className="text-white/40 text-sm">Gradually increases load to find your maximum stable throughput</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Spike Scenario</h4>
                                    <p className="text-white/40 text-sm">Sudden traffic bursts reveal how your system handles unexpected demand</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Chaos Testing</h4>
                                    <p className="text-white/40 text-sm">Injects artificial latency, connection failures, and traffic bursts to test how your API handles real-world failure conditions and recovers gracefully</p>
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
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span className="text-green-400 font-medium">Baseline Performance Complete</span>
                                </div>
                                <div className="text-white/40 pl-5">→ 0.02% error rate</div>

                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-green-400">✓</span>
                                    <span className="text-green-400 font-medium">Traffic Ramp Complete</span>
                                </div>
                                <div className="text-white/40 pl-5">→ Max stable RPS: 245</div>

                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-yellow-400">△</span>
                                    <span className="text-yellow-400 font-medium">Spike Scenario Warning</span>
                                </div>
                                <div className="text-white/40 pl-5">→ P95 latency spike at 500 concurrent users</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="divider" />

            {/* How it works - Simple numbered steps */}
            <section id="how-it-works" className="py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-semibold text-white mb-12 text-center">How it works</h2>

                    <div className="space-y-8">
                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">01</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Upload your OpenAPI spec</h3>
                                <p className="text-white/40 text-sm">AI analyzes your API structure and models realistic usage flows.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">02</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Run real-world load scenarios</h3>
                                <p className="text-white/40 text-sm">Ramp, spike, and sustained traffic based on how real users behave.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">03</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Get a Breakpoint Report</h3>
                                <p className="text-white/40 text-sm">See where it breaks, why it breaks, and what to fix.</p>
                            </div>
                        </div>
                    </div>

                    {/* OpenAPI Generation CTA */}
                    <div className="mt-12 text-center">
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
                            Don&apos;t have an OpenAPI spec? Learn how to generate one
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-20 px-6">
                <div className="max-w-xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold text-white mb-4">Find your API&apos;s breaking point before launch</h2>
                    <p className="text-white/40 mb-8">No subscriptions. Pay only when you test. Free tier includes 5 test runs per month. No credit card required.</p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/signup" className="btn-primary">
                            Get started free
                        </Link>
                        <Link href="/pricing" className="btn-secondary">
                            View pricing
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer - Minimal */}
            <footer className="py-8 px-6 border-t border-white/[0.06]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="text-white/30 text-sm">API Stress Lab</span>
                    <div className="flex flex-wrap gap-4 md:gap-6 text-white/30 text-sm justify-center">
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
