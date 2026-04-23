#!/bin/bash
# ConfigGen Panel 自动化部署脚本
# 使用方式: bash deploy.sh

set -e

# 配置
APP_NAME="configgen"
APP_DIR="/opt/configgen"
GIT_REPO="https://github.com/TextlineX/ConfigGen.git"
DOMAIN="${DOMAIN:-tl2.textline.top}"
PORT=3000

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo_step() {
    echo -e "${GREEN}[部署]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

echo_error() {
    echo -e "${RED}[错误]${NC} $1"
}

# 检查 root 权限
if [[ $EUID -ne 0 ]]; then
   echo_error "请使用 sudo 运行此脚本"
   exit 1
fi

# 1. 安装 Node.js
echo_step "检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo_step "安装 Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js $(node -v) 已安装"
fi

# 2. 安装 PM2
echo_step "检查 PM2..."
if ! command -v pm2 &> /dev/null; then
    echo_step "安装 PM2..."
    npm install -g pm2
else
    echo "PM2 已安装"
fi

# 3. 安装 Nginx
echo_step "检查 Nginx..."
if ! command -v nginx &> /dev/null; then
    echo_step "安装 Nginx..."
    apt-get update
    apt-get install -y nginx
else
    echo "Nginx 已安装"
fi

# 4. 安装 Certbot
echo_step "检查 SSL 证书..."
if ! command -v certbot &> /dev/null; then
    echo_step "安装 Certbot..."
    apt-get install -y certbot python3-certbot-nginx
fi

# 5. 创建应用目录
echo_step "创建应用目录..."
if [ -d "$APP_DIR" ]; then
    echo_warn "应用目录已存在，正在更新..."
    cd "$APP_DIR"
    git pull origin master
else
    echo_step "克隆仓库..."
    git clone "$GIT_REPO" "$APP_DIR"
    cd "$APP_DIR"
fi

# 6. 安装依赖
echo_step "安装依赖..."
cd "$APP_DIR"
npm install

# 7. 配置 PM2
echo_step "配置 PM2 开机自启..."
pm2 start server.js --name "$APP_NAME"
pm2 save
pm2 startup

# 8. 配置 Nginx
echo_step "配置 Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx

# 9. 配置 SSL
echo_step "申请 SSL 证书..."
certbot --nginx -d "$DOMAIN" --noninteractive --agree-tos --email admin@$DOMAIN -m admin@$DOMAIN

# 10. 完成
echo ""
echo_step "========================================="
echo_step "  部署完成!"
echo_step "========================================="
echo ""
echo "  访问地址: https://$DOMAIN"
echo "  订阅地址: https://$DOMAIN/sub/singbox"
echo ""
echo "  常用命令:"
echo "    pm2 status        # 查看状态"
echo "    pm2 logs $APP_NAME # 查看日志"
echo "    pm2 restart $APP_NAME # 重启"
echo ""
