'use strict';

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

const ZPW_KEY = 'grayzone_2026_secret_key_do_not_share_x9f3k2';

function decryptZpw(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 32) throw new Error('文件太小');
  if (buf.slice(0, 4).toString('ascii') !== 'ZPW1') throw new Error('不是 ZPW 格式');

  const iv = buf.slice(4, 16);
  const tag = buf.slice(16, 32);
  const ciphertext = buf.slice(32);
  const key = crypto.scryptSync(ZPW_KEY, 'zpw_salt_v1', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function loadMapFile(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    const zipBuf = decryptZpw(buf);
    const zip = new AdmZip(zipBuf);
    const entry = zip.getEntry('world.json');
    if (!entry) throw new Error('缺少 world.json');

    const data = JSON.parse(entry.getData().toString('utf8'));
    const fileId = path.basename(filePath).replace(/\.zpw$/i, '');
    data.id = data.id || fileId;
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(String(data.id))) {
      throw new Error('地图 id 非法: ' + data.id);
    }
    return data;
  } catch (e) {
    console.error('[MAP] 加载失败 ' + path.basename(filePath) + ': ' + e.message);
    return null;
  }
}

function loadAllMaps(mapsDir) {
  const maps = Object.create(null);
  let defaultMapId = null;

  try {
    if (!fs.existsSync(mapsDir)) {
      console.warn('[MAP] maps 目录不存在: ' + mapsDir);
      return { maps, defaultMapId };
    }

    for (const fileName of fs.readdirSync(mapsDir)) {
      if (!fileName.toLowerCase().endsWith('.zpw')) continue;
      const data = loadMapFile(path.join(mapsDir, fileName));
      if (!data) continue;
      maps[data.id] = data;
      console.log('[MAP] 加载 ' + data.id + ' (' + (Array.isArray(data.boxes) ? data.boxes.length : 0) + ' boxes) ← ' + fileName);
    }

    const keys = Object.keys(maps);
    if (keys.length) {
      defaultMapId = process.env.MAP && maps[process.env.MAP] ? process.env.MAP : keys[0];
    }
    console.log('[MAP] 地图库就绪：' + keys.length + ' 张，默认 ' + (defaultMapId || '无'));
  } catch (e) {
    console.error('[MAP] 扫描目录失败: ' + e.message);
  }

  return { maps, defaultMapId };
}

module.exports = { loadAllMaps };
