# CimcoDashBoard — Claude Working Rules

## 首要规则
1. **每次会话开始，必须先读 `memory/mistakes.md`**，确保不重复之前犯过的错误。
2. 所有修改先读懂现有代码，再动手。不读不改。
3. 只改被要求的内容，不做"顺手"的重构或添加功能。

## 项目结构
```
src/                   # Vite + React + TypeScript 前端
  components/          # UI 组件
    action-bar/        # 机器选择 + 日期 + 视图切换
    hourly-table/      # 主视图：单机逐小时表格
    machine-card/      # 卡片视图
    summary-table/     # 汇总视图
    status-bar/        # 顶部状态栏
    settings-panel/    # 设置面板
  config/constants.ts  # 颜色、状态阈值、getStatus()
  types/dashboard.ts   # 所有 TypeScript 类型
  hooks/               # use-dashboard-data, use-settings, use-clock
  pages/               # dashboard-page.tsx (主页面)
server/                # Express 后端 (TypeScript → dist/)
  dashboard.ts         # GET /api/dashboard — 只读 SELECT
  db.ts                # MySQL2 连接池
install_package/       # 交付包
  cimco-dashboard-lite.zip  # 最终交付文件
```

## 开发命令
```bash
# 前端开发服务器 (port 5180)
npx vite --port 5180

# 后端开发服务器 (port 3002)
npx tsx server/index.ts

# TypeScript 检查
npx tsc --noEmit

# 前端构建
npx vite build

# 后端构建
npx tsc -p server/tsconfig.json
```

## 打包安装包规范
1. 构建前端: `npx vite build` → `dist/`
2. 构建后端: `npx tsc -p server/tsconfig.json` → `server/dist/`
3. 创建 `_build/lite/cimco-dashboard/` 目录
4. 逐文件复制（**不用 glob**），复制后逐一 `ls` 验证
5. 必须验证的文件:
   - `_build/lite/cimco-dashboard/dist/index.html`
   - `_build/lite/cimco-dashboard/server/dist/index.js`
   - `_build/lite/cimco-dashboard/node_modules/express`
6. 创建 ZIP 使用 PowerShell `ZipFile::CreateFromDirectory(src, dst, Optimal, 0)` — **第4个参数必须是 `0`(false)**，否则会多一层目录
7. 提取 ZIP 用 `Expand-Archive` 验证，不用 `unzip`（Windows路径问题）
8. 删除 `_build/`，提交 ZIP

## 状态颜色系统 (4 级)
| 状态   | 条件               | 颜色   |
|--------|--------------------|--------|
| green  | ≥ greenThreshold%  | 绿     |
| yellow | ≥ green-5%         | 黄     |
| orange | ≥ yellowThreshold% | 橙     |
| red    | < yellowThreshold% | 红     |
默认: greenThreshold=100, yellowThreshold=80

**重要**: server/dashboard.ts 和 src/config/constants.ts 的 `getStatus()` 逻辑必须保持同步。

## Docker / DB
- 容器: `cimco-mdc-testdb`, MariaDB 11
- 二进制: `mariadb`（**不是 mysql**）
- 导入: `docker exec -i cimco-mdc-testdb mariadb -uroot -pcimco123 MDC < seed.sql`
- 表: `MDC.valtb_hourly_dashboard` (starttime=unix timestamp, portid, column1=累计目标, column2=小时目标, column3=小时实际)

## PowerShell 在 bash 中的注意事项
- `$variable` 在 bash 字符串中会被展开，需要用 `\$variable`
- `&` 在单行 `-Command` 中是合法的，但多行 heredoc 中有问题
- 倾向于用单行命令，或者写 `.ps1` 文件执行

## Git 规范
- 不自动 commit，必须用户明确要求
- 不 force push
- Binary 文件 (ZIP) 用 Git LFS 或直接 commit（本项目直接 commit）
- commit message 用英文，说明 why 不是 what

## 代码规范
- 语言: TypeScript strict mode
- 样式: Tailwind + inline style（深色主题，slate 色系）
- 组件: 函数组件 + hooks，无 class 组件
- 不添加注释（除非逻辑不明显）
- 不添加多余的 error handling
