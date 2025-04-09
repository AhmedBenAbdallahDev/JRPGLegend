/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d1geqzmavzu3y.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "screenscraper.fr",
      },
      {
        protocol: "https",
        hostname: "**.screenscraper.fr",
      },
      {
        protocol: "https",
        hostname: "neoclone.screenscraper.fr",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
