# ZeroPoint API v1

本项目的 `main.js` 会向页面暴露：

- `window.ZeroPoint`
- `window.ZeroPointAPI`
- `window.ZeroPointNative`（动态指向 `window.NativeBridge`）

## 生命周期

```js
window.addEventListener('ZeroPointAPIReady', () => {
  console.log('API loaded');
});

window.addEventListener('ZeroPointReady', () => {
  console.log('Game ready', ZeroPoint.ready);
});
```

也可以使用事件 API：

```js
ZeroPoint.events.on('ready', api => console.log(api));
ZeroPoint.events.on('game-start', state => console.log(state));
ZeroPoint.events.on('game-exit', state => console.log(state));
ZeroPoint.events.on('server-message', msg => console.log(msg));
ZeroPoint.events.on('message:snapshot', msg => console.log(msg));
```

## 游戏对象

```js
ZeroPoint.player.get();
ZeroPoint.player.getState();
ZeroPoint.player.getPosition();
ZeroPoint.player.getRotation();
ZeroPoint.player.setPosition(0, 0, 45);
ZeroPoint.player.setRotation(0, 0);
ZeroPoint.player.isAlive();
ZeroPoint.player.getId();
```

## 游戏控制

```js
ZeroPoint.game.isPlaying();
ZeroPoint.game.start();
ZeroPoint.game.exit();
ZeroPoint.game.optimize(true);
```

## 武器 / C4

```js
ZeroPoint.weapon.shoot();
ZeroPoint.weapon.reload();
ZeroPoint.weapon.switch();
ZeroPoint.weapon.getState();

ZeroPoint.c4.plant();
ZeroPoint.c4.getState();
ZeroPoint.c4.getSites();
```

## 陀螺仪

```js
ZeroPoint.gyro.enable();
ZeroPoint.gyro.disable();
ZeroPoint.gyro.toggle();
ZeroPoint.gyro.get();
ZeroPoint.gyro.setSensitivity(1.6);
ZeroPoint.gyro.setSmoothing(0.22);
```

## Three.js / 场景

```js
const THREE = ZeroPoint.THREE;
const scene = ZeroPoint.scene.get();
const camera = ZeroPoint.camera.get();
const renderer = ZeroPoint.renderer.get();

ZeroPoint.scene.add(new THREE.Object3D());
```

## 网络

```js
ZeroPoint.network.getState();
ZeroPoint.network.getSocket();
ZeroPoint.network.send({ type: 'example' });
ZeroPoint.network.sendPosition();
```

API 不暴露 `WS_SECRET`。

## APK NativeBridge

当前 APK 的原生能力直接通过原有 `window.NativeBridge` 提供。ZeroPoint 不重新包装或虚构 NativeBridge 的具体方法：

```js
const native = ZeroPoint.native;
// 或：
const native = ZeroPointNative;

if (native) {
  console.log(native);
}
```

这样可以继续使用打包器已经开启的 NativeBridge 能力。
