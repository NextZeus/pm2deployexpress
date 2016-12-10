var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var redisUtil = require('./util/redisUtil.js');

var game_dev = require('./game_dev.json');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if (game_dev.enable_session) {
    app.use(session({
        store: new RedisStore({
            client: redisUtil.getRedisClient(),
            ttl: 90000,   //session有效期 单位 秒
            prefix: game_dev.redis.prefix + 'sess:',
            logErrors: true
        }),
        secret: game_dev.server_name,
        cookie: {maxAge:90000000},  //session有效期 单位 ms
        resave: false,
        saveUninitialized: true
    }));
}

// Access Control
app.use(function (req, res, next) {
    var origin = (game_dev.allow_origin == '*' ? req.headers.origin : game_dev.allow_origin);
    if (!origin) origin = '*';

    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.header("Content-Type", "text/html;charset=utf-8");
    next();
});

var router = express.Router();

//auto load routes : post method
var loadRoutes = function(){
    var dirName = __dirname;
    var routesPath = path.join(dirName,'/routes');
    var files = fs.readdirSync(routesPath);
    for(var i = 0; i < files.length; i ++){
        var filePath = path.join(routesPath,files[i]);
        if(!fs.statSync(filePath).isDirectory() && filePath.indexOf('.js') != -1){
            var model = require(filePath);
            for(var key in require(filePath)){
                if(typeof(model[key]) ==  'function'){
                    router.post('/' + key,model[key]);
                }
            }
        }
    }
};
loadRoutes();
app.use('/',router);



mongoose.connect(game_dev.mongo.server_url, game_dev.mongo.server_opts, function(err) {
    console.log('Mongoose default connection callback, err:' + err);
});

mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + game_dev.mongo.server_url);
});
mongoose.connection.on('error',function (err) {
    console.log('Mongoose default connection open to ' + game_dev.mongo.server_url + ' error!');
    console.log('Mongoose default connection error: ' + err);
});
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});
mongoose.connection.once('open', function () {
    console.log('connected to mongodb!', game_dev.mongo.server_url);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
