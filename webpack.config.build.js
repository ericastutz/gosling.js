const pkg = require('./package.json');
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const PeerDepsExternalsPlugin = require("peer-deps-externals-webpack-plugin");

module.exports = (env, argv) => {
  const config = {
    entry: { main: './src/core/index.ts' },
    output: {
      filename: "gemini.min.js",
      path: path.resolve(__dirname, "dist"),
      pathinfo: false,
      library: 'gemini',
      libraryTarget: 'umd',
      umdNamedDefine: true
    },
    // performance: {
    //   hints: false,
    //   maxEntrypointSize: 512000,
    //   maxAssetSize: 512000,
    // },
    // devtool: argv.mode === 'development' ? 'cheap-module-source-map' : 'source-map',
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {plugins: [require('autoprefixer')]},
            },
          ],
        },
        {
            test: /\.ttf$/,
            use: ['file-loader'],
        },
      ],
    },
    plugins: [
      new webpack.SourceMapDevToolPlugin({
        exclude: ['higlass']
      }),
      // new PeerDepsExternalsPlugin(), // this can be added later
    ],
    // devServer: {
    //   stats: {
    //     colors: true,
    //   },
    //   overlay: {
    //     warnings: true,
    //     errors: true,
    //   },
    //   hot: true,
    //   stats: 'errors-only',
    //   open: false,
    //   contentBase: path.join(__dirname, 'public'),
    //   watchContentBase: true,
    //   watchOptions: {
    //     ignored: /node_modules/,
    //   },
    // },
    // node: {
    //   fs: 'empty',
    // },
  };
  return config;
};