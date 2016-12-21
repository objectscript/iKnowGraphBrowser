var webpack = require('webpack');
var path = require('path');

var npmDir = path.join(__dirname, 'node_modules');

module.exports = {
    entry: {
        iKnowBrowser: path.join(__dirname, 'src', 'index.js'),
    },
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx', '.min.js'],
        alias: {
          
        },
    },
    module: {
        loaders: [
//            {test: /\.ts$|\.tsx$/, loader: 'ts-loader'},
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
    plugins: [],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'iKnowBrowser.js',
        library: 'iKnowBrowser',
        libraryTarget: 'umd',
    },
    externals: {
    },
    devtool: '#source-map',
};