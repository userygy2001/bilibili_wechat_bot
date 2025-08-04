# PM2 使用指南

## 安装 PM2

```bash
# 全局安装 PM2
npm install -g pm2
```

## 部署前准备

```bash
# 1. 确保项目已编译
npm run build

# 2. 创建日志目录
mkdir -p logs

# 3. 检查配置文件
cat config/config.json
```

## 启动应用

```bash
# 使用配置文件启动
pm2 start ecosystem.config.js

# 或者直接启动
pm2 start dist/index.js --name bilibili-wechat-bot
```

## 管理命令

### 查看状态
```bash
# 查看所有应用状态
pm2 list

# 查看详细信息
pm2 show bilibili-wechat-bot

# 查看实时日志
pm2 logs bilibili-wechat-bot

# 查看错误日志
pm2 logs bilibili-wechat-bot --err

# 清空日志
pm2 flush bilibili-wechat-bot
```

### 控制应用
```bash
# 重启应用
pm2 restart bilibili-wechat-bot

# 停止应用
pm2 stop bilibili-wechat-bot

# 删除应用
pm2 delete bilibili-wechat-bot

# 重载应用 (0秒停机)
pm2 reload bilibili-wechat-bot
```

### 监控
```bash
# 实时监控
pm2 monit

# CPU和内存使用情况
pm2 show bilibili-wechat-bot
```

## 开机自启

```bash
# 保存当前pm2进程列表
pm2 save

# 生成开机自启脚本
pm2 startup

# 按照提示执行生成的命令（通常需要sudo权限）
```

## 更新部署

```bash
# 1. 更新代码
git pull

# 2. 安装依赖（如果有更新）
npm install

# 3. 重新编译
npm run build

# 4. 重启应用
pm2 restart bilibili-wechat-bot
```

## 配置说明

`ecosystem.config.js` 主要配置项：

- `name`: 应用名称
- `script`: 启动脚本路径
- `instances`: 实例数量
- `autorestart`: 自动重启
- `max_memory_restart`: 内存超限重启
- `log_*`: 日志文件配置
- `env`: 环境变量

## 常用组合命令

```bash
# 快速重启并查看日志
pm2 restart bilibili-wechat-bot && pm2 logs bilibili-wechat-bot --lines 50

# 停止并删除应用
pm2 stop bilibili-wechat-bot && pm2 delete bilibili-wechat-bot

# 启动并查看状态
pm2 start ecosystem.config.js && pm2 list
```