var hterm = require('hterm-umdjs').hterm
var lib = require('hterm-umdjs').lib
var spawn = require('child_pty').spawn

const { app, BrowserWindow, shell, Menu } = require('electron').remote;

//let c= new BrowserWindow({modal: true, show: false})
//c.loadURL('https://github.com')
//c.once('ready-to-show', () => {
//  c.show()
//})

var defaultShell = require('default-shell')
hterm.defaultStorage = new lib.Storage.Memory();

var t = new hterm.Terminal()
var pty = spawn(defaultShell, [])

pty.stdout.on('data', (data) => {
  let local_str = data.toString('utf8')
  t.io.print(local_str)
});

t.onTerminalReady = function() {
  var io = t.io.push();
  io.onVTKeystroke = inputHandler;
  io.sendString = inputHandler;
}

function isImage(data) {
  if ( data.indexOf(".png") != -1) {
    return true
  }

  return false
}

function inputHandler(data) {
  if (isImage(data)) {
    console.log("Found url: " + data)
    img = `<br /><img src='${data}'> </img>`
    t.io.println(data)
    t.getRowNode(t.getCursorRow()).innerHTML += img
  } else {
    pty.stdin.write(data);
  }
}

t.decorate(document.getElementById('terminal'));
t.installKeyboard()
