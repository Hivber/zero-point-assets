(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  let mode = 'login';
  let busy = false;

  function setMode(next) {
    mode = next;
    const isRegister = mode === 'register';
    $('tabLogin').classList.toggle('active', !isRegister);
    $('tabRegister').classList.toggle('active', isRegister);
    $('nicknameRow').classList.toggle('hidden', !isRegister);
    $('submitBtn').textContent = isRegister ? '建立玩家档案' : '进入行动系统';
    $('formTitle').textContent = isRegister ? '创建账号' : '欢迎回来，玩家';
    $('formHint').textContent = isRegister ? '注册后即可进入行动大厅' : '使用你的零点行动账号进入行动大厅';
    $('nickname').required = isRegister;
    $('authForm').action = isRegister ? '/api/register' : '/api/login';
    clearMessage();
  }

  function showMessage(text, good) {
    const el = $('message');
    el.textContent = text || '';
    el.classList.toggle('good', !!good);
    el.classList.toggle('bad', !good);
  }

  function clearMessage() {
    const el = $('message');
    el.textContent = '';
    el.className = 'message';
  }

  function saveAuth(token, user) {
    localStorage.setItem('zp_token', token);
    localStorage.setItem('zp_user', JSON.stringify(user || {}));
    localStorage.removeItem('zeroPoint.session');
    localStorage.removeItem('zp_session_token');
  }

  function cleanHash() {
    try { history.replaceState(null, document.title, window.location.pathname + window.location.search); } catch (e) {}
  }

  function handleAuthHash() {
    const hash = String(window.location.hash || '');
    if (!hash) return false;
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('token') || '';
    const userRaw = params.get('user') || '';
    const ok = params.get('auth_ok') === '1';
    const err = params.get('auth_error') || '';
    const hashMode = params.get('mode') === 'register' ? 'register' : 'login';

    if (!ok && !err) return false;

    mode = hashMode;
    if (ok && token) {
      let user = {};
      try { user = JSON.parse(userRaw || '{}'); } catch (e) {}
      saveAuth(token, user);
      cleanHash();
      window.location.replace('/index.html');
      return true;
    }

    cleanHash();
    setMode(hashMode);
    showMessage(err || '操作失败，请稍后重试', false);
    return true;
  }

  async function checkExistingSession() {
    const token = localStorage.getItem('zp_token');
    if (!token) return;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/api/me', {
        headers: { Authorization: 'Bearer ' + token },
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({ ok: false }));
      if (data.ok && data.user) {
        localStorage.setItem('zp_user', JSON.stringify(data.user));
        window.location.replace('/index.html');
      } else {
        localStorage.removeItem('zp_token');
        localStorage.removeItem('zp_user');
      }
    } catch (e) {
      // 当前页面保持可重试，不因为临时网络问题清掉本地登录信息。
    }
  }

  function submitForm(event) {
    event.preventDefault();
    if (busy) return;

    const username = $('username').value.trim();
    const password = $('password').value;
    const nickname = $('nickname').value.trim();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return showMessage('用户名需为3-20位字母、数字或下划线', false);
    }
    if (password.length < 6 || password.length > 128) {
      return showMessage('密码长度需为6-128位', false);
    }
    if (mode === 'register' && nickname.length > 24) {
      return showMessage('昵称不能超过24个字符', false);
    }

    busy = true;
    $('submitBtn').disabled = true;
    $('submitBtn').textContent = mode === 'register' ? '注册中…' : '登录中…';
    clearMessage();

    $('authForm').action = mode === 'register' ? '/api/register' : '/api/login';
    $('authForm').method = 'POST';
    $('authForm').encoding = 'application/x-www-form-urlencoded';

    // 使用浏览器原生表单提交，绕开部分 Android WebView 对 XHR/fetch 的网络限制。
    HTMLFormElement.prototype.submit.call($('authForm'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('tabLogin').addEventListener('click', () => setMode('login'));
    $('tabRegister').addEventListener('click', () => setMode('register'));
    $('authForm').addEventListener('submit', submitForm);
    setMode('login');
    if (!handleAuthHash()) checkExistingSession();
  });
})();
