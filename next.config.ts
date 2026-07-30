import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // minimal runtime image for self-hosted Docker (Coolify)
};

export default nextConfig;
