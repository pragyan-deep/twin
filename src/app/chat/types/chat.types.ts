export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  isStreaming?: boolean;
  isError?: boolean;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  currentConversation: string;
  streamingMessage: string;
  error: string | null;
}

export interface ChatContextType extends ChatState {
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  regenerateLastMessage: () => Promise<void>;
  addReaction: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
}

export interface InputState {
  value: string;
  isMultiline: boolean;
  isFocused: boolean;
} 