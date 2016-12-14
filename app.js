var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

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

// Access Control
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.header("Content-Type", "text/html;charset=utf-8");
    next();
});

//middleware
var forceSSL = function (req, res, next) {
    console.log('forcessl>>>>>>',req.headers);
    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect([ 'https://', req.get('Host'), req.url ].join(''));
    }
    return next();
};

// if (process.env.web_env === 'production') {
    app.use(forceSSL);
// }

var router = express.Router();

//auto load routes : post method
var loadRoutes = function(){
    var fs = require('fs');
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


process.on('uncaughtException', function (err) {
    console.error('uncaughtException error:',err);
    console.error(err.stack);
});

module.exports = app;
