module.exports = (windowType) => {
    const { ipcRenderer: ipc } = require('electron');

    if (process.env.TEST_MODE) {
        window.electronRequire = require;
    }

    require('./consoleLogCapture')(windowType);

    require('./suppressWindowPrompt')();

    // register with window manager
    ipc.send('backendAction_setWindowId');
};
