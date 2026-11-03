import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Individual high-resolution watercolor assets get responsive, high-quality delivery.
  images: { qualities: [75, 90] },
};

export default nextConfig;
