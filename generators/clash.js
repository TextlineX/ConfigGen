/**
 * Clash Config Generator
 * 生成 Clash 配置文件（兼容 Clash Meta）
 */

module.exports = function clash(config) {
  const lines = [];

  lines.push('port: 7890');
  lines.push('socks-port: 7891');
  lines.push('redir-port: 7892');
  lines.push('allow-lan: true');
  lines.push('mode: rule');
  lines.push('log-level: info');
  lines.push('external-controller: 127.0.0.1:20123');
  lines.push('');

  // DNS
  lines.push('dns:');
  lines.push('  enable: true');
  lines.push('  enhanced-mode: fakeip');
  lines.push('  fake-ip-range: 198.18.0.1/16');
  lines.push('  nameserver:');
  lines.push('    - https://doh.pub/dns-query');
  lines.push('    - https://dns.alidns.com/dns-query');
  lines.push('  fallback:');
  lines.push('    - https://1.1.1.1/dns-query');
  lines.push('    - tls://dns.google');
  lines.push('  fallback-filter:');
  lines.push('    - geoip:cn');
  lines.push('    - geoip:private');
  lines.push('');

  // Proxy groups
  const groups = buildClashGroups(config);
  for (const [name, group] of Object.entries(groups)) {
    lines.push(`  ${name}:`);
    if (group.type === 'select') {
      lines.push('    - select');
    } else if (group.type === 'urltest') {
      lines.push(`    - url: ${group.url || 'https://www.gstatic.com/generate_204'}`);
      lines.push(`    - interval: 180000`);
    }
    for (const node of group.nodes) {
      lines.push(`    - ${node}`);
    }
    if (group.policy) {
      lines.push(`    policy: ${group.policy}`);
    }
    lines.push('');
  }

  // Proxy（节点）
  lines.push('proxies:');
  for (const ob of config.outbounds || []) {
    if (['shadowsocks', 'vmess', 'vless', 'trojan', 'hysteria2', 'tuic'].includes(ob.type)) {
      lines.push(`  - name: ${ob.tag}`);
      lines.push(`    type: ${ob.type}`);
      if (ob.server) lines.push(`    server: ${ob.server}`);
      if (ob.server_port) lines.push(`    port: ${ob.server_port}`);
      if (ob.uuid) lines.push(`    uuid: ${ob.uuid}`);
      if (ob.password) lines.push(`    password: ${ob.password}`);
      if (ob.method) lines.push(`    cipher: ${ob.method}`);
      if (ob.network) lines.push(`    network: ${ob.network}`);
      if (ob.tls?.enabled) lines.push(`    tls: true`);
      if (ob.tls?.server_name) lines.push(`    sni: ${ob.tls.server_name}`);
      if (ob.tls?.reality?.enabled && ob.tls.reality.public_key) {
        lines.push(`    reality-opts:`);
        lines.push(`      public-key: ${ob.tls.reality.public_key}`);
      }
      if (ob.flow) lines.push(`    flow: ${ob.flow}`);
      lines.push('');
    }
  }
  lines.push('');

  // Rules
  const rules = buildClashRules(config);
  lines.push('rules:');
  for (const rule of rules) {
    lines.push(`  - ${rule}`);
  }

  return lines.join('\n');
};

function buildClashGroups(config) {
  const groups = {
    '🚀 自动选择': { type: 'select', nodes: [] },
  };

  const nodeGroups = {
    '香港': [],
    '台湾': [],
    '日本': [],
    '新加坡': [],
    '美国': [],
    '韩国': [],
    '其他': [],
  };

  for (const ob of config.outbounds || []) {
    if (ob.type === 'urltest') {
      const name = ob.tag;
      groups[name] = { type: 'urltest', url: ob.url, nodes: [] };
      groups[name].nodes.push(ob.tag);
      groups['🚀 自动选择'].nodes.push(name);
    }
    if (ob.type === 'shadowsocks' || ob.type === 'vless' || ob.type === 'vmess') {
      const tag = ob.tag;
      for (const [region, keywords] of Object.entries({
        '🇭🇰香港': ['香港'],
        '🇨🇳台湾': ['台湾'],
        '🇯🇵日本': ['日本'],
        '🇸🇬新加坡': ['新加坡'],
        '🇺🇸美国': ['美国'],
        '🇰🇷韩国': ['韩国'],
      })) {
        if (keywords.some(k => tag.includes(k))) {
          nodeGroups[region].push(tag);
        }
      }
      groups['🚀 自动选择'].nodes.push(tag);
    }
  }

  // 区域分组
  for (const [region, nodes] of Object.entries(nodeGroups)) {
    if (nodes.length > 0) {
      groups[region] = { type: 'select', nodes };
    }
  }

  groups['🐟 漏网之鱼'] = { type: 'select', nodes: ['🚀 自动选择', 'direct'] };

  return groups;
}

function buildClashRules(config) {
  const rules = [];

  // 广告
  rules.push('DOMAIN-SUFFIX,doubleclick.net,🛑 广告拦截');
  rules.push('DOMAIN-SUFFIX,googlesyndication.com,🛑 广告拦截');
  rules.push('DOMAIN-KEYWORD,ads,🛑 广告拦截');

  // 直连规则
  rules.push('DOMAIN-SUFFIX,bilibili.com,📺 哔哩哔哩');
  rules.push('DOMAIN-SUFFIX,baidu.com,🔒 国内服务');
  rules.push('DOMAIN-SUFFIX,taobao.com,🔒 国内服务');
  rules.push('DOMAIN-SUFFIX,tmall.com,🔒 国内服务');
  rules.push('DOMAIN-SUFFIX,tencent.com,🔒 国内服务');
  rules.push('DOMAIN-SUFFIX,qq.com,🔒 国内服务');
  rules.push('DOMAIN-KEYWORD,cn,🔒 国内服务');

  // GeoIP CN
  rules.push('GEOIP,CN,🔒 国内服务');

  // 服务分类
  rules.push('DOMAIN-SUFFIX,youtube.com,📹 油管视频');
  rules.push('DOMAIN-SUFFIX,googlevideo.com,📹 油管视频');
  rules.push('DOMAIN-SUFFIX,google.com,🔍 谷歌服务');
  rules.push('DOMAIN-SUFFIX,telegram.org,📲 电报消息');
  rules.push('DOMAIN-SUFFIX,github.com,🐱 Github');
  rules.push('DOMAIN-SUFFIX,steam.com,🎮 游戏平台');
  rules.push('DOMAIN-SUFFIX,steampowered.com,🎮 游戏平台');
  rules.push('DOMAIN-SUFFIX,netflix.com,🎬 流媒体');
  rules.push('DOMAIN-SUFFIX,disney.com,🎬 流媒体');
  rules.push('DOMAIN-SUFFIX,disneyplus.com,🎬 流媒体');
  rules.push('DOMAIN-SUFFIX,fb.com,🌐 社交媒体');
  rules.push('DOMAIN-SUFFIX,facebook.com,🌐 社交媒体');
  rules.push('DOMAIN-SUFFIX,twitter.com,🌐 社交媒体');
  rules.push('DOMAIN-SUFFIX,x.com,🌐 社交媒体');
  rules.push('DOMAIN-SUFFIX,tiktok.com,🌐 社交媒体');
  rules.push('DOMAIN-SUFFIX,apple.com,🍏 苹果服务');
  rules.push('DOMAIN-SUFFIX,microsoft.com,Ⓜ️ 微软服务');
  rules.push('DOMAIN-SUFFIX,azure.com,☁️ 云服务');
  rules.push('DOMAIN-SUFFIX,aws.amazon.com,☁️ 云服务');
  rules.push('DOMAIN-SUFFIX,paypal.com,💰 金融服务');
  rules.push('DOMAIN-SUFFIX,coursera.org,📚 教育资源');
  rules.push('DOMAIN-SUFFIX,udemy.com,📚 教育资源');
  rules.push('DOMAIN-SUFFIX,gemini.google.com,Google Gemini');
  rules.push('DOMAIN-SUFFIX,openai.com,💬 AI 服务');
  rules.push('DOMAIN-SUFFIX,anthropic.com,💬 AI 服务');
  rules.push('DOMAIN-SUFFIX,chatgpt.com,💬 AI 服务');
  rules.push('DOMAIN-SUFFIX,adobe.com,Adobe');

  // 最终兜底
  rules.push('MATCH,🐟 漏网之鱼');

  return rules;
}