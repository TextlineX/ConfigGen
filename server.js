const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// 规则集映射表
const RULE_SETS = {
  // 广告
  'ads-all': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/category-ads-all.json',
  // 代理
  'google': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/google.json',
  'youtube': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/youtube.json',
  'telegram': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/telegram.json',
  'github': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/github.json',
  'netflix': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/netflix.json',
  'disney': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/disney.json',
  'steam': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/steam.json',
  'category-ai-!cn': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/category-ai-!cn.json',
  // 直连
  'cn': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/cn.json',
  'bilibili': 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/bilibili.json',
  // 游戏
  'kg-mc': 'https://raw.githubusercontent.com/TextlineX/GameRules/main/src/kg-mc.json',
  'steam-direct': 'https://raw.githubusercontent.com/TextlineX/GameRules/main/src/steam-direct.json',
};

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
async function generateSingbox(nodes, rules) {
  const outbounds = [];
  const routeRules = [];

  // 添加节点
  for (const node of nodes) {
    outbounds.push(node);
  }

  // 默认出站
  outbounds.push(
    { type: 'selector', tag: '🚀 自动选择', outbounds: nodes.map(n => n.tag) },
    { type: 'direct', tag: '📺 哔哩哔哩' },
    { type: 'direct', tag: '🛑 广告拦截' },
    { type: 'direct', tag: '🎮 游戏直连' },
    { type: 'direct', tag: '🔒 国内服务' },
    { type: 'block', tag: 'block' },
    { type: 'direct', tag: 'direct' }
  );

  // 添加规则集
  const ruleSetList = [];
  for (const [name, url] of Object.entries(RULE_SETS)) {
    ruleSetList.push({
      tag: name,
      type: 'remote',
      url,
      format: 'source',
      download_detour: '🚀 自动选择'
    });
  }

  // 规则
  routeRules.push(
    { action: 'route', rule_set: ['ads-all'], outbound: '🛑 广告拦截' },
    { action: 'route', rule_set: ['kg-mc', 'steam-direct'], outbound: '🎮 游戏直连' },
    { action: 'route', rule_set: ['cn', 'bilibili'], outbound: '🔒 国内服务' },
    { action: 'route', rule_set: ['google', 'youtube'], outbound: '🚀 自动选择' }
  );

  return {
    log: { disabled: false, level: 'info' },
    inbounds: [
      { type: 'mixed', tag: 'mixed-in', listen: '0.0.0.0', listen_port: 20122 },
      { type: 'tun', tag: 'tun-in', address: ['172.19.0.1/30'], auto_route: true, strict_route: true, stack: 'system' }
    ],
    outbounds,
    route: {
      rules: routeRules,
      rule_set: ruleSetList,
      auto_detect_interface: true,
      final: '🚀 自动选择'
    },
    dns: {
      servers: [
        { tag: 'dns_proxy', type: 'tcp', detour: '🚀 自动选择', server: '1.1.1.1' },
        { tag: 'dns_direct', type: 'https', server: 'dns.alidns.com' },
        { tag: 'dns_fallback', type: 'udp', server: '223.5.5.5' }
      ],
      final: 'dns_direct'
    }
  };
}

// 生成 Clash 配置
async function generateClash(nodes, rules) {
  const lines = [];
  lines.push('port: 7890');
  lines.push('socks-port: 7891');
  lines.push('redir-port: 7892');
  lines.push('allow-lan: true');
  lines.push('mode: rule');
  lines.push('log-level: info');
  lines.push('');

  lines.push('dns:');
  lines.push('  enable: true');
  lines.push('  enhanced-mode: fakeip');
  lines.push('  fake-ip-range: 198.18.0.1/16');
  lines.push('  nameserver:');
  lines.push('    - https://doh.pub/dns-query');
  lines.push('    - https://dns.alidns.com/dns-query');
  lines.push('');

  // 代理组
  lines.push('proxies:');
  for (const node of nodes) {
    lines.push(`  - name: ${node.tag}`);
    lines.push(`    type: ${node.type}`);
    if (node.server) lines.push(`    server: ${node.server}`);
    if (node.server_port) lines.push(`    port: ${node.server_port}`);
    if (node.uuid) lines.push(`    uuid: ${node.uuid}`);
    if (node.password) lines.push(`    password: ${node.password}`);
    lines.push('');
  }
  lines.push('');

  lines.push('proxy-groups:');
  lines.push('  - name: 🚀 自动选择');
  lines.push('    type: select');
  lines.push(`    proxies:`);
  for (const node of nodes) {
    lines.push(`      - ${node.tag}`);
  }
  lines.push('');

  // 规则
  lines.push('rules:');
  lines.push('  - DOMAIN-SUFFIX,doubleclick.net,🛑 广告拦截');
  lines.push('  - DOMAIN-SUFFIX,googlesyndication.com,🛑 广告拦截');
  lines.push('  - DOMAIN-SUFFIX,bilibili.com,📺 哔哩哔哩');
  lines.push('  - GEOIP,CN,🔒 国内服务');
  lines.push('  - DOMAIN-SUFFIX,youtube.com,🚀 自动选择');
  lines.push('  - DOMAIN-SUFFIX,google.com,🚀 自动选择');
  lines.push('  - DOMAIN-SUFFIX,telegram.org,🚀 自动选择');
  lines.push('  - DOMAIN-SUFFIX,github.com,🚀 自动选择');
  lines.push('  - MATCH,🚀 自动选择');

  return lines.join('\n');
}

// API: 获取可用规则列表
app.get('/api/rules', (req, res) => {
  res.json({
    success: true,
    rules: Object.keys(RULE_SETS).map(name => ({
      name,
      url: RULE_SETS[name]
    }))
  });
});

// API: 生成配置
app.post('/api/generate', async (req, res) => {
  try {
    const { type, nodes } = req.body;

    if (type === 'singbox') {
      const config = await generateSingbox(nodes || [], {});
      res.json({ success: true, config });
    } else if (type === 'clash') {
      const config = await generateClash(nodes || [], {});
      res.json({ success: true, config });
    } else {
      res.status(400).json({ success: false, error: 'Unknown type' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: 订阅地址（自动生成配置）
app.get('/sub/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const configPath = path.join(__dirname, 'src/config.json');
    const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const nodes = userConfig.outbounds.filter(n =>
      ['shadowsocks', 'vmess', 'vless', 'trojan'].includes(n.type)
    );

    let content;
    if (type === 'singbox') {
      content = await generateSingbox(nodes, {});
      res.setHeader('Content-Type', 'application/json');
    } else if (type === 'clash') {
      content = await generateClash(nodes, {});
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    } else {
      return res.status(400).send('Unknown type');
    }

    res.send(content);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`ConfigGen Panel running at http://localhost:${PORT}`);
  console.log(`订阅地址: http://localhost:${PORT}/sub/clash`);
  console.log(`订阅地址: http://localhost:${PORT}/sub/singbox`);
});