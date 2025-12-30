import { getAllPosts } from '@/lib/blog'

export async function GET() {
  const posts = await getAllPosts()

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>API Stress Lab Blog</title>
    <link>https://apistresslab.com/blog</link>
    <description>Insights on API testing, performance optimization, and building scalable systems</description>
    <language>en-us</language>
    <atom:link href="https://apistresslab.com/blog/rss.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <title>${post.title}</title>
      <link>https://apistresslab.com/blog/${post.slug}</link>
      <description>${post.description}</description>
      <pubDate>${new Date(post.publishedDate).toUTCString()}</pubDate>
      <guid>https://apistresslab.com/blog/${post.slug}</guid>
      <category>${post.category}</category>
    </item>
    `
      )
      .join('')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
