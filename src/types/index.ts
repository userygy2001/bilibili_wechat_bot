export interface StreamerInfo {
  uid: number;
  name: string;
  roomId: number;
}

export interface StreamerStatus {
  uid: number;
  name: string;
  isLive: boolean;
  title?: string;
  startTime?: Date;
  roomUrl?: string;
  area?: string;
  cover?: string;
}

export interface BilibiliApiResponse {
  code: number;
  message: string;
  data: {
    live_status: number;
    title: string;
    room_id: number;
    area_name?: string;
    parent_area_name?: string;
    user_cover?: string;
  };
}

export interface WeChatMessage {
  msgtype: 'text' | 'markdown';
  text?: {
    content: string;
    mentioned_list?: string[];
  };
  markdown?: {
    content: string;
  };
}

export interface Config {
  webhook: {
    url: string;
  };
  streamers: StreamerInfo[];
  checkInterval: string;
  logLevel: string;
}