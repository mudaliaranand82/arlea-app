import { GoogleGenerativeAI } from "@google/generative-ai";
import * as admin from "firebase-admin";
import { defineString } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

// Define API Key as a param (best practice for Gen 2) or env var
const geminiApiKey = defineString("GEMINI_API_KEY");

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const chatWithGemini = onCall({ cors: true }, async (request) => {
    // 1. Check Authentication
    if (!request.auth) {
        throw new HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { message, bookId, characterId, conversationHistory } = request.data;

    // 2. Validate Data
    if (!message || !bookId || !characterId) {
        throw new HttpsError(
            'invalid-argument',
            'The function must be called with a message, bookId, and characterId.'
        );
    }

    try {
        // 3. Setup Gemini
        // Use value() to access params
        const apiKey = geminiApiKey.value() || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new HttpsError('failed-precondition', 'Gemini API Key is not configured.');
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 4. Fetch Context Data Parallelly
        const [bookDoc, charDoc, userProgressDoc] = await Promise.all([
            db.collection('books').doc(bookId).get(),
            db.collection('characters').doc(characterId).get(),
            db.collection('user_progress').doc(`${request.auth.uid}_${bookId}`).get() // Assuming a composite key or similar structure
        ]);

        if (!bookDoc.exists || !charDoc.exists) {
            throw new HttpsError('not-found', 'Book or Character not found.');
        }

        const bookData = bookDoc.data();
        const charData = charDoc.data();
        const currentChapter = userProgressDoc.exists ? userProgressDoc.data()?.current_chapter || 1 : 1;

        // 5. Construct System Prompt (The USP)
        const systemPrompt = `
        You are ${charData?.name}, a character from the book "${bookData?.title}".
        
        **Your Profile:**
        Role: ${charData?.role}
        Personality: ${charData?.personality || "Consistent with the book."}
        Backstory: ${charData?.backstory || "Standard book backstory."}

        **Context:**
        The user is currently reading Chapter ${currentChapter}.
        You KNOW everything that happened up to Chapter ${currentChapter}.
        You do NOT know what happens in future chapters. Do NOT spoil future events.
        
        **Book Context (up to Ch ${currentChapter}):**
        ${bookData?.summary || "No specific summary available."}
        
        **Tone:**
        Reply in character. Be immersive. correct any misconceptions the user has based on the book's lore.
        `;

        // 6. Generate Response
        // We append the system prompt to the history or strictly as instruction. 
        // For simple chat, we'll prepend it to the latest message or use a chat session if history is full.

        const chat = model.startChat({
            history: conversationHistory || [], // Expecting [{role: 'user'|'model', parts: 'text'}]
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        // Send the system prompt as a "developer" instruction if supported, or prepended to the user message.
        // Helper: Prepend system instruction to the immediate message for strong context.
        const fullMessage = `${systemPrompt}\n\nUser: ${message}`;

        const result = await chat.sendMessage(fullMessage);
        const response = result.response.text();

        return { response };

    } catch (error: any) {
        console.error("Gemini Error:", error);
        throw new HttpsError('internal', 'Failed to generate response.', error.message);
    }
});
