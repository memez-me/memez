/** @type {import("next").NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  images: { unoptimized: true },
};

function assertEnvVar(name) {
  if (!process.env[name]) {
    throw new Error(`${name} environment variable is not set`);
  }
}

assertEnvVar('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');

module.exports = nextConfig;
