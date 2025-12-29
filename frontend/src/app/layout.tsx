import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'API Performance Testing - Find Breaking Points Before Launch',
    description: 'AI-powered API capacity assessment. Discover exactly where your API breaks, what fails first, and what to fix before users encounter problems. Realistic traffic scenarios from your OpenAPI spec.',
    keywords: 'API load testing, API stress testing, realistic traffic simulation, API breaking point, performance bottleneck detection, pre-launch performance testing, API scalability testing',
    openGraph: {
        title: 'API Performance Testing - Find Breaking Points Before Launch',
        description: 'AI-powered API capacity assessment. Discover exactly where your API breaks, what fails first, and what to fix before users encounter problems. Realistic traffic scenarios from your OpenAPI spec.',
    },
    icons: {
        icon: [
            { url: '/favicon/favicon.ico', sizes: 'any' },
            { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [
            { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    },
    manifest: '/favicon/site.webmanifest',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
