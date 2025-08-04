# 哔哩哔哩企业微信机器人

一个用于监控哔哩哔哩主播开播状态并通过企业微信机器人发送通知的 Node.js 程序。

## 功能特性

- 🔴 监控多个B站主播的开播/下播状态
- 📱 通过企业微信机器人发送实时通知
- ⏰ 可配置的检查间隔
- 📝 完整的日志记录
- 🛡️ 错误处理和重试机制
- 🔧 灵活的配置管理

## 项目结构

```
bilibili-wechat-bot/
├── src/
│   ├── config/           # 配置管理
│   ├── services/         # 核心服务
│   │   ├── bilibili.ts   # B站API服务
│   │   ├── wechat.ts     # 企业微信服务
│   │   └── subscription.ts # 订阅管理
│   ├── types/            # TypeScript类型定义
│   ├── utils/            # 工具函数
│   └── index.ts          # 程序入口
├── config/
│   └── config.json       # 配置文件
├── logs/                 # 日志目录
└── package.json
```

## 安装依赖

```bash
npm install
```

## 配置说明

### 1. 企业微信机器人配置

在企业微信群中添加机器人，获取 Webhook URL。

### 2. 修改配置文件

编辑 `config/config.json`：

```json
{
  "webhook": {
    "url": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_WEBHOOK_KEY"
  },
  "streamers": [
    {
      "uid": 110631,
      "name": "老番茄",
      "roomId": 110
    }
  ],
  "checkInterval": "*/2 * * * *",
  "logLevel": "info"
}
```

#### 配置参数说明：

- `webhook.url`: 企业微信机器人的 Webhook URL
- `streamers`: 要监控的主播列表
  - `uid`: 主播的用户ID
  - `name`: 主播名称（用于显示）
  - `roomId`: 直播间ID
- `checkInterval`: 检查间隔（Cron 表达式）
  - `*/2 * * * *`: 每2分钟检查一次
  - `*/30 * * * * *`: 每30秒检查一次
- `logLevel`: 日志级别（debug, info, warn, error）

### 3. 获取主播信息

访问主播的直播间页面，URL 格式：`https://live.bilibili.com/{roomId}`

## 运行程序

### 开发模式
```bash
npm run dev
```

### 生产模式
```bash
npm run build
npm start
```

## 消息格式

### 开播通知
```
## 🔴 直播开始通知

**主播**: 老番茄
**直播间**: [游戏直播](https://live.bilibili.com/110)
**开播时间**: 2024-01-01 20:00:00

快来围观吧！ 🎉
```

### 下播通知
```
📴 老番茄 已结束直播
```

## 日志管理

程序会在 `logs/` 目录下生成日志文件：
- `combined.log`: 所有日志
- `error.log`: 错误日志

日志文件会自动轮转，最大5MB，保留5个历史文件。

## 常见问题

### 1. 如何获取主播的 roomId？
访问主播的直播间，地址栏中的数字就是 roomId。

### 2. 程序运行后没有收到通知？
- 检查企业微信 Webhook URL 是否正确
- 检查主播配置信息是否正确
- 查看日志文件了解详细错误信息

### 3. 如何调整检查频率？
修改 `config.json` 中的 `checkInterval` 参数，使用 Cron 表达式。

## API说明

### B站直播API
使用 B站公开的直播间信息API：
```
https://api.live.bilibili.com/room/v1/Room/get_info?room_id={roomId}
```

### 企业微信机器人API
支持文本和 Markdown 格式消息。

## 注意事项

- 请合理设置检查间隔，避免频繁请求API
- 建议使用 PM2 等进程管理工具在生产环境中运行
- 定期检查日志文件，及时处理错误

## 许可证

MIT License