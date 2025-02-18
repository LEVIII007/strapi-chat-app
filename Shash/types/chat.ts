export interface ChatSession {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  published_at: string;
  email: string;
}

// export interface Message {
//   id: number;
//   text: string;
//   sender: "user" | "bot";
//   chatId?: number;
// }

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'server';
  documentId : string;
  timestamp?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}
