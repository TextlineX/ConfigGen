let currentConfig = null;
let currentCDN = 0;
let configType = 'singbox';

const CDN_NAMES = [
  '官方源',
  'ghproxy.net',
  'ghproxy.com',
  'kgithub.com',
  'gitclone.com',
  'mirror.ghproxy.com',
  'github.moeyy.cn'
];

document.addEventListener('DOMContentLoaded', () => {
  loadRules();
  loadNodes();

  // CDN 选择
  document.getElementById('cdn-select').addEventListener('change', (e) => {
    currentCDN = parseInt(e.target.value);
    document.getElementById('cdn-status').textContent = `当前: ${CDN_NAMES[currentCDN]}`;
    updateSubscriptionLinks();
    loadRules();
  });
});

function updateSubscriptionLinks() {
  const base = window.location.origin;
  document.getElementById('sub-clash').value = `/sub/clash?cdn=${currentCDN}`;
  document.getElementById('sub-singbox').value = `/sub/singbox?cdn=${currentCDN}`;
  document.getElementById('sub-surge').value = `/sub/surge?cdn=${currentCDN}`;
}

async function loadRules() {
  const container = document.getElementById('rules-list');
  container.innerHTML = '<p style="color:#888">加载中...</p>';

  try {
    const resp = await fetch(`/api/rules?cdn=${currentCDN}`);
    const data = await resp.json();

    container.innerHTML = data.rules.map(rule => `
      <div class="rule-item">
        <span class="name">${rule.name}</span>
        <span class="status loading" id="status-${rule.name}"></span>
      </div>
    `).join('');

    // 检查每个规则
    for (const rule of data.rules) {
      try {
        const resp = await fetch(rule.url, { method: 'HEAD' });
        document.getElementById(`status-${rule.name}`).className = resp.ok ? 'status' : 'status error';
      } catch {
        document.getElementById(`status-${rule.name}`).className = 'status error';
      }
    }
  } catch (err) {
    container.innerHTML = `<p style="color:#ef4444">加载失败: ${err.message}</p>`;
  }
}

async function loadNodes() {
  try {
    const resp = await fetch('/api/nodes');
    const data = await resp.json();

    const container = document.getElementById('nodes-list');
    const nodes = data.nodes || [];

    container.innerHTML = nodes.map(node => `
      <div class="node-item">
        <div class="tag">${escapeHtml(node.tag)}</div>
        <div class="info">
          ${escapeHtml(node.server)}:${node.server_port}<br>
          类型: ${node.type}
        </div>
      </div>
    `).join('');

    document.getElementById('nodes-count').textContent = `共 ${nodes.length} 个节点`;
  } catch (err) {
    document.getElementById('nodes-count').textContent = '加载失败';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function copyLink(id) {
  const input = document.getElementById(id);
  const url = window.location.origin + input.value;
  navigator.clipboard.writeText(url).then(() => {
    showToast('订阅地址已复制！');
  });
}

async function generateConfig() {
  const type = document.getElementById('client-type').value;
  configType = type;
  const output = document.getElementById('config-output');
  const btnDownload = document.getElementById('btn-download');
  const btnCopy = document.getElementById('btn-copy');

  output.textContent = '生成中...';

  try {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, cdnIndex: currentCDN })
    });
    const data = await resp.json();

    if (data.success) {
      currentConfig = data.content;
      const displayContent = type === 'singbox'
        ? JSON.stringify(JSON.parse(data.content), null, 2)
        : data.content;
      output.textContent = displayContent;
      btnDownload.style.display = 'block';
      btnCopy.style.display = 'block';
    } else {
      output.textContent = '错误: ' + data.error;
    }
  } catch (err) {
    output.textContent = '错误: ' + err.message;
  }
}

function downloadConfig() {
  if (!currentConfig) return;

  const ext = configType === 'singbox' ? 'json' : configType === 'clash' ? 'yaml' : 'conf';
  const mime = configType === 'singbox' ? 'application/json' : 'text/plain';

  const blob = new Blob([currentConfig], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `config.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyConfig() {
  if (!currentConfig) return;

  const content = configType === 'singbox'
    ? JSON.stringify(JSON.parse(currentConfig), null, 2)
    : currentConfig;

  navigator.clipboard.writeText(content).then(() => {
    showToast('配置内容已复制！');
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #4ade80;
    color: #000;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: bold;
    z-index: 1000;
    animation: fadeIn 0.3s;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}