p = 'main.js'
s = open(p, encoding='utf-8').read()

# 在 setupUI() 里，buildQualityPanel(); 那行之前插入 CF 菜单初始化
anchor = "  // 画质设置按钮\n  buildQualityPanel();\n}"
assert anchor in s, '找不到 setupUI 尾部锚点'

cf_js = '''  // 画质设置按钮
  buildQualityPanel();
  initCFMenu();
}

/* ==================== CF 风格主菜单渲染 ==================== */
function renderHallTab() {
  const map = serverMapData || {};
  const meta = map.meta || {};
  const notices = (typeof latestNotices !== 'undefined' && latestNotices.length)
    ? latestNotices.slice(0, 3).map(n => `<div class="cf-list-item"><b>${escapeHtml(n.title||'')}</b><p>${escapeHtml(n.content||'')}</p></div>`).join('')
    : '<div style="color:#6b7885;text-align:center;padding:12px;font-size:11px">暂无公告</div>';
  return `
    <div class="cf-card">
      <div class="cf-card-head">当前作战 <b>LIVE</b></div>
      <div class="cf-card-body">
        <div class="cf-title-lg">${escapeHtml(map.name || '灰域爆破')}</div>
        <div class="cf-title-en">${escapeHtml((meta.name || 'GRAYZONE').toUpperCase())}</div>
        <div class="cf-kv"><span>安放区域</span><b>A / B</b></div>
        <div class="cf-kv"><span>掩体数量</span><b>${(map.boxes && map.boxes.length) || 0} 组</b></div>
        <div class="cf-kv"><span>复活机制</span><b>ON</b></div>
        <div class="cf-kv"><span>玩法</span><b>FFA</b></div>
      </div>
    </div>
    <div class="cf-card">
      <div class="cf-card-head">系统公告</div>
      <div class="cf-card-body">${notices}</div>
    </div>
  `;
}
function renderWeaponsTab() {
  return `
    <div class="cf-card">
      <div class="cf-card-head">AK47 伤害倍率</div>
      <div class="cf-card-body">
        <div class="cf-kv"><span>头部</span><b>100</b></div>
        <div class="cf-kv"><span>胸部</span><b>33</b></div>
        <div class="cf-kv"><span>腹部</span><b>29</b></div>
        <div class="cf-kv"><span>手臂</span><b>20</b></div>
        <div class="cf-kv"><span>腿部</span><b>22</b></div>
      </div>
    </div>
    <div class="cf-card">
      <div class="cf-card-head">武器参数</div>
      <div class="cf-card-body">
        <div class="cf-kv"><span>射速</span><b>545 RPM</b></div>
        <div class="cf-kv"><span>弹匣</span><b>30 发</b></div>
        <div class="cf-kv"><span>有效射程</span><b>120 m</b></div>
        <div class="cf-kv"><span>后坐力</span><b>CF 机制</b></div>
      </div>
    </div>
  `;
}
function renderRecordsTab() {
  const k = state.killCount | 0, d = state.deathCount | 0;
  const kd = d > 0 ? (k / d).toFixed(2) : k.toFixed(2);
  return `
    <div class="cf-card">
      <div class="cf-card-head">本局战绩</div>
      <div class="cf-card-body">
        <div class="cf-kv"><span>击杀</span><b>${k}</b></div>
        <div class="cf-kv"><span>死亡</span><b>${d}</b></div>
        <div class="cf-kv"><span>K/D</span><b>${kd}</b></div>
      </div>
    </div>
  `;
}
function renderMissionsTab() {
  const notices = (typeof latestNotices !== 'undefined' && latestNotices.length)
    ? latestNotices.slice(0, 5).map(n => `<div class="cf-list-item"><b>${escapeHtml(n.title||'')}</b><p>${escapeHtml(n.content||'')}</p></div>`).join('')
    : '<div style="color:#6b7885;text-align:center;padding:12px;font-size:11px">暂无任务</div>';
  return `
    <div class="cf-card">
      <div class="cf-card-head">任务中心</div>
      <div class="cf-card-body">${notices}</div>
    </div>
  `;
}
function renderSysTab() {
  const connected = ws && ws.readyState === 1;
  const url = (typeof currentWsUrl === 'string' ? currentWsUrl : '?').replace(/^wss?:\\/\\//, '');
  return `
    <div class="cf-card">
      <div class="cf-card-head">系统状态</div>
      <div class="cf-card-body">
        <div class="cf-kv"><span>连接</span><b>${connected ? 'ONLINE' : 'OFFLINE'}</b></div>
        <div class="cf-kv"><span>服务器</span><b>${escapeHtml(url)}</b></div>
        <div class="cf-kv"><span>协议版本</span><b>v${PROTOCOL_VERSION}</b></div>
        <div class="cf-kv"><span>客户端版本</span><b>${CLIENT_VERSION}</b></div>
      </div>
    </div>
  `;
}
function renderCFSide() {
  const side = document.getElementById('cfSide');
  if (!side) return;
  const active = document.querySelector('#cfNav .cf-nav-item.active');
  const tab = (active && active.dataset.tab) || 'hall';
  const map = { hall: renderHallTab, weapons: renderWeaponsTab, records: renderRecordsTab, missions: renderMissionsTab, sys: renderSysTab };
  side.innerHTML = (map[tab] || renderHallTab)();
}
function initCFMenu() {
  const nav = document.getElementById('cfNav');
  if (!nav) return;
  nav.addEventListener('click', (e) => {
    const item = e.target.closest('.cf-nav-item');
    if (!item) return;
    nav.querySelectorAll('.cf-nav-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    renderCFSide();
  });
  const ver = document.getElementById('cfVersion');
  if (ver) ver.textContent = 'v' + (CLIENT_VERSION || '1.0.0');
  renderCFSide();
}
'''

