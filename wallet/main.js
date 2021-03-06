const {
    app,
    BrowserWindow
} = require('electron'),
    path = require('path'),
    url = require('url'), {
        ipcMain
    } = require('electron');

var win;

ipcMain.on('close', () => {
    console.log("What?");
    app.quit();
})

ipcMain.on('create-new-wallet', (args) => {
    createWallet(args.username, args.password);
});

ipcMain.on("import-existing-wallet", (args) =>{
    importWallet(args.username, args.password);
});

function createWallet(username, password){

    var bip32 = require('./app/core/models/bip32');

    try{
        var wallet = new bip32(username, password, 'generator');
        var masterPrivateKey = wallet.derive();
        wallet.serialize(masterPrivateKey);
        dashboard(masterPrivateKey)
    }catch(err){
        ipcMain.send("error", "You supplied wrong password or username. Please try again!");
    }
}

function importWallet(username, password){
    var bip32 = require('./app/core/models/bip32');

    try{
        var wallet = new bip32(username, password, 'loader');
        var masterPrivateKey = wallet.deserialize();
        dashboard(masterPrivateKey)
    }catch(err){
        ipcMain.send("error", "You supplied wrong password or username. Please try again!");
    }
}

function dashboard(privateKey) {
    win = new BrowserWindow({
        width: 600,
        height: 550,
        frame: false,
        resizable: false
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'app/views/wallet-dashboard.html'),
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

function mainView() {
    //Win w:800 h:800
    win = new BrowserWindow({
        width: 473,
        height: 550,
        frame: false,
        resizable: false
    });
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