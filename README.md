# 使用pm2 实现自动化的多服务器部署--express application

[![Greenkeeper badge](https://badges.greenkeeper.io/NextZeus/pm2deployexpress.svg)](https://greenkeeper.io/)



在使用express开发游戏服务器的过程中，使用到了pm2来部署服务器， 下面就简单的介绍一下我们是如何使用pm2做到多个环境，多个服务器的自动化部署的。

项目开发过程中，会有不同的系统开发以及测试， 为了满足不同系统之间互不影响开发测试， 需要部署多个测试服务器到测试环境。 


没有和其他的部署方式做过比较，所以这里也就不说pm2 和其他的部署方式的对比了， 前几天看到了一篇shipit-deploy的文章，写的不错。不过在网上搜索了一下pm2的部署文章，大都是把官方的pm2 command 拿过来，用一下，截个图写个文章， 倒不如去看官方的文档了。  借此机会，也把nodejs使用pm2第三方库的一些简单的使用方法以及部署脚本介绍给大家。 如果发现文章中有不对的地方，还请把问题反馈到issue里。 

![pm2](https://github.com/unitech/pm2/raw/master/pres/pm2.20d3ef.png)

# 安装使用
> sudo npm install pm2 -g



## Commands overview [我常用到的]

### General
> $ npm install pm2 -g            # Install PM2
> 
> $ pm2 start app.js              # Start, Daemonize and auto-restart application (Node)


### Process Monitoring
> $ pm2 list                      # List all processes started with PM2
> 
> $ pm2 monit                     # Display memory and cpu usage of each app
> 
> $ pm2 show [app-name]           # Show all informations about application
> 

### Log management
> $ pm2 logs                      # Display logs of all apps
> 
> $ pm2 logs [app-name]           # Display logs for a specific app
>
> $ pm2 logs [app-id]             # Display logs for a specific app
> 
> $ pm2 flush					   # Empty logs
> 

### Process State Management
> $ pm2 start app.js --name="api" # Start application and name it "api"
> 
> $ pm2 stop 0                    # Stop process with id 0
> 
> $ pm2 restart all               # Restart all apps


## pm2第三方库
```

var async = require('async');
var pm2 = require('pm2');

var runningApps = [];

async.waterfall([
	function (cb) {
		pm2.connect(function(err){
			cb(err);
		});
	},
	function (cb) {
		pm2.list(function(err,data){
			if(!err && !!data && data.length){
				for(var i = 0 ; i < data.length; i++){
					runningApps.push({
						id	:	data[i].id,
						name	:	data[i].name
					});
				}
			}
			cb(err);
		});
	},
	function (cb) {
		//##停止服务器 
		async.mapSeries(runningApps,function(app,call){
			pm2.stop(app.name,function(err){
				call(err);
			});
		},function(err){
			cb(err);
		});
	},
	function (cb) {
		//启动服务器
		async.mapSeries(runningApps,function(app,call){
			pm2.start(app.name,function(err){
				call(err);
			});
		},function(err){
			cb(err);
		});
	}
],function(err){
	//断开连接
	pm2.disconnect();
});


```


## 多服务器配置
部署的服务器我们是这样区分的，一个**target**算是一个群，一个群里可以有多个**server**.
例如下面的targets里有**staging**, **alpha**,还可以继续扩展。 **staging**下面有两个服务器，端口分别为**4001**,**4002**. 

```
#pm2_deploy_dev.json

{
  "apps": [
    {
      "name": "server-%GAME_ENV-%PORT",
      "script": "pm2deployexpress/bin/www",
      "instances": 1,
      "exec_mode": "fork",
      "log_date_format": "YYYY-MM-DD HH:mm Z",
      "combine_logs": true,
      "env": { 
        "PORT": "%PORT",
        "GAME_ENV":"%GAME_ENV",
        "CONFIG_SUFFIX": "dev",
      }
    },
  ],
  "targets": {
    "staging": {
      "server": [4001, 4002],
    },
    "alpha": {
      "server": [4101, 4102, 4103],
    }
  }
}

```
> 顺便说一句，app里的env 是环境变量 . process.argv可以读取到. process.argv[2]对应GAME_ENV

读取配置，动态的生成多个app .

```
# 生成pm2 app json配置
appConfig = JSON.stringify(appConfig);
appConfig = appConfig.replace(/%GAME_ENV/g,envName);
appConfig = appConfig.replace(/%PORT/g,port);
appConfig = JSON.parse(appConfig);

```

## 线上pm2配置
线上的都是固定写好的app配置 不需要动态的去生成 

```
#pm2_deploy_prod.json
{
  "apps": [
    {
      "name": "server-prod-4001",
      "script": "Server/bin/www.js",
      "instances": 1,
      "exec_mode": "fork",
      "log_date_format": "YYYY-MM-DD HH:mm Z",
      "error_file": "/data/logs/server-prod-4001-error.log",
      "out_file": "/data/logs/server-prod-4001-out.log",
      "log_file": "/data/logs/server-prod-4001-all.log",
      "combine_logs": true,
      "env": {
        "PORT": 4001,
        "CONFIG_SUFFIX": "prod",
      }
    },
    {
      "name": "server-prod-4002",
      "script": "Server/bin/www.js",
      "instances": 1,
      "exec_mode": "fork",
      "log_date_format": "YYYY-MM-DD HH:mm Z",
      "error_file": "/data/logs/server-prod-4001-error.log",
      "out_file": "/data/logs/server-prod-4001-out.log",
      "log_file": "/data/logs/server-prod-4001-all.log",
      "combine_logs": true,
      "env": {
        "PORT": 4002,
        "CONFIG_SUFFIX": "prod",
      }
    },
  ]
}

```


### 脚本部署
> sh pm2_deploy_dev.sh staging

* 使用rsync 上传代码
* sed -i 可以动态的修改配置中的字符串，修改配置。


# 结束语
[有什么问题都可以到这提](https://github.com/NextZeus/pm2deployexpress/issues)

3Q!











