# ConfigGen - 多客户端配置生成器

从单一节点配置文件，自动生成多种客户端配置。

## 支持的客户端

| 客户端 | 格式 | 说明 |
|--------|------|------|
| sing-box | JSON | 完整配置文件 |
| Clash / Clash Meta | YAML | 通用代理配置 |
| Surge 4/5 | CONF | Surge 配置 |
| Shadowrocket | CONF | iOS 通用 |
| Surfboard | CONF | iOS 替代客户端 |

## 快速开始

### 1. 配置节点

编辑 `src/config.json`，放入你的 sing-box 节点配置：
```json
{
  "outbounds": [
    { "type": "vless", "server": "...", "uuid": "..." },
    { "type": "shadowsocks", "server": "...", "password": "..." }
  ]
}
```

### 2. 生成配置

```bash
npm install
npm start
```

### 3. 获取生成的配置

```
output/
├── config-singbox.json    # sing-box
├── config-clash.yaml      # Clash
├── config-surge.conf      # Surge
├── config-shadowrocket.conf
└── config-surfboard.conf
```

## 目录结构

```
ConfigGen/
├── src/
│   ├── config.json        # 你的节点配置
│   ├── index.js           # 生成器入口
│   └── cdn.js            # CDN 列表
├── generators/            # 各客户端生成器
│   ├── singbox.js
│   ├── clash.js
│   └── surge.js
├── output/               # 生成输出
├── public/               # Web 面板 (可选)
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── server.js             # Web 服务
├── Dockerfile
└── README.md
```

## Web 面板 (可选)

部署到服务器后，可通过浏览器访问：

```
http://你的服务器:3000
```

功能：
- 查看节点列表
- 生成各客户端配置
- 一键复制订阅地址
- CDN 加速选择

## Docker 部署

```bash
# 构建
docker build -t configgen .

# 运行
docker run -d -p 3000:3000 \
  -v /your/config.json:/app/src/config.json \
  configgen
```

## CDN 加速

面板支持多种 CDN 切换：
- 官方源
- ghfast.top
- ghproxy.com
- mirror.ghproxy.com
- github.moeyy.cn
- kgithub.com

## 规则来源

ConfigGen 自动组装以下规则仓库：
- [DailyRules](https://github.com/TextlineX/DailyRules) - 日常规则
- [GameRules](https://github.com/TextlineX/GameRules) - 游戏规则

## API

```
GET  /api/rules          # 获取规则列表
GET  /api/nodes          # 获取节点列表
POST /api/generate       # 生成配置
GET  /sub/:type          # 订阅地址
     /sub/clash
     /sub/singbox
     /sub/surge
```

## License

MIT
