/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: "/admin", destination: "/restaurante", permanent: false },
      { source: "/admin/login", destination: "/restaurante/login", permanent: false },
    ];
  },
}

export default nextConfig
