var hterm = require('hterm-umdjs').hterm
var lib = require('hterm-umdjs').lib
var spawn = require('child_pty').spawn
var cmd = require("child_process").execSync
var WebSocket = require('ws');

const { app, BrowserWindow, shell, Menu } = require('electron').remote;

var hostname = cmd("hostname").toString()
var defaultShell = require('default-shell')
var ws = new WebSocket('ws://localhost:3000');

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
  c.loadURL(link)
  c.once('ready-to-show', () => {
    c.show()
  })
}

function inputHandler(data) {
  let command = t.getRowText(t.getCursorRow()).split("\(master\)")[1]
  console.log(`56 command ${command}`)

  if (command) {
    command = command.slice(3, command.length)
    console.log(`59 command ${command}`)
    if ( command.length > 0) {
      msg["message"] = command
      let l_msg = JSON.stringify(msg)
      console.log(`62 command ${l_msg}`)
      ws.send(l_msg)
    }
  }

  if (shouldOpenInNewWindow(command)) {
    console.log(`pop open ${command}`)
    url = command.split(" ")[1]
    popOpenLink(url)
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

  ws.on('open', function open() {
    ws.send(JSON.stringify(msg));
  });

  ws.on('message', function(data, flags) {
    data = JSON.parse(data)
    console.log(data[0])
    popOpenLink(data[0])
  });

  var io = t.io.push();
  io.onVTKeystroke = inputHandler;
  io.sendString = inputHandler;
}

t.decorate(document.getElementById('terminal'));
t.installKeyboard()
