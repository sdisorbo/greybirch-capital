

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.mlbstatic.com" },
      { protocol: "https", hostname: "img.mlbstatic.com" },
    ],
  },
};

export default nextConfig;
