'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';

export default function DocsPage() {
    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Navigation */}
            <nav className="nav fixed top-0 left-0 right-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/">
                        <Logo size="md" />
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-white/60 hover:text-white text-sm transition">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4">
                        Documentation
                    </h1>
                    <p className="text-white/50 text-lg mb-12">
                        Everything you need to test your APIs and find breaking points before launch
                    </p>

                    {/* Quick Links */}
                    <div className="grid md:grid-cols-2 gap-6 mb-16">
                        <Link href="/docs/getting-started" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition group">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold mb-2 group-hover:text-emerald-400 transition">
                                        Getting Started
                                    </h3>
                                    <p className="text-white/40 text-sm">
                                        Step-by-step guide to running your first stress test in under 5 minutes
                                    </p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/docs/openapi-generation" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition group">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400 transition">
                                        Generate OpenAPI Spec
                                    </h3>
                                    <p className="text-white/40 text-sm">
                                        Framework-specific guides for generating OpenAPI specifications from your API
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Overview */}
                    <div className="prose prose-invert max-w-none">
                        <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
                        <p className="text-white/50 leading-relaxed mb-6">
                            API Stress Lab helps you understand exactly where your API breaks before users encounter problems. Our AI analyzes your OpenAPI specification to generate realistic traffic scenarios that mimic real-world usage patterns.
                        </p>

                        <h3 className="text-xl font-semibold text-white mb-3 mt-8">What You&apos;ll Learn</h3>
                        <div className="space-y-4">
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    </span>
                                    <div>
                                        <h4 className="text-white font-medium mb-1">Breaking Point</h4>
                                        <p className="text-white/40 text-sm">The exact traffic level where latency or errors spike</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    </span>
                                    <div>
                                        <h4 className="text-white font-medium mb-1">Primary Bottleneck</h4>
                                        <p className="text-white/40 text-sm">Database, CPU, memory, or upstream dependency causing failures</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    </span>
                                    <div>
                                        <h4 className="text-white font-medium mb-1">Traffic Headroom</h4>
                                        <p className="text-white/40 text-sm">How much real-world growth your system can handle</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    </span>
                                    <div>
                                        <h4 className="text-white font-medium mb-1">Fix Priority</h4>
                                        <p className="text-white/40 text-sm">What to change first to safely scale your API</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-white mb-3 mt-8">Need Help?</h3>
                        <p className="text-white/50 leading-relaxed mb-6">
                            If you need assistance or have questions, feel free to reach out. We&apos;re here to help you find your API&apos;s breaking point before your users do.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-white/[0.06]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="text-white/30 text-sm">API Stress Lab</span>
                    <div className="flex flex-wrap gap-4 md:gap-6 text-white/30 text-sm justify-center">
                        <Link href="/docs" className="hover:text-white/50 transition">
                            Documentation
                        </Link>
                        <Link href="/docs/getting-started" className="hover:text-white/50 transition">
                            Getting Started
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
