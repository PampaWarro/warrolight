const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const vendor = ['react', 'react-dom', 'react-redux', 'redux', 'redux-saga', 'react-router'];

const production = !!process.env['PRODUCTION'];

module.exports = {
  entry: {
    'app': [
      'webpack-hot-middleware/client',
      'babel-polyfill',
      './src/main.js',
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
      extensions: ['', '.webpack.js', '.web.js', '.js', 'jsx']
  },

  module: {
    loaders: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /.jsx?$/,
        loaders: ['react-hot', 'babel-loader?presets[]=es2015&presets[]=react&presets[]=stage-0'],
        exclude: /node_modules/
      },
      { test: /\.scss$/, loader: production
        ? ExtractTextPlugin.extract('css!sass')
        : 'style!css?sourceMap!sass?sourceMap'
      },
      { test: /\.json$/, loader: 'json' }
    ],

    preLoaders: [
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { test: /\.js$/, loader: 'source-map-loader' }
    ]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({ name: "vendor", filename: "vendor.js" }),
    new webpack.optimize.CommonsChunkPlugin({ name: 'meta', chunks: ['vendor'], filename: "meta.js" }),
    new HtmlWebpackPlugin({ title: 'Warrolight', template: 'src/index.html' }),
    new ExtractTextPlugin("styles.css"),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ]
};
