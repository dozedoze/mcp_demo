#!/bin/bash

# Playwright 浏览器依赖安装脚本
# 用于 WSL2 / Ubuntu / Debian 系统

echo "=========================================="
echo "Playwright 浏览器依赖安装脚本"
echo "=========================================="

# 检查是否有 sudo 权限
if ! command -v sudo &> /dev/null; then
    echo "❌ 需要 sudo 权限来安装依赖"
    exit 1
fi

echo ""
echo "📦 正在更新包列表..."
sudo apt-get update

echo ""
echo "📦 正在安装 Chromium 所需的系统依赖..."
sudo apt-get install -y \
    libnspr4 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libxshmfence1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 系统依赖安装完成！"
    echo ""
    echo "现在可以运行 MCP Server 了。"
else
    echo ""
    echo "❌ 安装过程中出现错误"
    echo ""
    echo "备选方案: 安装 Google Chrome"
    echo ""
    echo "wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb"
    echo "sudo dpkg -i google-chrome-stable_current_amd64.deb"
    echo "sudo apt-get install -f"
fi

