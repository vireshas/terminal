var hterm = require('hterm-umdjs').hterm
var lib = require('hterm-umdjs').lib
var spawn = require('child_pty').spawn

const zsh = /zsh: (?:(?:command not found)|(?:no such file or directory)): ((?:https?:\/\/)|(?:file:\/\/)|(?:\/\/))?([^\n]+)/;
const domainRegex = /\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b|^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*:)*?:?0*1$/;

function isUrlCommand(data) {
  const matcher = zsh
  if (undefined === matcher || !data) return null;

  const match = data.match(matcher);
  if (!match) return null;
  const protocol = match[1];
  const path = match[2];

  if (path) {
    if (protocol) {
      return `${protocol}${path}`;
    }
    // extract the domain portion from the url
    const domain = path.split('/')[0];
    if (domainRegex.test(domain)) {
      return `http://${path}`;
    }
  }

  return null;
}

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
  debugger
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
