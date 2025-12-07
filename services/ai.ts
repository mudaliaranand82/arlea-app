import { GoogleGenerativeAI } from "@google/generative-ai";

// Access API Key from Environment Variables
// In Expo, variables prefixed with EXPO_PUBLIC_ are available in the code.
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Missing EXPO_PUBLIC_GEMINI_API_KEY. AI features will fail.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

export const generateCharacterResponse = async (
    characterName: string,
    personality: string,
    backstory: string,
    speakingStyle: string,
    userMessage: string,
    chatHistory: { role: "user" | "model"; parts: { text: string }[] }[]
) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Construct the System Prompt (Persona)
        const systemPrompt = `
      You are roleplaying as ${characterName}.
      
      Character Context:
      - Role: ${personality}
      - Backstory: ${backstory}
      - Speaking Style: ${speakingStyle}
      
      Instructions:
      1. Stay in character at all times.
      2. Respond in the speaking style defined above.
      3. Use knowledge from your backstory.
      4. Keep responses concise and engaging (under 3 sentences unless asked for a story).
      5. Do not break character or mention you are an AI.
    `;

        // Start chat with history
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt + "\n\n(System: Acknowledge and prepare to act.)" }]
                },
                {
                    role: "model",
                    parts: [{ text: `(In Character): I am ready. I am ${characterName}.` }]
                },
                ...chatHistory
            ]
        });

        const result = await chat.sendMessage(userMessage);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return "I... I don't know what to say right now. (AI Error)";
    }
};
