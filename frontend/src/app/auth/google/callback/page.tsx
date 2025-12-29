'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function GoogleCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { handleGoogleCallback } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);
    const hasRun = useRef(false);

    useEffect(() => {
        // Prevent double-execution in React strict mode
        if (hasRun.current) return;
        hasRun.current = true;

        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError('Google sign-in was cancelled or failed');
            setDebugInfo(`Error from Google: ${errorParam}`);
            return;
        }

        if (!code) {
            setError('No authorization code received');
            return;
        }

        setDebugInfo('Exchanging code with backend...');

        handleGoogleCallback(code)
            .then(() => {
                setDebugInfo('Success! Redirecting...');
                router.push('/dashboard');
            })
            .catch((err) => {
                console.error('Google auth error:', err);
                setError(err.message || 'Failed to sign in with Google');
                setDebugInfo(`Backend error: ${err.message}`);
            });
    }, [searchParams, handleGoogleCallback, router]);

    return (
        <main className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
            <div className="text-center max-w-md px-6">
                {error ? (
                    <div>
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M15 9l-6 6M9 9l6 6" />
                            </svg>
                        </div>
                        <p className="text-red-400 mb-2">{error}</p>
                        {debugInfo && (
                            <p className="text-white/30 text-xs mb-4 font-mono break-all">{debugInfo}</p>
                        )}
                        <a 
                            href="/login" 
                            className="text-white/60 hover:text-white text-sm transition"
                        >
                            ← Back to login
                        </a>
                    </div>
                ) : (
                    <div>
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="animate-spin">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
                                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white" />
                            </svg>
                        </div>
                        <p className="text-white/60 text-sm">Signing in with Google...</p>
                        {debugInfo && (
                            <p className="text-white/30 text-xs mt-2 font-mono">{debugInfo}</p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

