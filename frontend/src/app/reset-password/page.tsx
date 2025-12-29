'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import Logo from '@/components/Logo';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (!tokenParam) {
            setError('Invalid reset link. Please request a new password reset.');
        } else {
            setToken(tokenParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!token) {
            setError('Invalid reset token');
            return;
        }

        setLoading(true);

        try {
            await auth.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#111113' }}>
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex justify-center">
                            <Logo size="lg" />
                        </Link>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                        <div className="text-center">
                            <div className="mb-4">
                                <svg className="w-12 h-12 mx-auto text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-white text-lg font-medium mb-2">Password reset successful</h2>
                            <p className="text-white/60 text-sm">
                                Redirecting to login...
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#111113' }}>
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex justify-center">
                        <Logo size="lg" />
                    </Link>
                    <p className="text-white/40 text-sm mt-4">Create a new password</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="text-red-400 text-sm text-center">{error}</div>
                    )}

                    <div>
                        <label className="block text-white/50 text-sm mb-2">New Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            required
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label className="block text-white/50 text-sm mb-2">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            required
                            minLength={8}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="btn-primary w-full mt-6"
                    >
                        {loading ? 'Resetting...' : 'Reset password'}
                    </button>

                    <p className="text-center text-white/40 text-sm mt-6">
                        <Link href="/login" className="text-white hover:underline">Back to login</Link>
                    </p>
                </form>
            </div>
        </main>
    );
}

