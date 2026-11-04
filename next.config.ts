/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const githubPagesBasePath = process.env.GITHUB_PAGES_BASE_PATH || '/inp-proyecto2.0'

const nextConfig = {
  ...(isGitHubPages && {
    output: 'export',
    basePath: githubPagesBasePath,
    trailingSlash: true,
  }),
  images: {
    unoptimized: isGitHubPages,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'imagenes-inp-aws.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'imagenes-inp-aws.s3.us-east-1.amazonaws.com',
      },
    ],
  },
  ...(!isGitHubPages && { output: 'standalone' }),
}

module.exports = nextConfig
