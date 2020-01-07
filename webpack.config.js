const { readdirSync, statSync } = require('fs');
const { join, extname } = require('path');
const { BannerPlugin, DefinePlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

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
        {
          test: /\.node$/,
          use: 'node-loader',
        },
        // In Windows, blessed requires some files for terminals in runtime
        // This just fixes the routes so they are kept inside the `app` target folder
        {
          test: join(__dirname, 'node_modules', 'blessed', 'lib', 'tput.js'),
          loader: 'string-replace-loader',
          options: {
            search: "__dirname \\+ '/../usr/",
            replace: "__dirname + '/../../usr/",
            flags: 'g',
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
      // Copy the files required by blessed in runtime into the target `app` folder:
      new CopyPlugin([{ from: join(__dirname, 'node_modules', 'blessed', 'usr'), to: 'usr' }]),
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
      warningsFilter: [/node-pty/, 'event-stream/index.js', 'colors/lib/colors.js'],
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
