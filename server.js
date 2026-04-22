const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const CDN = require('./src/cdn');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_FILE = process.env.CONFIG_FILE || '/opt/configgen/config.json';

app.use(express.json());
app.use(express.static('public'));

// 读取配置（优先读取私有配置文件）
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {}
  return null;
}

// 保存配置到私有文件
function saveConfig(data) {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

// API: 获取配置
app.get('/api/config', (req, res) => {
  const config = loadConfig();
  if (config) {
    // 隐藏敏感信息
    const safeConfig = JSON.parse(JSON.stringify(config));
    safeConfig.outbounds?.forEach(ob => {
      if (ob.password) ob.password = '***';
      if (ob.uuid) ob.uuid = '***';
    });
    return res.json({ success: true, config: safeConfig });
  }
  res.json({ success: false, message: 'No config found' });
});

// API: 保存配置
app.post('/api/config', (req, res) => {
  try {
    const config = req.body;
    if (!config || !config.outbounds) {
      return res.status(400).json({ success: false, error: 'Invalid config' });
    }
    saveConfig(config);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: 获取节点列表
app.get('/api/nodes', (req, res) => {
  const config = loadConfig();
  if (!config) return res.json({ success: false });
  const nodes = (config.outbounds || []).filter(n =>
    ['shadowsocks', 'vmess', 'vless', 'trojan', 'hysteria2', 'tuic'].includes(n.type)
  );
  res.json({ success: true, nodes });
});

// API: 获取 CDN 列表
app.get('/api/cdn', (req, res) => {
  res.json({ success: true, sources: CDN.getSources() });
});

// API: 获取规则列表
app.get('/api/rules', (req, res) => {
  const cdnIndex = parseInt(req.query.cdn || '1');
  const applyCdn = (url) => {
    if (cdnIndex === 0) return url;
    if (url.includes('raw.githubusercontent.com')) {
      const cdn = CDN.github[cdnIndex] || CDN.github[0];
      return url.replace('https://raw.githubusercontent.com', cdn);
    }
    return url;
  };

  const rules = [
    { name: 'ads-all', url: applyCdn('https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/category-ads-all.json') },
    { name: 'google', url: applyCdn('https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/google.json') },
    { name: 'youtube', url: applyCdn('https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/youtube.json') },
    { name: 'telegram', url: applyCdn('https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/telegram.json') },
    { name: 'github', url: applyCdn('https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/github.json') },
    { name: 'netflix', url: applyCdn('https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/netflix.json') },
    { name: 'cn', url: applyCdn('https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/cn.json') },
    { name: 'bilibili', url: applyCdn('https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/bilibili.json') },
    { name: 'kg-mc', url: applyCdn('https://raw.githubusercontent.com/TextlineX/GameRules/main/src/kg-mc.json') },
    { name: 'steam-direct', url: applyCdn('https://raw.githubusercontent.com/TextlineX/GameRules/main/src/steam-direct.json') },
  ];
  res.json({ success: true, rules });
});

// API: 生成配置
app.post('/api/generate', async (req, res) => {
  try {
    const { type, cdnIndex = 1 } = req.body;
    const config = loadConfig();
    if (!config) return res.status(400).json({ success: false, error: 'No config found' });

    let gen;
    if (type === 'singbox') gen = require('./generators/singbox');
    else if (type === 'clash') gen = require('./generators/clash');
    else gen = require('./generators/surge');

    const content = gen(config, { cdnIndex });
    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 仪表盘
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════╗
║       ConfigGen Panel 启动成功             ║
╠═══════════════════════════════════════════╣
║  访问地址: http://0.0.0.0:${PORT}           ║
║                                           ║
║  配置文件: ${CONFIG_FILE}  ║
╚═══════════════════════════════════════════╝
`);
});
