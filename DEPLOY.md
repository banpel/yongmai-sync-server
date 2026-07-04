# 云端同步服务端部署指南

## 方式一：Railway 免费部署（详细步骤）

### 1. 创建 GitHub 仓库

注册 https://github.com → 点右上角 **+** → **New repository** → 仓库名 `yongmai-sync-server` → Public → Create

### 2. 推送代码到 GitHub

在终端执行：

```bash
cd D:\work\Trae\YongMai_Box\server

git init
git add .
git commit -m "init sync server"
git remote add origin https://github.com/你的用户名/yongmai-sync-server.git
git branch -M main
git push -u origin main
```

刷新 GitHub 页面，确认 `server.js`、`package.json` 已上传。

### 3. 注册 Railway

打开 https://railway.app → Login → **Login with GitHub** 授权

### 4. 部署

1. 点击 **New Project** → **Deploy from GitHub repo**
2. 授权 GitHub 仓库访问 → 搜索选择 `yongmai-sync-server`
3. Railway 自动检测 Node.js，开始构建（~30秒）
4. 绿色 **Success** = 部署完成

### 5. 获取域名

项目详情 → **Settings** → **Networking** → **Generate Domain**
得到域名如：`yongmai-sync-server.up.railway.app`

### 6. 验证

浏览器打开 `https://你的域名.up.railway.app/api/sync/test`

应返回：
```json
{"success":true,"server":"yongmai-sync-server","version":"1.0.0","records":0}
```

### 7. 配置前端

修改 `YongMai_Box/src/common/api/sync.js`：

```js
const SYNC_MODE = 'server'
const SERVER_URL = 'https://你的域名.up.railway.app/api/sync'
```

---

## 方式二：Render 免费部署（无需绑卡，完全免费）

与 Railway 步骤几乎相同：

1. 同上创建 GitHub 仓库并推送代码
2. 打开 https://render.com → **Sign up with GitHub**
3. 点 **New +** → **Web Service**
4. 连接仓库 `yongmai-sync-server`
5. 配置：
   - **Name**: `yongmai-sync`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Free Plan**: 选择 Free
6. 点 **Create Web Service**
7. 获得域名 `yongmai-sync.onrender.com`

> 注意：Render 免费计划空闲 15 分钟后会休眠，下次访问需 ~30 秒唤醒。

---

## 方式三：本地开发

```bash
cd D:\work\Trae\YongMai_Box\server
npm install
npm start
```

启动后访问 http://localhost:3000/api/sync/test

前端配置：
```js
const SYNC_MODE = 'server'
const SERVER_URL = 'http://localhost:3000/api/sync'
```

---

## 方式四：仅本地使用（无需服务器）

```js
const SYNC_MODE = 'local'
// SERVER_URL 不需要配置
```

所有数据存在当前设备本地，无需网络。

---

## API 接口一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/sync/test` | 健康检查 |
| POST | `/api/sync/save` | 保存单条数据 |
| POST | `/api/sync/saveAll` | 批量保存 |
| POST | `/api/sync/load` | 加载单条 |
| POST | `/api/sync/loadAll` | 批量加载 |
| POST | `/api/sync/remove` | 删除数据 |
| POST | `/api/sync/checkUpdate` | 检查版本更新 |
| GET | `/api/sync/all` | 查看所有记录 |

