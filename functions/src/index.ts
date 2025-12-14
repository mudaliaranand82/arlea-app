import { GoogleGenerativeAI } from "@google/generative-ai";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();
const db = admin.firestore();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const chatWithGemini = functions.https.onCall(async (data: any, context: any) => {
    // 1. Check Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { message, bookId, characterId, conversationHistory } = data;

    // 2. Validate Data
    if (!message || !bookId || !characterId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The function must be called with a message, bookId, and characterId.'
        );
    }

    try {
        // 3. Setup Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new functions.https.HttpsError('failed-precondition', 'Gemini API Key is not configured.');
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 4. Fetch Context Data Parallelly
        const [bookDoc, charDoc, userProgressDoc] = await Promise.all([
            db.collection('books').doc(bookId).get(),
            db.collection('characters').doc(characterId).get(),
            db.collection('user_progress').doc(`${context.auth.uid}_${bookId}`).get() // Assuming a composite key or similar structure
        ]);

        if (!bookDoc.exists || !charDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Book or Character not found.');
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
        throw new functions.https.HttpsError('internal', 'Failed to generate response.', error.message);
    }
});
