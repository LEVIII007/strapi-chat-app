import { chatStorage } from './indexedDB';

export async function handleSignOut() {
  try {
    await chatStorage.clearAll();
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
  }
}

export async function syncChats(userId: string, jwt: string) {
  try {
    await chatStorage.syncWithServer(userId, jwt);
  } catch (error) {
    console.error('Error syncing chats:', error);
  }
} 