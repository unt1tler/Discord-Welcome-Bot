/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "**",
      },
    ],
    dangerouslyAllowSVG: true, // Add this line to allow SVG images
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Add this for security
  },
}

module.exports = nextConfig

