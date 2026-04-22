let currentConfig = null;
let configType = 'singbox';
const CDN_NAMES = ['官方源', 'ghfast.top', 'ghproxy.com', 'mirror.ghproxy.com'];

document.addEventListener('DOMContentLoaded', () => {
  loadRules();
  loadNodes();
});

async function loadNodes() {
  try {
    const resp = await fetch('/api/config');
    const data = await resp.json();
    if (data.success && data.config) {
      document.getElementById('node-config').value = JSON.stringify(data.config, null, 2);
      updateSubscriptionLinks();
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

async function saveNodes() {
  const status = document.getElementById('node-status');
  try {
    const config = JSON.parse(document.getElementById('node-config').value);
    const resp = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await resp.json();
    if (data.success) {
      status.textContent = '✅ 保存成功';
      status.style.color = '#4ade80';
      updateSubscriptionLinks();
    } else {
      status.textContent = '❌ ' + data.error;
      status.style.color = '#ef4444';
    }
  } catch (err) {
    status.textContent = '❌ JSON 格式错误';
    status.style.color = '#ef4444';
  }
  setTimeout(() => status.textContent = '', 3000);
}

function updateSubscriptionLinks() {
  const cdn = document.getElementById('cdn-select').value;
  const base = window.location.origin;
  document.getElementById('sub-clash').value = `${base}/sub/clash?cdn=${cdn}`;
  document.getElementById('sub-singbox').value = `${base}/sub/singbox?cdn=${cdn}`;
}

document.getElementById('cdn-select').addEventListener('change', updateSubscriptionLinks);

async function loadRules() {
  const container = document.getElementById('rules-list');
  container.innerHTML = '<p style="color:#888">加载中...</p>';

  try {
    const resp = await fetch('/api/rules?cdn=1');
    const data = await resp.json();

    container.innerHTML = data.rules.map(rule => `
      <div class="rule-item">
        <span class="name">${rule.name}</span>
        <span class="status" title="${rule.url}"></span>
      </div>
    `).join('');

    // 尝试检测每个规则
    for (const rule of data.rules) {
      try {
        const resp = await fetch(rule.url, { method: 'HEAD' });
        const el = container.querySelector(`[title="${rule.url}"]`);
        if (el) el.className = resp.ok ? 'status' : 'status error';
      } catch {
        const el = container.querySelector(`[title="${rule.url}"]`);
        if (el) el.className = 'status error';
      }
    }
  } catch (err) {
    container.innerHTML = `<p style="color:#ef4444">加载失败</p>`;
  }
}

function copyLink(id) {
  const input = document.getElementById(id);
  navigator.clipboard.writeText(input.value);
  showToast('订阅地址已复制');
}

async function generateConfig() {
  configType = document.getElementById('client-type').value;
  const output = document.getElementById('config-output');
  output.textContent = '生成中...';

  try {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: configType,
        cdnIndex: parseInt(document.getElementById('cdn-select').value)
      })
    });
    const data = await resp.json();

    if (data.success) {
      currentConfig = data.content;
      const display = configType === 'singbox'
        ? JSON.stringify(JSON.parse(data.content), null, 2)
        : data.content;
      output.textContent = display;
      document.getElementById('btn-download').style.display = 'block';
      document.getElementById('btn-copy').style.display = 'block';
    } else {
      output.textContent = '错误: ' + data.error;
    }
  } catch (err) {
    output.textContent = '错误: ' + err.message;
  }
}

function downloadConfig() {
  if (!currentConfig) return;
  const ext = configType === 'singbox' ? 'json' : 'yaml';
  const blob = new Blob([currentConfig], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `config.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyConfig() {
  if (!currentConfig) return;
  navigator.clipboard.writeText(currentConfig);
  showToast('配置已复制');
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#4ade80;color:#000;padding:12px 24px;border-radius:8px;font-weight:bold;z-index:1000';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}
