/**
 * Sing-box Config Generator
 * 生成 sing-box 完整配置文件
 */

module.exports = function singbox(config) {
  const { outbounds, rules, rule_sets } = parseConfig(config);

  const cfg = {
    log: { disabled: false, level: 'info' },
    dns: buildDNS(config),
    inbounds: [
      { type: 'mixed', tag: 'mixed-in', listen: '0.0.0.0', listen_port: 20122, tcp_fast_open: true, tcp_multi_path: true, udp_fragment: true },
      { type: 'tun', tag: 'tun-in', address: ['172.19.0.1/30'], auto_route: true, strict_route: true, stack: 'mixed' }
    ],
    outbounds: buildOutbounds(config),
    route: buildRoute(config),
  };

  return JSON.stringify(cfg, null, 2);
};

function buildOutbounds(config) {
  const out = [];
  const seen = new Set();

  // 主选择器
  out.push({ type: 'selector', tag: '🚀 自动选择', outbounds: [] });

  // 遍历所有出站，构建 selector
  const allNodes = [];
  for (const ob of config.outbounds) {
    if (ob.type === 'urltest' || ob.type === 'selector') {
      allNodes.push(ob.tag);
    }
  }
  out[0].outbounds = allNodes;

  // 直连类出站
  out.push({ type: 'direct', tag: '📺 哔哩哔哩' });
  out.push({ type: 'direct', tag: '🛑 广告拦截' });
  out.push({ type: 'direct', tag: '🎮 游戏直连' });
  out.push({ type: 'direct', tag: '🔒 国内服务' });
  out.push({ type: 'direct', tag: '🏠 私有网络' });
  out.push({ type: 'direct', tag: 'Ⓜ️ 微软服务' });
  out.push({ type: 'direct', tag: '🍏 苹果服务' });

  // 代理类选择器
  const proxyGroups = {
    'Google Gemini': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '💬 AI 服务': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '📹 油管视频': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '🔍 谷歌服务': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '📲 电报消息': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '🐱 Github': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '🌐 社交媒体': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '🎬 流媒体': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '🎮 游戏平台': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '📚 教育资源': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '💰 金融服务': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '☁️ 云服务': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '🌐 非中国': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
    '🐟 漏网之鱼': { url: 'https://www.gstatic.com/generate_204', nodes: [] },
  };

  for (const ob of config.outbounds) {
    if (ob.type === 'urltest') {
      const tag = ob.tag;
      if (proxyGroups[tag]) proxyGroups[tag].nodes.push(ob.tag);
    }
  }

  for (const [tag, group] of Object.entries(proxyGroups)) {
    out.push({
      type: 'urltest',
      tag,
      url: group.url,
      interval: '3m',
      tolerance: 50,
      outbounds: group.nodes.length ? group.nodes : ['🚀 自动选择']
    });
  }

  out.push({ type: 'direct', tag: 'Adobe' });

  // 添加所有节点出站
  for (const ob of config.outbounds) {
    if (!['urltest', 'selector', 'direct', 'block'].includes(ob.type)) {
      out.push(ob);
    }
  }

  out.push({ type: 'block', tag: 'block' });
  out.push({ type: 'direct', tag: 'direct' });

  return out;
}

function buildRoute(config) {
  const route_rules = [];
  const rule_set = [];

  // 规则集映射（从 src/ 目录）
  const ruleSetMap = {
    '日常规则': 'DailyRules/ID_6vc5ga1a.srs',
    'ads-all': 'meta/geo/geosite/category-ads-all',
    'dreista-ads': 'Dreista/category-ads-all',
    'kg-mc': 'GameRules/kg-mc',
    'steam-direct': 'GameRules/steam-direct',
    'google-gemini': 'google-gemini',
    'adobe': 'adobe',
    'category-ai-!cn': 'category-ai-!cn',
    'bilibili': 'bilibili',
    'youtube': 'youtube',
    'google': 'google',
    'meta-cn': 'geolocation-cn',
    'cn': 'cn',
    'github': 'github',
    'gitlab': 'gitlab',
    'microsoft': 'microsoft',
    'apple': 'apple',
    'facebook': 'facebook',
    'instagram': 'instagram',
    'twitter': 'twitter',
    'tiktok': 'tiktok',
    'linkedin': 'linkedin',
    'netflix': 'netflix',
    'hulu': 'hulu',
    'disney': 'disney',
    'hbo': 'hbo',
    'amazon': 'amazon',
    'bahamut': 'bahamut',
    'steam': 'steam',
    'epicgames': 'epicgames',
    'ea': 'ea',
    'ubisoft': 'ubisoft',
    'blizzard': 'blizzard',
    'coursera': 'coursera',
    'edx': 'edx',
    'udemy': 'udemy',
    'khanacademy': 'khanacademy',
    'category-scholar-!cn': 'category-scholar-!cn',
    'paypal': 'paypal',
    'visa': 'visa',
    'mastercard': 'mastercard',
    'stripe': 'stripe',
    'wise': 'wise',
    'aws': 'aws',
    'azure': 'azure',
    'digitalocean': 'digitalocean',
    'heroku': 'heroku',
    'dropbox': 'dropbox',
    'geolocation-!cn': 'geolocation-!cn',
    'google-ip': 'geoip/google',
    'private-ip': 'geoip/private',
    'cn-ip': 'geoip/cn',
    'telegram-ip': 'geoip/telegram',
  };

  const outboundMap = {
    '广告拦截': '🛑 广告拦截',
    '哔哩哔哩': '📺 哔哩哔哩',
    '游戏直连': '🎮 游戏直连',
    'Google Gemini': 'Google Gemini',
    'Adobe': 'Adobe',
    'AI 服务': '💬 AI 服务',
    '油管视频': '📹 油管视频',
    '谷歌服务': '🔍 谷歌服务',
    '私有网络': '🏠 私有网络',
    '国内服务': '🔒 国内服务',
    '电报消息': '📲 电报消息',
    'Github': '🐱 Github',
    '微软服务': 'Ⓜ️ 微软服务',
    '苹果服务': '🍏 苹果服务',
    '社交媒体': '🌐 社交媒体',
    '流媒体': '🎬 流媒体',
    '游戏平台': '🎮 游戏平台',
    '教育资源': '📚 教育资源',
    '金融服务': '💰 金融服务',
    '云服务': '☁️ 云服务',
    '非中国': '🌐 非中国',
  };

  return {
    rules: route_rules,
    rule_set: rule_set,
    auto_detect_interface: true,
    find_process: true,
    final: '🐟 漏网之鱼'
  };
}

function buildDNS(config) {
  return {
    servers: [
      { tag: 'dns_proxy', type: 'tcp', detour: '🚀 自动选择', server: '1.1.1.1' },
      { tag: 'dns_direct', type: 'https', server: 'dns.alidns.com' },
      { tag: 'dns_resolver', type: 'udp', server: '223.5.5.5' },
      { tag: 'dns_fakeip', type: 'fakeip', inet4_range: '198.18.0.0/15', inet6_range: 'fc00::/18' }
    ],
    rules: [
      { action: 'route', rule_set: 'geolocation-!cn', query_type: ['A', 'AAAA'], server: 'dns_fakeip' },
      { action: 'route', rule_set: 'geolocation-!cn', query_type: 'CNAME', server: 'dns_proxy' }
    ],
    final: 'dns_direct',
    strategy: 'prefer_ipv4'
  };
}

function parseConfig(config) {
  const outbounds = config.outbounds || [];
  const route = config.route || {};
  return { outbounds, rules: route.rules || [], rule_sets: route.rule_set || [] };
}