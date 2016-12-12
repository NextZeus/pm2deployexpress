/**
 * pm2 启动服务器
 * Created by lixiaodong on 16/12/12.
 */

var async = require('async');
var pm2 = require('pm2');

var isConnected;

async.waterfall([
    function (cb) {
        pm2.connect(function (err) {
            if(!err){
                isConnected = true;
            }
            cb(err);
        });
    },
    function (cb) {
        pm2.list(function (err, processDescriptionList) {
            var appNamesRunning = {};
            if (!!processDescriptionList) {
                for (var i = 0; i < processDescriptionList.length; i++) {
                    var runningAppName = processDescriptionList[i].name;
                    appNamesRunning[runningAppName] = 1;
                }
            }
            var appNames = Object.keys(appNamesRunning);
            console.log('appNames running:', appNames);

            cb(err);
        });
    }
],function (err) {
    if(isConnected){
        console.log('pm2 disconnect');
        pm2.disconnect();
    }
    if(!!err){
        process.exit(2);
    }

    console.log('pm2 start server complete!');
});
