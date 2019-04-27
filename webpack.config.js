const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = (env) => {
  return {
    entry: {
      'hyd': path.resolve(__dirname, 'src', 'index.js')
    },
    devtool: "source-map",
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, 'dist'),
      chunkFilename: '[name].chunk.js',
      // library: '[name]',
      // libraryTarget: "window"
    },
    optimization: {
      minimize: false
    },
    plugins: [
      new CleanWebpackPlugin(['dist']),
    ],
    externals: {
      vue: 'Vue'
    }
  }
}
