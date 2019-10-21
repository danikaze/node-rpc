const { readdirSync, statSync } = require('fs');
const { join, extname } = require('path');
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
      ...generateRpcEntries('src/entries', 'entries'),
      ...generateRpcEntries('src/rpc', 'rpc'),
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
        IS_PRODUCTION: isProd,
      }),
      new BannerPlugin({
        raw: true,
        banner: `const __non_webpack_module__ = module;`,
        include: 'rpc',
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

function generateRpcEntries(entryFolder, bundlePrefix = '', filter = /\.[tj]s$/) {
  let res = {};

  readdirSync(entryFolder).forEach(file => {
    const fileName = join(entryFolder, file);
    if (statSync(fileName).isDirectory()) {
      res = {
        ...res,
        ...generateRpcEntries(fileName, `${bundlePrefix}/${file}`, filter),
      };
    }

    if (filter && !filter.test(file)) {
      return;
    }

    const bundleName = join(bundlePrefix, stripExtension(file));
    res[bundleName] = fileName;
  });

  return res;
}

function stripExtension(file) {
  const ext = extname(file);
  return file.substring(0, file.length - ext.length);
}
