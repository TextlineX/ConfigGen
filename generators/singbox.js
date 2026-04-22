/**
 * Sing-box Config Generator
 */

const CDN = require('../src/cdn');

module.exports = function singbox(config, options = {}) {
  const cdnIndex = 0;  // 使用官方源，通过代理下载
  const { outbounds, rules, rule_sets } = parseConfig(config);

  const cfg = {
    log: { disabled: false, level: 'info' },
    experimental: {
      clash_api: {
        external_controller: '127.0.0.1:20123',
        default_mode: 'rule'
      },
      cache_file: {
        enabled: false
      }
    },
    dns: buildDNS(config),
    inbounds: [
      { type: 'mixed', tag: 'mixed-in', listen: '0.0.0.0', listen_port: 20122, tcp_fast_open: true, tcp_multi_path: true, udp_fragment: true },
      { type: 'tun', tag: 'tun-in', address: ['172.19.0.1/30'], auto_route: true, strict_route: true, stack: 'mixed' }
    ],
    outbounds: buildOutbounds(config),
    route: buildRoute(config, cdnIndex),
  };

  return JSON.stringify(cfg, null, 2);
};

function buildOutbounds(config) {
  const out = [];

  // 第一遍：收集所有节点
  const allNodes = [];
  const nodeTagSet = new Set();
  for (const ob of (config.outbounds || [])) {
    if (['shadowsocks', 'vless', 'vmess', 'trojan', 'tuic', 'hysteria2'].includes(ob.type)) {
      if (!nodeTagSet.has(ob.tag)) {
        allNodes.push(ob);
        nodeTagSet.add(ob.tag);
      }
    }
  }

  // 第二遍：处理 urltest 组
  const proxyGroups = {};
  for (const ob of (config.outbounds || [])) {
    if (ob.type === 'urltest') {
      const tag = ob.tag;
      if (tag === '🐟 漏网之鱼') continue;
      // 排除自身引用（避免循环依赖）
      const validNodes = (ob.outbounds || [])
        .filter(n => n !== tag && nodeTagSet.has(n));
      proxyGroups[tag] = {
        url: ob.url || 'https://www.gstatic.com/generate_204',
        nodes: validNodes.length ? validNodes : allNodes.map(n => n.tag).slice(0, 5)
      };
    }
  }

  // 主选择器
  out.push({ type: 'selector', tag: '🚀 自动选择', outbounds: allNodes.map(n => n.tag) });

  // 直连类
  out.push({ type: 'direct', tag: '📺 哔哩哔哩' });
  out.push({ type: 'direct', tag: '🛑 广告拦截' });
  out.push({ type: 'direct', tag: '🎮 游戏直连' });
  out.push({ type: 'direct', tag: '🔒 国内服务' });
  out.push({ type: 'direct', tag: '🏠 私有网络' });
  out.push({ type: 'direct', tag: 'Ⓜ️ 微软服务' });
  out.push({ type: 'direct', tag: '🍏 苹果服务' });
  out.push({ type: 'direct', tag: 'Adobe' });

  // 代理组
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

  // 漏网之鱼
  out.push({
    type: 'urltest',
    tag: '🐟 漏网之鱼',
    url: 'https://www.gstatic.com/generate_204',
    interval: '3m',
    tolerance: 50,
    outbounds: allNodes.map(n => n.tag).length ? allNodes.map(n => n.tag) : ['🚀 自动选择']
  });

  // 所有节点
  for (const node of allNodes) {
    out.push(node);
  }

  out.push({ type: 'block', tag: 'block' });
  out.push({ type: 'direct', tag: 'direct' });

  return out;
}

function buildRoute(config, cdnIndex = 0) {
  const routeRules = [];
  const ruleSetList = [];

  // 规则集 URL 生成
  const ruleSetSources = {
    // DailyRules 规则集
    daily: {
      adsAll: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/category-ads-all.json',
      google: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/google.json',
      youtube: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/youtube.json',
      telegram: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/telegram.json',
      github: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/github.json',
      netflix: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/netflix.json',
      disney: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/disney.json',
      steam: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/steam.json',
      cn: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/cn.json',
      bilibili: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/bilibili.json',
      categoryAi: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/category-ai-!cn.json',
      geolocationNotCn: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/geolocation-!cn.json',
      scholar: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/category-scholar-!cn.json',
      gemini: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/google-gemini.json',
      adobe: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/adobe.json',
      facebook: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/facebook.json',
      instagram: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/instagram.json',
      twitter: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/twitter.json',
      tiktok: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/tiktok.json',
      hulu: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/hulu.json',
      hbo: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/hbo.json',
      amazon: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/amazon.json',
      bahamut: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/bahamut.json',
      epicgames: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/epicgames.json',
      ea: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/ea.json',
      blizzard: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/blizzard.json',
      paypal: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/paypal.json',
      aws: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/aws.json',
      coursera: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/coursera.json',
      udemy: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/udemy.json',
      microsoft: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/microsoft.json',
      apple: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/apple.json',
      gitlab: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/gitlab.json',
      privateIp: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/private-ip.json',
      cnIp: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/cn-ip.json',
      googleIp: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/google-ip.json',
      telegramIp: 'https://raw.githubusercontent.com/TextlineX/DailyRules/main/src/telegram-ip.json',
    },
    // GameRules 规则集
    game: {
      kgMc: 'https://raw.githubusercontent.com/TextlineX/GameRules/main/src/kg-mc.json',
      steamDirect: 'https://raw.githubusercontent.com/TextlineX/GameRules/main/src/steam-direct.json',
    }
  };

  // 应用 CDN 加速
  const applyCdn = (url) => {
    if (cdnIndex === 0) return url;
    if (url.includes('raw.githubusercontent.com')) {
      const cdn = CDN.github[cdnIndex] || CDN.github[0];
      // moeyy.cn 格式: github.moeyy.cn/{user}/{repo}/raw/{branch}/{path}
      if (cdn.includes('github.moeyy.cn')) {
        return url.replace('https://raw.githubusercontent.com/', 'https://github.moeyy.cn/').replace('/blob/', '/raw/');
      }
      // kgithub 格式: kgithub.com/{user}/{repo}/{branch}/{path}
      if (cdn.includes('kgithub.com')) {
        return url.replace('https://raw.githubusercontent.com/', 'https://kgithub.com/').replace('/blob/', '/raw/');
      }
      // 其他 CDN 直接替换域名
      return url.replace('https://raw.githubusercontent.com', cdn);
    }
    if (url.includes('github.com') && url.includes('/releases/')) {
      const cdn = CDN.release[cdnIndex] || CDN.release[0];
      return url.replace('https://github.com', cdn);
    }
    return url;
  };

  // 添加规则集
  const addRuleSet = (tag, url) => {
    if (!url) return;
    ruleSetList.push({
      tag,
      type: 'remote',
      url: applyCdn(url),
      format: 'source',
      download_detour: cdnIndex === 0 ? '🚀 自动选择' : '🚀 自动选择',
      update_interval: '6h'
    });
  };

  // 广告
  addRuleSet('ads-all', ruleSetSources.daily.adsAll);

  // 游戏
  addRuleSet('kg-mc', ruleSetSources.game.kgMc);
  addRuleSet('steam-direct', ruleSetSources.game.steamDirect);

  // AI / Gemini
  addRuleSet('google-gemini', ruleSetSources.daily.gemini);
  addRuleSet('category-ai-!cn', ruleSetSources.daily.categoryAi);

  // 国内服务
  addRuleSet('bilibili', ruleSetSources.daily.bilibili);
  addRuleSet('cn', ruleSetSources.daily.cn);

  // 代理服务
  addRuleSet('youtube', ruleSetSources.daily.youtube);
  addRuleSet('google', ruleSetSources.daily.google);
  addRuleSet('telegram', ruleSetSources.daily.telegram);
  addRuleSet('github', ruleSetSources.daily.github);
  addRuleSet('netflix', ruleSetSources.daily.netflix);
  addRuleSet('disney', ruleSetSources.daily.disney);
  addRuleSet('steam', ruleSetSources.daily.steam);
  addRuleSet('facebook', ruleSetSources.daily.facebook);
  addRuleSet('instagram', ruleSetSources.daily.instagram);
  addRuleSet('twitter', ruleSetSources.daily.twitter);
  addRuleSet('tiktok', ruleSetSources.daily.tiktok);
  addRuleSet('hulu', ruleSetSources.daily.hulu);
  addRuleSet('hbo', ruleSetSources.daily.hbo);
  addRuleSet('amazon', ruleSetSources.daily.amazon);
  addRuleSet('bahamut', ruleSetSources.daily.bahamut);
  addRuleSet('epicgames', ruleSetSources.daily.epicgames);
  addRuleSet('ea', ruleSetSources.daily.ea);
  addRuleSet('blizzard', ruleSetSources.daily.blizzard);
  addRuleSet('adobe', ruleSetSources.daily.adobe);
  addRuleSet('microsoft', ruleSetSources.daily.microsoft);
  addRuleSet('apple', ruleSetSources.daily.apple);
  addRuleSet('gitlab', ruleSetSources.daily.gitlab);
  addRuleSet('paypal', ruleSetSources.daily.paypal);
  addRuleSet('aws', ruleSetSources.daily.aws);
  addRuleSet('coursera', ruleSetSources.daily.coursera);
  addRuleSet('udemy', ruleSetSources.daily.udemy);
  addRuleSet('geolocation-!cn', ruleSetSources.daily.geolocationNotCn);
  addRuleSet('category-scholar-!cn', ruleSetSources.daily.scholar);

  // IP 规则
  addRuleSet('google-ip', ruleSetSources.daily.googleIp);
  addRuleSet('telegram-ip', ruleSetSources.daily.telegramIp);
  addRuleSet('private-ip', ruleSetSources.daily.privateIp);
  addRuleSet('cn-ip', ruleSetSources.daily.cnIp);

  // 路由规则
  routeRules.push(
    { action: 'route', rule_set: ['ads-all'], outbound: '🛑 广告拦截' },
    { action: 'route', rule_set: ['kg-mc', 'steam-direct'], outbound: '🎮 游戏直连' },
    { action: 'route', rule_set: ['google-gemini'], outbound: 'Google Gemini' },
    { action: 'route', rule_set: ['adobe'], outbound: 'Adobe' },
    { action: 'route', rule_set: ['category-ai-!cn'], outbound: '💬 AI 服务' },
    { action: 'route', rule_set: ['bilibili'], outbound: '📺 哔哩哔哩' },
    { action: 'route', rule_set: ['youtube'], outbound: '📹 油管视频' },
    { action: 'route', rule_set: ['google'], outbound: '🔍 谷歌服务' },
    { action: 'route', rule_set: ['cn'], outbound: '🔒 国内服务' },
    { action: 'route', rule_set: ['github', 'gitlab'], outbound: '🐱 Github' },
    { action: 'route', rule_set: ['microsoft'], outbound: 'Ⓜ️ 微软服务' },
    { action: 'route', rule_set: ['apple'], outbound: '🍏 苹果服务' },
    { action: 'route', rule_set: ['facebook', 'instagram', 'twitter', 'tiktok'], outbound: '🌐 社交媒体' },
    { action: 'route', rule_set: ['netflix', 'hulu', 'hbo', 'disney', 'amazon', 'bahamut'], outbound: '🎬 流媒体' },
    { action: 'route', rule_set: ['steam', 'epicgames', 'ea', 'blizzard'], outbound: '🎮 游戏平台' },
    { action: 'route', rule_set: ['coursera', 'udemy', 'category-scholar-!cn'], outbound: '📚 教育资源' },
    { action: 'route', rule_set: ['paypal'], outbound: '💰 金融服务' },
    { action: 'route', rule_set: ['aws'], outbound: '☁️ 云服务' },
    { action: 'route', rule_set: ['geolocation-!cn'], outbound: '🌐 非中国' },
    { action: 'route', rule_set: ['google-ip'], outbound: '🔍 谷歌服务' },
    { action: 'route', rule_set: ['private-ip'], outbound: '🏠 私有网络' },
    { action: 'route', rule_set: ['cn-ip'], outbound: '🔒 国内服务' },
    { action: 'route', rule_set: ['telegram-ip'], outbound: '📲 电报消息' },
    { action: 'route', rule_set: ['telegram'], outbound: '📲 电报消息' }
  );

  return {
    rules: routeRules,
    rule_set: ruleSetList,
    auto_detect_interface: true,
    find_process: true,
    final: '🐟 漏网之鱼',
    default_domain_resolver: {
      server: 'dns_resolver'
    }
  };
}

function buildDNS(config) {
  return {
    servers: [
      { tag: 'dns_proxy', type: 'tcp', detour: '🚀 自动选择', server: '1.1.1.1' },
      { tag: 'dns_direct', type: 'udp', server: '223.5.5.5', detour: 'direct' },
      { tag: 'dns_resolver', type: 'udp', server: '119.29.29.29', detour: 'direct' },
      { tag: 'dns_fakeip', type: 'fakeip', inet4_range: '198.18.0.0/15', inet6_range: 'fc00::/18' }
    ],
    rules: [
      { action: 'route', rule_set: 'geolocation-!cn', query_type: ['A', 'AAAA'], server: 'dns_fakeip' },
      { action: 'route', rule_set: 'geolocation-!cn', query_type: 'CNAME', server: 'dns_proxy' },
      { action: 'predefined', invert: true, query_type: ['A', 'AAAA', 'CNAME'], rcode: 'REFUSED' }
    ],
    disable_cache: false,
    disable_expire: false,
    independent_cache: true,
    final: 'dns_direct',
    strategy: 'prefer_ipv4'
  };
}

function parseConfig(config) {
  const outbounds = config.outbounds || [];
  const route = config.route || {};
  return { outbounds, rules: route.rules || [], rule_sets: route.rule_set || [] };
}
