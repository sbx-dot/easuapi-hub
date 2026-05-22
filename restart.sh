#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

echo "正在删除缓存..."
rm -rf .next

if [ "${SKIP_NPM_INSTALL:-0}" = "1" ]; then
  echo "已跳过依赖安装。"
else
  echo "正在安装依赖..."
  npm install
fi

echo "正在构建..."
npm run build

echo "正在重启 PM2..."
pm2 restart eelapi --update-env

echo "部署完成，请检查 pm2 logs eelapi 是否正常"
