# 故障排除指南

## 常见问题及解决方案

### 1. 连接错误 (ERR_CONNECTION_REFUSED)

**问题描述**: 浏览器控制台显示 `Failed to load resource: net::ERR_CONNECTION_REFUSED`

**解决方案**:

1. **检查开发服务器是否运行**

   ```bash
   # 方法1: 使用快速启动脚本
   npm run quick-start

   # 方法2: 手动启动
   npm run dev
   ```

2. **检查端口占用**

   ```bash
   # 检查端口 3000 是否被占用
   lsof -i :3000

   # 如果被占用，停止进程
   pkill -f "next dev"
   ```

3. **重启开发服务器**
   ```bash
   # 停止当前服务器 (Ctrl+C)
   # 然后重新启动
   npm run dev
   ```

### 2. API 请求失败

**问题描述**: 页面显示 "加载客户数据失败" 或 "加载统计数据失败"

**解决方案**:

1. **检查 API 路由是否正常**

   ```bash
   # 测试统计 API
   curl http://localhost:3000/api/customers/stats

   # 测试客户列表 API
   curl "http://localhost:3000/api/customers?page=1&pageSize=6"
   ```

2. **检查数据库连接**

   ```bash
   # 查看数据库连接状态
   npm run db:setup
   ```

3. **查看错误日志**

   ```bash
   # 查看所有日志
   npm run logs

   # 查看错误日志
   npm run logs:error
   ```

### 3. 页面加载缓慢

**问题描述**: 页面加载时间超过 1 秒

**解决方案**:

1. **运行性能测试**

   ```bash
   npm run perf-test
   ```

2. **检查网络连接**

   - 确保网络连接稳定
   - 检查是否有代理设置影响

3. **清除浏览器缓存**
   - 按 F12 打开开发者工具
   - 右键刷新按钮，选择"清空缓存并硬性重新加载"

### 4. 组件加载失败

**问题描述**: 页面显示 "组件加载中..." 但一直不完成

**解决方案**:

1. **检查组件文件是否存在**

   ```bash
   # 检查组件文件
   ls -la src/components/customers/
   ```

2. **重新构建项目**

   ```bash
   npm run build
   npm run dev
   ```

3. **清除 Next.js 缓存**
   ```bash
   # 删除 .next 目录
   rm -rf .next
   npm run dev
   ```

### 5. 数据库连接问题

**问题描述**: 数据库查询失败或连接超时

**解决方案**:

1. **检查 MySQL 服务**

   ```bash
   # macOS
   brew services list | grep mysql

   # 启动 MySQL
   brew services start mysql
   ```

2. **检查数据库配置**

   ```bash
   # 检查环境变量
   cat .env.local
   ```

3. **重置数据库**
   ```bash
   npm run db:reset
   npm run db:setup
   ```

## 开发环境设置

### 快速启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd agent-crm

# 2. 安装依赖
npm install

# 3. 设置数据库
npm run db:setup

# 4. 启动开发服务器
npm run quick-start
```

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- MySQL >= 8.0
- 内存 >= 4GB

### 推荐开发工具

- VS Code
- Chrome DevTools
- MySQL Workbench

## 性能优化检查清单

- [ ] 开发服务器正常运行
- [ ] API 路由响应正常
- [ ] 数据库连接稳定
- [ ] 组件懒加载工作正常
- [ ] 缓存机制生效
- [ ] 代码分割正确

## 联系支持

如果以上解决方案都无法解决问题，请：

1. 查看详细错误日志
2. 提供错误截图
3. 描述复现步骤
4. 提供系统环境信息

## 常用命令速查

```bash
# 启动开发服务器
npm run dev
npm run quick-start

# 构建生产版本
npm run build
npm start

# 运行测试
npm test
npm run test:watch

# 查看日志
npm run logs
npm run logs:error

# 性能测试
npm run perf-test

# 数据库操作
npm run db:setup
npm run db:reset
```
