var webpack = require('webpack');
var path = require('path');

var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');

var npmDir = path.join(__dirname, 'node_modules');

module.exports = {
    entry: {
        demo: path.join(__dirname, 'src', 'examples', 'demo.jsx'),
        reactDemo: path.join(__dirname, 'src', 'examples', 'reactDemo.jsx'),
    },
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx'],
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
            {
                test: /\.js.?$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015', 'react', 'stage-0']
                }
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'iKnowBrowser demo',
            chunks: ['commons', 'reactDemo'],
            template: path.join(__dirname, 'src', 'examples', 'template.ejs'),
        }),
        new HtmlWebpackPlugin({
            filename: 'demo.html',
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
                target: process.env.IKNOW_ENDPOINT ? process.env.IKNOW_ENDPOINT : 'http://82.110.159.50:57772/csp/browser/rest/domain/1/' ,
                //ignorePath: true,
                changeOrigin: true,
                secure: false,
                auth: process.env.IKNOW_AUTH ? process.env.IKNOW_AUTH  : 'EntityBrowser:BrowseM3!'
            },
        },
    },
};
