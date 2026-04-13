import type { NextConfig } from "next";

const nextConfig:NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http', // ou 'https' 
        hostname: 'resto-api.test', // L'adresse de ton API Laravel
        port: '8000', //localhost 8000
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;
