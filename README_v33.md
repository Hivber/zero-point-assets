# 零点行动 ZERO POINT 3D v33

本包是当前 3D FPS 工程的 v33 核心整合升级包。已将本轮稳定联机、关键操作确认、运行中心与模块化服务一起合并。

## 已整合

- 服务端权威移动校验：水平速度限制、垂直位移限制、软纠正、异常移动计数。
- C4 两阶段确认：requestId、服务器确认/拒绝、重复请求去重、2.5m 网络容差默认值。
- C4 安放成功只在服务器确认后改变客户端最终状态。
- 关键状态操作 ACK：C4、复活、action requestId。
- WebSocket 自动重连与 15 秒会话恢复。
- 客户端位置上报稳定 50ms，支持运行配置动态调整，不因 RTT 变高而主动降频。
- 气罐坐标只由服务器下发，客户端停止本地随机坐标生成。
- 协议 / 世界验证 / 服务端运行时 / JSON 持久化 / 客户端基础服务模块化。
- XOR + Base64 协议统一抽离，浏览器与 Node 使用同一字节级实现。
- `/api/config` 远程运行配置。
- 协议版本、客户端版本、资源版本握手检查。
- 维护模式。
- 系统公告中心 + WebSocket 实时推送。
- 活动调度器与 `/api/activities`。
- 邮件与奖励基础存储、领取接口，并接入前端系统中心。
- `/health` 健康检查、管理指标接口。
- `/api/client-error` 客户端错误上报与限流记录。
- 战术风格 3D 主菜单 UI v32 与 v33 运行中心合并。

## 目录

```text
server.js
package.json
package-lock.json
game/
  protocol.js
  world.js
  server-runtime.js
services/
  json-store.js
  runtime-services.js
public/
  index.html
  main.js
  style.css
  models/client-infra.js
data/
  runtime-config.json
  notices.json
  activities.json
  mail.json
  rewards.json
```

## 部署

将 ZIP 解压后覆盖到现有 `~/zero-point-server/`，保留你现有的 `models/`、`public/models/`、`public/maps/` 和其它大型资源文件。

然后执行：

```bash
cd ~/zero-point-server
npm install
export ZERO_POINT_ADMIN_TOKEN='修改成你自己的长随机字符串'
npm start
```

端口默认 `9178`。

## 管理接口

所有 `/api/admin/*` 接口要求：

```text
Authorization: Bearer <ZERO_POINT_ADMIN_TOKEN>
```

包含：公告、活动、邮件、奖励、运行配置、在线指标。

## 运行配置

文件：`data/runtime-config.json`

主要项目：

```text
maintenance.enabled
maintenance.message
gameplay.positionSendMs
gameplay.c4LatencyGraceMeters
features.notices
features.mail
features.rewards
features.activities
features.errorReport
```

## 注意

ZIP 不重复塞入 VRM、地图和其它大型模型资源，避免覆盖你当前已经正常使用的资源文件；代码、配置和模块均已在包内完成整合。
