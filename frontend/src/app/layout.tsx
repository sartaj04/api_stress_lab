import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { OrganizationSchema, WebsiteSchema, SoftwareApplicationSchema } from '@/components/StructuredData';
import GoogleAnalytics from '@/components/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    metadataBase: new URL('https://apistresslab.com'),
    title: {
        default: 'API Stress Lab - Know Where Your API Breaks Before Users Do',
        template: '%s | API Stress Lab',
    },
    description: 'AI-powered API load testing and capacity assessment. Find your API breaking point, identify bottlenecks, and fix performance issues before launch. Realistic traffic scenarios from your OpenAPI spec.',
    keywords: [
        'API load testing',
        'API stress testing',
        'API performance testing',
        'API capacity testing',
        'load testing tool',
        'stress testing software',
        'API breaking point',
        'performance bottleneck detection',
        'API scalability testing',
        'realistic traffic simulation',
        'OpenAPI testing',
        'MVP launch testing',
        'pre-launch performance testing',
        'API health check',
        'backend testing',
        'API capacity assessment',
    ],
    authors: [{ name: 'API Stress Lab' }],
    creator: 'API Stress Lab',
    publisher: 'API Stress Lab',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://apistresslab.com',
        siteName: 'API Stress Lab',
        title: 'API Stress Lab - Know Where Your API Breaks Before Users Do',
        description: 'AI-powered API capacity assessment. Discover exactly where your API breaks, what fails first, and what to fix before users encounter problems.',
        images: [
            {
                url: '/og-image.png',
                width: 1014,
                height: 653,
                alt: 'API Stress Lab - AI-Powered API Testing',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'API Stress Lab - Know Where Your API Breaks Before Users Do',
        description: 'AI-powered API capacity assessment. Find breaking points before users do.',
        images: ['/twitter-image.png'],
        // creator: '@apistresslab', // Add when Twitter exists
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: 'https://apistresslab.com',
    },
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        shortcut: '/favicon.ico',
        apple: [
            { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
        other: [
            {
                rel: 'mask-icon',
                url: '/favicon/favicon-32x32.png',
                color: '#10b981',
            },
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
                <GoogleAnalytics />
                <OrganizationSchema />
                <WebsiteSchema />
                <SoftwareApplicationSchema />
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
