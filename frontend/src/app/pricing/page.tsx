import { Metadata } from 'next';
import PricingClient from '@/components/PricingClient';

export const metadata: Metadata = {
    title: 'Pricing - Pay-As-You-Go API Testing Credits',
    description: 'Simple, transparent pricing for API load testing. Pay only when you test. No subscriptions, no monthly fees. Free tier includes 50 credits. From $10 for 100 credits.',
    keywords: [
        'API testing pricing',
        'load testing cost',
        'API stress testing pricing',
        'pay as you go testing',
        'testing credits',
        'API testing free tier',
        'performance testing pricing',
    ],
    alternates: {
        canonical: 'https://apistresslab.com/pricing',
    },
    openGraph: {
        title: 'Pricing - Pay-As-You-Go API Testing',
        description: 'Simple pricing for API load testing. Pay only when you test. Free tier available.',
        url: 'https://apistresslab.com/pricing',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Pricing - Pay-As-You-Go API Testing',
        description: 'Simple pricing for API load testing. Pay only when you test. Free tier available.',
    },
};

export default function PricingPage() {
    return <PricingClient />;
}
