/**
 * CDN 加速源列表
 * 用于替换 raw.githubusercontent.com 等源
 */

module.exports = {
  // GitHub Raw 加速
  github: [
    'https://raw.githubusercontent.com',
    'https://ghproxy.com/https://raw.githubusercontent.com',
    'https://mirror.ghproxy.com',
    'https://ghproxy.net',
    'https://github.moeyy.cn',
    'https://kgithub.com',
    'https://gitclone.com/github.com',
  ],

  // GitHub Release 加速
  release: [
    'https://github.com',
    'https://ghproxy.net',
    'https://ghproxy.com',
    'https://mirror.ghproxy.com',
    'https://gitclone.com/github.com',
    'https://kgithub.com',
  ],

  // 特定规则源
  meta: [
    'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat',
    'https://ghproxy.net/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat',
    'https://ghproxy.com/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat',
    'https://mirror.ghproxy.com/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat',
    'https://kgithub.com/MetaCubeX/meta-rules-dat',
    'https://gitclone.com/github.com/MetaCubeX/meta-rules-dat',
  ],

  dreista: [
    'https://raw.githubusercontent.com/Dreista/sing-box-rule-set-cn',
    'https://ghproxy.net/https://raw.githubusercontent.com/Dreista/sing-box-rule-set-cn',
    'https://ghproxy.com/https://raw.githubusercontent.com/Dreista/sing-box-rule-set-cn',
    'https://kgithub.com/Dreista/sing-box-rule-set-cn',
  ],

  // 当前使用的 CDN
  current: {
    raw: 'https://raw.githubusercontent.com',
    release: 'https://github.com',
  },

  /**
   * 获取加速 URL
   * @param {string} type - 'github' | 'meta' | 'dreista' | 'release'
   * @param {number} index - CDN 索引（0 = 官方源）
   */
  getUrl(type, original, index = 0) {
    if (type === 'github' || type === 'raw') {
      const sources = this.github;
      if (index === 0) return original;
      return original.replace('https://raw.githubusercontent.com', sources[index]);
    }
    if (type === 'release') {
      const sources = this.release;
      if (index === 0) return original;
      return original.replace('https://github.com', sources[index]);
    }
    if (type === 'meta') {
      const sources = this.meta;
      if (index === 0) return original;
      return original.replace('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat', sources[index]);
    }
    if (type === 'dreista') {
      const sources = this.dreista;
      if (index === 0) return original;
      return original.replace('https://raw.githubusercontent.com/Dreista/sing-box-rule-set-cn', sources[index]);
    }
    return original;
  },

  /**
   * 获取所有可用的 CDN 源（用于面板选择）
   */
  getSources() {
    return {
      github: this.github.map((url, i) => ({ index: i, url, name: i === 0 ? '官方源' : new URL(url).hostname })),
      release: this.release.map((url, i) => ({ index: i, url, name: i === 0 ? '官方源' : new URL(url).hostname })),
    };
  }
};
