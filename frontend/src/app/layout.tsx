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
