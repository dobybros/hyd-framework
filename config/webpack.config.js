const VueLoaderPlugin = require("vue-loader/lib/plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const webpack = require('webpack');
const path = require("path")
const fs = require('fs')

module.exports = {
  mode: "production",
  entry: {
    'hyd-electron': "../hyd/HydElectronRenderer.js"
  },
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "[name]/app.bundle.js",
  },
  devServer: {
    contentBase: path.resolve(__dirname, "../dist"),
    hot: true,
    host: "localhost",
    port: 8010,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader"
      },
      {
        test: /\.(feature|service).js$/,
        use: [
          {
            loader: "hyd-loader"
          },
        ]
      },
      {
        test: /\.(png|jpg|svg)$/,
        use: [
          {
            loader: "file-loader"
          }
        ]
      },

      {
        test: /\.css$/,
        use: [
          "vue-style-loader",
          "css-loader"
        ]
      },
      {
        test: /\.less$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'less-loader'
        ]
      }
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src")
    },
    extensions: [
      ".js", ".vue", ".json", ".css", ".less"
    ]
  },
  devtool: "source-map",
  plugins: [
    new VueLoaderPlugin(),
    new CleanWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ],
}
