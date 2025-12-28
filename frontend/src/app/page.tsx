'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Logo from '@/components/Logo';

export default function Home() {
    const { user } = useAuth();

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Navigation */}
            <nav className="nav fixed top-0 left-0 right-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/">
                        <Logo size="md" />
                    </Link>
                    <div className="flex items-center gap-6">
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
                </div>
            </nav>

            {/* Hero - Clean and minimal */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-semibold text-white mb-6" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                        Stress test your APIs with confidence
                    </h1>
                    <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
                        Upload your OpenAPI spec. We generate load tests, run them, and give you AI-powered insights. Simple.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/signup" className="btn-primary">
                            Start for free
                        </Link>
                        <Link href="#features" className="btn-secondary">
                            Learn more
                        </Link>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="divider" />

            {/* Feature Section 1 - Deploy Anything Style */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Text */}
                        <div>
                            <span className="inline-block px-3 py-1 text-xs font-medium bg-white/10 text-white/70 rounded-full mb-4">
                                Automatic
                            </span>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4" style={{ lineHeight: '1.2' }}>
                                Deploy anything<br />
                                <span className="text-white/60">without the complexity</span>
                            </h2>
                            <p className="text-white/50 leading-relaxed">
                                Upload your OpenAPI spec and we auto-run 4 test profiles: Smoke, Ramp, Spike, and Chaos. Get a complete resilience report in minutes.
                            </p>
                        </div>

                        {/* Right - Terminal Card */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    <span className="text-white/80 text-sm">Smoke Test → Baseline</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    <span className="text-white/80 text-sm">Ramp Test → Gradual Load</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    <span className="text-white/80 text-sm">Spike Test → Traffic Burst</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    <span className="text-white/80 text-sm">Chaos Test → Failure Injection</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Section 2 - Monitor and Observe Style */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Text with features */}
                        <div>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4" style={{ lineHeight: '1.2' }}>
                                Monitor and Observe
                            </h2>
                            <p className="text-white/50 mb-8">
                                Logs, metrics, and insights in one place. Clarity without the chaos.
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <h4 className="text-white font-medium mb-1">Rich Metrics</h4>
                                    <p className="text-white/40 text-sm">P50, P95, P99 latencies. RPS curves. Error breakdowns.</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">AI Analysis</h4>
                                    <p className="text-white/40 text-sm">Automated insights identify bottlenecks before users do.</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Real-time Updates</h4>
                                    <p className="text-white/40 text-sm">Watch tests run live with streaming metrics.</p>
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
                                    <span className="text-green-400 font-medium">Smoke Test Complete</span>
                                </div>
                                <div className="text-white/40 pl-5">→ 0.02% error rate</div>

                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-green-400">✓</span>
                                    <span className="text-green-400 font-medium">Ramp Test Complete</span>
                                </div>
                                <div className="text-white/40 pl-5">→ Max stable RPS: 245</div>

                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-yellow-400">△</span>
                                    <span className="text-yellow-400 font-medium">Spike Test Warning</span>
                                </div>
                                <div className="text-white/40 pl-5">→ P95 latency spike at 500 VUs</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="divider" />

            {/* How it works - Simple numbered steps */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-semibold text-white mb-12 text-center">How it works</h2>

                    <div className="space-y-8">
                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">01</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Upload your spec</h3>
                                <p className="text-white/40 text-sm">Paste your OpenAPI 3.x specification or upload a file.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">02</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Run the test suite</h3>
                                <p className="text-white/40 text-sm">We execute 4 test profiles automatically: Smoke, Ramp, Spike, and Chaos.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">03</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Get AI insights</h3>
                                <p className="text-white/40 text-sm">Receive a detailed report with recommendations to improve your API performance.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 px-6">
                <div className="max-w-xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold text-white mb-4">Ready to test your APIs?</h2>
                    <p className="text-white/40 mb-8">Free tier includes 5 test runs per month. No credit card required.</p>
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
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <span className="text-white/30 text-sm">API Stress Lab</span>
                    <div className="flex gap-6 text-white/30 text-sm">
                        <a href="#" className="hover:text-white/50 transition">Docs</a>
                        <a href="#" className="hover:text-white/50 transition">GitHub</a>
                    </div>
                </div>
            </footer>
        </main>
    );
}
