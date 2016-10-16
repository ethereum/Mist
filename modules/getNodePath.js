"use strict";

/**
Gets the right Node path

@module getNodePath
*/

const path = require('path');
const binaryPath = path.resolve(__dirname + '/../nodes');
const log = require('./utils/logger').create('getNodePath');
const Settings = require('./settings');


// cache
const resolvedPaths = {};


module.exports = function(type) {
    if (resolvedPaths[type]) {
        return resolvedPaths[type];
    }

    let ret = '';

    // global override?
    let globallySetType = Settings[`${type}Path`];
    
    if (globallySetType) {
        resolvedPaths[type] = globallySetType;
    } else {
        let platform = process.platform;

        // "win32" -> "win" (because nodes are bundled by electron-builder)
        if (0 === platform.indexOf('win')) {
            platform = 'win';
        } else if (0 === platform.indexOf('darwin')) {
            platform = 'mac';
        }

        log.debug('Platform: ' + platform);

        let binPath = path.join(
            __dirname, 
            '..', 
            'nodes',
            type,
            `${platform}-${process.arch}`
        );

        if (Settings.inProductionMode) {
            // get out of the ASAR
            binPath = binPath.replace('nodes', path.join('..', '..', 'nodes'));
        }

        binPath = path.join(path.resolve(binPath), type);

        if ('win' === platform) {
            binPath += '.exe';
        }

        resolvedPaths[type] = binPath;
    }

    log.debug(`Resolved path for ${type}: ${resolvedPaths[type]}`);

    return resolvedPaths[type];
};


