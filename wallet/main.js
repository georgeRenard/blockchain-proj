const {app, BrowserWindow} = require('electron'),
    path = require('path'),
    url = require('url'),
    {ipcMain} = require('electron');

var win;

ipcMain.on('close', () => {
    console.log("What?");
    app.quit();
})

ipcMain.on('create-new-wallet', () => {
    createWalletView();
});

function createWalletView(){
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'app/views/wallet-dashboard.html'),
        protocol: 'file:',
        slashes: true
    }));
}

function mainView(){
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
app.on('ready', mainView);

