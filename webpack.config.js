const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin');
const fs = require('fs')

module.exports = (env) => {
  return {
    mode: 'production',
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
    // devServer: {
    //   contentBase: './dist',
    //   host: 'odev.itsroyal.me',
    //   inline: false,
    //   hot: false,
    //   https: {
    //     key: fs.readFileSync('/home/royal/dev/cert/odev.itsroyal.me/2099842_odev.itsroyal.me.key'),
    //     cert: fs.readFileSync('/home/royal/dev/cert/odev.itsroyal.me/2099842_odev.itsroyal.me.pem'),
    //     ca: fs.readFileSync('/home/royal/dev/cert/odev.itsroyal.me/2099842_odev.itsroyal.me.pem'),
    //   }
    // },
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
