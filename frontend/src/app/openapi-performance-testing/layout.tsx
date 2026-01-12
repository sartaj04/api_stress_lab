import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OpenAPI Performance Testing - Turn Your Spec Into Load Tests',
  description: 'Already have an OpenAPI spec? Get automated load testing for free. AI generates realistic test scenarios from your spec. Works with Swagger, FastAPI, NestJS, Spring Boot.',
  keywords: [
    'openapi load testing',
    'swagger performance testing',
    'openapi stress testing',
    'swagger load testing',
    'api spec testing',
    'openapi 3.0 testing',
    'automated api testing',
  ],
  alternates: {
    canonical: 'https://apistresslab.com/openapi-performance-testing',
  },
  openGraph: {
    title: 'OpenAPI Performance Testing - Turn Your Spec Into Load Tests',
    description: 'Upload your OpenAPI spec, get AI-generated load tests in 5 minutes. No scripting required.',
    type: 'website',
    url: 'https://apistresslab.com/openapi-performance-testing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenAPI Performance Testing - Turn Your Spec Into Load Tests',
    description: 'Upload your OpenAPI spec, get AI-generated load tests in 5 minutes.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
