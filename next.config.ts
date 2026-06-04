import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "bcryptjs", "@node-rs/argon2", "sharp", "mbbank", "jimp"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
