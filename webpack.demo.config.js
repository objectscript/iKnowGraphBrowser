var webpack = require('webpack');
var path = require('path');

var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');

var npmDir = path.join(__dirname, 'node_modules');

module.exports = {
    entry: {
        demo: path.join(__dirname, 'src', 'examples', 'demo.js'),        
    },
    resolve: {
        extensions: ['', '.ts', '.tsx', '.webpack.js', '.web.js', '.js'],
        alias: {        
        },
    },
    module: {
        loaders: [
            //{test: /\.ts$|\.tsx$/, loader: 'ts-loader'},
            {test: /\.json$/, loader: 'json-loader'},
            {test: /\.css$/, loader: 'style-loader!css-loader'},
            {test: /\.scss$/, loader: 'style-loader!css-loader!sass-loader'},
            {test: /\.jpe?g$/, loader: 'url-loader?mimetype=image/jpeg'},
            {test: /\.gif$/, loader: 'url-loader?mimetype=image/gif'},
            {test: /\.png$/, loader: 'url-loader?mimetype=image/png'},
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'iKnowBrowser demo',
            chunks: ['commons', 'demo'],
            template: path.join(__dirname, 'src', 'examples', 'template.ejs'),
        }),
        new CommonsChunkPlugin('commons', 'commons.chunk.js'),
    ],
    output: {
        path: path.join(__dirname, 'dist', 'examples'),
        filename: '[name].bundle.js',
        chunkFilename: '[id].chunk.js',
        publicPath: '/',
    },
    devtool: '#source-map',
    devServer: {
        proxy: {
            "**": {
                target: process.env.ENDPOINT ? process.env.ENDPOINT : 'http://82.110.159.50/csp/browser/rest/domain/1/' ,
                //ignorePath: true,
                changeOrigin: true,
                secure: false,
                auth: 'EntityBrowser:BrowseM3!'
            },
        },
    },
};
