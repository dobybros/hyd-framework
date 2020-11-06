var RE_BLOCKS = new RegExp([
    /\/(\*)[^*]*\*+(?:[^*\/][^*]*\*+)*\//.source,           // $1: multi-line comment
    /\/(\/)[^\n]*$/.source,                                 // $2 single-line comment
    /"(?:[^"\\]*|\\[\S\s])*"|'(?:[^'\\]*|\\[\S\s])*'/.source, // - string, don't care about embedded eols
    /(?:[$\w\)\]]|\+\+|--)\s*\/(?![*\/])/.source,           // - division operator
    /\/(?=[^*\/])[^[/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[/\\]*)*?\/[gim]*/.source
  ].join('|'),                                            // - regex
  'gm'  // note: global+multiline with replace() need test
);

// remove comments, keep other blocks
function stripComments(str) {
  return str.replace(RE_BLOCKS, function (match, mlc, slc) {
    return mlc ? ' ' :         // multiline comment (replace with space)
      slc ? '' :          // single/multiline comment
        match;              // divisor, regex, or string, return as-is
  });
}

module.exports = function (source) {
  var tempSource = source;
  var callback = this.async();
  // console.log('------------' + tempSource + '------------ console.log("hello world")')
  // return source + "console.log(\"hello world\")"
  var classes = [];
  tempSource = stripComments(tempSource);
  var pos = tempSource.indexOf("class ");
  while(pos != -1) {
    var nextPos = tempSource.indexOf("{", pos);
    var nextPos1 = tempSource.indexOf("extends", pos);

    if(nextPos != -1) {
      if(nextPos1 != -1 && nextPos1 < nextPos){
        nextPos = nextPos1;
      }
      var className = tempSource.substring(pos + 5, nextPos).trim();
      if(className.indexOf(' ') == -1) {
        classes.push(className);
      }
      pos = tempSource.indexOf("class ", pos + 5);
    }
  }

  var importedHyd = false;
  pos = tempSource.indexOf("import");
  while(pos != -1) {
    var nextPos = tempSource.indexOf("\n", pos);
    if(nextPos != -1) {
      var str = tempSource.substring(pos + 6, nextPos).trim();
      if(str.indexOf("hyd-framework") != -1) {
        importedHyd = true;
        break;
      }
      pos = tempSource.indexOf("import", pos + 6);
    }
  }
  var head = "";
  if(!importedHyd) {
    // head += 'import hyd from \'hyd-framework\'\n';
  }

  var tail = "\n";
  for(var i in classes) {
    tail += ('hyd.feature("' + classes[i] + '", ' + classes[i] + '); \n');
  }

  var content = head + '\n' + source + '\n' + tail;
  // console.log(`
  // ${this.resourcePath}
  // -------------------------------
  // ${content}
  // ===============================`)
  callback(null, content);
}