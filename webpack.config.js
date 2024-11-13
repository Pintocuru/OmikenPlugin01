const pkg = require('./package.json')
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const config = {
  entry: './src/index.ts',
  target: 'node',
  output: {
    filename: 'plugin.js',
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, `dist/${pkg.name}`),
    clean: true,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'static', to: `.` },
      ]
    }),
    new ZipPlugin({
      path: path.resolve(__dirname, `dist`),
      filename: `${pkg.name}.zip`,
    })
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    minimizer: [new TerserPlugin()],
  },
};

module.exports = config
