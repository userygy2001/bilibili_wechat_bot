import * as cron from 'node-cron';
import { BilibiliService } from './services/bilibili';
import { WeChatService } from './services/wechat';
import { SubscriptionService } from './services/subscription';
import { loadConfig, validateConfig } from './config';
import { logger } from './utils/logger';
import { mkdirSync, existsSync } from 'fs';

class BilibiliWeChatBot {
  private bilibiliService: BilibiliService;
  private wechatService: WeChatService;
  private subscriptionService: SubscriptionService;
  private task?: cron.ScheduledTask;

  constructor() {
    if (!existsSync('logs')) {
      mkdirSync('logs');
    }

    const config = loadConfig();
    validateConfig(config);

    this.bilibiliService = new BilibiliService();
    this.wechatService = new WeChatService(config.webhook.url);
    this.subscriptionService = new SubscriptionService(config.streamers);

    logger.info(`机器人启动成功，监控 ${config.streamers.length} 个主播`);
    logger.info(`检查间隔: ${config.checkInterval}`);

    this.task = cron.schedule(config.checkInterval, () => {
      this.checkStreamers().catch(error => {
        logger.error('检查主播状态时发生错误:', error);
      });
    });
  }

  private async checkStreamers(): Promise<void> {
    try {
      logger.debug('开始检查主播状态...');
      
      const config = loadConfig();
      const currentStatuses = await this.bilibiliService.batchGetStreamersStatus(config.streamers);
      
      const { newlyLive, newlyOffline } = this.subscriptionService.checkStatusChanges(currentStatuses);

      for (const streamer of newlyLive) {
        await this.wechatService.sendStreamStartNotification(streamer);
      }

      for (const streamer of newlyOffline) {
        await this.wechatService.sendStreamEndNotification(streamer);
      }

      const liveCount = this.subscriptionService.getLiveCount();
      logger.info(`状态检查完成 - 当前直播: ${liveCount}人, 新开播: ${newlyLive.length}人, 新下播: ${newlyOffline.length}人`);

    } catch (error) {
      logger.error('检查主播状态失败:', error);
    }
  }

  public async start(): Promise<void> {
    logger.info('机器人已启动，开始监控...');
    
    await this.checkStreamers();
  }

  public stop(): void {
    if (this.task) {
      this.task.stop();
      logger.info('机器人已停止');
    }
  }
}

const bot = new BilibiliWeChatBot();

process.on('SIGINT', () => {
  logger.info('收到停止信号，正在关闭...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('收到终止信号，正在关闭...');
  bot.stop();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  bot.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
});

bot.start().catch(error => {
  logger.error('启动机器人失败:', error);
  process.exit(1);
});