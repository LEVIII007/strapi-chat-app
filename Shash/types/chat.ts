export interface ChatSession {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

// export interface Message {
//   id: number;
//   text: string;
//   sender: "user" | "bot";
//   chatId?: number;
// }

export interface ChatMessage {
  id: number;
  content: string;
  sender: 'user' | 'server';
  timestamp: Date;
  chatId: number;
} 