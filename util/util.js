/**
 * Created by lixiaodong on 16/12/10.
 */
var _ = require('underscore');

var configName = process.env.GAME_CONFIG_SUFFIX || 'dev';
var gameConfig = require('../../game_' + configName + '.json');
var env = process.env.GAME_ENV || '';
var port = process.env.PORT || '4001';

//自动匹配配置文件 根据脚本参数
gameConfig.mongo.server_url = gameConfig.mongo.server_url.replace(/%PORT/g, port);

if (gameConfig.mongo.server_opts.user) {
    gameConfig.mongo.server_opts.user = gameConfig.mongo.server_opts.user.replace(/%PORT/g, port);
}
gameConfig.redis.prefix += port + '_';
gameConfig.server_name = (process.env.name || 'server-local');
gameConfig.server_port = port;

exports.gameConfig = gameConfig;


function getTimeAt(parHour){
    var oneDay = 24 * 60 * 60 * 1000;
    var fourHours = parHour * 60 * 60 * 1000;
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    month  = month < 10 ? month : '0'+month;
    day  = day < 10 ? day : '0'+day;
    var morning = new Date(year+'-'+month+'-'+day+' 00:00:00').getTime();
    var night = morning + oneDay;

    var hour = now.getHours();
    var time = 0;
    if(hour >= parHour){
        time = night + fourHours;
    } else {
        time = morning + fourHours;
    }
    return time;
}

exports.getTimeAt = getTimeAt;

exports.getTimeAtEighteen = function () {
    return getTimeAt(18);
};

//函数元素叠加
function  overlay(array){
    if(!array || !array.length || !(array instanceof Array)){
        return [];
    }

    var rate = [];
    array.forEach(function (value,index) {
        var tempArr = array.slice(0, index + 1);
        //memo 上一次计算的结果
        rate.push(_.reduce(tempArr, function (memo,num) {
            return memo + num;
        },0));
    });
    return rate;
}

function getRateIndex (array,rate){
    var index = _.sortedIndex(array, rate);
    return index;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getMNTime(date){
    var curr = new Date(getServerTime());
    if(!!date){
        curr = new Date(date);
    }

    var year = curr.getFullYear();
    var month = curr.getMonth() + 1;
    month = month < 10 ? '0'+month : month;
    var day = curr.getDate();
    day = day < 10 ? '0'+day : day;

    var morning = new Date(year + '-' + month + '-' + day + ' 00:00:00').getTime();
    var night = morning + 24 * 60 * 60 * 1000;
    return {morning : morning, night : night};
}

function atDay(time){
    var date = new Date();
    var signDate = new Date(time);

    return (date.getDate() == signDate.getDate()
    && date.getMonth() == signDate.getMonth()
    && date.getYear() == signDate.getYear());
}

/**
 * 获取本周末24点的时间戳
 * @returns {number}
 */
function getTimeAtWeekEnd(){
    var oneDay = 24 * 60 * 60 * 1000;
    var mnTime = getMNTime();
    var currDate = new Date(mnTime.night - 1000);
    var day = currDate.getDay();
    var time = 0;
    if(day == 0){
        time = mnTime.night - Date.now();
    } else {
        time = (7 - day) * oneDay + mnTime.night - Date.now();
    }

    return time;
}

exports.getTimeAtWeekEnd = getTimeAtWeekEnd;
exports.atDay = atDay;
exports.getMNTime = getMNTime;
exports.getRandomInt = getRandomInt;
exports.getRateIndex = getRateIndex;
exports.overlay = overlay;
