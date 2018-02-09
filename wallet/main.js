var {app, BrowserWindow} = require('electron')
var path = require('path')
var url = require('url')

var win;

function createWindow(){
    //Win w:800 h:800
    win = new BrowserWindow({width: 450, height: 550, frame: false, resizable: false});
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'app/views/main.html'),
        protocol: 'file:',
        slashes: true
    }));
    
    //Open dev tools
    win.webContents.openDevTools();
    //Dereference the window
    win.on('closed', () => {
        win = null;
    });
    
}
app.on('ready', createWindow);

