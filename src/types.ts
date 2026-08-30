export interface AdminController {
  id: string;
  name: string;
  telegramId: string;
  username?: string;
  email?: string;
  password?: string;
  role: 'super_admin' | 'controller';
  addedAt: string;
  isActive: boolean;
  notes?: string;
}

export interface TelegramAccount {
  id: string;
  name: string;
  username: string;
  phone: string;
  telegramId?: number | string;
  avatarUrl: string;
  sessionString: string;
  apiId: string;
  apiHash: string;
  proxy?: {
    type: 'socks5' | 'http' | 'none';
    host: string;
    port: number;
    username?: string;
    password?: string;
    pingMs?: number;
  };
  status: 'active' | 'in_live' | 'banned' | 'cooldown' | 'idle';
  isPremium: boolean;
  country: string;
  countryCode: string;
  tags: string[];
  joinedLiveAt?: string;
  lastPingMs?: number;
  selected?: boolean;
}

export interface LiveRoomState {
  isActive: boolean;
  targetLink: string;
  targetTitle: string;
  targetChatType: 'channel' | 'group' | 'voice_chat';
  hostName: string;
  hostAvatar: string;
  hostSpeaking: boolean;
  startedAt: string | null;
  viewerCount: number;
  activeAccounts: LiveAccountParticipant[];
  autoReactionsEnabled: boolean;
  selectedReactions: string[];
  reactionIntervalSec: number;
  autoCommentsEnabled: boolean;
  commentIntervalSec: number;
  jitterDelaySec: number;
  muteAll: boolean;
}

export interface LiveAccountParticipant {
  accountId: string;
  name: string;
  username: string;
  avatarUrl: string;
  isMuted: boolean;
  isHandRaised: boolean;
  lastReaction?: string;
  lastReactionTime?: number;
  audioPingMs: number;
  state: 'connecting' | 'listening' | 'speaking' | 'left';
  joinedAt: string;
}

export interface LiveStreamLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  accountId?: string;
  accountName?: string;
  message: string;
  detail?: string;
}

export interface LiveComment {
  id: string;
  accountId: string;
  accountName: string;
  avatarUrl: string;
  text: string;
  timestamp: string;
}

export interface PresetScript {
  title: string;
  filename: string;
  language: 'python' | 'docker' | 'bash' | 'env';
  description: string;
  code: string;
}
