# 零点行动 v31.2 高延迟稳定版

## P0：服务端权威移动
- 不再直接接受客户端坐标。
- 按服务端收到位置包的实际间隔自适应水平移动阈值。
- 允许有限网络抖动，但单包大范围瞬移会被拒绝/限制。
- 服务端增加碰撞采样，防止位置包穿墙。
- 增加垂直速度、跳跃高度、空中持续时间限制，飞天坐标无效。
- 服务端发现明显回拉时向客户端发送 move_correction，客户端平滑修正。

## P1：C4
- C4_LATENCY_GRACE_METERS 从 8 米收紧到 2.5 米。

## P2：位置同步
- 客户端位置上报固定 50ms（20Hz）。
- 不再因为 RTT 700ms/400ms/220ms 自动降到 110/85/65ms。
- WebSocket 拥塞仍由 bufferedAmount 保护。

## P3：世界物体
- 删除客户端 startGasTankSpawner() 及其 Math.random() 坐标生成。
- 气罐只接受服务端 gasTanks 坐标并负责渲染。

## P4：版本
- package.json / package-lock.json / server.js / main.js 统一到 v31.2.0。
- index.html 和 map-select.js 的资源版本统一到 31.2.0。
