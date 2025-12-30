import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '@/lib/blog'
import Logo from '@/components/Logo'
import { BlogPostSchema } from '@/components/StructuredData'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return {}
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: {
      canonical: `https://apistresslab.com/blog/${params.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedDate,
      authors: [post.author],
      url: `https://apistresslab.com/blog/${params.slug}`,
      images: [post.ogImage || '/og-image-blog.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.ogImage || '/twitter-image-blog.png'],
    },
  }
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen" style={{ background: '#111113' }}>
      <BlogPostSchema post={post} />

      <nav className="nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <Link href="/blog" className="text-white/60 hover:text-white text-sm transition">
            All Posts
          </Link>
        </div>
      </nav>

      <article className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="text-emerald-400 hover:text-emerald-300 text-sm mb-6 inline-flex items-center gap-2 transition"
          >
            ← Back to Blog
          </Link>

          <header className="mb-12">
            <div className="flex items-center gap-4 text-sm mb-4">
              <span className="text-emerald-400">{post.category}</span>
              <span className="text-white/40">•</span>
              <time className="text-white/40">{post.date}</time>
              <span className="text-white/40">•</span>
              <span className="text-white/40">{post.readTime}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4">
              {post.title}
            </h1>

            <p className="text-xl text-white/60">
              {post.description}
            </p>

            <div className="flex items-center gap-3 mt-6">
              <div className="text-sm">
                <div className="text-white font-medium">{post.author}</div>
                <div className="text-white/40">{post.authorTitle}</div>
              </div>
            </div>
          </header>

          <div className="prose prose-invert prose-emerald max-w-none
            prose-headings:font-semibold prose-headings:text-white
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-white/70 prose-p:leading-relaxed
            prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:text-emerald-300
            prose-strong:text-white prose-strong:font-semibold
            prose-code:text-emerald-400 prose-code:bg-white/[0.05] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/[0.08]
            prose-ul:text-white/70 prose-ol:text-white/70
            prose-li:marker:text-emerald-400
            prose-blockquote:border-l-emerald-400 prose-blockquote:text-white/60
          ">
            <MDXRemote
              source={post.content}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [[rehypePrettyCode, { theme: 'github-dark' }]],
                },
              }}
            />
          </div>

          <footer className="mt-16 pt-8 border-t border-white/[0.08]">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">Ready to test your API?</h3>
              <p className="text-white/60 text-sm mb-4">
                Find your API breaking point before your users do. Get started with 50 free credits.
              </p>
              <Link href="/signup" className="btn-primary inline-block">
                Start Testing Free
              </Link>
            </div>
          </footer>
        </div>
      </article>

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
