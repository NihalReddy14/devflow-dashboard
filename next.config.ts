import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@aws-amplify/backend', '@aws-amplify/backend-cli'],
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude aws-cdk and aws-sdk from client bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'aws-cdk-lib': 'aws-cdk-lib',
        '@aws-cdk/core': '@aws-cdk/core',
        'aws-sdk': 'aws-sdk',
        '@aws-sdk/client-ssm': '@aws-sdk/client-ssm',
        '@aws-sdk/client-cloudformation': '@aws-sdk/client-cloudformation',
      });
    }
    
    // Handle the problematic JSON files
    config.module.rules.push({
      test: /sdk-v2-to-v3\.json$/,
      loader: 'ignore-loader'
    });
    
    config.module.rules.push({
      test: /sdk-v3-metadata\.json$/,
      loader: 'ignore-loader'
    });

    return config;
  },
};

export default nextConfig;
