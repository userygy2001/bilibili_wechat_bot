import express from 'express';
import { WeChatService } from './wechat';
import { WeChatCallbackMessage } from '../types';
import { logger } from '../utils/logger';

export class CallbackServer {
  private app: express.Application;
  private server?: any;

  constructor(
    private port: number,
    private wechatService: WeChatService
  ) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // 日志中间件
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`, { body: req.body });
      next();
    });
  }

  private setupRoutes(): void {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // 企业微信回调接口
    this.app.post('/wechat/callback', async (req, res) => {
      try {
        const callbackMessage: WeChatCallbackMessage = req.body;
        
        // 验证消息格式
        if (!this.isValidCallbackMessage(callbackMessage)) {
          logger.warn('收到无效的回调消息', callbackMessage);
          return res.status(400).json({ error: '无效的消息格式' });
        }

        // 处理消息
        await this.wechatService.handleCallback(callbackMessage);
        
        res.json({ success: true });
      } catch (error) {
        logger.error('处理企业微信回调失败:', error);
        res.status(500).json({ error: '内部服务器错误' });
      }
    });

    // 快速回复接口（可以手动触发介绍消息）
    this.app.post('/wechat/intro', async (req, res) => {
      try {
        await this.wechatService.sendQuickReply();
        res.json({ success: true, message: '介绍消息已发送' });
      } catch (error) {
        logger.error('发送介绍消息失败:', error);
        res.status(500).json({ error: '发送失败' });
      }
    });

    // 404处理
    this.app.use((req, res) => {
      res.status(404).json({ error: '接口不存在' });
    });

    // 错误处理
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Express错误:', error);
      res.status(500).json({ error: '内部服务器错误' });
    });
  }

  private isValidCallbackMessage(message: any): message is WeChatCallbackMessage {
    return (
      message &&
      typeof message.msgtype === 'string' &&
      typeof message.msgid === 'string' &&
      message.from &&
      typeof message.from.userid === 'string' &&
      typeof message.from.name === 'string' &&
      typeof message.createtime === 'number' &&
      typeof message.agentid === 'number'
    );
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        logger.info(`回调服务器启动成功，监听端口 ${this.port}`);
        logger.info(`健康检查: http://localhost:${this.port}/health`);
        logger.info(`企业微信回调地址: http://localhost:${this.port}/wechat/callback`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('回调服务器已停止');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}