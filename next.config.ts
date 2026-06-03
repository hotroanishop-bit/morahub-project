import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "bcryptjs", "@node-rs/argon2"],
};

export default nextConfig;
