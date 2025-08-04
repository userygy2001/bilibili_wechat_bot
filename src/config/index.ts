import { readFileSync } from 'fs';
import { join } from 'path';
import { Config } from '../types';

export function loadConfig(): Config {
  try {
    const configPath = join(process.cwd(), 'config', 'config.json');
    const configData = readFileSync(configPath, 'utf-8');
    return JSON.parse(configData) as Config;
  } catch (error) {
    throw new Error(`加载配置文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function validateConfig(config: Config): void {
  if (!config.webhook?.url) {
    throw new Error('配置错误: webhook.url 不能为空');
  }
  
  if (!config.streamers || config.streamers.length === 0) {
    throw new Error('配置错误: 至少需要配置一个主播');
  }

  for (const streamer of config.streamers) {
    if (!streamer.uid || !streamer.name || !streamer.roomId) {
      throw new Error(`配置错误: 主播信息不完整 - ${JSON.stringify(streamer)}`);
    }
  }

  if (!config.checkInterval) {
    throw new Error('配置错误: checkInterval 不能为空');
  }
}