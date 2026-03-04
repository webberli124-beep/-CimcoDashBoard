# CIMCO MDC Dashboard — 安装指南

> **只读连接**：仪表盘仅执行 `SELECT` 查询，不创建、修改或删除任何数据。

---

## 快速开始（4 步）

### Step 1：解压安装包

将 `cimco-dashboard-lite.zip` 解压到目标目录，例如：

```
C:\CimcoDashboard\
```

解压后目录结构：

```
cimco-dashboard\
├── dist\              ← 前端文件（勿修改）
├── server\
│   └── dist\          ← 后端 API 服务（已编译）
├── node_modules\      ← 依赖包（勿修改）
├── .env.example       ← 配置模板
├── install.bat        ← 首次安装
├── start.bat          ← 启动（带命令窗口）
├── launch.vbs         ← ★ 一键启动（推荐）
├── verify.bat         ← 完整性检查
├── INSTALL.md         ← 本文件
├── README.md          ← 完整文档
└── package.json
```

> **前提**：系统需安装 **Node.js v18 LTS 或更高版本**。
> 安装命令：`winget install OpenJS.NodeJS.LTS`
> 或访问 https://nodejs.org/ 下载安装。

---

### Step 2：配置数据库

如果目录中没有 `.env` 文件，先从模板复制：

```bat
copy C:\CimcoDashboard\.env.example C:\CimcoDashboard\.env
```

编辑 `.env`，填入 CIMCO MDC MariaDB 连接信息：

```ini
DB_HOST=192.168.1.100     # MariaDB 服务器 IP（本机填 localhost）
DB_PORT=3306              # MariaDB 端口（默认 3306）
DB_USER=root              # 数据库用户名
DB_PASSWORD=your_password # 数据库密码
DB_NAME=MDC               # 数据库名（默认 MDC）
SERVER_PORT=3002          # 仪表盘 Web 端口
```

**常见场景：**
- MariaDB 在同一台机器：`DB_HOST=localhost`
- MariaDB 在另一台服务器：`DB_HOST=192.168.1.100`（填实际 IP）
- 端口冲突：修改 `SERVER_PORT=8080`

---

### Step 3：首次安装

双击 **`install.bat`**，安装程序自动：

1. 检测 Node.js
2. 校验 npm 依赖
3. 显示当前数据库配置
4. 执行文件完整性检查

> 首次运行约需 1–2 分钟；后续启动无需重复安装。

---

### Step 4：启动

双击 **`launch.vbs`** — 一键启动，无黑色命令窗口，3 秒后自动打开浏览器。

或双击 **`start.bat`** — 带命令行窗口，可实时查看日志输出。

**局域网其他设备访问**：启动后在 ⚙ Settings 面板查看 **Network Access** 地址，在手机 / 电视 / 其他电脑浏览器输入该地址即可访问。

---

## 界面说明

### 三种视图

通过 ActionBar 右侧按钮切换：

| 视图 | 说明 |
|------|------|
| **Hourly Table**（默认） | 逐小时明细表格。左侧机床选择器可聚焦单台机床，或 All Machines 纵向显示全部 |
| **Grid Cards** | 卡片网格，显示进度环、偏差徽标和趋势迷你图 |
| **Summary** | 汇总表格，支持按机床名 / 差值 / 百分比 / 状态排序 |

### 四级状态颜色

| 颜色 | 状态 | 条件（默认阈值） |
|------|------|----------------|
| 🟢 绿 — On Track | 达标 | ≥ 100% 目标 |
| 🟡 黄 — Minor | 轻微不足 | 95%–99% |
| 🟠 橙 — Caution | 中等偏差 | 80%–94% |
| 🔴 红 — Behind | 严重落后 | < 80% |

### ActionBar 操作栏

| 控件 | 功能 |
|------|------|
| 机床选择器 | 选单台机床（Hourly Table 聚焦显示）或 All Machines |
| 日期选择器 | 查询历史日期；每次打开页面**自动重置为今天** |
| Today / Refresh | 当前为今天时显示 Refresh（刷新）；历史日期时显示 Today（回到今天） |
| 视图切换 | Hourly Table / Grid Cards / Summary |
| 班次标签 | 显示当前班次名和时间段 |

### ⚙ Settings 面板

| 设置 | 说明 |
|------|------|
| Shift Schedule | 切换班次（列表来自 `.env` 中的 `SHIFTS` 配置） |
| Refresh Interval | 自动刷新间隔：15 / 30 / 60 / 120 秒 |
| Green Threshold | 绿色阈值（默认 100%）；黄色 = Green−5% 至 Green−1% |
| Yellow Threshold | 橙色下界（默认 80%）；低于此值为红色 |
| TV Mode | 大屏模式，字号和间距放大，适合电视 / 投影 |
| Network Access | 局域网访问地址 |

---

## 日常使用

| 操作 | 方法 |
|------|------|
| **启动** | 双击 `launch.vbs`（推荐）或 `start.bat` |
| **停止** | 关闭命令窗口，或在任务管理器结束 `node.exe` |
| **重启** | 停止后重新启动 |
| **修改配置** | 编辑 `.env`，然后重启 |

---

## 机床名称配置

在 `.env` 中添加 `MACHINE_NAMES` 字段来自定义机床显示名称：

```ini
MACHINE_NAMES={"1":"CNC 车床 #1","2":"CNC 铣床 #2","3":"钻床 #3"}
```

JSON 格式：`portid` → 显示名称。编辑后重启生效。

---

## 故障排查

### 运行完整性检查

双击 **`verify.bat`** 检查安装包完整性，输出结果截图发给技术支持。

检查项目：
- Node.js 可用性
- 前端文件（`dist/`）
- 后端文件（`server/dist/`）
- 依赖包（`express`, `mysql2`）
- 配置文件（`.env`）
- 包清单（`package.json`）

### 常见问题

| 现象 | 可能原因 | 解决方案 |
|------|----------|----------|
| 启动后无数据 | MariaDB 未运行 / 连接信息错误 | 确认数据库服务，核对 `.env` |
| 显示历史日期无数据 | — | 点击 ActionBar 中的 **Today** 按钮 |
| `ECONNREFUSED` | MariaDB 未运行或 host/port 错误 | 检查数据库服务状态 |
| `Access denied` | 用户名或密码错误 | 核对 `.env` 中凭据 |
| `Unknown database` | 数据库名错误 | 确认 `DB_NAME=MDC` |
| `EADDRINUSE :::3002` | 端口被占用 | 修改 `.env` 中 `SERVER_PORT` |

---

## 局域网访问

1. 在本机命令提示符运行 `ipconfig`，找到 **IPv4 地址**（如 `192.168.1.50`）
2. 在其他设备浏览器输入：

```
http://192.168.1.50:3002
```

**如果无法访问**，添加 Windows 防火墙入站规则：

1. 打开「Windows Defender 防火墙高级安全」
2. 点击「入站规则」→「新建规则」
3. 选择「端口」→ TCP → 指定端口：`3002`
4. 允许连接 → 应用到所有配置文件
5. 名称：`CIMCO Dashboard`

---

## 开机自启

1. 打开**任务计划程序**（在开始菜单搜索）
2. 点击「创建基本任务」
3. 名称：`CIMCO Dashboard`
4. 触发器：「计算机启动时」
5. 操作：「启动程序」
   - 程序：`C:\CimcoDashboard\launch.vbs`
   - 起始位置：`C:\CimcoDashboard`
6. 完成后勾选「打开属性对话框」→ 将「只在用户登录时运行」改为「不管用户是否登录都要运行」
