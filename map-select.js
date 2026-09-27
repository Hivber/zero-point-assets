(function () {
  'use strict';

  const SELECTED_KEY = 'zp_selected_map';
  let mapLoaded = false;
  let bootingGame = false;
  let currentMaps = [];

  const $ = (id) => document.getElementById(id);

  function setStatus(text, bad) {
    const el = $('mapStatus');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('bad', !!bad);
  }

  function getSelected() {
    try { return localStorage.getItem(SELECTED_KEY) || ''; } catch (e) { return ''; }
  }

  function setSelected(id) {
    try { localStorage.setItem(SELECTED_KEY, id); } catch (e) {}
  }

  function renderMaps(list) {
    const wrap = $('mapList');
    if (!wrap) return;
    wrap.textContent = '';
    const selected = getSelected();

    list.forEach((map) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'map-card' + (map.id === selected ? ' selected' : '');
      btn.dataset.mapId = map.id;

      const title = document.createElement('span');
      title.className = 'map-card-title';
      title.textContent = map.name || map.id;

      const id = document.createElement('span');
      id.className = 'map-card-id';
      id.textContent = map.id + ' · ' + (map.type || 'zpw');

      btn.append(title, id);
      btn.addEventListener('click', () => chooseMap(map.id));
      wrap.appendChild(btn);
    });
  }

  function chooseMap(id) {
    if (!currentMaps.some(m => m.id === id)) return;
    const old = getSelected();
    setSelected(id);
    renderMaps(currentMaps);
    setStatus('当前地图：' + id, false);

    // main.js 在页面初始化时就建立 WS，所以运行中的连接无法切换房间。
    // 游戏未开始时刷新页面即可用新 mapId 建立正确的 WS；不会修改游戏内逻辑。
    if (mapLoaded && old !== id) {
      setStatus('已切换地图，正在重新连接…', false);
      setTimeout(() => window.location.reload(), 120);
    }
  }

  async function loadMaps() {
    const wrap = $('mapList');
    if (!wrap) return;
    wrap.textContent = '正在读取地图列表…';

    try {
      const res = await window.ZPAuth.authFetch('/api/maps', { cache: 'no-store' });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!data.ok || !Array.isArray(data.list) || !data.list.length) {
        wrap.textContent = '没有可用地图';
        $('startBtn')?.setAttribute('disabled', 'disabled');
        setStatus('服务器没有可用地图', true);
        return;
      }

      currentMaps = data.list;
      let selected = getSelected();
      if (!currentMaps.some(m => m.id === selected)) {
        selected = currentMaps[0].id;
        setSelected(selected);
      }
      renderMaps(currentMaps);
      setStatus('当前地图：' + selected, false);
      $('startBtn')?.removeAttribute('disabled');
    } catch (e) {
      wrap.textContent = '地图列表加载失败';
      $('startBtn')?.setAttribute('disabled', 'disabled');
      setStatus('无法连接服务器，请稍后重试', true);
    }
  }

  function showGameLoading() {
    $('menu')?.classList.add('hidden');
    $('loading')?.classList.remove('hidden');
    const status = $('loadingStatus');
    if (status) status.textContent = '连接服务器并加载游戏…';
    const bar = $('loadingBar');
    if (bar) bar.style.width = '2%';
  }

  function waitForGameReady() {
    const deadline = Date.now() + 120_000;
    const timer = setInterval(() => {
      const loading = $('loading');
      const menu = $('menu');
      if (loading && menu && loading.classList.contains('hidden') && !menu.classList.contains('hidden')) {
        clearInterval(timer);
        mapLoaded = true;
        $('startBtn')?.removeAttribute('disabled');
        $('startBtn')?.click();
      } else if (Date.now() > deadline) {
        clearInterval(timer);
        bootingGame = false;
        const status = $('loadingStatus');
        if (status) status.textContent = '游戏初始化超时，请刷新页面重试';
      }
    }, 200);
  }

  async function bootGame() {
    if (bootingGame || mapLoaded) return;
    if (!currentMaps.length) return;
    bootingGame = true;
    $('startBtn')?.setAttribute('disabled', 'disabled');
    showGameLoading();

    try {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = '/main.js?v=31.2.0';
      script.async = false;
      script.addEventListener('error', () => {
        bootingGame = false;
        $('startBtn')?.removeAttribute('disabled');
        const status = $('loadingStatus');
        if (status) status.textContent = 'main.js 加载失败，请检查静态资源';
      });
      document.body.appendChild(script);
      waitForGameReady();
    } catch (e) {
      bootingGame = false;
      $('startBtn')?.removeAttribute('disabled');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.ZPAuth) return;
    const ok = await window.ZPAuth.ready;
    if (!ok) return;

    const user = window.ZPAuth.readUser();
    const nickname = $('userNickname');
    if (nickname) nickname.textContent = user?.nickname || user?.username || '玩家';

    $('logoutBtn')?.addEventListener('click', () => {
      window.ZPAuth.clearAuth();
      window.location.replace('/login.html');
    });

    $('startBtn')?.addEventListener('click', (e) => {
      if (!mapLoaded) {
        e.preventDefault();
        e.stopImmediatePropagation();
        bootGame();
      }
    }, true);

    await loadMaps();
  });
})();
