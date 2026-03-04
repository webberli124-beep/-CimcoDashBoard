# CIMCO MDC Dashboard

CIMCO MDC 生产监控仪表盘 — 实时显示每台机床的小时计划产量 vs 实际产量，支持逐小时历史明细、多视图切换和班次管理。
**只读连接**现有 CIMCO MDC MariaDB 数据库，仅执行 `SELECT` 查询，不修改任何数据。

---

## 界面概览

```
┌─────────────────────────────────────────────────────────────────────┐
│ CIMCO MDC Dashboard  Mar 4, 2026 (Wed)   1 On Track  3 Caution  2 Behind  14:24:33 ⚙ │
├─────────────────────────────────────────────────────────────────────┤
│ [All Machines ▼]  [📅 04/03/2026]  [Refresh]   [Hourly Table|Grid Cards|Summary]  [Day Shift 08:00–16:00] │
├─────────────────────────────────────────────────────────────────────┤
│  🔴 [M-002] CNC Mill #2                                             │
│  HOUR │ H.TARGET │ H.OUTPUT │ DIFF │  %  │ C.TARGET │ C.OUTPUT │ C.DIFF │ C.% │
│  08:00│    11    │    6     │  -5  │ 55% │    11    │    6     │   -5   │ 55% │
│  09:00│    11    │    5     │  -6  │ 45% │    22    │   11     │  -11   │ 50% │
│  ...  │   ...    │   ...    │ ...  │ ... │   ...    │   ...    │  ...   │ ... │
│  TOTAL│    78    │   40     │ -38  │ 51% │    —     │    —     │   —    │  —  │
└─────────────────────────────────────────────────────────────────────┘
```

### 三种视图

| 视图 | 说明 |
|------|------|
| **Hourly Table**（默认） | 逐小时明细表格，含小时数据和累计数据，支持按机床筛选 |
| **Grid Cards** | 卡片网格，每台机床显示进度环、偏差徽标和趋势迷你图 |
| **Summary** | 汇总表格，支持按机床名、差值、百分比、状态多列排序 |

### 四级状态颜色

| 颜色 | 状态 | 条件（默认阈值） |
|------|------|----------------|
| 🟢 绿 — On Track | 达标 | 实际 ≥ 100% 目标 |
| 🟡 黄 — Minor | 轻微不足 | 95%–99% |
| 🟠 橙 — Caution | 中等偏差 | 80%–94% |
| 🔴 红 — Behind | 严重落后 | < 80% |

> 绿色阈值（100%）和橙色下界（80%）均可在设置面板调整；黄色区间始终为绿色阈值下方 5% 范围。

---

## 一键部署（4 步）

> 面向 Windows 用户，从零开始到仪表盘运行。

### Step 1 — 下载 Lite 包

```powershell
# 方式 A：浏览器下载（推荐）
# 打开 https://github.com/webberli124-beep/-CimcoDashBoard
# 进入 install_package/ → 点击 cimco-dashboard-lite.zip → Download raw file

# 方式 B：PowerShell 下载
Invoke-WebRequest `
  -Uri "https://github.com/webberli124-beep/-CimcoDashBoard/raw/main/install_package/cimco-dashboard-lite.zip" `
  -OutFile "$HOME\Downloads\cimco-dashboard-lite.zip"
```

解压到目标位置，例如：

```powershell
Expand-Archive -Path "$HOME\Downloads\cimco-dashboard-lite.zip" -DestinationPath "C:\"
# 解压后目录: C:\cimco-dashboard\
```

> **前提**：系统需安装 Node.js v18 LTS 或更高版本。
> 安装方式：`winget install OpenJS.NodeJS.LTS` 或访问 https://nodejs.org/

### Step 2 — 配置数据库

编辑 `.env` 文件，填入 CIMCO MDC MariaDB 连接信息：

```powershell
notepad C:\cimco-dashboard\.env
```

```ini
DB_HOST=192.168.1.100     # MariaDB 服务器 IP（本机填 localhost）
DB_PORT=3306              # MariaDB 端口（默认 3306）
DB_USER=root              # 数据库用户名
DB_PASSWORD=your_password # 数据库密码
DB_NAME=MDC               # 数据库名（默认 MDC）
SERVER_PORT=3002          # 仪表盘 Web 端口
```

> 如果没有 `.env` 文件：`copy C:\cimco-dashboard\.env.example C:\cimco-dashboard\.env`

### Step 3 — 安装（首次）

双击 **`install.bat`**，安装程序会自动：

1. 检测 Node.js
2. 校验 npm 依赖
3. 显示数据库配置供确认
4. 执行完整性检查

> 首次运行会检查 npm 依赖，后续无需重复安装。

### Step 4 — 启动

双击 **`launch.vbs`** 一键启动（推荐，无黑窗口），3 秒后自动打开浏览器。

或双击 **`start.bat`**（带命令行窗口，可实时查看日志）。

**局域网其他设备访问**：启动后在 Settings 面板查看 Network Access 地址，手机 / 电视 / 其他电脑直接输入该地址访问。

---

## 操作说明

### ActionBar（操作栏）

| 控件 | 功能 |
|------|------|
| **机床选择器** | 下拉选择单台机床（Hourly Table 视图聚焦该机床），或 All Machines 显示全部 |
| **日期选择器** | 查询历史日期数据；每次打开页面自动重置为今天 |
| **Today / Refresh** | 当前为今天时显示 Refresh（刷新数据）；查看历史日期时显示 Today（回到今天） |
| **视图切换** | Hourly Table / Grid Cards / Summary 三键切换 |
| **班次标签** | 显示当前班次名和时间段（在 Settings 中切换班次） |

### Settings 面板（⚙ 图标）

| 设置 | 说明 |
|------|------|
| Shift Schedule | 切换班次（班次列表来自服务端 `.env` 配置），切换后立即重新拉取数据 |
| Refresh Interval | 自动刷新间隔：15 / 30 / 60 / 120 秒 |
| Green Threshold | 绿色达标阈值（默认 100%）；黄色区间 = Green−5% 至 Green−1% |
| Yellow Threshold | 橙色下界（默认 80%）；低于此值为红色 |
| TV Mode | 大屏模式（字号和间距放大，适合电视/投影） |
| Network Access | 局域网访问地址（供其他设备使用） |

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
| `MACHINE_NAMES` | *(未设置)* | 机床名称映射 JSON（见下方） |
| `SHIFT_SCHEDULES` | *(内置默认)* | 班次配置 JSON 数组（见下方） |

### 机床名称配置

```ini
MACHINE_NAMES={"1":"CNC Lathe #1","2":"CNC Mill #2","3":"Drill Press #3"}
```

JSON 格式：key 为 `portid`（数据库中的 portid 字段），value 为界面显示名称。未配置时使用内置默认名称（`Machine #N`）。

### 班次时间配置

```ini
SHIFT_SCHEDULES=[{"name":"Day Shift","start":"08:00","end":"16:00"},{"name":"Night Shift","start":"16:00","end":"00:00"}]
```

支持跨午夜班次（如 `22:00` → `06:00`）。修改后重启后端生效，前端 Settings 面板自动加载新班次列表。

---

## 数据库（只读）

> **重要：** 此仪表盘**只读**。仅执行 `SELECT` 查询，不创建表、不插入数据、不修改任何记录。

### 读取的表

仪表盘读取 `MDC.valtb_hourly_dashboard`（CIMCO MDC 系统维护的现有表）：

| 字段 | 类型 | 用途 |
|------|------|------|
| `starttime` | VARCHAR | Unix 时间戳字符串，标识该小时开始时刻 |
| `portid` | VARCHAR | 机床 ID，对应机床选择器和卡片 |
| `column1` | INT | 累计目标产量（班次截至当前时刻的目标） |
| `column2` | INT | 本小时目标产量 |
| `column3` | INT | 本小时实际产量 |

### 建议：创建只读数据库用户

```sql
CREATE USER 'dashboard'@'%' IDENTIFIED BY 'your_password';
GRANT SELECT ON MDC.valtb_hourly_dashboard TO 'dashboard'@'%';
FLUSH PRIVILEGES;
```

然后在 `.env` 中配置 `DB_USER=dashboard`，最小化数据库权限。

---

## 故障排除

| 现象 | 原因 & 解决方案 |
|------|----------------|
| 页面显示 "No machine data available" | 1. 确认选择的日期有数据 2. 检查班次时间是否匹配 3. 运行 `verify.bat` 检查完整性 |
| ECONNREFUSED | MariaDB 未运行或 host/port 配置错误，检查 `.env` 的 `DB_HOST`/`DB_PORT` |
| Access denied | 用户名或密码错误，检查 `.env` 的 `DB_USER`/`DB_PASSWORD` |
| Unknown database | `DB_NAME` 配置的数据库不存在 |
| 端口被占用 | 修改 `.env` 中 `SERVER_PORT`；或 `taskkill /PID <PID> /F` 结束占用进程 |
| 局域网无法访问 | Windows 防火墙放行 `SERVER_PORT` 端口的入站规则 |
| launch.vbs 弹出"端口已被占用" | 仪表盘已在运行，点击 Yes 直接打开浏览器即可 |

**运行 `verify.bat`** 可快速检查包完整性（Node.js、前后端文件、依赖、配置）。

### 常见连接排查步骤

```powershell
# 1. 确认 MariaDB 服务正在运行
Get-Service -Name "MySQL*","MariaDB*" | Format-Table Name,Status

# 2. 确认网络可达
Test-NetConnection -ComputerName 192.168.1.100 -Port 3306

# 3. 查看 3002 端口占用
netstat -ano | findstr :3002
```

---

## 开机自启动

1. 打开 **任务计划程序**（开始菜单搜索）
2. 点击 "创建基本任务"
3. 名称：`CIMCO Dashboard`，触发器：**计算机启动时**
4. 操作：**启动程序**
   - 程序：`C:\cimco-dashboard\launch.vbs`
   - 起始于：`C:\cimco-dashboard`
5. 勾选 "打开属性对话框" → 改为 "不管用户是否登录都要运行"

---

## 模块架构

```
cimco-dashboard/
├── src/                              # 前端源码 (React + TypeScript + Tailwind)
│   ├── pages/
│   │   └── dashboard-page.tsx        # 主页面（3 视图路由、状态管理）
│   ├── components/
│   │   ├── action-bar/               # 操作栏（机床选择器、日期、视图切换、班次）
│   │   ├── hourly-table/             # 逐小时明细表格（默认主视图）
│   │   ├── status-bar/               # 顶部状态栏（标题、日期、4 级统计、时钟）
│   │   ├── machine-card/             # 机床卡片（进度环、偏差、迷你趋势图）
│   │   ├── machine-grid/             # 响应式卡片网格
│   │   ├── detail-panel/             # 详情侧边栏（ECharts 小时柱状图）
│   │   ├── summary-table/            # 汇总表格（多列排序）
│   │   ├── settings-panel/           # 设置面板（班次、阈值、TV 模式）
│   │   ├── error-banner/             # 错误提示横幅
│   │   └── ui/                       # 基础 UI 组件 (shadcn/ui)
│   ├── hooks/
│   │   ├── use-dashboard-data.ts     # 数据获取 + 自动刷新 + 状态计算
│   │   ├── use-settings.ts           # 设置持久化（localStorage，日期始终重置为今天）
│   │   └── use-clock.ts              # 实时时钟（1 秒更新）
│   ├── services/api.ts               # API 客户端（结构化错误处理）
│   ├── config/constants.ts           # 颜色、阈值、状态标签、getStatus()
│   └── types/dashboard.ts            # TypeScript 类型定义
│
├── server/                           # 后端 API (Express + TypeScript)
│   ├── index.ts                      # 入口（路由、安全头、静态文件服务）
│   ├── db.ts                         # MariaDB 连接池（mysql2/promise）
│   ├── dashboard.ts                  # GET /api/dashboard（只读 SELECT）
│   └── logger.ts                     # 日志工具（控制台 + 文件异步写入）
│
├── db/seed.sql                       # 测试用种子数据
├── dist/                             # 前端构建产物（vite build）
├── server/dist/                      # 后端编译产物（tsc）
│
├── Dockerfile / docker-compose.yml   # Docker 部署（可选）
├── nginx.conf                        # Nginx 反向代理配置
├── .env.example                      # 环境变量模板
└── CLAUDE.md                         # 开发规范（AI 协作用）
```

### API 接口

| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| GET | `/api/health` | — | 健康检查 + 数据库连通性 |
| GET | `/api/config` | — | 班次配置 + 局域网 IP + 端口 |
| GET | `/api/dashboard` | `shiftStart`, `shiftEnd`, `date`, `greenThreshold`, `yellowThreshold` | 机床逐小时数据（只读） |

### npm 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（port 5199，HMR） |
| `npm run server` | 启动后端开发服务器（port 3002，tsx 热重载） |
| `npm run dev:all` | 前端 + 后端并行开发模式 |
| `npm run build` | 构建前端生产包 → `dist/` |
| `npm run build:server` | 编译后端 TypeScript → `server/dist/` |
| `npm run build:all` | 构建前端 + 编译后端 |
| `npm run lint` | ESLint 代码检查 |

---

## 开发指南

```bash
# 安装全部依赖
npm install

# 配置环境
cp .env.example .env
# 编辑 .env，设置数据库连接

# 启动开发模式（前端 + 后端同时）
npm run dev:all
```

- 前端：http://localhost:5199（Vite HMR 热更新）
- 后端：http://localhost:3002（tsx 自动重载）

### 测试数据库（Docker）

```bash
# 启动 MariaDB 测试容器
docker run -d --name cimco-mdc-testdb \
  -e MARIADB_ROOT_PASSWORD=cimco123 \
  -e MARIADB_DATABASE=MDC \
  -p 3306:3306 \
  mariadb:11

# 等待容器就绪后导入种子数据（注意：用 mariadb 命令，不是 mysql）
docker exec -i cimco-mdc-testdb mariadb -uroot -pcimco123 MDC < db/seed.sql
```

### 打包交付物

```bash
# 1. 构建前后端
npm run build:all

# 2. 手动暂存到 _build/lite/cimco-dashboard/
#    （参考 CLAUDE.md 打包规范）

# 3. 安装生产依赖
cd _build/lite/cimco-dashboard && npm ci --omit=dev

# 4. 创建 ZIP（PowerShell，includeBaseDirectory=false）
powershell -Command "
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::CreateFromDirectory('_build/lite', 'install_package/cimco-dashboard-lite.zip', 'Optimal', 0)
"
```

---

## Docker 部署（可选）

适用于有 Docker 环境的服务器部署：

```bash
git clone https://github.com/webberli124-beep/-CimcoDashBoard.git
cd CimcoDashBoard

cp .env.example .env
# 编辑 .env，设置 DB_HOST=host.docker.internal（Docker 内访问宿主机）

docker compose up -d
docker compose logs -f
```

---

## 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|---------|
| Chrome / Edge | 80+ |
| Firefox | 78+ |
| Safari | 14+ |

需要 ES2020+。**不支持** Internet Explorer。
