/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
  output: 'standalone',
}

module.exports = nextConfig
