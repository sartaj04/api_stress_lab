import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

const contentDirectory = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  publishedDate: string
  author: string
  authorTitle: string
  category: string
  keywords: string
  readTime: string
  ogImage?: string
  content: any
}

export async function getAllPosts(): Promise<BlogPost[]> {
  // Create directory if it doesn't exist
  if (!fs.existsSync(contentDirectory)) {
    return []
  }

  const files = fs.readdirSync(contentDirectory)

  const posts = files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const slug = file.replace('.mdx', '')
      const filePath = path.join(contentDirectory, file)
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContent)
      const stats = readingTime(content)

      return {
        slug,
        title: data.title,
        description: data.description,
        date: new Date(data.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        publishedDate: data.date,
        author: data.author,
        authorTitle: data.authorTitle,
        category: data.category,
        keywords: data.keywords,
        readTime: stats.text,
        ogImage: data.ogImage,
        content: null,
      }
    })
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())

  return posts
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(contentDirectory, `${slug}.mdx`)

    if (!fs.existsSync(filePath)) {
      return null
    }

    const fileContent = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContent)
    const stats = readingTime(content)

    return {
      slug,
      title: data.title,
      description: data.description,
      date: new Date(data.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      publishedDate: data.date,
      author: data.author,
      authorTitle: data.authorTitle,
      category: data.category,
      keywords: data.keywords,
      readTime: stats.text,
      ogImage: data.ogImage,
      content: content,
    }
  } catch (error) {
    console.error('Error loading blog post:', error)
    return null
  }
}
