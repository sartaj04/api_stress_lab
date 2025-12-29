'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import Logo from '@/components/Logo';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await auth.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#111113' }}>
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex justify-center">
                        <Logo size="lg" />
                    </Link>
                    <p className="text-white/40 text-sm mt-4">Reset your password</p>
                </div>

                {success ? (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                        <div className="text-center">
                            <div className="mb-4">
                                <svg className="w-12 h-12 mx-auto text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-white text-lg font-medium mb-2">Check your email</h2>
                            <p className="text-white/60 text-sm mb-6">
                                If an account with that email exists, we have sent you a password reset link.
                            </p>
                            <Link href="/login" className="text-white hover:underline text-sm">
                                Back to login
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="text-red-400 text-sm text-center">{error}</div>
                        )}

                        <div>
                            <label className="block text-white/50 text-sm mb-2">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mt-6"
                        >
                            {loading ? 'Sending...' : 'Send reset link'}
                        </button>

                        <p className="text-center text-white/40 text-sm mt-6">
                            Remember your password?{' '}
                            <Link href="/login" className="text-white hover:underline">Sign in</Link>
                        </p>
                    </form>
                )}
            </div>
        </main>
    );
}

