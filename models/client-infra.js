const WS_SECRET = 'Z3R0_P01NT_V29_SECRET';
const WS_SECRET_BYTES = new TextEncoder().encode(WS_SECRET);

export function encryptMsg(str) {
  try {
    const input = new TextEncoder().encode(String(str));
    const out = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) out[i] = input[i] ^ WS_SECRET_BYTES[i % WS_SECRET_BYTES.length];
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < out.length; i += chunk) binary += String.fromCharCode(...out.subarray(i, i + chunk));
    return btoa(binary);
  } catch (e) {
    return String(str);
  }
}

export function decryptMsg(b64) {
  try {
    if (typeof b64 !== 'string' || b64.length > 96000) return null;
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i) ^ WS_SECRET_BYTES[i % WS_SECRET_BYTES.length];
    return new TextDecoder().decode(out);
  } catch (e) {
    return null;
  }
}

export const PROTOCOL_VERSION = 1;
export const CLIENT_VERSION = '1.0.0';
export const RESOURCE_VERSION = '1.0.0';

export function createRequestId(prefix = 'req') {
  const a = Math.random().toString(36).slice(2, 10);
  const b = Date.now().toString(36).slice(-8);
  return `${prefix}_${b}_${a}`.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
}

export async function fetchRuntimeConfig() {
  const res = await fetch('/api/config', { cache: 'no-store' });
  if (!res.ok) throw new Error('配置加载失败：HTTP ' + res.status);
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.message || '配置加载失败');
  return json;
}

export async function fetchNotices(limit = 20) {
  const res = await fetch('/api/notices?limit=' + encodeURIComponent(limit), { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json?.notices) ? json.notices : [];
}

export async function fetchActivities() {
  const res = await fetch('/api/activities', { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json?.activities) ? json.activities : [];
}

export async function fetchMailbox(session) {
  if (!session) return { mail: [], rewards: [] };
  const res = await fetch('/api/mail?session=' + encodeURIComponent(session), { cache: 'no-store' });
  if (!res.ok) return { mail: [], rewards: [] };
  const json = await res.json();
  return { mail: json?.mail || [], rewards: json?.rewards || [] };
}

export function reportClientError(payload) {
  try {
    const body = JSON.stringify({
      message: String(payload?.message || '').slice(0, 500),
      stack: String(payload?.stack || '').slice(0, 4000),
      source: String(payload?.source || 'client').slice(0, 80),
      version: CLIENT_VERSION,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/client-error', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}

export async function claimMail(session, mailId) {
  const res = await fetch('/api/mail/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session, mailId }), keepalive: true });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) throw new Error(json?.message || '邮件领取失败');
  return json;
}

export async function claimReward(session, rewardId) {
  const res = await fetch('/api/rewards/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session, rewardId }), keepalive: true });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) throw new Error(json?.message || '奖励领取失败');
  return json;
}
