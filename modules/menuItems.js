const app = require('app');
const BrowserWindow = require('browser-window');
const popupWindow = require('./popupWindow.js');
const MenuItem = require('menu-item');
const Menu = require('menu');
const shell = require('electron').shell;
const config = require('../config.js');
const log = require('./utils/logger').create('menuItems');
const ipc = require('electron').ipcMain;
const ethereumNode = require('./ethereumNode.js');
const fs = require('fs');
const dialog = require('dialog');


// create menu
// null -> null
var createMenu = function(webviews) {
    webviews = webviews || [];

    const menu = Menu.buildFromTemplate(menuTempl(webviews));
    Menu.setApplicationMenu(menu);
};


const restartNode = function(newType, newNetwork) {
    newNetwork = newNetwork || ethereumNode.network;

    log.info('Switch node', newType, newNetwork);

    return ethereumNode.restart(newType, newNetwork, popupWindow)
        .then(() => {
            global.mainWindow.loadURL(global.interfaceAppUrl);

            createMenu(webviews);
        })
        .catch((err) => {
            log.error('Error switching node', err);
        });
};



// create a menu template
// null -> obj
var menuTempl = function(webviews) {
    const menu = []
    webviews = webviews || [];

    // APP
    menu.push({
        label: i18n.t('mist.applicationMenu.app.label', {app: config.name}),
        submenu: [
            {
                label: i18n.t('mist.applicationMenu.app.about', {app: config.name}),
                click: function(){
                    popupWindow.show('about_'+ global.mode, {width: 420, height: 230, alwaysOnTop: true});
                }
            },
            {
                label: i18n.t('mist.applicationMenu.app.quit', {app: config.name}),
                accelerator: 'CommandOrControl+Q',
                click: function(){
                    app.quit();
                }
            }
        ]
    });

    // ACCOUNTS
    menu.push({
        label: i18n.t('mist.applicationMenu.accounts.label'),
        submenu: [
            {
                label: i18n.t('mist.applicationMenu.accounts.newAccount'),
                accelerator: 'CommandOrControl+N',
                click: function(){
                    popupWindow.show('requestAccount', {width: 400, height: 230, alwaysOnTop: true});
                }
            },
            {
                label: i18n.t('mist.applicationMenu.accounts.importPresale'),
                accelerator: 'CommandOrControl+I',
                enabled: ethereumNode.isMainNetwork,            
                click: function(){
                    popupWindow.show('importAccount', {width: 600, height: 370, alwaysOnTop: true});
                }
            }, 
            {
                type: 'separator'
            },
            {
                label: i18n.t('mist.applicationMenu.accounts.backup'),
                submenu: [
                    {
                        label: i18n.t('mist.applicationMenu.accounts.backupKeyStore'),
                        click: function(){
                            var path = global.path.HOME;

                            // eth
                            if(ethereumNode.isEth) {
                                if(process.platform === 'win32')
                                    path = global.path.APPDATA + '\\Web3\\keys';
                                else
                                    path += '/.web3/keys';
                            
                            // geth
                            } else {
                                if(process.platform === 'darwin')
                                    path += '/Library/Ethereum/keystore';

                                if(process.platform === 'freebsd' ||
                                   process.platform === 'linux' ||
                                   process.platform === 'sunos')
                                    path += '/.ethereum/keystore';

                                if(process.platform === 'win32')
                                    path = global.path.APPDATA + '\\Ethereum\\keystore';
                            }

                            shell.showItemInFolder(path);
                        }
                    },{
                        label: i18n.t('mist.applicationMenu.accounts.backupMist'),
                        click: function(){
                            shell.showItemInFolder(global.path.USERDATA);
                        }
                    }
                ]
            }
        ]
    });

    // EDIT
    menu.push({
        label: i18n.t('mist.applicationMenu.edit.label'),
        submenu: [
            {
                label: i18n.t('mist.applicationMenu.edit.undo'),
                accelerator: 'CommandOrControl+Z',
                role: 'undo'
            },
            {
                label: i18n.t('mist.applicationMenu.edit.redo'),
                accelerator: 'Shift+CommandOrControl+Z',
                role: 'redo'
            },
            {
                type: 'separator'
            },
            {
                label: i18n.t('mist.applicationMenu.edit.cut'),
                accelerator: 'CommandOrControl+X',
                role: 'cut'
            },
            {
                label: i18n.t('mist.applicationMenu.edit.copy'),
                accelerator: 'CommandOrControl+C',
                role: 'copy'
            },
            {
                label: i18n.t('mist.applicationMenu.edit.paste'),
                accelerator: 'CommandOrControl+V',
                role: 'paste'
            },
            {
                label: i18n.t('mist.applicationMenu.edit.selectAll'),
                accelerator: 'CommandOrControl+A',
                role: 'selectall'
            },
        ]
    })

    // VIEW
    menu.push({
        label: i18n.t('mist.applicationMenu.view.label'),
        submenu: [
            {
                label: i18n.t('mist.applicationMenu.view.fullscreen'),
                accelerator: 'CommandOrControl+F',
                click: function(){
                    global.mainWindow.setFullScreen(!global.mainWindow.isFullScreen());
                }
            }
        ]
    })


    // DEVELOP
    var devToolsMenu = [];

    // change for wallet
    if(global.mode === 'mist') {
        devtToolsSubMenu = [{
            label: i18n.t('mist.applicationMenu.develop.devToolsMistUI'),
            accelerator: 'Alt+CommandOrControl+I',
            click: function() {
                if(curWindow = BrowserWindow.getFocusedWindow())
                    curWindow.toggleDevTools();
            }
        },{
            type: 'separator'
        }];

        // add webviews
        webviews.forEach(function(webview){
            devtToolsSubMenu.push({
                label: i18n.t('mist.applicationMenu.develop.devToolsWebview', {webview: webview.name}),
                click: function() {
                    if(global.mainWindow && global.mainWindow.webContents && !global.mainWindow.webContents.isDestroyed())
                        global.mainWindow.webContents.send('toggleWebviewDevTool', webview._id);
                }
            });
        });

    // wallet
    } else {
        devtToolsSubMenu = [{
            label: i18n.t('mist.applicationMenu.develop.devToolsWalletUI'),
            accelerator: 'Alt+CommandOrControl+I',
            click: function() {
                if(curWindow = BrowserWindow.getFocusedWindow())
                    curWindow.toggleDevTools();
            }
        }];
    }

    devToolsMenu = [{
            label: i18n.t('mist.applicationMenu.develop.devTools'),
            submenu: devtToolsSubMenu
        },{
            label: i18n.t('mist.applicationMenu.develop.runTests'),
            enabled: (global.mode === 'mist'),
            click: function(){
                if(global.mainWindow && global.mainWindow.webContents && !global.mainWindow.webContents.isDestroyed())
                    global.mainWindow.webContents.send('runTests', 'webview');
            }
        },{
            label: i18n.t('mist.applicationMenu.develop.logFiles'),
            click: function(){
                var log = '';
                try {
                    log = fs.readFileSync(global.path.USERDATA + '/node.log', {encoding: 'utf8'});
                    log = '...'+ log.slice(-1000);
                } catch(e){
                    log.info(e);
                    log = 'Couldn\'t load log file.';
                };

                dialog.showMessageBox({
                    type: "info",
                    buttons: ['OK'],
                    message: 'Log file',
                    detail: log
                }, function(){
                });
            }
        }
    ];



                   

    // add node switching menu
    devToolsMenu.push({
        type: 'separator'
    });
    // add node switch
    if(process.platform === 'darwin' || process.platform === 'win32') {
        devToolsMenu.push({
            label: i18n.t('mist.applicationMenu.develop.ethereumNode'),
            submenu: [
              {
                label: 'Geth 1.3.6 (Go)',
                checked: ethereumNode.isOwnNode && ethereumNode.isGeth,
                enabled: ethereumNode.isOwnNode,
                type: 'checkbox',
                click: function(){
                    restartNode('geth');
                }
              },
              {
                label: 'Eth 1.2.4 (C++) [experimental!]',
                checked: ethereumNode.isOwnNode && ethereumNode.isEth,
                enabled: ethereumNode.isOwnNode,
                type: 'checkbox',
                click: function(){
                    restartNode('eth');
                }
              }
        ]});
    }

    // add network switch
    devToolsMenu.push({
        label: i18n.t('mist.applicationMenu.develop.network'),
        submenu: [
          {
            label: i18n.t('mist.applicationMenu.develop.mainNetwork'),
            accelerator: 'Alt+CommandOrControl+1',
            checked: ethereumNode.isOwnNode && ethereumNode.isMainNetwork,
            enabled: ethereumNode.isOwnNode,
            type: 'checkbox',
            click: function(){
                restartNode(ethereumNode.type, 'main');
            }
          },
          {
            label: 'Testnet (Morden)',
            accelerator: 'Alt+CommandOrControl+2',                
            checked: ethereumNode.isOwnNode && ethereumNode.isTestNetwork,
            enabled: ethereumNode.isOwnNode,
            type: 'checkbox',
            click: function(){
                restartNode(ethereumNode.type, 'test');
            }
          }
    ]});

    devToolsMenu.push({
        label: (global.mining) ? i18n.t('mist.applicationMenu.develop.stopMining') : i18n.t('mist.applicationMenu.develop.startMining'),
        accelerator: 'CommandOrControl+M',
        enabled: ethereumNode.isIpcConnected,
        click: function(){
            if(!global.mining) {
                ethereumNode.send('miner_start', [1])
                    .then((result) => {
                        log.info('miner_start', result);

                        if (result) {
                            global.mining = true;
                            createMenu(webviews);
                        }                        
                    })
                    .catch(err) {
                        log.error('miner_start', err);
                    })
                });
            } else {
                ethereumNode.send('miner_stop', [1])
                    .then((result) => {
                        log.info('miner_stop', result);

                        if (result) {
                            global.mining = false;
                            createMenu(webviews);
                        }                        
                    })
                    .catch(err) {
                        log.error('miner_stop', err);
                    })
                });
            }
        }
    });


    menu.push({
        label: ((global.mining) ? '⛏ ' : '') + i18n.t('mist.applicationMenu.develop.label'),
        submenu: devToolsMenu
    })

    // WINDOW
    menu.push({
        label: i18n.t('mist.applicationMenu.window.label'),
        role: 'window',
        submenu: [
            {
                label: i18n.t('mist.applicationMenu.window.minimize'),
                accelerator: 'CommandOrControl+M',
                role: 'minimize'
            },
            {
                label: i18n.t('mist.applicationMenu.window.close'),
                accelerator: 'CommandOrControl+W',
                role: 'close'
            },
            {
                type: 'separator'
            },
            {
                label: i18n.t('mist.applicationMenu.window.toFront'),
                role: 'arrangeInFront:',
                role: 'front'
            },
        ]
    })

    // HELP
    if(process.platform === 'darwin') {
        menu.push({
            label: i18n.t('mist.applicationMenu.help.label'),
            role: 'help',
            submenu: []
        });
    }

    return menu;
};


module.exports = createMenu;