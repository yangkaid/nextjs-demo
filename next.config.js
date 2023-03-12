/** @type {import('next').NextConfig} */
const WindiCSSWebpackPlugin = require('windicss-webpack-plugin')
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      //接口请求 前缀带上/api-text/
      { source: '/api/:path*', destination: `https://raasr.xfyun.cn/v2/:path*` },

    ]
  },
  webpack: (config) => {
    config.plugins.push(new WindiCSSWebpackPlugin())
    return config
  }

}

module.exports = nextConfig
