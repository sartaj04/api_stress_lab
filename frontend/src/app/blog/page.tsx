import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import Logo from '@/components/Logo'

export const metadata: Metadata = {
  title: 'Blog - API Testing Insights, Tutorials & Best Practices',
  description: 'Expert insights on API load testing, performance optimization, and startup scaling. Learn how to test APIs, prevent outages, and launch with confidence.',
  keywords: [
    'API testing blog',
    'load testing tutorials',
    'performance testing guides',
    'API optimization',
    'startup scaling',
    'API best practices',
  ],
  alternates: {
    canonical: 'https://apistresslab.com/blog',
  },
  openGraph: {
    title: 'Blog - API Testing Insights & Tutorials',
    description: 'Expert insights on API testing, performance optimization, and scaling.',
    url: 'https://apistresslab.com/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - API Testing Insights & Tutorials',
    description: 'Expert insights on API testing, performance optimization, and scaling.',
  },
}

export default async function BlogPage() {
  const posts = await getAllPosts()

  return (
    <main className="min-h-screen" style={{ background: '#111113' }}>
      <nav className="nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="text-white/60 hover:text-white text-sm transition">
              Docs
            </Link>
            <Link href="/pricing" className="text-white/60 hover:text-white text-sm transition">
              Pricing
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4">
            Blog
          </h1>
          <p className="text-white/50 text-lg mb-12">
            Insights on API testing, performance optimization, and building scalable systems
          </p>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/40 mb-4">No blog posts yet. Check back soon!</p>
              <Link href="/" className="text-emerald-400 hover:text-emerald-300 transition">
                Return to Home
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition group"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition">
                      {post.title}
                    </h2>
                    <time className="text-white/40 text-sm flex-shrink-0">
                      {post.date}
                    </time>
                  </div>
                  <p className="text-white/60 mb-4">{post.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-emerald-400">{post.category}</span>
                    <span className="text-white/40">{post.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-white/30 text-sm">API Stress Lab</span>
          <div className="flex flex-wrap gap-4 md:gap-6 text-white/30 text-sm justify-center">
            <Link href="/docs" className="hover:text-white/50 transition">
              Documentation
            </Link>
            <Link href="/blog" className="hover:text-white/50 transition">
              Blog
            </Link>
            <Link href="/pricing" className="hover:text-white/50 transition">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
