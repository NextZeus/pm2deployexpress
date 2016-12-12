/**
 * pm2 启动服务器
 * Created by lixiaodong on 16/12/12.
 */

var async = require('async');
var pm2 = require('pm2');

var game_env = process.argv[2];


var gameConfig,
    isConnected,
    pm2Apps={};

/**
 * 根据配置动态生成app 配置
 * @param appName
 * @param envName
 * @param port
 * @returns {*}
 */
function getAppConfig(appName,envName,port){
    var appConfig ;

    var apps = gameConfig.apps;

    for(var i = 0 ; i < apps.length; i++){
        if(apps[i].name == appName){
            appConfig = apps[i];
            break;
        }
    }

    if(appConfig){
        appConfig = JSON.stringify(appConfig);
        appConfig = appConfig.replace(/%GAME_ENV/g,envName);
        appConfig = appConfig.replace(/%PORT/g,port);
        appConfig = JSON.parse(appConfig);
    }
    return appConfig;
}




async.waterfall([
    function (cb) {
        if (!game_env) {
            return cb('missing env');
        }
        gameConfig = require('./game_dev.json');

        var appConfig = gameConfig && gameConfig.targets && gameConfig.targets[game_env];

        var serverPort = appConfig.server;

        if(!serverPort || !serverPort.length){
            return cb('server port missing');
        }

        //multi server port
        for(var i = 0 ; i < serverPort.length; i++){
            var port = serverPort[i];
            var app = getAppConfig('server-%GAME_ENV-%PORT',game_env,port);
            pm2Apps[app.name] = app;
        }

        cb();
    },
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
            //正在运行的pm2 app
            var appNamesRunning = {};
            if (!!processDescriptionList) {
                for (var i = 0; i < processDescriptionList.length; i++) {
                    var runningAppName = processDescriptionList[i].name;
                    appNamesRunning[runningAppName] = 1;
                }
            }
            var appNames = Object.keys(appNamesRunning);
            console.log('appNames running:', appNames);

            var appNamesToStart = Object.keys(pm2Apps);
            var appNamesWillStop = [];

            for(var i = 0 ; i < appNames.length; i++){
                if(appNamesToStart.indexOf(appNames[i]) != -1){
                    appNamesWillStop.push(appNames[i]);
                }
            }
            console.log('appNamesWillStop>>>>>',appNamesWillStop);

            async.mapSeries(appNamesWillStop,function (app,call) {
                pm2.stop(app,function (err) {
                    console.log('pm2 stop app:' + app + 'err:'+err);
                    call();
                });
            },function (err) {
                cb(err);
            });
        });
    },
    function (cb) {
        var appNamesToStart = Object.keys(pm2Apps);
        async.mapSeries(appNamesToStart,function (app,call) {
            pm2.start(pm2Apps[app],function (err) {
                console.log('pm2 start app:' + app + 'err:'+err);
                call();
            });
        },function (err) {
            cb(err);
        })
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
