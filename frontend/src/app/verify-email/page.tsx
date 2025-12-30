'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { auth } from '@/lib/api';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'already_verified'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. Please check your email for the correct link.');
                return;
            }

            try {
                const result = await auth.verifyEmail(token);

                if (result.already_verified) {
                    setStatus('already_verified');
                    setMessage('Your email is already verified.');
                } else {
                    setStatus('success');
                    setMessage(result.message);
                }

                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Failed to verify email. The link may be expired or invalid.');
            }
        };

        verifyEmail();
    }, [token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
            <div className="max-w-md w-full mx-auto px-6">
                <div className="text-center mb-8">
                    <Link href="/">
                        <Logo size="lg" />
                    </Link>
                </div>

                <div className="card p-8">
                    {status === 'verifying' && (
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mb-4"></div>
                            <h2 className="text-xl font-semibold text-white mb-2">Verifying your email...</h2>
                            <p className="text-white/60 text-sm">Please wait a moment</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-4">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-2">Email verified successfully!</h2>
                            <p className="text-white/60 text-sm mb-6">{message}</p>
                            <p className="text-white/40 text-xs">Redirecting to dashboard...</p>
                        </div>
                    )}

                    {status === 'already_verified' && (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4">
                                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-2">Already verified</h2>
                            <p className="text-white/60 text-sm mb-6">{message}</p>
                            <p className="text-white/40 text-xs">Redirecting to dashboard...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-2">Verification failed</h2>
                            <p className="text-white/60 text-sm mb-6">{message}</p>
                            <div className="flex flex-col gap-3">
                                <Link href="/dashboard" className="btn-primary text-sm">
                                    Go to Dashboard
                                </Link>
                                <p className="text-white/40 text-xs">
                                    You can request a new verification link from your dashboard
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center mt-6">
                    <Link href="/dashboard" className="text-white/40 hover:text-white text-sm transition">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
