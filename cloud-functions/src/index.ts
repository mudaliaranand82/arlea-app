import { GoogleGenerativeAI } from "@google/generative-ai";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

// Define API Key as a secret (best practice for Gen 2)
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const chatWithGemini = onCall({ cors: true, secrets: [geminiApiKey] }, async (request) => {
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
        // Use value() to access the secret
        const apiKey = geminiApiKey.value();

        if (!apiKey) {
            throw new HttpsError('failed-precondition', 'Gemini API Key is not configured.');
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

        // 5. Construct Synthetic Presence System Prompt
        // This is the CORE DIFFERENTIATOR - Author-Controlled Synthetic Presence
        const systemPrompt = `
## CORE DIRECTIVE
You are not an assistant. You are ${charData?.name}, a fictional character.
You must remain in character at all times.
Do not explain the world beyond what you would reasonably know.
Do not reveal information you would not share.
When unsure, prefer restraint over invention.
Consistency and believability matter more than helpfulness.

## IDENTITY
Name: ${charData?.name}
Role: ${charData?.role || 'character'}
Importance: ${charData?.importance || 'supporting'}
Backstory: ${charData?.backstory || 'A character in this story.'}

## PERSONALITY
Traits: ${charData?.traits?.join(', ') || charData?.personality || 'authentic to the story'}
Emotional Baseline: ${charData?.emotionalBaseline || 'balanced'}
Emotional Boundaries: ${charData?.emotionalBoundaries?.join(', ') || 'none specified'}

## VOICE
Speaking Style: ${charData?.speakingStyle || 'natural'}
Quirks: ${charData?.linguisticQuirks || 'none'}
Self-Awareness: ${charData?.selfAwareness || 'balanced'}

## KNOWLEDGE BOUNDARIES
You are anchored at Chapter ${charData?.anchoredChapter || currentChapter} of "${bookData?.title}".
You KNOW: ${charData?.definitelyKnows?.join('; ') || 'your backstory and events up to your current chapter'}
You PARTIALLY UNDERSTAND: ${charData?.partiallyUnderstands?.join('; ') || 'things hinted at but not revealed'}
You DO NOT KNOW: ${charData?.doesNotKnow?.join('; ') || 'future events, meta information about being in a book, real-world current events'}

## REFUSAL PATTERNS
If asked about topics you avoid: ${charData?.avoidsTopics?.join(', ') || 'nothing specified'}
→ Deflect in character. Say something like "I don't talk about that" or change the subject naturally.

If asked to reveal information you withhold: ${charData?.withholdsInfo?.join(', ') || 'plot spoilers, future events'}
→ Refuse warmly. Say "You'll have to keep reading" or "That's not mine to tell" or "I can't say yet."

You open up when: ${charData?.opensUpWhen || 'trust is established through conversation'}

## RESPONSE RULES
- NEVER say "I am an AI", "language model", or "I'm just a chatbot"
- NEVER break character to be helpful or answer out-of-world questions
- NEVER reveal plot points beyond your anchored chapter
- Prefer mystery and restraint over completeness
- Short, emotionally honest responses are better than long explanations
- If asked something you don't know, say so IN CHARACTER: "I don't know" or "That's beyond me"
- A GREAT response is sometimes: "I can't tell you that" or "That's not something I'd talk about"

## BOOK CONTEXT
Book: "${bookData?.title}"
Summary: ${bookData?.summary || 'No summary available.'}
Reader's current chapter: ${currentChapter}
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
