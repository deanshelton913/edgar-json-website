import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds to prevent deployment failures
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', 'redis', '@redis/client'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only modules for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        url: false,
        timers: false,
        'timers/promises': false,
      };
      
      // Exclude Redis modules from client bundles
      config.externals = config.externals || [];
      config.externals.push({
        'redis': 'redis',
        '@redis/client': '@redis/client',
      });
      
      // Ignore Redis-related modules during client-side bundling
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\.(ts|tsx|js|jsx)$/,
        include: [
          /node_modules\/redis/,
          /node_modules\/@redis/,
          /src\/services\/RedisConnectionManager/,
          /src\/services\/CredentialCachingService/,
          /src\/services\/rate-limiting\/RedisRateLimitService/,
          /src\/services\/rate-limiting\/UsageTrackingService/,
          /src\/services\/ApiKeyCacheService/,
          /src\/services\/authorizers\/GoogleAuthenticationService/,
          /src\/lib\/server-container/,
        ],
        use: 'null-loader',
      });
    }
    
    return config;
  },
  env: {
    // Make sure environment variables are available on both client and server
    NEXT_PUBLIC_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  },
};

export default nextConfig;
