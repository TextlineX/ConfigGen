# ConfigGen 面板

多客户端配置生成面板，可部署到服务器。

## 支持的客户端

- **Sing-box** - JSON 配置
- **Clash / Clash Meta** - YAML 配置
- **Surge / Shadowrocket** - CONF 配置

## 快速部署

### Docker 部署（推荐）

```bash
docker build -t configgen .
docker run -d -p 3000:3000 \
  -v /your/config.json:/app/src/config.json \
  --restart unless-stopped \
  configgen
```

### Docker Compose

```yaml
version: '3.8'
services:
  configgen:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
    restart: unless-stopped
```

### 手动部署

```bash
npm install
node server.js
```

## 功能

1. **订阅地址** - 自动生成各客户端订阅
   - `/sub/clash` - Clash 订阅
   - `/sub/singbox` - Sing-box 订阅

2. **规则集** - 在线查看所有规则状态

3. **配置生成** - 实时生成各客户端配置

4. **自动更新** - GitHub Actions 每6小时同步规则

## API

```
GET  /api/rules          # 获取规则列表
POST /api/generate       # 生成配置
GET  /sub/:type          # 订阅地址
```

## 目录结构

```
ConfigGen/
├── server.js           # Express 服务
├── src/
│   └── config.json     # 你的配置文件
├── public/             # 前端静态文件
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── generators/         # 配置生成器
│   ├── singbox.js
│   ├── clash.js
│   └── surge.js
├── Dockerfile
└── README.md
```