import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 images: {
    domains: ["kexfmzgscbwkhzrswidl.supabase.co"]
 },
 experimental: {
  serverActions: {
    bodySizeLimit: '5mb',
  }
 }
};

export default nextConfig;
