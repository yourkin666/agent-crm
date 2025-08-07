# MySQL 数据库设置指南

本项目已完全切换到 MySQL 数据库。请按照以下步骤配置和初始化数据库。

## 准备工作

### 1. 安装 MySQL

**Windows:**

- 下载并安装 [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
- 或使用包管理器：`choco install mysql`

**macOS:**

```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2. 创建数据库和用户

连接到 MySQL 并创建项目所需的数据库：

```sql
-- 连接到MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选，也可以使用root用户）
CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON crm_system.* TO 'crm_user'@'localhost';
FLUSH PRIVILEGES;

-- 退出MySQL
EXIT;
```

## 项目配置

### 1. 配置环境变量

复制环境变量模板文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置您的数据库连接信息：

```env
# MySQL数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=crm_user        # 您的MySQL用户名
DB_PASSWORD=your_password   # 您的MySQL密码
DB_NAME=crm_system
```

### 2. 安装项目依赖

```bash
npm install
```

### 3. 初始化数据库

运行数据库初始化脚本：

```bash
npm run db:setup
```

此脚本会：

- 创建所有必要的数据表
- 插入示例数据
- 设置索引和约束

## 验证安装

### 1. 检查数据库表

连接到 MySQL 并验证表是否创建成功：

```sql
mysql -u crm_user -p crm_system

-- 查看创建的表
SHOW TABLES;

-- 查看客户表结构
DESCRIBE qft_ai_customers;

-- 查看示例数据
SELECT COUNT(*) FROM qft_ai_customers;
SELECT COUNT(*) FROM qft_ai_viewing_records;
```

### 2. 启动应用

```bash
npm run dev
```

访问 http://localhost:3000 查看应用是否正常运行。

## 数据库管理

### 备份数据库

```bash
mysqldump -u crm_user -p crm_system > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 恢复数据库

```bash
mysql -u crm_user -p crm_system < backup_file.sql
```

### 重置数据库

如果需要重置数据库，请手动清空表后重新初始化：

```sql
-- 连接到数据库
mysql -u crm_user -p crm_system

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 清空表
TRUNCATE TABLE qft_ai_viewing_records;
TRUNCATE TABLE qft_ai_customers;

-- 启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 退出MySQL
EXIT;
```

然后运行：

```bash
npm run db:setup
```

## 故障排除

### 常见问题

1. **连接失败**

   - 检查 MySQL 服务是否运行：`brew services list | grep mysql` (macOS)
   - 检查端口是否正确（默认 3306）
   - 验证用户名和密码

2. **权限错误**

   - 确保用户有足够的数据库权限
   - 重新授权：`GRANT ALL PRIVILEGES ON crm_system.* TO 'crm_user'@'localhost';`

3. **字符编码问题**

   - 确保数据库使用 utf8mb4 字符集
   - 检查 MySQL 配置文件中的字符集设置

4. **环境变量未加载**
   - 确保 `.env.local` 文件存在且格式正确
   - 重启开发服务器

### 性能优化

对于生产环境，建议：

1. **调整 MySQL 配置**：

   ```ini
   # /etc/mysql/mysql.conf.d/mysqld.cnf
   [mysqld]
   innodb_buffer_pool_size = 1G
   max_connections = 200
   query_cache_type = 1
   query_cache_size = 64M
   ```

2. **定期维护**：

   ```sql
   -- 优化表
   OPTIMIZE TABLE qft_ai_customers, qft_ai_viewing_records;

   -- 分析表
   ANALYZE TABLE qft_ai_customers, qft_ai_viewing_records;
   ```

## 注意事项

- 本项目已完全移除 SQLite 依赖，仅支持 MySQL
- 所有数据表名以 `qft_ai_` 前缀开头
- 建议定期备份生产环境数据
- 开发和生产环境使用不同的数据库实例
