import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Load Testing Tools - AI-Powered vs Traditional (k6, JMeter)',
  description: 'Skip the k6/JMeter learning curve. AI-powered API load testing without scripting. Upload your OpenAPI spec and get results in 5 minutes. Compare tools and pricing.',
  keywords: [
    'api load testing tools',
    'api stress testing software',
    'k6 alternative',
    'jmeter alternative',
    'load testing comparison',
    'api performance testing tools',
    'ai-powered load testing',
  ],
  alternates: {
    canonical: 'https://apistresslab.com/api-load-testing-tools',
  },
  openGraph: {
    title: 'API Load Testing Tools - AI-Powered vs Traditional',
    description: 'No scripting required. AI-powered load testing from your OpenAPI spec. Compare vs k6, JMeter, Locust.',
    type: 'website',
    url: 'https://apistresslab.com/api-load-testing-tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Load Testing Tools - AI-Powered vs Traditional',
    description: 'No scripting required. AI-powered load testing from your OpenAPI spec.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
