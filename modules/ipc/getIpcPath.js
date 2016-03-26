/**
Gets the right IPC path

@module getIpcPath
*/

module.exports = function() {
    var p = require('path');
    var providedPath = global.rpcUri;
    if (providedPath) {
        return providedPath;
    }

    var path = global.path.HOME;
    if(process.platform === 'darwin')
        path += '/Library/Ethereum/geth.ipc';

    if(process.platform === 'freebsd' ||
       process.platform === 'linux' ||
       process.platform === 'sunos')
        path += '/.ethereum/geth.ipc';

    if(process.platform === 'win32')
        path = '\\\\.\\pipe\\geth.ipc';
    
    console.log('CONNECT to IPC PATH: '+ path);
    return path;
};
