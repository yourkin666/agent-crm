# Agent CRM 房产中介客户管理

面向房产中介的轻量级 CRM：管理客户、记录带看、查询小区地址并做基础统计。

## 功能

- **客户管理**：客户档案（姓名、联系方式、需求偏好）、状态流转、详情编辑、智能筛选
- **带看记录**：新增/编辑、状态与反馈、佣金记录、客户维度统计
- **数据统计**：关键指标总览（客户数、带看数、成交数/佣金等）
- **小区查询**：联想搜索小区地址，外部接口聚合检索
- **日志与监控**：统一 API 日志；数据库健康检查

## 技术栈

- **前端**：Next.js 14（App Router）· React 18 · TypeScript · Ant Design 5 · Tailwind CSS
- **后端**：Next.js API Routes · MySQL（mysql2）
- **日志**：Pino（开发态彩色输出）

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 配置环境变量（创建 `.env.local`）

```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=你的用户名
DB_PASSWORD=你的密码
DB_NAME=你的数据库名
# 可选：LOG_LEVEL=debug|info|warn|error（默认开发态为 debug）
```

3. 初始化数据库（建表并插入示例数据）

```bash
npm run db:setup
```

4. 启动开发服务

```bash
npm run dev
# 访问 http://localhost:3000
```

## 常用命令

- `npm run dev`：启动开发环境
- `npm run build`：构建生产包
- `npm start`：启动生产服务
- `npm run lint`：代码检查
- `npm run db:setup`：初始化数据库（按 `src/lib/database/schema_qft_ai.sql`）并插入示例数据
- `npm run logs` / `logs:list` / `logs:tail` / `logs:error`：查看日志

## 目录概览

```
agent-crm/
├─ src/
│  ├─ app/
│  │  ├─ api/                # 服务端接口（客户、带看记录、外部查询、日志等）
│  │  ├─ customers/          # 客户管理页面
│  │  └─ viewing-records/    # 带看记录页面
│  ├─ components/            # 组件（含小区联想输入等）
│  ├─ lib/                   # 数据库与日志
│  └─ utils/                 # 工具与常量
├─ scripts/                  # 脚本（数据库初始化等）
├─ docs/                     # 详细接口与使用说明
└─ logs/                     # 运行日志
```

## 文档

- 外部 Agent 接口与查询：`docs/外部Agent接口文档.md`、`docs/外部Agent查询接口文档.md`、`docs/外部查询接口快速参考.md`
- 带看记录录入 API：`docs/带看记录录入接口API文档.md`
- 日志与错误处理：`docs/logging-guide.md`、`docs/api-error-handling.md`
- 数据表一览：`docs/数据表.md`
- 部署：`docs/DEPLOYMENT.md`

## 许可证

MIT License
