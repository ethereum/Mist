/**
@module dbSync
*/
const { ipcMain, ipcRenderer } = require('electron');

/**
 * Sync IPC calls received from given window into given db table.
 * @param  {Object} coll Db collection to save to.
 */
exports.backendSync = function () {
    let log = require('./utils/logger').create('dbSync'),
        db = require('./db'),
        ipc = ipcMain;

    ipc.on('dbSync-add', (event, args) => {
        let collName = args.collName,
            coll = db.getCollection(collName);

        log.trace('dbSync-add', collName, args._id);

        const _id = args._id;

        if (!coll.findOne({ _id })) {
            args.fields._id = _id;
            coll.insert(args.fields);
        }
    });

    ipc.on('dbSync-changed', (event, args) => {
        let collName = args.collName,
            coll = db.getCollection(collName);

        log.trace('dbSync-changed', collName, args._id);

        const _id = args._id;
        const item = coll.findOne({ _id });

        if (item) {
            for (const k in args.fields) {
                if ({}.hasOwnProperty.call(args.fields, k)) {
                    item[k] = args.fields[k];
                }
            }

            coll.update(item);
        } else {
            log.error('Item not found in db', _id);
        }
    });

    ipc.on('dbSync-removed', (event, args) => {
        let collName = args.collName,
            coll = db.getCollection(collName);

        log.trace('dbSync-removed', collName, args._id);

        const _id = args._id;
        const item = coll.findOne({ _id });

        if (item) {
            coll.remove(item);
        } else {
            log.error('Item not found in db', _id);
        }
    });

    // get all data (synchronous)
    ipc.on('dbSync-reloadSync', (event, args) => {
        let collName = args.collName,
            coll = db.getCollection(collName),
            docs = coll.find();

        log.debug('dbSync-reloadSync, no. of docs:', collName, docs.length);

        docs = docs.map((doc) => {
            const ret = {};

            for (const k in doc) {
                if (k !== 'meta' && k !== '$loki') {
                    ret[k] = doc[k];
                }
            }

            return ret;
        });

        event.returnValue = JSON.stringify(docs);
    });
};


exports.frontendSync = function (coll, collName) {
    let ipc = ipcRenderer,
        syncDoneResolver;

    console.debug('Reload collection from backend: ', collName);

    coll.onceSynced = new Promise((resolve, reject) => {
        syncDoneResolver = resolve;
    });

    (new Promise((resolve, reject) => {
        let dataStr,
            dataJson;

        dataStr = ipc.sendSync('dbSync-reloadSync', {
            collName,
        });

        try {
            if (!dataStr || (dataJson = JSON.parse(dataStr)).length === 0) {
                return resolve();
            }

            let done = 0;

            coll.remove({});

            // we do inserts slowly, to avoid race conditions when it comes
            // to updating the UI
            dataJson.forEach((record) => {
                Tracker.afterFlush(() => {
                    try {
                        // On Meteor startup if a record contains a redirect to about:blank
                        // page, the application process crashes.
                        if (typeof (record.redirect) !== 'undefined'
                            && record.redirect.indexOf('//about:blank') > -1) {
                            record.redirect = null;
                        }

                        coll.insert(record);
                    } catch (err) {
                        console.error(err.toString());
                    }

                    done++;

                    if (done >= dataJson.length) {
                        resolve();
                    }
                });
            });
        } catch (err) {
            reject(err);
        }
    }))
    .catch((err) => {
        console.error(err.toString());
    })
    .then(() => {
        // start watching for changes
        coll.find().observeChanges({
            added(id, fields) {
                ipc.send('dbSync-add', {
                    collName,
                    _id: id,
                    fields,
                });
            },
            changed(id, fields) {
                ipc.send('dbSync-changed', {
                    collName,
                    _id: id,
                    fields,
                });
            },
            removed(id) {
                ipc.send('dbSync-removed', {
                    collName,
                    _id: id,
                });
            },
        });

        console.debug('Finished reloading collection from backend: ', collName);

        syncDoneResolver();
    });

    return coll;
};
