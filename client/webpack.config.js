var path = require('path');
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');

module.exports = {
  context: __dirname,
  entry: './index.js',
  output: {
      path: path.resolve('./assets/webpack_bundles/'),
      filename: "[name].js"
  },

  mode: 'development',
  devtool: 'source-map',

  plugins: [
    new BundleTracker({filename: './webpack-stats.json'})
  ],

  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}