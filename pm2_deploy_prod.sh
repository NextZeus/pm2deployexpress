#!/bin/bash

# deploy prod env
#config : pm2_deploy_prod.json

set -e
set -o pipefail

build_release_name=$1

#init params
path_git=$(pwd)

path_deploy_server=/data/work/Server

cd ${path_git}

server_ip="10.0.0.1"
server_port=8000
server_user=root

rsync -avcrzl --delete-after ./pm2_deploy_prod.json ./game_prod.json  --exclude './logs' -e "ssh -p ${server_port}" ${server_user}@${server_ip}:${path_deploy_server}

# pm2 start server
cmd="cd ${path_deploy_server};pm2 startOrRestart pm2_deploy_prod.json;"
ssh -tt -p ${server_port} ${server_user}@${server_ip} "${cmd}"

echo "pm2 star server complete"