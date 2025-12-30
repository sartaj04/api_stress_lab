'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';

export default function GettingStartedPage() {
    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Navigation */}
            <nav className="nav fixed top-0 left-0 right-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/">
                        <Logo size="md" />
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/docs" className="text-white/60 hover:text-white text-sm transition">
                            Documentation
                        </Link>
                        <Link href="/dashboard" className="btn-primary text-sm">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
                        <Link href="/docs" className="hover:text-white/60 transition">Documentation</Link>
                        <span>/</span>
                        <span className="text-white/60">Getting Started</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4">
                        Getting Started
                    </h1>
                    <p className="text-white/50 text-lg mb-12">
                        Run your first stress test in under 5 minutes
                    </p>

                    {/* Quick Overview */}
                    <div className="card p-6 mb-12 border-emerald-500/20 bg-emerald-500/5">
                        <h3 className="text-white font-semibold mb-3">What you'll accomplish</h3>
                        <ul className="space-y-2 text-white/60 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">✓</span>
                                Create your first project and upload an OpenAPI spec
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">✓</span>
                                Run a complete test suite (Smoke, Ramp, Spike, and Chaos tests)
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">✓</span>
                                Understand your API's breaking point and performance bottlenecks
                            </li>
                        </ul>
                    </div>

                    {/* Steps */}
                    <div className="space-y-12">
                        {/* Step 1 */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                                    1
                                </span>
                                <h2 className="text-2xl font-semibold text-white">Sign Up and Claim Free Credits</h2>
                            </div>
                            <div className="pl-11">
                                <p className="text-white/60 mb-4">
                                    Create your account and claim 50 free credits to run your first tests at no cost.
                                </p>
                                <div className="card p-4 bg-white/[0.02]">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="text-sm">
                                            <p className="text-white/70 mb-2">50 free credits = 2 full test suites or 10 individual tests</p>
                                            <Link href="/pricing" className="text-emerald-400 hover:text-emerald-300 transition">
                                                View pricing →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                                    2
                                </span>
                                <h2 className="text-2xl font-semibold text-white">Create a Project</h2>
                            </div>
                            <div className="pl-11">
                                <p className="text-white/60 mb-4">
                                    Projects organize your API tests. Each project represents one API you want to test.
                                </p>
                                <ol className="space-y-3 text-white/60 text-sm mb-4">
                                    <li className="flex gap-2">
                                        <span className="text-white/40">1.</span>
                                        Go to your <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300">Dashboard</Link>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-white/40">2.</span>
                                        Click "New Project"
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-white/40">3.</span>
                                        Enter a name (e.g., "My API") and optional description
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-white/40">4.</span>
                                        Set your API base URL (e.g., https://api.example.com)
                                    </li>
                                </ol>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                                    3
                                </span>
                                <h2 className="text-2xl font-semibold text-white">Configure API Settings</h2>
                            </div>
                            <div className="pl-11">
                                <p className="text-white/60 mb-4">
                                    Set your API's base URL and authentication before uploading your OpenAPI spec.
                                </p>
                                <ol className="space-y-3 text-white/60 text-sm mb-4">
                                    <li className="flex gap-2">
                                        <span className="text-white/40">1.</span>
                                        Click on your project name to open the configuration page
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-white/40">2.</span>
                                        Enter your API base URL (e.g., https://staging-api.example.com)
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-white/40">3.</span>
                                        If your API requires authentication, select the type and enter credentials
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-white/40">4.</span>
                                        <strong className="text-white">Click "Save Configuration"</strong>
                                    </li>
                                </ol>
                                <div className="card p-4">
                                    <h4 className="text-white font-medium text-sm mb-2">Supported Auth Types:</h4>
                                    <ul className="space-y-2 text-white/60 text-sm">
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            Bearer Token
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            API Key (header or query parameter)
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            Basic Auth
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            Custom Headers
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                                    4
                                </span>
                                <h2 className="text-2xl font-semibold text-white">Upload OpenAPI Specification</h2>
                            </div>
                            <div className="pl-11">
                                <p className="text-white/60 mb-4">
                                    Your OpenAPI spec (Swagger) tells us about your API's endpoints, so we can generate realistic test scenarios.
                                </p>

                                <div className="card p-4 bg-white/[0.02] mb-4">
                                    <p className="text-white/70 text-sm mb-2">Don't have an OpenAPI spec?</p>
                                    <Link href="/docs/openapi-generation" className="text-emerald-400 hover:text-emerald-300 text-sm transition">
                                        Learn how to generate one from your framework →
                                    </Link>
                                </div>

                                <ol className="space-y-3 text-white/60 text-sm">
                                    <li className="flex gap-2">
                                        <span className="text-white/40">1.</span>
                                        Scroll down to the "OpenAPI Specs" section
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-white/40">2.</span>
                                        Click "Upload Spec"
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-white/40">3.</span>
                                        Select your openapi.json or openapi.yaml file
                                    </li>
                                </ol>
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                                    5
                                </span>
                                <h2 className="text-2xl font-semibold text-white">Generate Test Scenarios</h2>
                            </div>
                            <div className="pl-11">
                                <p className="text-white/60 mb-4">
                                    Our AI analyzes your OpenAPI spec to create realistic test scenarios that match real-world usage patterns.
                                </p>
                                <ol className="space-y-3 text-white/60 text-sm mb-4">
                                    <li className="flex gap-2">
                                        <span className="text-white/40">1.</span>
                                        Click "Generate Scenarios" (AI-powered, takes ~30 seconds)
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-white/40">2.</span>
                                        Review the generated scenarios - the system automatically saves them
                                    </li>
                                </ol>
                                <div className="card p-4 bg-white/[0.02]">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <div className="text-sm">
                                            <p className="text-white/70 font-medium mb-1">AI-Generated Scenarios</p>
                                            <p className="text-white/50">The AI identifies critical user flows (e.g., login → fetch data → update) and assigns realistic traffic weights to each endpoint.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 6 */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                                    6
                                </span>
                                <h2 className="text-2xl font-semibold text-white">Run Your First Test Suite</h2>
                            </div>
                            <div className="pl-11">
                                <p className="text-white/60 mb-4">
                                    A full test suite runs 4 different test profiles to thoroughly evaluate your API's performance and resilience.
                                </p>

                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    <div className="card p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-xs">🧪</span>
                                            <h4 className="text-white font-medium text-sm">Smoke Test</h4>
                                        </div>
                                        <p className="text-white/50 text-xs">3 VUs, 15 seconds - Basic health check under minimal load</p>
                                    </div>
                                    <div className="card p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-xs">📈</span>
                                            <h4 className="text-white font-medium text-sm">Ramp Test</h4>
                                        </div>
                                        <p className="text-white/50 text-xs">8 VUs ramping up, 20 seconds - Find breaking point gradually</p>
                                    </div>
                                    <div className="card p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-6 h-6 rounded bg-red-500/20 flex items-center justify-center text-xs">⚡</span>
                                            <h4 className="text-white font-medium text-sm">Spike Test</h4>
                                        </div>
                                        <p className="text-white/50 text-xs">10 VUs with sudden burst, 15 seconds - Test traffic spike resilience</p>
                                    </div>
                                    <div className="card p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-xs">💥</span>
                                            <h4 className="text-white font-medium text-sm">Chaos Test</h4>
                                        </div>
                                        <p className="text-white/50 text-xs">5 VUs with latency injection and errors, 20 seconds - Test resilience</p>
                                    </div>
                                </div>

                                <div className="card p-4 bg-emerald-500/5 border-emerald-500/20 mb-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <div className="text-sm">
                                            <p className="text-white/70 font-medium mb-1">Cost: ~20 credits per full suite</p>
                                            <p className="text-white/50">Your 50 free credits include 2 complete test suites.</p>
                                        </div>
                                    </div>
                                </div>

                                <ol className="space-y-3 text-white/60 text-sm">
                                    <li className="flex gap-2">
                                        <span className="text-white/40">1.</span>
                                        Select your scenario
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-white/40">2.</span>
                                        Click "Run Full Suite"
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-white/40">3.</span>
                                        Watch the tests execute in real-time (~70 seconds total)
                                    </li>
                                </ol>
                            </div>
                        </div>

                        {/* Step 7 */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                                    7
                                </span>
                                <h2 className="text-2xl font-semibold text-white">Analyze Results</h2>
                            </div>
                            <div className="pl-11">
                                <p className="text-white/60 mb-4">
                                    After your test suite completes, you'll get comprehensive insights powered by AI analysis.
                                </p>

                                <div className="space-y-3 mb-6">
                                    <div className="card p-4">
                                        <h4 className="text-white font-medium text-sm mb-2">📊 Performance Metrics</h4>
                                        <ul className="space-y-1 text-white/60 text-xs">
                                            <li>• Requests per second (RPS)</li>
                                            <li>• Latency percentiles (P50, P95, P99)</li>
                                            <li>• Error rates and status code distribution</li>
                                            <li>• Per-endpoint breakdown</li>
                                        </ul>
                                    </div>
                                    <div className="card p-4">
                                        <h4 className="text-white font-medium text-sm mb-2">🤖 AI Analysis</h4>
                                        <ul className="space-y-1 text-white/60 text-xs">
                                            <li>• Breaking point identification</li>
                                            <li>• Bottleneck detection (database, CPU, memory)</li>
                                            <li>• Production readiness verdict</li>
                                            <li>• Prioritized fix recommendations</li>
                                            <li>• Concurrent user capacity estimates</li>
                                        </ul>
                                    </div>
                                    <div className="card p-4">
                                        <h4 className="text-white font-medium text-sm mb-2">📈 Suite Comparison</h4>
                                        <ul className="space-y-1 text-white/60 text-xs">
                                            <li>• Best vs worst performing profiles</li>
                                            <li>• Resilience score across all tests</li>
                                            <li>• Specific recommendations per test type</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Next Steps */}
                    <div className="card p-8 mt-16 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
                        <h2 className="text-2xl font-semibold text-white mb-4">Next Steps</h2>
                        <div className="space-y-4 mb-6">
                            <Link href="/dashboard" className="block group">
                                <div className="flex items-center gap-3 text-white/80 hover:text-white transition">
                                    <span className="text-emerald-400">→</span>
                                    <span className="group-hover:translate-x-1 transition-transform">Go to Dashboard and create your first project</span>
                                </div>
                            </Link>
                            <Link href="/docs/openapi-generation" className="block group">
                                <div className="flex items-center gap-3 text-white/80 hover:text-white transition">
                                    <span className="text-emerald-400">→</span>
                                    <span className="group-hover:translate-x-1 transition-transform">Learn how to generate an OpenAPI spec</span>
                                </div>
                            </Link>
                            <Link href="/pricing" className="block group">
                                <div className="flex items-center gap-3 text-white/80 hover:text-white transition">
                                    <span className="text-emerald-400">→</span>
                                    <span className="group-hover:translate-x-1 transition-transform">View pricing and credit packages</span>
                                </div>
                            </Link>
                        </div>
                        <div className="pt-4 border-t border-white/10">
                            <p className="text-white/50 text-sm">
                                Need help? Check out our <Link href="/docs" className="text-emerald-400 hover:text-emerald-300">documentation</Link> or reach out to support.
                            </p>
                        </div>
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
