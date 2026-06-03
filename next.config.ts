import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "bcryptjs", "@node-rs/argon2"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
