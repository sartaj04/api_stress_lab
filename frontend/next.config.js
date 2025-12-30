const withMDX = require('@next/mdx')({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins: [require('remark-gfm')],
        rehypePlugins: [
            require('rehype-slug'),
            require('rehype-autolink-headings'),
            [require('rehype-pretty-code'), { theme: 'github-dark' }],
        ],
    },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
}

module.exports = withMDX(nextConfig)
