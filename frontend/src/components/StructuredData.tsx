export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'API Stress Lab',
    url: 'https://apistresslab.com',
    logo: 'https://apistresslab.com/logo.png',
    description:
      'AI-powered API capacity assessment. Discover exactly where your API breaks, what fails first, and what to fix before users encounter problems.',
    foundingDate: '2025',
    sameAs: [
      // Add social media URLs when available
      // 'https://twitter.com/apistresslab',
      // 'https://linkedin.com/company/apistresslab',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'API Stress Lab',
    url: 'https://apistresslab.com',
    description:
      'AI-powered API load testing and capacity assessment. Find your API breaking point before users do.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://apistresslab.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'API Stress Lab',
    applicationCategory: 'DeveloperApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier with 50 credits for new users',
    },
    operatingSystem: 'Web',
    description:
      'AI-powered API load testing and capacity assessment tool. Find your API breaking point, identify bottlenecks, and fix performance issues before launch.',
    featureList: [
      'AI-generated realistic traffic scenarios',
      'OpenAPI specification-based testing',
      'Breaking point detection',
      'Bottleneck identification',
      'Performance metrics analysis',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQSchema({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function HowToSchema({
  name,
  description,
  steps,
}: {
  name: string
  description: string
  steps: Array<{ name: string; text: string }>
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step) => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BlogPostSchema({
  post,
}: {
  post: {
    title: string
    description: string
    publishedDate: string
    author: string
    slug: string
    ogImage?: string
  }
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedDate,
    dateModified: post.publishedDate,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'API Stress Lab',
      logo: {
        '@type': 'ImageObject',
        url: 'https://apistresslab.com/logo.png',
      },
    },
    image: post.ogImage || 'https://apistresslab.com/og-image-blog.png',
    url: `https://apistresslab.com/blog/${post.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://apistresslab.com/blog/${post.slug}`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
