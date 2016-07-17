const Loki = require('lokijs');
const Settings = require('./settings');
const path = require('path');
const Q = require('bluebird');
const log = require('./utils/logger').create('Db');
const fs = require('fs');


let db;


exports.init = function() {
  const filePath = path.join(Settings.userDataPath, 'mist.lokidb');

  return Q.try(() => {
    // if db file doesn't exist then create it
    try {
      log.debug(`Check that db exists: ${filePath}`);

      fs.accessSync(filePath, fs.R_OK);

      return Q.resolve();
    } catch (err) {
      log.info(`Creating db: ${filePath}`);

      let tempdb = new Loki(filePath, {
        env: 'NODEJS',
        autoload: false,
      });

      return new Q.promisify(tempdb.saveDatabase, {context: tempdb})();
    }
  })
  .then(() => {
    log.info(`Loading db: ${filePath}`);

    return new Q((resolve, reject) => {
      db = new Loki(filePath, {
        env: 'NODEJS',
        autosave: true,
        autosaveInterval: 5000,
        autoload: true,
        autoloadCallback: function(err) {
          if (err) {
            log.error(err);

            reject(new Error('Error instantiating db'));
          }

          if (!db.getCollection('tabs')) {
            db.addCollection('tabs');
          }

          exports.Tabs = db.getCollection('tabs');

          resolve();
        }
      });      
    });
  })
};



exports.close = function() {
  return new Q((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};


