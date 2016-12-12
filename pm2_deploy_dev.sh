#!/bin/bash

# stop shell if error
set -e
set -o pipefail

if [ $# -lt 1 ]; then
    echo "Usage:"
    echo "  sh deploy.sh [target]"
    echo "target:   [staging | alpha ]"
    echo ""
    echo "etc:  sh deploy.sh staging"
    echo ""
    exit 1
fi

build_target=$1

#init params
port=4000
path_git=$(pwd)
path_config=./game_dev.json
path_deploy=/data/work/server/${build_target}

#check params
target_list=("staging" "alpha")
if [[ " ${target_list[@]} " =~ " ${build_target} " ]] ; then
    echo "build target : ${build_target}"
else
    echo "invalid target: ${build_target}"
    exit 1
fi

echo "deploy begin"

cd ${path_git}



#server port
host_port=8000
#server ip
host_ip=10.0.0.1
#server user
host_user_name=root

#修改配置的send_mail_on_error项
sed -i '' "s/send_mail_on_error\": false/send_mail_on_error\": true/g" ${path_config}

# sync file to server
rsync -avcrzl --delete-after ./game_dev.json  --exclude ./logs -e 'ssh -p ${host_port}' ${host_user_name}@${host_ip}:${path_deploy}

git checkout ${path_config}

# start server
cmd="cd ${path_deploy} ; node pm2_start_server.js ${build_target};"
ssh -tt -p ${host_port} ${host_user_name}@${host_ip} "${cmd}"

echo "deploy complete!"

