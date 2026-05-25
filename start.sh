#!/bin/bash
cd "$(dirname "$0")/server"
echo "📸 正在启动摄影师网站服务..."
exec node index.js
