import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    }
  },
  //configurar images
 
  images: {
    domains: [
      "kexfmzgscbwkhzrswidl.supabase.co"
    ]
  }
};

export default nextConfig;
