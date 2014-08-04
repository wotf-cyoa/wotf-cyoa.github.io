(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
require.register("app", function(exports, require, module) {
var editor = ace.edit('game-rb-editor');
editor.setTheme('ace/theme/monokai');
editor.getSession().setFoldStyle('manual');
editor.getSession().setMode("ace/mode/ruby");
editor.getSession().setTabSize(2);
editor.getSession().setUseSoftTabs(true);
editor.getSession().setUseWrapMode(true);
editor.setDisplayIndentGuides(false);
editor.setHighlightActiveLine(true);
editor.setShowPrintMargin(false);
editor.setShowInvisibles(true);

var addToTerminal = function(value, type) {
    if (type === 'output' && value.indexOf('()') > -1) return;
    var classes = 'outputs outputs-' + type;
    value = value.replace(/&/g, '&amp;')
                 .replace(/>/g, '&gt;')
                 .replace(/</g, '&lt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&apos;')
                 .replace(/\n/g, '<br>');
    terminalOutputs.innerHTML += '<p class="' + classes + '">' + value + '</p>';
    terminalInput.scrollIntoView();
};

var handleterminalInput = function(event) {
    var key = event.which || event.keyCode;
    if (key == 13) {
        event.preventDefault();
        socket.emit('terminalInput', { input: terminalInput.value });
        addToTerminal(terminalInput.value, 'input');
        terminalInput.value = '';
    }
};

var handleFileLoad = function() {
    var currentFileContent = editor.getValue();
    socket.emit('fileLoad', { input: currentFileContent });
    addToTerminal('Loading game...', 'status');
};

var handleFileSave = function() {
    var currentFileContent = editor.getValue();
    socket.emit('fileSave', { fileContent: currentFileContent });
    addToTerminal('Saving game code...', 'status');
};

//var socket = io('http://localhost:8888/ruby'),
var socket = io.connect('http://wotf-cyoa.herokuapp.com:80/ruby'),
    terminal = document.getElementById('terminal'),
    terminalOutputs = document.getElementById('terminal-outputs'),
    terminalInput = document.getElementById('terminal-input'),
    sourceActionSave = document.getElementById('source-action-save'),
    sourceActionLoad = document.getElementById('source-action-load');

terminal.addEventListener('click', function(e) { terminalInput.focus() }, false);

socket.on('connect', function() {
    addToTerminal('Server connected', 'status');
    terminalInput.addEventListener('keypress', handleterminalInput, false);
    sourceActionSave.addEventListener('click', handleFileSave, false );
    sourceActionLoad.addEventListener('click', handleFileLoad, false);
});

socket.on('disconnect', function() {
    addToTerminal('Server disconnected', 'error');
    terminalInput.removeEventListener('keypress', handleterminalInput, false);
    sourceActionSave.removeEventListener('click', handleFileSave, false );
    sourceActionLoad.removeEventListener('click', handleFileLoad, false);
});

socket.on('ready', function(data) {
    addToTerminal(data.output, 'status');
    editor.setValue(data.fileContent);
    editor.gotoLine(0);
});

socket.on('terminalOutput', function(data) {
    //if (data.output.indexOf('Error') > -1 || data.output.indexOf('undefined') > -1)
    //    addToTerminal(data.output, 'error');
    //else addToTerminal(data.output, 'output');
    addToTerminal(data.output, 'output');
});

socket.on('terminalError', function(data) {
    addToTerminal(data.output, 'error');
});

socket.on('fileSaved', function(data) {
    addToTerminal(data.output, 'status');
});

socket.on('fileLoaded', function(data) {
    addToTerminal(data.output, 'status');
});

});


//# sourceMappingURL=app.js.map