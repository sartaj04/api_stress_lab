import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Testing for Startups - Prevent Launch Day Disasters',
  description: 'Don\'t let a launch day outage kill your startup momentum. Find critical API bottlenecks before you launch with AI-powered load testing. 5 free test runs per month.',
  keywords: [
    'api testing for startups',
    'mvp api testing',
    'pre-launch api testing',
    'startup load testing',
    'product hunt launch testing',
    'api performance testing',
    'startup infrastructure testing',
  ],
  alternates: {
    canonical: 'https://apistresslab.com/api-testing-for-startups',
  },
  openGraph: {
    title: 'API Testing for Startups - Prevent Launch Day Disasters',
    description: 'Find critical API bottlenecks before you launch. AI-powered load testing in 5 minutes. Free tier for startups.',
    type: 'website',
    url: 'https://apistresslab.com/api-testing-for-startups',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Testing for Startups - Prevent Launch Day Disasters',
    description: 'Find critical API bottlenecks before you launch. AI-powered load testing in 5 minutes.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
