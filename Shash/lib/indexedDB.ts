// import { openDB, DBSchema, IDBPDatabase } from 'idb';

// export interface ChatSession {
//   id: number;
//   title: string;
//   description?: string;
//   createdAt: string;
//   updatedAt: string;
//   messages?: ChatMessage[];
// }
// export interface ChatMessage {
//   id: number;
//   content: string;
//   sender: 'user' | 'server';
//   timestamp: Date;
//   chatId: number;
// } 

// interface ChatDB extends DBSchema {
//   chats: {
//     key: number;
//     value: ChatSession;
//     indexes: { 'by-date': number };
//   };
// }

// const DB_NAME = 'chat-store';
// const STORE_NAME = 'chats';
// const MAX_CHATS = 5;

// class ChatStorage {
//   private db: Promise<IDBPDatabase<ChatDB>> | null = null;

//   constructor() {
//     if (typeof window !== 'undefined') {
//       this.db = openDB<ChatDB>(DB_NAME, 1, {
//         upgrade(db) {
//           const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
//           store.createIndex('by-date', 'updatedAt');
//         },
//       });
//     }
//   }

//   async saveChat(chatSession: ChatSession): Promise<void> {
//     if (!this.db) return;
//     const db = await this.db;
//     await db.put(STORE_NAME, {
//       ...chatSession,
//       updatedAt: new Date().toISOString(),
//     });
//     await this.deleteOldChats();
//   }

//   async getRecentChats(): Promise<ChatSession[]> {
//     if (!this.db) return [];
//     const db = await this.db;
//     const chats = await db.getAllFromIndex(
//       STORE_NAME,
//       'by-date',
//       IDBKeyRange.lowerBound(0)
//     );
//     return chats
//       .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
//       .slice(0, MAX_CHATS);
//   }

//   private async deleteOldChats(): Promise<void> {
//     if (!this.db) return;
//     const chats = await this.getRecentChats();
//     if (chats.length > MAX_CHATS) {
//       const db = await this.db;
//       const oldestChats = chats.slice(MAX_CHATS);
//       for (const chat of oldestChats) {
//         await db.delete(STORE_NAME, chat.id);
//       }
//     }
//   }

//   async clearAll(): Promise<void> {
//     if (!this.db) return;
//     const db = await this.db;
//     await db.clear(STORE_NAME);
//   }

//   async syncWithServer(userId: string, jwt: string): Promise<void> {
//     if (!this.db) return;
//     const chats = await this.getRecentChats();
    
//     try {
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/api/chat-sessions/sync`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${jwt}`,
//           },
//           body: JSON.stringify({
//             userId,
//             chats,
//           }),
//         }
//       );

//       if (!response.ok) {
//         throw new Error('Failed to sync chats with server');
//       }
//     } catch (error) {
//       console.error('Error syncing chats:', error);
//       throw error;
//     }
//   }
// }

// export const chatStorage = new ChatStorage(); 