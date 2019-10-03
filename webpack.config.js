const { join } = require('path');
const { BannerPlugin, DefinePlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const constants = require('./constants');

module.exports = env => {
  const isProd = env === 'production';

  return {
    mode: isProd ? 'production' : 'development',

    devtool: isProd ? undefined : 'inline-source-map',

    entry: {
      server: ['src/server.ts'],
      client: ['src/client.ts'],
    },

    output: {
      path: join(__dirname, 'app'),
    },

    watch: !isProd,

    module: {
      rules: [
        {
          test: /\.(png|jpg|gif|jpeg|svg|woff|woff2|ttf|eot|ico)$/,
          use: {
            loader: 'file-loader',
            options: {
              name: '[name]-[hash].[ext]',
              outputPath: 'img',
              publicPath: './img',
            },
          },
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.json',
            },
          },
        },
      ],
    },

    plugins: [
      new DefinePlugin({
        ...(() => {
          const c = { ...constants };
          Object.keys(c).forEach(k => {
            c[k] = JSON.stringify(c[k]);
          });
          return c;
        })(),
        NODE_ENV: JSON.stringify(isProd ? 'production' : 'development'),
      }),
      new BannerPlugin({
        raw: true,
        banner: `const __non_webpack_module__ = module;`,
      }),
    ].concat(isProd ? [new CleanWebpackPlugin()] : []),

    target: 'node',
    node: {
      __dirname: false,
      __filename: false,
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      plugins: [new TsconfigPathsPlugin({ configFile: 'tsconfig.json' })],
    },

    optimization: {
      minimize: isProd,
      namedModules: !isProd,
    },

    stats: {
      children: false,
    },
  };
};
