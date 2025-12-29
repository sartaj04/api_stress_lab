'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuiteRedirectPage({ params }: { params: { id: string } }) {
    const router = useRouter();

    useEffect(() => {
        // This page is deprecated - redirect to project dashboard
        // The suite ID is in the URL, but we need the project ID
        // For now, just redirect to main dashboard and let user navigate
        router.push('/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
            <div className="text-white/40">Redirecting...</div>
        </div>
    );
}
