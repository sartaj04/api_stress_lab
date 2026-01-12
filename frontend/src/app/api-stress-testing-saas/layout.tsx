import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Stress Testing for SaaS - Scale Without Downtime',
  description: 'Production-grade API stress testing for growing SaaS companies. Capacity planning, infrastructure ROI analysis, and continuous performance testing. Volume pricing available.',
  keywords: [
    'saas api testing',
    'api capacity planning',
    'saas stress testing',
    'production api testing',
    'enterprise load testing',
    'saas performance testing',
    'api scalability testing',
  ],
  alternates: {
    canonical: 'https://apistresslab.com/api-stress-testing-saas',
  },
  openGraph: {
    title: 'API Stress Testing for SaaS - Scale Without Downtime',
    description: 'Production-grade testing for SaaS companies. Capacity planning, infrastructure ROI, continuous testing.',
    type: 'website',
    url: 'https://apistresslab.com/api-stress-testing-saas',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Stress Testing for SaaS - Scale Without Downtime',
    description: 'Production-grade testing for SaaS. Capacity planning and infrastructure ROI analysis.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
