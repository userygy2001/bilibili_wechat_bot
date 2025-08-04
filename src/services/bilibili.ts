import axios from 'axios';
import { BilibiliApiResponse, StreamerInfo, StreamerStatus } from '../types';
import { logger } from '../utils/logger';

export class BilibiliService {
  private readonly API_BASE = 'https://api.live.bilibili.com/room/v1/Room/get_info';
  
  async getStreamerStatus(streamer: StreamerInfo): Promise<StreamerStatus> {
    try {
      const response = await axios.get<BilibiliApiResponse>(this.API_BASE, {
        params: { room_id: streamer.roomId },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.data.code !== 0) {
        throw new Error(`B站API错误: ${response.data.message}`);
      }

      const { live_status, title, room_id, area_name, parent_area_name, user_cover } = response.data.data;
      const isLive = live_status === 1;

      const areaDisplay = parent_area_name && area_name 
        ? `${parent_area_name} - ${area_name}`
        : area_name || parent_area_name;

      return {
        uid: streamer.uid,
        name: streamer.name,
        isLive,
        title: isLive ? title : undefined,
        startTime: isLive ? new Date() : undefined,
        roomUrl: `https://live.bilibili.com/${room_id}`,
        area: isLive ? areaDisplay : undefined,
        cover: isLive ? user_cover : undefined
      };
    } catch (error) {
      logger.error(`获取主播 ${streamer.name} 状态失败:`, error);
      throw error;
    }
  }

  async batchGetStreamersStatus(streamers: StreamerInfo[]): Promise<StreamerStatus[]> {
    const promises = streamers.map(streamer => 
      this.getStreamerStatus(streamer).catch(error => {
        logger.error(`获取主播 ${streamer.name} 状态失败:`, error);
        return {
          uid: streamer.uid,
          name: streamer.name,
          isLive: false
        };
      })
    );

    return Promise.all(promises);
  }
}