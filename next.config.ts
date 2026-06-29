import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      {
        source: "/noam-bar-mitzvah",
        destination: "/e/noam-bar-mitzvah",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
