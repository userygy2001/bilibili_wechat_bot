import axios from 'axios';
import { WeChatMessage, StreamerStatus } from '../types';
import { logger } from '../utils/logger';

export class WeChatService {
  constructor(private webhookUrl: string) {}

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
    let content = `## 🔴 直播开始通知

**主播**: ${streamer.name}`;

    if (streamer.title) {
      content += `\n**标题**: ${streamer.title}`;
    }

    if (streamer.area) {
      content += `\n**分区**: ${streamer.area}`;
    }

    content += `\n**直播间**: [点击观看](${streamer.roomUrl})
**开播时间**: ${streamer.startTime?.toLocaleString('zh-CN')}`;

    if (streamer.cover) {
      content += `\n\n![直播封面](${streamer.cover})`;
    }

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
}