/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: [
    '@whiskeysockets/baileys',
    'jimp',
    'link-preview-js',
    '@hapi/boom',
    'pino',
  ],
  webpack: (config) => {
    config.externals = [...config.externals, 'keyv'];
    return config;
  },
};

export default config; 