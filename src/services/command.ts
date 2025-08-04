import { StreamerStatus, CommandResponse, WeChatCallbackMessage } from '../types';
import { SubscriptionService } from './subscription';
import { BilibiliService } from './bilibili';
import { logger } from '../utils/logger';
import { loadConfig } from '../config';

export class CommandService {
  constructor(
    private subscriptionService: SubscriptionService,
    private bilibiliService: BilibiliService
  ) {}

  async processCommand(message: WeChatCallbackMessage): Promise<CommandResponse> {
    if (!message.text?.content) {
      return {
        success: false,
        message: '请输入有效的命令'
      };
    }

    const content = message.text.content.trim();
    const command = content.toLowerCase();

    logger.info(`收到用户 ${message.from.name} 的命令: ${content}`);

    try {
      switch (true) {
        case command === '状态' || command === 'status':
          return await this.getStatus();
        
        case command === '直播中' || command === 'live':
          return await this.getLiveStreamers();
        
        case command === '帮助' || command === 'help':
          return this.getHelp();
        
        case command.startsWith('查询 '):
          const streamerName = content.substring(3).trim();
          return await this.queryStreamer(streamerName);
        
        default:
          return {
            success: false,
            message: '未知命令，请输入 "帮助" 查看可用命令'
          };
      }
    } catch (error) {
      logger.error('处理命令时发生错误:', error);
      return {
        success: false,
        message: '处理命令时发生错误，请稍后重试'
      };
    }
  }

  private async getStatus(): Promise<CommandResponse> {
    const totalSubscriptions = this.subscriptionService.getTotalSubscriptions();
    const liveCount = this.subscriptionService.getLiveCount();
    const subscriptionStatus = this.subscriptionService.getSubscriptionStatus();
    
    let message = `## 📊 订阅状态

**总订阅数**: ${totalSubscriptions}
**当前直播**: ${liveCount}人

### 主播状态`;

    Object.entries(subscriptionStatus).forEach(([name, isLive]) => {
      const status = isLive ? '🔴 直播中' : '⚫ 未直播';
      message += `\n- ${name}: ${status}`;
    });

    return {
      success: true,
      message,
      data: { totalSubscriptions, liveCount, subscriptionStatus }
    };
  }

  private async getLiveStreamers(): Promise<CommandResponse> {
    const config = loadConfig();
    const currentStatuses = await this.bilibiliService.batchGetStreamersStatus(config.streamers);
    const liveStreamers = currentStatuses.filter(s => s.isLive);

    if (liveStreamers.length === 0) {
      return {
        success: true,
        message: '🌙 当前没有主播在直播'
      };
    }

    let message = `## 🔴 当前直播中 (${liveStreamers.length}人)

`;

    liveStreamers.forEach(streamer => {
      message += `### ${streamer.name}
**标题**: ${streamer.title || '无标题'}
**分区**: ${streamer.area || '未知'}
**直播间**: [点击观看](${streamer.roomUrl})
**开播时间**: ${streamer.startTime?.toLocaleString('zh-CN')}

`;
    });

    return {
      success: true,
      message,
      data: liveStreamers
    };
  }

  private async queryStreamer(name: string): Promise<CommandResponse> {
    const config = loadConfig();
    const streamer = config.streamers.find(s => s.name.includes(name) || name.includes(s.name));
    
    if (!streamer) {
      return {
        success: false,
        message: `未找到主播 "${name}"，请检查名称是否正确`
      };
    }

    try {
      const status = await this.bilibiliService.getStreamerStatus(streamer);
      
      let message = `## 👤 ${status.name}

**状态**: ${status.isLive ? '🔴 直播中' : '⚫ 未直播'}`;

      if (status.isLive) {
        message += `
**标题**: ${status.title || '无标题'}
**分区**: ${status.area || '未知'}
**直播间**: [点击观看](${status.roomUrl})
**开播时间**: ${status.startTime?.toLocaleString('zh-CN')}`;
      }

      return {
        success: true,
        message,
        data: status
      };
    } catch (error) {
      logger.error(`查询主播 ${name} 状态失败:`, error);
      return {
        success: false,
        message: `查询主播 "${name}" 状态失败，请稍后重试`
      };
    }
  }

  private getHelp(): CommandResponse {
    const message = `## 🤖 可用命令

**查询命令**:
- \`状态\` 或 \`status\` - 查看所有订阅主播状态
- \`直播中\` 或 \`live\` - 查看当前正在直播的主播
- \`查询 主播名\` - 查询指定主播的详细状态

**其他命令**:
- \`帮助\` 或 \`help\` - 显示此帮助信息

**使用示例**:
- 输入 \`状态\` 查看总体情况
- 输入 \`直播中\` 查看正在直播的主播
- 输入 \`查询 某某主播\` 查看具体主播状态`;

    return {
      success: true,
      message
    };
  }
}