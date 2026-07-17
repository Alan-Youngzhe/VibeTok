import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  serverExternalPackages: ["node:sqlite"],
};

export default nextConfig;
