var hterm = require('hterm-umdjs').hterm
var lib = require('hterm-umdjs').lib
var spawn = require('child_pty').spawn
var cmd = require("child_process").execSync
var WebSocket = require('ws');

const { app, BrowserWindow, shell, Menu } = require('electron').remote;

var hostname = cmd("hostname").toString()
var defaultShell = require('default-shell')
hterm.defaultStorage = new lib.Storage.Memory();

var t = new hterm.Terminal()
var pty = spawn(defaultShell, [])


function isWebpage(data) {
  if ( data.match(/https?/) ) {
    return true
  }
  return false
}

function isImage(data) {
  if ( data.indexOf(".png") != -1 || data.indexOf(".gif") != -1 ) {
    return true
  }
  return false
}

function shouldOpenInNewWindow(data) {
  if (data.match(/o /) || data.match(/open /)) {
    return true
  }
  return false
}

function openImageInline(data) {
  img = `<br /><img src='${data}'> </img>`
  t.io.println(data)
  t.getRowNode(t.getCursorRow()).innerHTML += img
}

function popOpenLink(link) {
  let c = new BrowserWindow({modal: true, show: false})
  t.io.println(link)
  url = link.split(" ")[1]
  c.loadURL(url)
  c.once('ready-to-show', () => {
    c.show()
  })
}

function inputHandler(data) {
  let command = t.getRowText(t.getCursorRow()).split("\(master\)")[1]
  if (command)
    command = command.slice(3, command.length)
  else
    command = data

  console.log(`command ${command}`)
  if (shouldOpenInNewWindow(command)) {
    console.log(`pop open ${command}`)
    popOpenLink(command)
  } else if (isImage(command)) {
    console.log(`inline ${command}`)
    openImageInline(command)
  } else {
    pty.stdin.write(data);
  }
}

pty.stdout.on('data', (data) => {
  let local_str = data.toString('utf8')
  t.io.print(local_str)
});

msg = {user: hostname, room: "", message: ""}

t.onTerminalReady = function() {
  var ws = new WebSocket('ws://localhost:3000');

  ws.on('open', function open() {
    ws.send(JSON.stringify(msg));
  });

  ws.on('message', function(data, flags) {
    t.io.print(data)
    // flags.binary will be set if a binary data is received.
    // flags.masked will be set if the data was masked.
  });

  var io = t.io.push();
  io.onVTKeystroke = inputHandler;
  io.sendString = inputHandler;
}

t.decorate(document.getElementById('terminal'));
t.installKeyboard()
