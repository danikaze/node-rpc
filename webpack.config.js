const { readdirSync, statSync } = require('fs');
const { join, extname } = require('path');
const { BannerPlugin, DefinePlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');

const gitRevisionPlugin = new GitRevisionPlugin();

// read the constants from the constants file or return an empty object if not found
function getConstants() {
  let res = {};
  try {
    res = require('./constants');
  } finally {
    return res;
  }
}

module.exports = env => {
  const isProduction = env === 'production';
  const defines = {
    ...getConstants(),
    NODE_ENV: isProduction ? 'production' : 'development',
    IS_PRODUCTION: isProduction,
    GIT_VERSION: gitRevisionPlugin.version(),
    GIT_COMMITHASH: gitRevisionPlugin.commithash(),
    GIT_BRANCH: gitRevisionPlugin.branch(),
  };
  console.log(`Webpack building with ${JSON.stringify(defines, null, 2)}`);

  return {
    mode: isProduction ? 'production' : 'development',

    devtool: isProduction ? undefined : 'inline-source-map',

    entry: {
      ...generateRpcEntries('src/entries', 'entries'),
      ...generateRpcEntries('src/rpc', 'rpc'),
    },

    output: {
      path: join(__dirname, 'app'),
    },

    watch: !isProduction,

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
      new DefinePlugin(
        (() => {
          const c = { ...defines };
          Object.keys(c).forEach(k => {
            c[k] = JSON.stringify(c[k]);
          });
          return c;
        })()
      ),
      new BannerPlugin({
        raw: true,
        banner: `const __non_webpack_module__ = module;`,
        include: 'rpc',
      }),
    ].concat(isProduction ? [new CleanWebpackPlugin()] : []),

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
      minimize: isProduction,
      namedModules: !isProduction,
    },

    stats: {
      children: false,
      modules: false,
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
