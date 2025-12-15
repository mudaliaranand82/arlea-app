import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig'; // This checks our config
// We should NOT import 'firebase-functions' here directly if it pulls in Node.js modules like 'util'.
// But wait, the previous code imported 'firebase/functions' (client SDK) correctly.
// The error says "functions/node_modules/firebase-functions/lib/logger/index.js: util could not be found".
// This implies the FRONTEND is trying to bundle the BACKEND 'firebase-functions' package (which depends on Node 'util').

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const ChatService = {
    sendMessage: async (
        message: string,
        bookId: string,
        characterId: string,
        history: ChatMessage[]
    ) => {
        try {
            const chatFunction = httpsCallable(functions, 'chatWithGemini');
            const result = await chatFunction({
                message,
                bookId,
                characterId,
                conversationHistory: history
            });

            return (result.data as any).response as string;
        } catch (error) {
            console.error("ChatService Error:", error);
            throw error;
        }
    }
};
