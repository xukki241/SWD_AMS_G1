/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  // Allow CI (and local verification) to build into an isolated directory so a
  // cached `.next` from another run is never touched.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Firebase Google popup needs opener access (default same-origin blocks it).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
    ]
  },
};

export default nextConfig;
