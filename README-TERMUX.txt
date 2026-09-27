零点行动服务器 v31.2 高延迟稳定版 - Termux 部署说明

目录结构已经整理完成：
- server.js
- map-loader.js
- game/*.js
- public/index.html
- public/main.js
- public/style.css
- public/login.html
- public/login.js
- public/auth-client.js
- public/map-select.js
- package.json

重要：maps / models / data 目录保留为空目录，不覆盖你现有的地图、模型和用户数据库。

在 Termux 中推荐这样更新：

1. 先备份旧项目
cp -r ~/zero-point-server ~/zero-point-server-backup-$(date +%Y%m%d-%H%M%S)

2. 解压 ZIP 后，把 ZIP 内的文件复制到 ~/zero-point-server
不要删除旧项目中的：
- public/maps/
- public/models/
- models/
- data/

3. 安装依赖
cd ~/zero-point-server
npm install

4. 检查 JS 语法
npm run check

5. 启动
node server.js

如果地图文件是 .zpw，请保持它们放在：
~/zero-point-server/public/maps/

VRM 文件继续放在：
~/zero-point-server/models/

前端使用的环境贴图、材质和 GLB 等资源放在：
~/zero-point-server/public/models/
~/zero-point-server/public/textures/


本版本高延迟优化：
- 客户端保持本地预测，移动渲染不等待服务器；位置包按 RTT/发送缓冲自动降频。
- WebSocket 支持 60 秒断线会话恢复，恢复时不会重新随机出生并覆盖本地位置。
- C4 下包增加有限的 8 米网络位置容错，并使用 requestId 防重复；只有服务器确认后才显示已安装。
- snapshot 根据房间人数自适应为 40/60/90/120ms，减少服务器在高人数下的广播压力。
- 增加轻量 RTT 探测。

注意：本版本未把服务器变成逐帧强制校正移动；这是为了避免高延迟服务器环境下把正常玩家频繁拉回。
地图 .zpw 与服务器 VRM 不包含在此源码包中，请保留部署机现有的 public/maps/ 与 models/ 文件。
