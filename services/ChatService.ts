import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';

export interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
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
