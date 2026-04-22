let currentConfig = null;

document.addEventListener('DOMContentLoaded', () => {
  loadRules();
  loadNodes();
});

async function loadRules() {
  try {
    const resp = await fetch('/api/rules');
    const data = await resp.json();

    const container = document.getElementById('rules-list');
    container.innerHTML = data.rules.map(rule => `
      <div class="rule-item">
        <span class="name">${rule.name}</span>
        <span class="status" id="status-${rule.name}"></span>
      </div>
    `).join('');

    // 检查每个规则是否可访问
    data.rules.forEach(async rule => {
      try {
        const resp = await fetch(rule.url, { method: 'HEAD' });
        document.getElementById(`status-${rule.name}`).className = resp.ok ? 'status' : 'status error';
      } catch {
        document.getElementById(`status-${rule.name}`).className = 'status error';
      }
    });
  } catch (err) {
    console.error('Failed to load rules:', err);
  }
}

async function loadNodes() {
  try {
    const resp = await fetch('/sub/singbox');
    const data = await resp.json();

    const container = document.getElementById('nodes-list');
    const nodes = (data.outbounds || []).filter(n =>
      ['shadowsocks', 'vmess', 'vless', 'trojan'].includes(n.type)
    );

    container.innerHTML = nodes.map(node => `
      <div class="node-item">
        <div class="tag">${node.tag}</div>
        <div class="info">
          ${node.server}:${node.server_port}<br>
          类型: ${node.type}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load nodes:', err);
  }
}

function copyLink(id) {
  const input = document.getElementById(id);
  navigator.clipboard.writeText(window.location.origin + input.value);
  alert('已复制到剪贴板');
}

async function generateConfig() {
  const type = document.getElementById('client-type').value;
  const output = document.getElementById('config-output');
  const btnDownload = document.getElementById('btn-download');

  try {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    const data = await resp.json();

    if (data.success) {
      currentConfig = data.config;
      output.textContent = type === 'clash' ? data.config : JSON.stringify(data.config, null, 2);
      btnDownload.style.display = 'block';
    } else {
      output.textContent = 'Error: ' + data.error;
    }
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
  }
}

function downloadConfig() {
  if (!currentConfig) return;

  const type = document.getElementById('client-type').value;
  const blob = new Blob([type === 'clash' ? currentConfig : JSON.stringify(currentConfig, null, 2)], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `config.${type === 'singbox' ? 'json' : 'yaml'}`;
  a.click();
  URL.revokeObjectURL(url);
}