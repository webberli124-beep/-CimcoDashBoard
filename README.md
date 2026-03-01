# CIMCO MDC Dashboard

CIMCO MDC 生产监控仪表盘 — 实时显示每台机床的小时计划产量 vs 实际产量，高亮偏差设备。
**只读连接**现有 CIMCO MDC MariaDB 数据库，仅执行 `SELECT` 查询，不修改任何数据。

---

## 一键部署（4 步）

> 面向 Windows 用户，从零开始到仪表盘运行。

### Step 1 — 下载

从 GitHub 下载交付包（二选一）：

| 包 | 大小 | 适用场景 |
|----|------|----------|
| **Full 包**（推荐） | ~75 MB | 内置 Node.js，无需额外安装 |
| **Lite 包** | ~40 MB | 需系统已安装 Node.js |

```powershell
# 方式 A：PowerShell 一键下载 Full 包（推荐）
Invoke-WebRequest -Uri "https://github.com/webberli124-beep/-CimcoDashBoard/raw/main/install_package/cimco-dashboard-full.zip" -OutFile "$HOME\Downloads\cimco-dashboard-full.zip"

# 方式 B：浏览器下载
# 打开 https://github.com/webberli124-beep/-CimcoDashBoard
# 进入 install_package/ 文件夹 → 点击对应 ZIP → Download raw file
```

下载后解压到目标位置，例如：

```powershell
Expand-Archive -Path "$HOME\Downloads\cimco-dashboard-full.zip" -DestinationPath "C:\"
# 解压后目录: C:\cimco-dashboard\
```

### Step 2 — 配置数据库

编辑 `.env` 文件，填入你的 CIMCO MDC MariaDB 连接信息：

```powershell
notepad C:\cimco-dashboard\.env
```

修改以下字段：

```ini
DB_HOST=192.168.1.100     # MariaDB 服务器 IP（本机填 localhost）
DB_PORT=3306              # MariaDB 端口（默认 3306）
DB_USER=root              # 数据库用户名
DB_PASSWORD=your_password # 数据库密码
DB_NAME=MDC               # 数据库名（默认 MDC）
SERVER_PORT=3002          # 仪表盘 Web 端口
```

> 如果没有 `.env` 文件，从 `.env.example` 复制一份即可：`copy .env.example .env`

### Step 3 — 安装

双击运行 **`install.bat`**，安装程序会自动：

1. 检测 Node.js（Full 包内置，无需安装）
2. 校验 npm 和依赖包
3. 显示数据库配置供确认
4. 执行完整性检查

> 首次运行会安装 npm 依赖，需要 1-2 分钟。后续启动秒开。

### Step 4 — 启动

双击 **`launch.vbs`** 即可一键启动（推荐，无黑窗口）。

或使用 `start.bat`（带命令行窗口，可查看日志）。

启动后自动打开浏览器访问 `http://localhost:3002`。

**局域网其他设备访问**：启动后在 Settings 面板查看 Network Access 地址，手机/电视/其他电脑直接输入该地址访问。

---

## 缺少依赖？逐项解决

### Node.js 未安装

**Full 包用户**：无需操作，Full 包自带 Node.js。

**Lite 包用户**：需安装 Node.js v22 LTS：

```powershell
# 方式 A：winget 安装（Win10 1709+ / Win11）
winget install OpenJS.NodeJS.LTS

# 方式 B：手动下载
# 访问 https://nodejs.org/ → 下载 LTS 版本 → 运行 MSI 安装
```

安装后验证：

```powershell
node -v   # 应显示 v22.x.x
npm -v    # 应显示 10.x.x
```

### MariaDB / MySQL 无法连接

1. **确认 MariaDB 正在运行**：
   ```powershell
   # 检查服务状态
   Get-Service -Name "MySQL*","MariaDB*" | Format-Table Name,Status
   ```

2. **确认网络可达**：
   ```powershell
   Test-NetConnection -ComputerName 192.168.1.100 -Port 3306
   ```

3. **确认凭据正确**：
   ```powershell
   mysql -h 192.168.1.100 -u root -p -e "SELECT 1"
   ```

4. **防火墙放行**（如从远程连接）：
   - MariaDB 服务器需放行 3306 端口
   - 仪表盘服务器需放行 3002 端口（供局域网设备访问）

### npm 依赖安装失败

```powershell
cd C:\cimco-dashboard

# 清除缓存重装
npm cache clean --force
npm install --omit=dev

# 如果网络问题，设置镜像
npm config set registry https://registry.npmmirror.com
npm install --omit=dev
```

### 端口被占用

```powershell
# 查看 3002 端口占用
netstat -ano | findstr :3002

# 方式 A：改用其他端口 — 编辑 .env
SERVER_PORT=8080

# 方式 B：结束占用进程
taskkill /PID <进程ID> /F
```

---

## 环境变量配置

所有配置在 `.env` 文件中，从 `.env.example` 复制。

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DB_HOST` | `localhost` | MariaDB 服务器地址 |
| `DB_PORT` | `3306` | MariaDB 端口 |
| `DB_USER` | `root` | 数据库用户名 |
| `DB_PASSWORD` | *(空)* | 数据库密码 |
| `DB_NAME` | `MDC` | 数据库名 |
| `SERVER_PORT` | `3002` | 仪表盘 Web 端口 |
| `CORS_ORIGIN` | *(未设置)* | 允许的跨域来源（生产环境建议设置） |
| `MACHINE_NAMES` | *(未设置)* | 机床名称映射 JSON（见下方） |
| `SHIFT_SCHEDULES` | *(内置默认)* | 班次时间 JSON 数组（见下方） |

### 机床名称配置

```ini
MACHINE_NAMES={"1":"CNC Lathe #1","2":"CNC Mill #2","3":"Drill Press #3"}
```

JSON 格式：key 为 `portid`，value 为显示名称。未配置时使用内置默认名称。

### 班次时间配置

```ini
SHIFT_SCHEDULES=[{"name":"Day Shift","start":"08:00","end":"16:00"},{"name":"Night Shift","start":"16:00","end":"00:00"}]
```

支持跨午夜班次（如 `22:00` → `06:00`）。修改后重启生效，前端 Settings 面板会显示配置的班次。

---

## UI 设置（浏览器端）

通过右上角齿轮图标打开 Settings 面板，设置保存在浏览器 localStorage：

| 设置 | 默认值 | 说明 |
|------|--------|------|
| Refresh Interval | 30s | 自动刷新间隔（15/30/60/120s） |
| Green Threshold | 100% | 达标阈值（>= 此百分比显示绿色） |
| Yellow Threshold | 80% | 警告阈值（>= 此百分比显示黄色） |
| Shift Schedule | Day Shift | 当前班次（从服务端配置加载） |
| TV Mode | Off | 大屏模式（更大字体和布局） |

---

## 数据库（只读）

> **重要：** 此仪表盘**只读**。仅执行 `SELECT` 查询，不创建表、不插入数据、不修改任何记录。

### 表结构（参考）

仪表盘读取 `mdc.valtb_hourly_dashboard`（CIMCO MDC 系统维护的现有表）：

| 字段 | 类型 | 仪表盘用途 | 说明 |
|------|------|-----------|------|
| `starttime` | VARCHAR(20) | 时间戳 | Unix 时间戳字符串 |
| `portid` | VARCHAR(10) | 机床 ID | 对应机床卡片 |
| `column1` | INT | 累计目标 | 班次总目标 |
| `column2` | INT | 小时目标 | 每小时目标 |
| `column3` | INT | 实际产量 | 每小时实际产出 |

### 建议：创建只读数据库用户

```sql
CREATE USER 'dashboard'@'%' IDENTIFIED BY 'your_password';
GRANT SELECT ON MDC.valtb_hourly_dashboard TO 'dashboard'@'%';
FLUSH PRIVILEGES;
```

然后在 `.env` 中设置 `DB_USER=dashboard`。

---

## 模块架构

```
cimco-dashboard/
├── src/                          # 前端源码 (React + TypeScript + Tailwind)
│   ├── pages/                    #   页面组件
│   │   └── dashboard-page.tsx    #     主仪表盘页面
│   ├── components/               #   UI 组件
│   │   ├── status-bar/           #     顶部状态栏（时钟、统计、班次）
│   │   ├── machine-card/         #     机床卡片（进度环、迷你图、偏差）
│   │   ├── machine-grid/         #     响应式卡片网格
│   │   ├── detail-panel/         #     详情弹窗 + 小时柱状图 (ECharts)
│   │   ├── summary-table/        #     表格视图（可排序）
│   │   ├── settings-panel/       #     设置面板（侧边栏）
│   │   ├── error-banner/         #     错误提示横幅
│   │   └── ui/                   #     基础 UI 组件 (Shadcn)
│   ├── hooks/                    #   React Hooks
│   │   ├── use-dashboard-data.ts #     数据获取 + 自动刷新
│   │   ├── use-settings.ts       #     设置持久化 (localStorage)
│   │   └── use-clock.ts          #     实时时钟
│   ├── services/api.ts           #   API 客户端
│   ├── config/constants.ts       #   常量和阈值配置
│   └── types/dashboard.ts        #   TypeScript 类型定义
│
├── server/                       # 后端 API (Express + TypeScript)
│   ├── index.ts                  #   Express 入口（路由、安全头、静态文件）
│   ├── db.ts                     #   MariaDB 连接池（懒加载、优雅关闭）
│   ├── dashboard.ts              #   GET /api/dashboard（只读查询）
│   └── logger.ts                 #   日志工具（异步文件写入）
│
├── db/seed.sql                   # 测试用种子数据
├── dist/                         # 前端构建产物
├── server/dist/                  # 后端编译产物
│
├── Dockerfile                    # 多阶段 Docker 构建
├── docker-compose.yml            # Docker Compose 编排
├── nginx.conf                    # Nginx 反向代理配置
│
├── pack.bat                      # 打包脚本（生成 lite + full ZIP）
├── install.bat                   # 客户端一键安装
├── start.bat                     # 客户端启动（带控制台）
├── launch.vbs                    # 客户端启动（隐藏窗口）
├── verify.bat                    # 完整性校验工具
│
├── .env.example                  # 环境变量模板
├── package.json                  # 依赖和脚本
├── INSTALL.md                    # 客户端安装指南
└── README.md                     # 本文件
```

### API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 + 数据库连通性 |
| GET | `/api/config` | 班次配置 + 局域网 IP + 端口 |
| GET | `/api/dashboard?shiftStart=08:00&shiftEnd=16:00` | 机床数据（只读） |

### npm 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 构建前端生产包 |
| `npm run build:server` | 编译后端 TypeScript |
| `npm run build:all` | 构建前端 + 编译后端 |
| `npm run server` | 启动后端开发服务器（tsx 热重载） |
| `npm run dev:all` | 前端 + 后端并行开发模式 |
| `npm run lint` | ESLint 代码检查 |

---

## Docker 部署（可选）

适用于有 Docker 环境的服务器部署：

```bash
# 1. 克隆仓库
git clone https://github.com/webberli124-beep/-CimcoDashBoard.git
cd CimcoDashBoard

# 2. 配置环境
cp .env.example .env
# 编辑 .env，设置数据库连接（Docker 中用 DB_HOST=host.docker.internal）

# 3. 启动
docker compose up -d

# 4. 查看状态
docker compose ps
docker compose logs -f
```

| 服务 | 端口 | 说明 |
|------|------|------|
| frontend | 80 | Nginx 静态文件服务 |
| backend | 3002 | Express API（只读查询） |

---

## 开发指南

```bash
# 安装全部依赖
npm install

# 配置环境
cp .env.example .env

# 启动开发模式（前端 + 后端）
npm run dev:all
```

- 前端：http://localhost:5199（Vite HMR 热更新）
- 后端：http://localhost:3002（tsx 自动重载）

### 测试数据

使用 Docker 启动测试数据库：

```bash
docker run -d --name cimco-mdc-testdb \
  -e MARIADB_ROOT_PASSWORD=cimco123 \
  -e MARIADB_DATABASE=MDC \
  -p 3306:3306 \
  mariadb:11

# 导入种子数据
mysql -h 127.0.0.1 -u root -pcimco123 MDC < db/seed.sql
```

### 构建交付包

```bash
# 运行打包脚本，生成 install_package/ 下的 lite + full ZIP
pack.bat
```

---

## 浏览器兼容性

| 浏览器 | 最低版本 | 状态 |
|--------|---------|------|
| Chrome | 80+ | 完全支持 |
| Firefox | 78+ | 完全支持 |
| Edge | 80+ | 完全支持 |
| Safari | 14+ | 完全支持 |

需要 ES2020+ 支持。**不支持** Internet Explorer。

---

## 开机自启动

### Windows 任务计划程序

1. 打开 **任务计划程序**（开始菜单搜索）
2. 点击 "创建基本任务"
3. 名称：`CIMCO Dashboard`
4. 触发器：**计算机启动时**
5. 操作：**启动程序**
   - 程序：`C:\cimco-dashboard\launch.vbs`
   - 起始于：`C:\cimco-dashboard`
6. 勾选 "打开属性对话框" → 改为 "不管用户是否登录都要运行"

---

## 故障排除

| 问题 | 排查步骤 |
|------|----------|
| 仪表盘无数据 | 1. 确认后端运行中 2. 浏览器 F12 查看控制台错误 3. 检查 `.env` 数据库配置 |
| ECONNREFUSED | MariaDB 未运行或 host/port 错误 |
| Access denied | `.env` 中用户名或密码错误 |
| Unknown database | `.env` 中 `DB_NAME` 不存在 |
| 端口被占用 | 修改 `.env` 中 `SERVER_PORT`，或关闭占用进程 |
| 局域网无法访问 | 检查 Windows 防火墙是否放行 `SERVER_PORT` 端口 |
| Docker 无法连接数据库 | 设置 `DB_HOST=host.docker.internal` |

运行 **`verify.bat`** 可快速检查包完整性。如需支持，截图输出发送给技术人员。
