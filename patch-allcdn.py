#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re
from pathlib import Path

HASH = 'f30f87e'
CDN = f'https://cdn.jsdelivr.net/gh/Hivber/zero-point-assets@{HASH}/'

# ==================== index.html ====================
ih = Path('index.html')
h = ih.read_text(encoding='utf-8')

# style.css
h = re.sub(
    r'<link rel="stylesheet" href="[^"]*style\.css[^"]*">',
    f'<link rel="stylesheet" href="{CDN}style.css?v=killcanvas">',
    h
)

# howler
h = re.sub(
    r'<script src="[^"]*howler[^"]*"></script>',
    f'<script src="{CDN}vendor/howler/howler.min.js"></script>',
    h
)

# importmap 3 项
h = re.sub(
    r'"@pixiv/three-vrm": "[^"]*"',
    f'"@pixiv/three-vrm": "{CDN}vendor/three-vrm/lib/three-vrm.module.js"',
    h
)
h = re.sub(
    r'"@pixiv/three-vrm-animation": "[^"]*"',
    f'"@pixiv/three-vrm-animation": "{CDN}vendor/three-vrm-animation/lib/three-vrm-animation.module.js"',
    h
)
h = re.sub(
    r'"three-mesh-bvh": "[^"]*"',
    f'"three-mesh-bvh": "{CDN}vendor/three-mesh-bvh/build/index.module.js"',
    h
)

# main.js
h = re.sub(
    r"import\('[^']*main\.js[^']*'\)",
    f"import('{CDN}main.js?v=allcdn01')",
    h
)

ih.write_text(h, encoding='utf-8')
print('OK: index.html')

# ==================== main.js ====================
m = Path('main.js')
s = m.read_text(encoding='utf-8')

# 1. 顶部 import client-infra → 相对路径（随 main.js 从 CDN 解析）
old = "} from '/models/client-infra.js';"
assert old in s, '顶层 client-infra import 找不到'
s = s.replace(old, "} from './models/client-infra.js';", 1)

# 2. CDN_CANDIDATES
old = "const CDN_CANDIDATES = ['/'];"
assert old in s, 'CDN_CANDIDATES 找不到'
new = """const CDN_HASH = 'f30f87e';
const CDN_CANDIDATES = [
  'https://cdn.jsdelivr.net/gh/Hivber/zero-point-assets@' + CDN_HASH + '/',
  'https://cdn.jsdmirror.com/gh/Hivber/zero-point-assets@' + CDN_HASH + '/',
  'https://jsd.onmicrosoft.cn/gh/Hivber/zero-point-assets@' + CDN_HASH + '/',
  'https://cdn.osyb.cn/gh/Hivber/zero-point-assets@' + CDN_HASH + '/',
];"""
s = s.replace(old, new, 1)

# 3. pickFastestCDN 里的探测：ping.txt → 真实文件
old = "const r = await fetch(base + 'ping.txt?t=' + Date.now(), { cache: 'no-store', signal: ctrl.signal });"
if old in s:
    new = "const r = await fetch(base + 'models/XGeBGFQxYg.glb?t=' + Date.now(), { cache: 'no-store', signal: ctrl.signal });"
    s = s.replace(old, new, 1)
    print('OK: 探测文件 → XGeBGFQxYg.glb (73KB)')
else:
    print('WARN: 探测文件那行没找到，跳过')

# 探测超时从 3000 延长到 5000（73KB 要时间）
s = s.replace('await _probeOne(base, 3000)', 'await _probeOne(base, 5000)')

# 4. precacheAssets：'/' + f.path → ASSET_BASE + f.path
old = "const blob = await _zpDownload('/' + f.path, (loaded) => {"
assert old in s, 'precacheAssets 下载行找不到'
new = "const blob = await _zpDownload(ASSET_BASE + f.path, (loaded) => {"
s = s.replace(old, new, 1)

# 5. _zpNormURL 精确提取 tail
old = """function _zpNormURL(u) {
  if (!u) return '';
  try {
    let s = String(u);
    s = s.replace(/^https?:\\/\\/[^/]+/i, '');
    s = s.replace(/^blob:[^/]+\\//i, '');
    s = s.replace(/^\\/+/, '');
    const q = s.indexOf('?'); if (q >= 0) s = s.slice(0, q);
    const h = s.indexOf('#'); if (h >= 0) s = s.slice(0, h);
    return s;
  } catch (e) { return ''; }
}"""
if old in s:
    new = """function _zpNormURL(u) {
  if (!u) return '';
  try {
    let s = String(u).split('#')[0].split('?')[0];
    // 从 URL 里提取 models/... animations/... textures/... sounds/... 的尾部
    const m = s.match(/\\/(models|animations|textures|sounds)\\/(.+)$/);
    if (m) return m[1] + '/' + m[2];
    return '';
  } catch (e) { return ''; }
}"""
    s = s.replace(old, new, 1)
    print('OK: _zpNormURL 已改')
else:
    print('WARN: _zpNormURL 那行没找到，跳过')

m.write_text(s, encoding='utf-8')
print('OK: main.js')
print('DONE')
