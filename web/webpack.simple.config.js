const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './js/main.js',
  mode: 'development',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: './',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.web.json'),
            transpileOnly: true,
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      // Direct aliases to the SwissKnife TypeScript source
      '@swissknife': path.resolve(__dirname, '../src'),
      '@core': path.resolve(__dirname, '../src/core'),
      '@ai': path.resolve(__dirname, '../src/ai'),
      '@tasks': path.resolve(__dirname, '../src/tasks'),
      '@storage': path.resolve(__dirname, '../src/storage'),
      '@utils': path.resolve(__dirname, '../src/utils'),
      '@types': path.resolve(__dirname, '../src/types'),
      '@config': path.resolve(__dirname, '../src/config'),
      '@cli': path.resolve(__dirname, '../src/cli'),
      '@services': path.resolve(__dirname, '../src/services'),
      '@models': path.resolve(__dirname, '../src/models'),
      '@commands': path.resolve(__dirname, '../src/commands'),
    },
    fallback: {
      "path": require.resolve("path-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util"),
      "buffer": require.resolve("buffer"),
      "process": require.resolve("process/browser"),
      "os": require.resolve("os-browserify/browser"),
      "fs": false,
      "child_process": false,
      "net": false,
      "tls": false,
      "worker_threads": false,
      "module": false,
      "cluster": false,
      "readline": false,
      "repl": false,
      "tty": false,
      "v8": false,
      "vm": false,
      "dns": false,
      "http": false,
      "https": false,
      "zlib": false,
      "url": false,
      "querystring": false,
      "events": require.resolve("events"),
      "assert": false,
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: 'body',
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.BROWSER': JSON.stringify('true'),
      'global': 'globalThis',
    }),
  ],
  devtool: 'eval-source-map',
  target: 'web',
};
