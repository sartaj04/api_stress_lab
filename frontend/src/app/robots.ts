import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://apistresslab.com' // Update with your actual domain

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/projects/',
          '/projects/*',
          '/runs/',
          '/runs/*',
          '/suites/',
          '/suites/*',
          '/auth/',
          '/auth/*',
          '/api/',
          '/api/*',
          '/verify-email',
          '/reset-password',
          '/forgot-password',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
