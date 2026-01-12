import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pre-Launch API Testing - Launch with Confidence',
  description: 'Test your API before launch day. Find critical bottlenecks, verify infrastructure limits, and prevent outages. Complete pre-launch checklist in 5 minutes. Free tier available.',
  keywords: [
    'pre-launch api testing',
    'launch day checklist',
    'api launch preparation',
    'pre-launch performance testing',
    'startup launch testing',
    'mvp launch checklist',
    'api launch readiness',
  ],
  alternates: {
    canonical: 'https://apistresslab.com/pre-launch-api-testing',
  },
  openGraph: {
    title: 'Pre-Launch API Testing - Launch with Confidence',
    description: 'Test your API before users do. Find bottlenecks, verify limits, prevent disasters. 5-minute testing.',
    type: 'website',
    url: 'https://apistresslab.com/pre-launch-api-testing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pre-Launch API Testing - Launch with Confidence',
    description: 'Test your API before users do. Complete launch checklist in 5 minutes.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
