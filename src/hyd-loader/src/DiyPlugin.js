'use strict';

var FStream = require('fs');
var Archiver = require('archiver'); //npm install archiver
// var ConcatSource = require('webpack-sources/lib/ConcatSource');
// var CachedSource = require('webpack-sources/lib/CachedSource');
/**
 * 版本信息生成插件
 * @author phpdragon@qq.com
 * @param options
 * @constructor
 */
function DiyPlugin(options) {
  console.log("options ${options}")
}

//apply方法是必须要有的，因为当我们使用一个插件时（new somePlugins({})），webpack会去寻找插件的apply方法并执行
DiyPlugin.prototype.apply = function (compiler) {
  var self = this;

  compiler.plugin("compile", function (params) {
    console.log("")
  });
  // compiler.plugin("after-compile", function (stats) {
  //   console.log("after-compile...");
  //   // let source = new ConcatSource();
  //
  // });
  //编译器'对'所有任务已经完成'这个事件的监听
  compiler.plugin("done", function (stats) {
    console.log("开始打包压缩编译文件...");
    // let source = new ConcatSource();

  });
};

module.exports = DiyPlugin;