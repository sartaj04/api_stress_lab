'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Logo from '@/components/Logo';
import DemoTest from '@/components/DemoTest';

export default function OpenApiPerformanceTesting() {
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
                        <Link href="#how-it-works" className="text-white/60 hover:text-white text-sm transition">
                            How It Works
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
                                href="#how-it-works"
                                className="block text-white/60 hover:text-white text-sm transition py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                How It Works
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

            {/* Hero - OpenAPI-focused */}
            <section className="pt-32 pb-12 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-block px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full mb-6">
                        Powered by OpenAPI / Swagger
                    </div>
                    <h1 className="text-5xl md:text-6xl font-semibold text-white mb-6" style={{ letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                        Already have an OpenAPI spec? Get load testing for free
                    </h1>
                    <p className="text-lg text-white/50 mb-8 max-w-2xl mx-auto">
                        Your OpenAPI spec contains everything we need to generate realistic load tests. Upload it, and our AI creates traffic scenarios that test every endpoint automatically. No manual scripting.
                    </p>
                    <div className="flex gap-4 justify-center mb-4">
                        <Link href="#demo" className="btn-primary">
                            Test with your spec
                        </Link>
                        <Link href="/docs/openapi-generation" className="btn-secondary">
                            Generate a spec
                        </Link>
                    </div>
                    <p className="text-sm text-emerald-400/80">
                        Works with OpenAPI 3.0+ and Swagger 2.0
                    </p>
                </div>
            </section>

            {/* OpenAPI Benefits */}
            <section className="pb-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-emerald-400 mb-2">Upload spec</div>
                            <div className="text-white/50 text-sm">YAML or JSON format</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-emerald-400 mb-2">AI generates</div>
                            <div className="text-white/50 text-sm">Realistic test scenarios</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 text-center">
                            <div className="text-3xl font-semibold text-emerald-400 mb-2">5 minutes</div>
                            <div className="text-white/50 text-sm">To full results</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Demo Test */}
            <DemoTest />

            {/* Divider */}
            <div className="divider" />

            {/* Feature Section 1 - What We Extract from OpenAPI */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Text */}
                        <div>
                            <span className="inline-block px-3 py-1 text-xs font-medium bg-white/10 text-white/70 rounded-full mb-4">
                                Spec-Driven Testing
                            </span>
                            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4" style={{ lineHeight: '1.2' }}>
                                Everything we learn<br />
                                <span className="text-white/60">from your OpenAPI spec</span>
                            </h2>
                            <p className="text-white/50 leading-relaxed mb-6">
                                Your OpenAPI spec is a goldmine of information. We extract endpoints, parameters, schemas, authentication methods, and response formats to generate comprehensive, realistic load tests automatically.
                            </p>
                            <p className="text-xs text-white/40 italic">
                                Works with OpenAPI 3.0+, Swagger 2.0, and auto-generated specs from FastAPI, NestJS, Spring Boot, and more.
                            </p>
                        </div>

                        {/* Right - Extracted Info Card */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">All endpoints & methods</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">GET, POST, PUT, DELETE — we test them all</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Request/response schemas</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">AI generates valid payloads automatically</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Authentication flows</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">API keys, Bearer tokens, OAuth — all supported</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-white font-medium text-sm">Endpoint relationships</span>
                                    </div>
                                    <p className="text-white/50 text-xs pl-5">Realistic user journeys (create → get → update → delete)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Section 2 - Example OpenAPI to Test Flow */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Code example */}
                        <div>
                            <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wide">Your OpenAPI Spec</h3>
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
                                {/* Terminal header */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08]">
                                    <span className="w-3 h-3 rounded-full bg-red-400/80"></span>
                                    <span className="w-3 h-3 rounded-full bg-yellow-400/80"></span>
                                    <span className="w-3 h-3 rounded-full bg-green-400/80"></span>
                                    <span className="text-white/40 text-xs ml-2">openapi.yaml</span>
                                </div>
                                {/* Code content */}
                                <div className="p-5 font-mono text-xs text-white/60 space-y-1">
                                    <div><span className="text-emerald-400">paths:</span></div>
                                    <div className="pl-3"><span className="text-white/80">/users:</span></div>
                                    <div className="pl-6"><span className="text-white/80">post:</span></div>
                                    <div className="pl-9"><span className="text-white/50">summary: Create user</span></div>
                                    <div className="pl-6"><span className="text-white/80">get:</span></div>
                                    <div className="pl-9"><span className="text-white/50">summary: List users</span></div>
                                    <div className="pl-3"><span className="text-white/80">/users/&#123;id&#125;:</span></div>
                                    <div className="pl-6"><span className="text-white/80">get:</span></div>
                                    <div className="pl-9"><span className="text-white/50">summary: Get user</span></div>
                                    <div className="pl-6"><span className="text-white/80">put:</span></div>
                                    <div className="pl-9"><span className="text-white/50">summary: Update user</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Right - Generated test flow */}
                        <div>
                            <h3 className="text-white/60 text-sm font-medium mb-3 uppercase tracking-wide">AI-Generated Test Scenarios</h3>
                            <div className="space-y-3">
                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-emerald-400 text-sm">✓</span>
                                        <span className="text-white font-medium text-sm">Scenario 1: User CRUD flow</span>
                                    </div>
                                    <div className="text-white/40 text-xs pl-5 space-y-1">
                                        <div>1. POST /users → create</div>
                                        <div>2. GET /users/&#123;id&#125; → verify</div>
                                        <div>3. PUT /users/&#123;id&#125; → update</div>
                                        <div>4. GET /users → list</div>
                                    </div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-emerald-400 text-sm">✓</span>
                                        <span className="text-white font-medium text-sm">Scenario 2: Bulk operations</span>
                                    </div>
                                    <div className="text-white/40 text-xs pl-5 space-y-1">
                                        <div>1. POST /users (×10) → batch create</div>
                                        <div>2. GET /users → paginate</div>
                                        <div>3. GET /users/&#123;id&#125; (random) → read</div>
                                    </div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-emerald-400 text-sm">✓</span>
                                        <span className="text-white font-medium text-sm">Scenario 3: Error handling</span>
                                    </div>
                                    <div className="text-white/40 text-xs pl-5 space-y-1">
                                        <div>1. GET /users/invalid → 404</div>
                                        <div>2. POST /users (bad data) → 400</div>
                                        <div>3. PUT /users/999 → 404</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="divider" />

            {/* Framework-specific info */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-semibold text-white mb-8 text-center">Works with any framework that generates OpenAPI specs</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-center">
                            <div className="text-white font-medium text-sm mb-1">FastAPI</div>
                            <div className="text-white/40 text-xs">Built-in OpenAPI</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-center">
                            <div className="text-white font-medium text-sm mb-1">NestJS</div>
                            <div className="text-white/40 text-xs">@nestjs/swagger</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-center">
                            <div className="text-white font-medium text-sm mb-1">Spring Boot</div>
                            <div className="text-white/40 text-xs">springdoc-openapi</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-center">
                            <div className="text-white font-medium text-sm mb-1">Express</div>
                            <div className="text-white/40 text-xs">swagger-jsdoc</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-center">
                            <div className="text-white font-medium text-sm mb-1">Django</div>
                            <div className="text-white/40 text-xs">drf-spectacular</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-center">
                            <div className="text-white font-medium text-sm mb-1">ASP.NET</div>
                            <div className="text-white/40 text-xs">Swashbuckle</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-center">
                            <div className="text-white font-medium text-sm mb-1">Rails</div>
                            <div className="text-white/40 text-xs">rswag</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-center">
                            <div className="text-white font-medium text-sm mb-1">Flask</div>
                            <div className="text-white/40 text-xs">flask-swagger-ui</div>
                        </div>
                    </div>
                    <div className="text-center mt-8">
                        <Link
                            href="/blog/why-every-api-needs-openapi-spec"
                            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                        >
                            Why every API needs an OpenAPI spec
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* How it works - Simple numbered steps */}
            <section id="how-it-works" className="py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-semibold text-white mb-12 text-center">From spec to insights in 3 steps</h2>

                    <div className="space-y-8">
                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">01</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Upload your OpenAPI spec (YAML or JSON)</h3>
                                <p className="text-white/40 text-sm">We parse your spec to understand endpoints, schemas, auth, and relationships.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">02</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">AI generates realistic test scenarios</h3>
                                <p className="text-white/40 text-sm">User journeys, traffic patterns, valid payloads — all automated from your spec.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <span className="text-white/20 font-semibold text-lg">03</span>
                            <div>
                                <h3 className="text-white font-medium mb-2">Run 4 test types automatically</h3>
                                <p className="text-white/40 text-sm">Baseline, ramp, spike, and chaos testing. Get results with specific performance insights.</p>
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
                            Don&apos;t have a spec? Learn how to generate one for your framework
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold text-white mb-4">Turn your OpenAPI spec into load tests in 5 minutes</h2>
                    <p className="text-white/40 mb-8">Free tier includes 5 test runs per month. No credit card required. Upload your spec and test your API today.</p>
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
                        <Link href="/blog/why-every-api-needs-openapi-spec" className="hover:text-white/50 transition">
                            Why OpenAPI Specs Matter
                        </Link>
                        <Link href="/docs/openapi-generation" className="hover:text-white/50 transition">
                            Generate OpenAPI Spec
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
