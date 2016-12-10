#!/bin/bash

#if error stop shell
set -e
set -o pipefail

if [$# -lt 1i ]; then
    echo "Usage:"
    echo "  sh deploy.sh [target]"
    echo "valid targets:[staging|alpha]"
    echo ""
    echo "example: sh deploy.sh staging"
exit 1
fi

deploy_target=$1

#init params
port=4000
path_git=${pwd}
path_config=./game_dev.json
path_deploy=/data/work/server/${deploy_target}

echo "deploy start"

cd ${path_git}


