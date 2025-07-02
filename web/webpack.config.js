const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      main: './js/main.js',
      'swissknife-browser': './js/swissknife-browser.js'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[contenthash].js',
      clean: true,
      publicPath: './',
    },
    
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        fallback: {
          "buffer": require.resolve("buffer"),
          "crypto": require.resolve("crypto-browserify"),
          "stream": require.resolve("stream-browserify"),
          "process": require.resolve("process/browser"),
          "path": require.resolve("path-browserify"),
          "os": require.resolve("os-browserify"),
          "util": require.resolve("util"),
          "fs": false,
          "child_process": false,
          "worker_threads": false,
          "tty": false,
          "net": false,
          "http": false,
          "https": false,
          "url": false,
          "querystring": false,
          "zlib": false
        },
        alias: {
          // Map source paths to web-compatible versions
          '@swissknife/core': path.resolve(__dirname, '../src'),
          '@swissknife/ai': path.resolve(__dirname, '../src/ai'),
          '@swissknife/tasks': path.resolve(__dirname, '../src/tasks'),
          '@swissknife/storage': path.resolve(__dirname, '../src/storage'),
          '@swissknife/utils': path.resolve(__dirname, '../src/utils'),
        }
      },
    
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: path.resolve(__dirname, 'tsconfig.web.json'),
                transpileOnly: true
              }
            }
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.worker\.js$/,
          use: { loader: 'worker-loader' },
        },
      ],
    },
    
    plugins: [
      new HtmlWebpackPlugin({
        template: './template.html',
        filename: 'index.html',
        inject: 'body',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        } : false,
      }),
      
      new CopyWebpackPlugin({
        patterns: [
          { from: 'css', to: 'css' },
          { from: 'assets', to: 'assets', noErrorOnMissing: true },
          { from: 'favicon.ico', to: 'favicon.ico', noErrorOnMissing: true },
        ],
      }),
      
      // Provide global variables for Node.js compatibility
      new (require('webpack')).ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
      
      // Define environment variables
      new (require('webpack')).DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode),
        'process.env.BROWSER': JSON.stringify(true),
        'global': 'globalThis',
      }),
    ],
    
    optimization: isProduction ? {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          swissknife: {
            test: /[\\/]src[\\/]/,
            name: 'swissknife-core',
            chunks: 'all',
            enforce: true,
          },
        },
      },
    } : {
      splitChunks: {
        chunks: 'all',
      },
    },
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
        watch: false,
      },
      compress: true,
      port: 8080,
      hot: false,
      liveReload: false,
      open: false,
      historyApiFallback: true,
      allowedHosts: 'all',
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    target: 'web',
    
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 2000000, // 2MB
      maxAssetSize: 2000000, // 2MB
    },
  };
};
