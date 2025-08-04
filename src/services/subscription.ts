import { StreamerStatus, StreamerInfo } from '../types';
import { logger } from '../utils/logger';

export class SubscriptionService {
  private liveStatus: Map<number, boolean> = new Map();

  constructor(private streamers: StreamerInfo[]) {
    streamers.forEach(streamer => {
      this.liveStatus.set(streamer.uid, false);
    });
  }

  checkStatusChanges(currentStatuses: StreamerStatus[]): {
    newlyLive: StreamerStatus[];
    newlyOffline: StreamerStatus[];
  } {
    const newlyLive: StreamerStatus[] = [];
    const newlyOffline: StreamerStatus[] = [];

    currentStatuses.forEach(status => {
      const previousStatus = this.liveStatus.get(status.uid);
      
      if (previousStatus !== undefined) {
        if (!previousStatus && status.isLive) {
          newlyLive.push(status);
          logger.info(`主播 ${status.name} 开始直播`);
        } else if (previousStatus && !status.isLive) {
          newlyOffline.push(status);
          logger.info(`主播 ${status.name} 结束直播`);
        }
      }

      this.liveStatus.set(status.uid, status.isLive);
    });

    return { newlyLive, newlyOffline };
  }

  getCurrentLiveStreamers(): StreamerInfo[] {
    return this.streamers.filter(streamer => 
      this.liveStatus.get(streamer.uid) === true
    );
  }

  getTotalSubscriptions(): number {
    return this.streamers.length;
  }

  getLiveCount(): number {
    return Array.from(this.liveStatus.values()).filter(status => status).length;
  }

  getSubscriptionStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    this.streamers.forEach(streamer => {
      status[streamer.name] = this.liveStatus.get(streamer.uid) || false;
    });
    return status;
  }

  addStreamer(streamer: StreamerInfo): void {
    if (!this.streamers.find(s => s.uid === streamer.uid)) {
      this.streamers.push(streamer);
      this.liveStatus.set(streamer.uid, false);
      logger.info(`添加主播订阅: ${streamer.name}`);
    }
  }

  removeStreamer(uid: number): boolean {
    const index = this.streamers.findIndex(s => s.uid === uid);
    if (index !== -1) {
      const removed = this.streamers.splice(index, 1)[0];
      this.liveStatus.delete(uid);
      logger.info(`移除主播订阅: ${removed.name}`);
      return true;
    }
    return false;
  }
}