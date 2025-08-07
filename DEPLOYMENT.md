# CRM 系统部署文档

## 📋 目录

- [系统概述](#系统概述)
- [环境要求](#环境要求)
- [部署方式](#部署方式)
- [配置说明](#配置说明)
- [部署步骤](#部署步骤)
- [监控与维护](#监控与维护)
- [故障排除](#故障排除)

## 🏗️ 系统概述

CRM 客户关系管理系统是一个专为房产中介业务设计的 Web 应用，提供客户管理、预约带看、数据统计等功能。

### 技术架构

- **前端**: Next.js 14 + React 18 + TypeScript + Ant Design 5
- **后端**: Next.js API Routes + Node.js
- **数据库**: MySQL 8.0+
- **日志**: Pino + 文件轮转
- **部署**: PM2 进程管理

## 🔧 环境要求

### 最低配置

- **CPU**: 2 核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **网络**: 稳定的互联网连接

### 软件要求

- **操作系统**: Linux (Ubuntu 20.04+ / CentOS 7+) 或 macOS 10.15+
- **Node.js**: 18.0.0 或更高版本
- **MySQL**: 8.0 或更高版本
- **Nginx**: 1.18+ (生产环境推荐)

### 推荐配置

- **CPU**: 4 核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **带宽**: 100Mbps+

## 🚀 部署方式

### 1. 本地开发部署

适用于开发测试环境。

### 2. 生产环境部署

支持以下部署方式：

- **传统服务器部署**
- **Docker 容器化部署**
- **云平台部署** (阿里云、腾讯云等)

## ⚙️ 配置说明

### 环境变量配置

创建 `.env.local` 文件：

```bash
# 数据库配置
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name

# 应用配置
NODE_ENV=production
LOG_LEVEL=info
PORT=3000

# 安全配置
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

### 数据库配置

#### 阿里云 RDS 配置示例

```bash
# 数据库配置 - 阿里云RDS
DB_HOST=rm-xxxxxxxxxxxxx.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD="your_password"
DB_NAME=your_database_name
```

#### 本地 MySQL 配置示例

```bash
# 数据库配置 - 本地MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=crm_system
```

## 📦 部署步骤

### 方式一：传统服务器部署

#### 1. 服务器环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# 安装Nginx
sudo apt install nginx -y

# 安装PM2
sudo npm install -g pm2
```

#### 2. 项目部署

```bash
# 克隆项目
git clone <your-repo-url>
cd agent-crm

# 安装依赖
npm install

# 构建项目
npm run build

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，填入正确的配置信息

# 初始化数据库
npm run db:setup

# 使用PM2启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. Nginx 配置

创建 Nginx 配置文件 `/etc/nginx/sites-available/crm-system`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/crm-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 方式二：Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USER=crm_user
      - DB_PASSWORD=crm_password
      - DB_NAME=crm_system
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=crm_system
      - MYSQL_USER=crm_user
      - MYSQL_PASSWORD=crm_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./scripts/setup-database.js:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    restart: unless-stopped

volumes:
  mysql_data:
```

#### 3. 启动 Docker 服务

```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

### 方式三：云平台部署

#### 阿里云 ECS 部署

1. **创建 ECS 实例**

   - 选择 Ubuntu 20.04 LTS
   - 配置：4 核 8GB
   - 带宽：5Mbps

2. **连接实例并部署**

   ```bash
   # 通过SSH连接实例
   ssh root@your-server-ip

   # 按照传统服务器部署步骤执行
   ```

#### 腾讯云 CVM 部署

1. **创建 CVM 实例**

   - 选择 CentOS 7.6
   - 配置：4 核 8GB
   - 带宽：5Mbps

2. **部署步骤同阿里云 ECS**

## 📊 监控与维护

### 日志管理

#### 查看应用日志

```bash
# 查看PM2日志
pm2 logs crm-system

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看应用日志文件
tail -f logs/app-$(date +%Y-%m-%d).log
```

#### 日志轮转配置

创建 logrotate 配置 `/etc/logrotate.d/crm-system`：

```
/var/log/crm-system/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 性能监控

#### PM2 监控

```bash
# 查看进程状态
pm2 status

# 监控资源使用
pm2 monit

# 查看详细信息
pm2 show crm-system
```

#### 系统监控

```bash
# 查看系统资源
htop
df -h
free -h

# 查看网络连接
netstat -tulpn | grep :3000
```

### 备份策略

#### 数据库备份

```bash
# 创建备份脚本
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
DB_NAME="crm_system"

mkdir -p $BACKUP_DIR
mysqldump -u root -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/crm_$DATE.sql
gzip $BACKUP_DIR/crm_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "crm_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup-db.sh

# 添加到crontab
echo "0 2 * * * /opt/backup-db.sh" | crontab -
```

#### 应用备份

```bash
# 备份应用代码
tar -czf /opt/backups/crm-app-$(date +%Y%m%d).tar.gz /opt/crm-system/

# 备份配置文件
cp /opt/crm-system/.env.local /opt/backups/env-$(date +%Y%m%d).backup
```

## 🔧 故障排除

### 常见问题

#### 1. 应用无法启动

**症状**: PM2 显示应用状态为 error

**排查步骤**:

```bash
# 查看详细错误信息
pm2 logs crm-system --lines 50

# 检查环境变量
pm2 env crm-system

# 手动启动测试
cd /opt/crm-system
npm start
```

**常见原因**:

- 环境变量配置错误
- 数据库连接失败
- 端口被占用

#### 2. 数据库连接失败

**症状**: 应用启动时出现数据库连接错误

**排查步骤**:

```bash
# 测试数据库连接
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -D $DB_NAME -e "SELECT 1"

# 检查数据库服务状态
sudo systemctl status mysql

# 检查防火墙设置
sudo ufw status
```

#### 3. 性能问题

**症状**: 页面加载缓慢，响应时间长

**排查步骤**:

```bash
# 查看CPU和内存使用
top
pm2 monit

# 查看数据库连接数
mysql -u root -p -e "SHOW PROCESSLIST;"

# 检查日志文件大小
du -sh logs/*
```

### 性能优化建议

#### 1. 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_viewing_records_customer_id ON viewing_records(customer_id);
CREATE INDEX idx_appointments_status ON appointments(status);

-- 优化查询
EXPLAIN SELECT * FROM customers WHERE status = 'active';
```

#### 2. 应用优化

```javascript
// 启用数据库连接池
const pool = mysql.createPool({
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
});

// 启用缓存
const cache = new Map();
```

#### 3. Nginx 优化

```nginx
# 启用gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# 设置缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 📞 技术支持

### 联系信息

- **技术支持邮箱**: support@yourcompany.com
- **紧急联系电话**: +86-xxx-xxxx-xxxx
- **在线文档**: https://docs.yourcompany.com/crm

### 问题报告

报告问题时请提供以下信息：

1. **错误描述**: 详细描述遇到的问题
2. **复现步骤**: 如何重现问题
3. **环境信息**:
   - 操作系统版本
   - Node.js 版本
   - 数据库版本
   - 应用版本
4. **错误日志**: 相关的错误日志信息
5. **截图**: 问题相关的截图

### 维护计划

- **每日**: 检查应用状态和日志
- **每周**: 数据库备份和性能检查
- **每月**: 系统更新和安全补丁
- **每季度**: 完整系统维护和优化

---

**文档版本**: v1.0  
**最后更新**: 2024 年 8 月  
**维护团队**: 技术开发部
