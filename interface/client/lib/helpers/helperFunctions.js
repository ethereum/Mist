/**
Helper functions

@module Helpers
**/

/**
The Helpers class containing helper functions

@class Helpers
@constructor
**/
Helpers = {};

/**
Reruns functions reactively, based on an interval. Use it like so:

    Helpers.rerun['10s'].tick();


@method rerun
**/
Helpers.rerun = {
    '10s': new ReactiveTimer(10),
    '1s': new ReactiveTimer(1)
};

/**
Get the webview from either and ID, or the string "browser"

@method getWebview
@param {String} id  The Id of a tab or the string "browser"
*/
Helpers.getWebview = function(id){
    return $('webview[data-id="'+ id +'"]')[0];
};

/**
Get tab by url and return the id

@method getTabIdByUrl
@param {String} url
@return {String} id
*/
Helpers.getTabIdByUrl= function(url, returnEmpty){
    var tabs = Tabs.find().fetch();
    url = Helpers.sanitizeUrl(url);

    var foundTab = _.find(tabs, function(tab){
            if(tab._id === 'browser' || !tab.url)
                return false;
            var tabOrigin = new URL(tab.url).origin;
            return (url && new URL(url).origin.indexOf(tabOrigin) === 0);
        });

    // switch tab to browser
    if(foundTab)
        foundTab = foundTab._id;
    else
        foundTab = 'browser';

    return foundTab;
};

/**
Format Urls, e.g add a default protocol if on is missing.

@method formatUrl
@param {String} url
**/
Helpers.formatUrl = function(url){
    // add http:// if no protocol is present
    if(url && url.indexOf('://') === -1)
        url = 'http://'+ url;

    return url;
};

/**
Sanatizes URLs to prevent phishing and XSS attacks

@method sanitizeUrl
@param {String} url
**/
Helpers.sanitizeUrl = function(url, returnEmptyURL){
    url = String(url);

    url = url.replace(/[\t\n\r\s]+/g, '');
    url = url.replace(/^[:\/]{1,3}/i, 'http://');

    if(returnEmptyURL && /^(?:file|javascript|data):/i.test(url)) {
        url = false;
    }

    return url;
};

/**
Takes an URL and creates a breadcrumb out of it.

@method generateBreadcrumb
@return Spacebars.SafeString
**/
Helpers.generateBreadcrumb = function (url) {
    var filteredUrl;
    var pathname;

    filteredUrl = {
        host: Blaze._escape(url.host),
        pathname: Blaze._escape(url.pathname)
    };

    pathname = _.reject(filteredUrl.pathname.replace(/\/$/g, '').split('/'), function (el) {
        return el === '';
    });

    return new Spacebars.SafeString(_.flatten(['<span>' + filteredUrl.host + ' </span>', pathname]).join(' ▸ '));
};

/**
Clear localStorage

@method getLocalStorageSize
**/
Helpers.getLocalStorageSize = function () {

    var size = 0;
    if(localStorage) {
        _.each(Object.keys(localStorage), function (key) {
            size += localStorage[key].length * 2 / 1024 / 1024;
        });
    }

    return size;
};

/**
Makes tab with index active

@method selecTabWithIndex
@param {Integer} index
*/
Helpers.selectTabWithIndex = function (index) {
    var tabList = Tabs.find({}, { sort: { position: 1 }, fields: { _id: 1 } }).fetch();
    if (index < tabList.length) {
        LocalStore.set('selectedTab', tabList[index]._id);
    }
};

/**
Makes last tab active

@method selecLastTab
*/
Helpers.selectLastTab = function () {
    var lastTab = Tabs.findOne({}, { sort: { position: -1 }, fields: { _id: 1 }, limit: 1 });
    LocalStore.set('selectedTab', lastTab._id);
};

/**
Selects previous or next tab (offset +1 or -1)

@method selectTabWithOffset
*/
Helpers.selectTabWithOffset = function (offset) {
    var tabList;
    var currentTabIndex;
    var newTabIndex;

    if (Math.abs(offset) !== 1) {
        return;
    }
    tabList = _.pluck(Tabs.find({}, { sort: { position: 1 }, fields: { _id: 1 } }).fetch(), '_id');
    currentTabIndex = tabList.indexOf(LocalStore.get('selectedTab'));

    newTabIndex = (currentTabIndex + offset) % tabList.length;
    if (newTabIndex < 0) newTabIndex = tabList.length - 1;

    LocalStore.set('selectedTab', tabList[newTabIndex]);
};

/**
Detect Network

@method detectNetwork
**/
Helpers.detectNetwork = function (hash) {
    var network = {};

    switch (hash) {
    case '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3':
        console.log('Network is mainnet');
        network.type = 'mainnet';
        break;

    case '0x41941023680923e0fe4d74a34bdac8141f2540e3ae90623718e47d66d1ca4a2d':
        console.log('Network is Testnet #3 (Ropsten)');
        network.type = 'testnet';
        network.name = 'Testnet #3 (Ropsten)';
        break;

    case '0x0cd786a2425d16f152c658316c423e6ce1181e15c3295826d7c9904cba9ce303':
        console.log('Network is Testnet #2 (Morden)');
        network.type = 'testnet';
        network.name = 'Testnet #2 (Morden)';
        break;

    default:
        console.log('Network is privatenet');
        network.type = 'privatenet';
    }

    return network;
};


/**
Detect Network

@method detectNetwork
**/
Helpers.detectNetwork = function (hash) {
    var network = {};

    switch (hash) {
    case '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3':
        console.log('Network is mainnet');
        network.type = 'mainnet';
        break;

    case '0x41941023680923e0fe4d74a34bdac8141f2540e3ae90623718e47d66d1ca4a2d':
        console.log('Network is testnet (Ropsten)');
        network.type = 'testnet';
        network.name = 'Ropsten';
        break;

    case '0x0cd786a2425d16f152c658316c423e6ce1181e15c3295826d7c9904cba9ce303':
        console.log('Network is testnet (Morden)');
        network.type = 'testnet';
        network.name = 'Morden';
        break;

    default:
        console.log('Network is privatenet');
        network.type = 'privatenet';
    }

    return network;
};


/**
Displays an error as global notification

@method displayError
@param {Object} error The error object
@param {Boolean} accounts will show the accounts errors
@return {Boolean}
**/
// Helpers.displayError = function(error, accounts) {
//     var duration = 8;

//     if(error) {

//         if(error.reason){
//             // hack to make account errors still work
//             if(accounts) {
//                 GlobalNotification.error({
//                     content: 'i18n:accounts.error.' + error.reason.toLowerCase().replace(/[ ]+/g, ''),
//                     duration: duration
//                 });

//             } else {
//                 GlobalNotification.error({
//                     content: 'i18n:'+ error.reason,
//                     duration: duration
//                 });
//             }
//         } else if(error.message) {
//             GlobalNotification.error({
//                 content: error.message,
//                 duration: duration
//             });
//         } else {
//             GlobalNotification.error({
//                 content: error,
//                 duration: duration
//             });
//         }

//         return true;

//     } else
//         return false;
// };


/**
Get form values and build a parameters object out of it.

@method formValuesToParameters
@param {Element} elements   DOM-Elements elements, selects, inputs and textareas, to get values from. Must have a name tag
@return {Object} An object with parameters to pass to the API Controller e.g.:

    {
        key1: 'value1',
        key2: 'value2'
    }
**/
// Helpers.formValuesToParameters = function(elements) {
//     var parameters = {};

//     $(elements).each(function(){
//         var $element = $(this),
//             name = $element.attr('name'),
//             value = $element.val();

//         // add only values wich are not null or empty
//         if(name && !_.isEmpty(value) && value !== 'null' && value !== 'NULL') {
//             if(_.isFinite(value))
//                 parameters[name] = parseInt(value);
//             else if(_.isBoolean(value))
//                 parameters[name] = (value === 'true' || value === 'True' || value === 'TRUE') ? true : false;
//             else if($element.attr('type') === 'radio')
//                 parameters[name] = ($element.is(':checked')) ? true : false;
//             else if($element.attr('type') === 'checkbox')
//                 parameters[name] = ($element.is(':checked')) ? true : false;
//             else
//                 parameters[name] = value;
//         }
//         $element = null;
//     });

//     return parameters;
// };


/**
Reactive wrapper for the moment package.

@method moment
@param {String} time    a date object passed to moment function.
@return {Object} the moment js package
**/
// Helpers.moment = function(time){

//     // react to language changes as well
//     TAPi18n.getLanguage();

//     if(_.isFinite(time) && moment.unix(time).isValid())
//         return moment.unix(time);
//     else
//         return moment(time);

// };


/**
Formats a timestamp to any format given.

    Helpers.formatTime(myTime, "YYYY-MM-DD")

@method formatTime
@param {String} time         The timstamp, can be string or unix format
@param {String} format       the format string, can also be "iso", to format to ISO string, or "fromnow"
@return {String} The formated time
**/
// Helpers.formatTime = function(time, format) { //parameters

//     // make sure not existing values are not Spacebars.kw
//     if(format instanceof Spacebars.kw)
//         format = null;

//     if(time) {

//         if(_.isString(format) && !_.isEmpty(format)) {

//             if(format.toLowerCase() === 'iso')
//                 time = Helpers.moment(time).toISOString();
//             else if(format.toLowerCase() === 'fromnow') {
//                 // make reactive updating
//                 Helpers.rerun['10s'].tick();
//                 time = Helpers.moment(time).fromNow();
//             } else
//                 time = Helpers.moment(time).format(format);
//         }

//         return time;

//     } else
//         return '';
// };


/**
Formats a given number

    Helpers.formatNumber(10000, "0.0[000]")

@method formatNumber
@param {Number|String|BigNumber} number the number to format
@param {String} format           the format string e.g. "0.0[000]" see http://numeraljs.com for more.
@return {String} The formated time
**/
// Helpers.formatNumber = function(number, format){
//     if(format instanceof Spacebars.kw)
//         format = null;

//     if(number instanceof BigNumber)
//         number = number.toString(10);

//     format = format || '0,0.0[0000]';

//     if(!_.isFinite(number))
//         number = numeral().unformat(number);

//     if(_.isFinite(number))
//         return numeral(number).format(format);
// };


/**
Formats a given number toa unit balance

    Helpers.formatBalance(10000, "0.0[000]")

@method formatBalance
@param {Number|String|BigNumber} number the number to format
@param {String} format           the format string e.g. "0.0[000]" see http://numeraljs.com for more.
@return {String} The formated balance including the unit
**/
// Helpers.formatBalance = function(number, format){
//     number = web3.fromWei(number, LocalStore.get('etherUnit'));

//     return Helpers.formatNumber(number, format) +' '+ LocalStore.get('etherUnit');
// };
