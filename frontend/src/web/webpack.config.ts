var path = require('path')

var webpack = require('webpack')
var HtmlwebpackPlugin = require('html-webpack-plugin')

var ROOT_PATH = path.join(path.resolve(__dirname), '../../')

module.exports = {
    devtool: 'cheap-module-source-map',
    entry: [
        'webpack-hot-middleware/client?path=http://localhost:3000/assets/__webpack_hmr',
        'react-hot-loader/patch',
        'babel-polyfill',
        path.resolve(ROOT_PATH, 'src/web/main.jsx'),
    ],
    module: {
        loaders: [{
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['react', 'es2015'],
                    plugins: [
                        'react-hot-loader/babel',
                        'transform-regenerator',
                        ['import', {
                            libraryName: 'antd',
                            style: true
                        }]
                    ]
                }
            },
            {
                test: /\.json$/,
                loader: "json-loader"
            },
            {
                test: /\.less$/,
                loader: "style-loader!css-loader!less-loader"
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.less'],
        alias: {
            'styled-components$': 'styled-components/lib/index.js',
        },
    },
    output: {
        path: path.resolve(ROOT_PATH, 'src/web/dist'),
        publicPath: '/assets/',
        filename: 'main.js'
    },
    devServer: {
        contentBase: path.resolve(ROOT_PATH, 'src/web/dist'),
        publicPath: '/',
        indexEntry: 'main.js',
        historyApiFallback: true,
        hot: true,
        inline: true,
        progress: true
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlwebpackPlugin({
            title: 'Poet - Bard',
            template: path.resolve(ROOT_PATH, 'src/web/index.html')
        })
    ]
}
