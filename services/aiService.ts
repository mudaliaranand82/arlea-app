import { GoogleGenerativeAI } from "@google/generative-ai";
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db, firebaseConfig } from "../firebaseConfig";
import { buildCharacterPrompt } from "./promptBuilder";

// Initialize Gemini API
// Note: In a production app, this key should be proxied through a backend to avoid exposing it in the client.
// For this prototype, we use the key directly.
const genAI = new GoogleGenerativeAI(firebaseConfig.apiKey);

// Mode A: API-based LLM (Gemini)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

interface AIResponse {
    text: string;
    error?: string;
}

/**
 * Modular AI Service
 * Encapsulates all AI logic, allowing for future model swapping.
 */
export const AIService = {
    /**
     * Sends a message to the AI and gets a response.
     * Acts as a virtual backend endpoint.
     */
    sendMessage: async (
        userMessage: string,
        bookId: string,
        characterId: string,
        userId: string
    ): Promise<AIResponse> => {
        try {
            // 1. Fetch Data (Simulating Backend RAG)
            const characterDoc = await getDoc(doc(db, "characters", characterId));
            const bookDoc = await getDoc(doc(db, "books", bookId));

            if (!characterDoc.exists() || !bookDoc.exists()) {
                return { text: "", error: "Character or Book not found." };
            }

            const character = characterDoc.data();
            const book = bookDoc.data();

            // Fetch recent history (last 10 messages)
            const historyQuery = query(
                collection(db, "messages"),
                where("chatId", "==", `${userId}_${characterId}`),
                orderBy("createdAt", "desc"),
                limit(10)
            );
            const historySnapshot = await getDocs(historyQuery);
            const history = historySnapshot.docs.map(d => d.data()).reverse();

            // 2. Build Prompt
            const prompt = buildCharacterPrompt(character, book, history);

            // 3. Call AI (Mode A)
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // 4. Safety Guardrails (Phase One)
            const safeResponse = applyGuardrails(responseText);

            // 5. Save AI Reply to Firestore
            // Note: The UI should also save the User's message. 
            // Ideally, a backend function would save both to ensure atomicity.
            // Here, we assume the UI saved the user message, and we save the AI response.
            await addDoc(collection(db, "messages"), {
                text: safeResponse,
                senderId: 'ai',
                userId: userId,
                characterId: characterId,
                bookId: bookId,
                chatId: `${userId}_${characterId}`,
                createdAt: new Date()
            });

            return { text: safeResponse };

        } catch (error: any) {
            console.error("AI Service Error:", error);
            return { text: "", error: error.message || "Failed to generate response." };
        }
    }
};

/**
 * Basic safety wrapper to filter/check output.
 * Can be expanded with more sophisticated checks later.
 */
function applyGuardrails(text: string): string {
    // Basic check for empty or error responses
    if (!text) return "...";

    // Future: Add profanity filter, character consistency check, etc.
    return text.trim();
}
