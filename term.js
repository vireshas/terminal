var hterm = require('hterm-umdjs').hterm
var lib = require('hterm-umdjs').lib
var spawn = require('child_pty').spawn

const { app, BrowserWindow, shell, Menu } = require('electron').remote;

var defaultShell = require('default-shell')
hterm.defaultStorage = new lib.Storage.Memory();

var t = new hterm.Terminal()
var child = spawn(defaultShell, [])

child.stdout.on('data', (data) => {
  var local_str = data.toString('utf8')
  t.io.print(local_str)
  console.log("i am here")
  img = "<img src='http://media.charlesleifer.com/blog/photos/nginx-logo.png'> </img>"
  t.getRowNode(t.getCursorRow()).innerHTML += img
});

t.onTerminalReady = function() {
  var io = t.io.push();

  io.onVTKeystroke = function(str) {
    child.stdin.write(str);
  };

  io.sendString = function(str) {
    t.io.print(str)
  };
}

t.decorate(document.getElementById('terminal'));
t.installKeyboard()
