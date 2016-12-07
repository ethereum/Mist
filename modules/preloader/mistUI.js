/**
@module preloader MistUI
*/

require('./include/common')('mist');
const { ipcRenderer, remote, webFrame } = require('electron');  // eslint-disable-line import/newline-after-import
const { Menu, MenuItem } = remote;
const dbSync = require('../dbSync.js');
const i18n = require('../i18n.js');
const mist = require('./include/mistAPI.js');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');
const ipcProviderWrapper = require('../ipc/ipcProviderWrapper.js');
const web3Admin = require('../web3Admin.js');


require('./include/setBasePath')('interface');


// make variables globally accessable
window.BigNumber = BigNumber;
window.web3 = new Web3(new Web3.providers.IpcProvider('', ipcProviderWrapper));

// add admin later
setTimeout(() => {
    web3Admin.extend(window.web3);
}, 1000);

window.mist = mist();
window.mistMode = remote.getGlobal('mode');
window.dbSync = dbSync;
window.dirname = remote.getGlobal('dirname');
window.ipc = ipcRenderer;


// remove require and module, because node-integration is on
delete window.module;
delete window.require;


// prevent overwriting the Dapps Web3
// delete global.Web3;
// delete window.Web3;


// set the langauge for the electron interface
// ipcRenderer.send('setLanguage', navigator.language.substr(0,2));


// A message coming from other window, to be passed to a webview
ipcRenderer.on('uiAction_windowMessage', (e, type, id, error, value) => {
    console.log(type, id, error, value);
    if ((type === 'requestAccount') || (type === 'connectAccount') && !error) {
        Tabs.update({ webviewId: id }, { $addToSet: {
            'permissions.accounts': value,
        } });
    }

    // forward to the webview (TODO: remove and manage in the ipcCommunicator?)
    var tab = Tabs.findOne({ webviewId: id });
    if(tab) {
        webview = $('webview[data-id='+ tab._id +']')[0];
        if(webview)
            webview.send('uiAction_windowMessage', type, error, value);
    }

});

ipcRenderer.on('uiAction_enableBlurOverlay', (e, value) => {
    $('html').toggleClass('has-blur-overlay', !!value);
});

// Wait for webview toggle
ipcRenderer.on('uiAction_toggleWebviewDevTool', (e, id) => {
    const webview = Helpers.getWebview(id);

    if (!webview)
        { return; }

    if (webview.isDevToolsOpened())
        { webview.closeDevTools(); }
    else
        { webview.openDevTools(); }
});

// Run tests
ipcRenderer.on('uiAction_runTests', (e, type) => {
    if (type === 'webview') {
        web3.eth.getAccounts((error, accounts) => {
            if (error)
                { return; }

            // remove one account
            accounts.pop();

            Tabs.upsert('tests', {
                position: -1,
                name: 'Tests',
                url: '', // is hardcoded in webview.html to prevent hijacking
                permissions: {
                    accounts,
                },
            });

            Tracker.afterFlush(() => {
                LocalStore.set('selectedTab', 'tests');
            });

            // update the permissions, when accounts change
            // Tracker.autorun(function(){
            //     var accounts = _.pluck(EthAccounts.find({}, {fields:{address: 1}}).fetch(), 'address');

            //     // remove one account
            //     accounts.pop();

            //     Tabs.update('tests', {$set: {
            //         'permissions.accounts': accounts
            //     }});
            // });
        });
    }
});

// Run tests without any accounts
ipcRenderer.on('uiAction_runTestsAnon', (e, type) => {
    if (type === 'webview') {

        Tabs.upsert('testsAnon', {
            position: -1,
            name: 'Tests Anon',
            url: '', // is hardcoded in webview.html to prevent hijacking
            permissions: {},
        });

        Tracker.afterFlush(() => {
            LocalStore.set('selectedTab', 'testsAnon');
        });
    }
});


// CONTEXT MENU

const currentMousePosition = { x: 0, y: 0 };
const menu = new Menu();
// menu.append(new MenuItem({ type: 'separator' }));
menu.append(new MenuItem({ label: i18n.t('mist.rightClick.reload'), accelerator: 'Command+R', click() {
    const webview = Helpers.getWebview(LocalStore.get('selectedTab'));
    if (webview)
        { webview.reloadIgnoringCache(); }
} }));
menu.append(new MenuItem({ label: i18n.t('mist.rightClick.openDevTools'), click() {
    const webview = Helpers.getWebview(LocalStore.get('selectedTab'));
    if (webview)
        { webview.openDevTools(); }
} }));
menu.append(new MenuItem({ label: i18n.t('mist.rightClick.inspectElements'), click() {
    const webview = Helpers.getWebview(LocalStore.get('selectedTab'));
    if (webview)
        { webview.inspectElement(currentMousePosition.x, currentMousePosition.y); }
} }));


window.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    // OPEN CONTEXT MENU over webviews
    if ($('webview:hover')[0]) {
        currentMousePosition.x = e.layerX;
        currentMousePosition.y = e.layerY;
        menu.popup(remote.getCurrentWindow());
    }
}, false);


document.addEventListener('keydown', (e) => {
    // RELOAD current webview
    if (e.metaKey && e.keyCode === 82) {
        const webview = Helpers.getWebview(LocalStore.get('selectedTab'));
        if (webview)
            { webview.reloadIgnoringCache(); }
    }
}, false);
