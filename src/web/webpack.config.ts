const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const vendor = ['react', 'react-dom', 'react-redux', 'redux', 'redux-saga', 'react-router'];

const production = !!process.env['PRODUCTION'];

module.exports = {
  entry: {
    'app': [
      'webpack-hot-middleware/client',
      './src/index.tsx',
    ],
    'vendor': vendor
  },
  output: {
      filename: '[name].[hash].js',
      path: __dirname + '/dist'
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: 'cheap-eval-source-map',

  resolve: {
      // Add '.ts' and '.tsx' as resolvable extensions.
      extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },

  module: {
    loaders: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.jsx?$/, loaders: ['react-hot', 'babel'],
      { test: /\.scss$/, loader: production
        ? ExtractTextPlugin.extract('css!sass')
        : 'style!css?sourceMap!sass?sourceMap'
      }
    ],

    preLoaders: [
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { test: /\.js$/, loader: 'source-map-loader' }
    ]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({ name: "vendor", filename: "vendor.js" }),
    new webpack.optimize.CommonsChunkPlugin({ name: 'meta', chunks: ['vendor'], filename: "meta.js" }),
    new HtmlWebpackPlugin({ title: 'Poet App', template: 'src/index.html' }),
    new ExtractTextPlugin("styles.css"),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ]
};
