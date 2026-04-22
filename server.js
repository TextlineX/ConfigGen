const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const CDN = require('./src/cdn');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// 规则集映射表（默认源）
const RULE_SETS = {
  // DailyRules
  'ads-all': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/category-ads-all.json',
  'google': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/google.json',
  'youtube': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/youtube.json',
  'telegram': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/telegram.json',
  'github': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/github.json',
  'netflix': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/netflix.json',
  'disney': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/disney.json',
  'steam': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/steam.json',
  'cn': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/cn.json',
  'bilibili': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/bilibili.json',
  // GameRules
  'kg-mc': 'https://raw.githubusercontent.com/TextlineX/GameRules/main/src/kg-mc.json',
  'steam-direct': 'https://raw.githubusercontent.com/TextlineX/GameRules/main/src/steam-direct.json',
};

// 应用 CDN
function applyCDN(url, cdnIndex = 0) {
  if (cdnIndex === 0 || !url) return url;
  if (url.includes('raw.githubusercontent.com')) {
    const cdn = CDN.github[cdnIndex] || CDN.github[0];
    return url.replace('https://raw.githubusercontent.com', cdn);
  }
  if (url.includes('github.com') && url.includes('/releases/')) {
    const cdn = CDN.release[cdnIndex] || CDN.release[0];
    return url.replace('https://github.com', cdn);
  }
  return url;
}

// 获取规则集内容
async function fetchRuleSet(name) {
  const url = RULE_SETS[name];
  if (!url) return null;
  try {
    const resp = await axios.get(url, { timeout: 10000 });
    return resp.data;
  } catch (err) {
    console.error(`Failed to fetch ${name}:`, err.message);
    return null;
  }
}

// 生成 sing-box 配置
function generateSingbox(config, options = {}) {
  const cdnIndex = options.cdnIndex || 0;
  const gen = require('./generators/singbox');
  return gen(config, { cdnIndex });
}

// 生成 Clash 配置
function generateClash(config, options = {}) {
  const cdnIndex = options.cdnIndex || 0;
  const gen = require('./generators/clash');
  return gen(config, { cdnIndex });
}

// 生成 Surge 配置
function generateSurge(config, options = {}) {
  const cdnIndex = options.cdnIndex || 0;
  const gen = require('./generators/surge');
  return gen(config, { cdnIndex });
}

// API: 获取 CDN 源列表
app.get('/api/cdn', (req, res) => {
  res.json({
    success: true,
    sources: CDN.getSources()
  });
});

// API: 获取可用规则列表
app.get('/api/rules', (req, res) => {
  const cdnIndex = parseInt(req.query.cdn || '0');
  res.json({
    success: true,
    rules: Object.keys(RULE_SETS).map(name => ({
      name,
      url: applyCDN(RULE_SETS[name], cdnIndex)
    }))
  });
});

// API: 获取节点列表
app.get('/api/nodes', (req, res) => {
  try {
    const configPath = path.join(__dirname, 'src/config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const nodes = (config.outbounds || []).filter(n =>
      ['shadowsocks', 'vmess', 'vless', 'trojan', 'hysteria2', 'tuic'].includes(n.type)
    );
    res.json({ success: true, nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: 生成配置
app.post('/api/generate', async (req, res) => {
  try {
    const { type, cdnIndex = 0 } = req.body;
    const configPath = path.join(__dirname, 'src/config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    let content;
    if (type === 'singbox') {
      content = generateSingbox(config, { cdnIndex });
      res.setHeader('Content-Type', 'application/json');
    } else if (type === 'clash') {
      content = generateClash(config, { cdnIndex });
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    } else if (type === 'surge' || type === 'shadowrocket' || type === 'surfboard') {
      content = generateSurge(config, { cdnIndex });
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    } else {
      return res.status(400).json({ success: false, error: 'Unknown type' });
    }

    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: 订阅地址（自动生成配置）
app.get('/sub/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const cdnIndex = parseInt(req.query.cdn || '0');
    const configPath = path.join(__dirname, 'src/config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    let content;
    if (type === 'singbox') {
      content = generateSingbox(config, { cdnIndex });
      res.setHeader('Content-Type', 'application/json');
    } else if (type === 'clash') {
      content = generateClash(config, { cdnIndex });
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    } else if (type === 'surge') {
      content = generateSurge(config, { cdnIndex });
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    } else {
      return res.status(400).send('Unknown type');
    }

    // 防止缓存
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Subscription-Userinfo', 'upload=0; download=0; total=999999; expire=' + (Date.now() + 86400000));
    res.send(content);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 仪表盘页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║       ConfigGen Panel 启动成功            ║
╠═══════════════════════════════════════════╣
║  访问地址: http://localhost:${PORT}           ║
║                                           ║
║  订阅地址:                                ║
║  - http://localhost:${PORT}/sub/clash       ║
║  - http://localhost:${PORT}/sub/singbox     ║
║  - http://localhost:${PORT}/sub/surge       ║
║                                           ║
║  CDN 加速:                                ║
║  - ?cdn=0 官方源                          ║
║  - ?cdn=1 ghproxy.net                     ║
║  - ?cdn=2 kgithub.com                     ║
║  - ?cdn=3 gitclone.com                    ║
╚═══════════════════════════════════════════╝
`);
});