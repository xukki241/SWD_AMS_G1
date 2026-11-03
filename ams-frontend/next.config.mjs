/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  // Allow CI (and local verification) to build into an isolated directory so a
  // cached `.next` from another run is never touched.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
