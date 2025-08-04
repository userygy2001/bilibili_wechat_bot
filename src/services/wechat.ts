import axios from 'axios';
import { WeChatMessage, StreamerStatus, WeChatCallbackMessage, CommandResponse } from '../types';
import { logger } from '../utils/logger';
import { CommandService } from './command';

export class WeChatService {
  private commandService?: CommandService;

  constructor(private webhookUrl: string) {}

  setCommandService(commandService: CommandService): void {
    this.commandService = commandService;
  }

  async sendMessage(message: WeChatMessage): Promise<void> {
    try {
      const response = await axios.post(this.webhookUrl, message, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`企业微信API错误: ${response.data.errmsg}`);
      }

      logger.info('消息发送成功');
    } catch (error) {
      logger.error('发送企业微信消息失败:', error);
      throw error;
    }
  }

  async sendStreamStartNotification(streamer: StreamerStatus): Promise<void> {
    let content = `## 🔴 直播开始通知`;

    // 直播封面放在最前面
    if (streamer.cover) {
      content += `\n\n![直播封面](${streamer.cover})`;
    }

    content += `\n\n**主播**: ${streamer.name}`;

    if (streamer.title) {
      content += `\n**标题**: ${streamer.title}`;
    }

    if (streamer.area) {
      content += `\n**分区**: ${streamer.area}`;
    }

    content += `\n**直播间**: [点击观看](${streamer.roomUrl})
**开播时间**: ${streamer.startTime?.toLocaleString('zh-CN')}`;

    content += `\n\n快来围观吧！ 🎉`;

    const message: WeChatMessage = {
      msgtype: 'markdown',
      markdown: {
        content
      }
    };

    await this.sendMessage(message);
  }

  async sendStreamEndNotification(streamer: StreamerStatus): Promise<void> {
    const message: WeChatMessage = {
      msgtype: 'text',
      text: {
        content: `📴 ${streamer.name} 已结束直播`
      }
    };

    await this.sendMessage(message);
  }

  async sendBatchNotification(streamers: StreamerStatus[]): Promise<void> {
    const liveStreamers = streamers.filter(s => s.isLive);
    
    if (liveStreamers.length === 0) {
      return;
    }

    const content = liveStreamers.map(streamer => 
      `**${streamer.name}**: [${streamer.title || '直播中'}](${streamer.roomUrl})`
    ).join('\n');

    const message: WeChatMessage = {
      msgtype: 'markdown',
      markdown: {
        content: `## 📺 当前直播中 (${liveStreamers.length}人)

${content}

快来围观吧！ 🎉`
      }
    };

    await this.sendMessage(message);
  }

  async handleCallback(callbackMessage: WeChatCallbackMessage): Promise<void> {
    if (!this.commandService) {
      logger.warn('命令服务未初始化，无法处理回调消息');
      return;
    }

    if (callbackMessage.msgtype !== 'text') {
      logger.debug('忽略非文本消息');
      return;
    }

    try {
      const response = await this.commandService.processCommand(callbackMessage);
      await this.sendCommandResponse(response);
    } catch (error) {
      logger.error('处理回调消息失败:', error);
      await this.sendMessage({
        msgtype: 'text',
        text: {
          content: '处理消息时发生错误，请稍后重试'
        }
      });
    }
  }

  private async sendCommandResponse(response: CommandResponse): Promise<void> {
    if (response.success) {
      await this.sendMessage({
        msgtype: 'markdown',
        markdown: {
          content: response.message
        }
      });
    } else {
      await this.sendMessage({
        msgtype: 'text',
        text: {
          content: response.message
        }
      });
    }
  }

  async sendQuickReply(): Promise<void> {
    const message: WeChatMessage = {
      msgtype: 'markdown',
      markdown: {
        content: `## 🤖 B站直播监控机器人

我可以帮您查询订阅主播的直播状态！

**快速命令**:
- 输入 \`状态\` 查看所有主播状态
- 输入 \`直播中\` 查看正在直播的主播  
- 输入 \`帮助\` 查看完整命令列表

现在就试试吧！ 😊`
      }
    };

    await this.sendMessage(message);
  }
}