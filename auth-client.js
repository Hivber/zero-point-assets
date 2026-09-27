(function () {
  'use strict';

  const TOKEN_KEY = 'zp_token';
  const USER_KEY = 'zp_user';
  const currentPath = window.location.pathname;
  const isGamePage = currentPath === '/' || /\/index\.html$/i.test(currentPath);

  function readToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }

  function readUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearAuth() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {}
  }

  async function verify() {
    const token = readToken();
    if (!token) {
      if (isGamePage) window.location.replace('/login.html');
      return false;
    }

    try {
      const res = await fetch('/api/me', {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!data.ok || !data.user) {
        clearAuth();
        if (isGamePage) window.location.replace('/login.html');
        return false;
      }
      try { localStorage.setItem(USER_KEY, JSON.stringify(data.user)); } catch (e) {}
      return true;
    } catch (e) {
      // 服务器暂时不可达时不要误清 token；游戏本身会继续进行连接重试。
      return true;
    }
  }

  function appendWsAuth(rawUrl) {
    try {
      const url = new URL(rawUrl, location.href);
      if (!/^wss?:$/i.test(url.protocol)) return rawUrl;
      const token = readToken();
      const mapId = localStorage.getItem('zp_selected_map') || '';
      let session = '';
      try { session = localStorage.getItem('zp_session_token') || ''; } catch (e) {}
      if (token) url.searchParams.set('token', token);
      if (/^[a-zA-Z0-9_-]{1,64}$/.test(mapId)) url.searchParams.set('map', mapId);
      if (/^[a-f0-9]{64}$/i.test(session)) url.searchParams.set('session', session);
      return url.toString();
    } catch (e) {
      return rawUrl;
    }
  }

  // main.js 会直接 new WebSocket(url)。这里统一给每次连接附加登录 token 与所选地图。
  if (window.WebSocket && !window.__zpWebSocketWrapped) {
    const NativeWebSocket = window.WebSocket;

    function AuthWebSocket(url, protocols) {
      const finalUrl = appendWsAuth(url);
      const socket = protocols === undefined
        ? new NativeWebSocket(finalUrl)
        : new NativeWebSocket(finalUrl, protocols);

      socket.addEventListener('close', function (event) {
        if (event.code === 1008) {
          clearAuth();
          if (isGamePage) window.location.replace('/login.html');
        }
      });
      return socket;
    }

    AuthWebSocket.prototype = NativeWebSocket.prototype;
    try { Object.setPrototypeOf(AuthWebSocket, NativeWebSocket); } catch (e) {}
    window.WebSocket = AuthWebSocket;
    window.__zpWebSocketWrapped = true;
  }

  window.ZPAuth = {
    TOKEN_KEY,
    USER_KEY,
    readToken,
    readUser,
    clearAuth,
    verify,
    authFetch(url, options) {
      const opts = options ? { ...options } : {};
      opts.headers = { ...(opts.headers || {}) };
      const token = readToken();
      if (token) opts.headers.Authorization = 'Bearer ' + token;
      return fetch(url, opts);
    },
  };

  window.ZPAuth.ready = verify();
})();
