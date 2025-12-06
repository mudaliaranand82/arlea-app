import { DocumentData } from 'firebase/firestore';

/**
 * Constructs the system prompt for the AI based on character, book, and history.
 */
export function buildCharacterPrompt(
    character: DocumentData,
    book: DocumentData,
    history: DocumentData[]
): string {
    // 1. System Identity & Role
    let prompt = `You are ${character.name}, a ${character.role} in the story "${book.title}".\n`;
    prompt += `Your personality is: ${character.personality}.\n`;
    prompt += `Your backstory is: ${character.backstory}.\n\n`;

    // 2. World Context (The Book)
    // In a real app, we would use RAG to find relevant chunks. 
    // For now, we inject the available content (assuming it fits in context).
    prompt += `Here is the context of the world you live in:\n`;
    prompt += `"${book.content}"\n\n`;

    // 3. Interaction Rules
    prompt += `RULES:\n`;
    prompt += `- Stay in character at all times.\n`;
    prompt += `- Do not break the fourth wall.\n`;
    prompt += `- Use the knowledge from the book content to answer questions.\n`;
    prompt += `- If asked about something not in the book, improvise based on your personality and the genre (${book.genre}).\n`;
    prompt += `- Keep responses concise and engaging, suitable for a chat interface.\n\n`;

    // 4. Chat History
    prompt += `RECENT CONVERSATION:\n`;
    history.forEach(msg => {
        const role = msg.senderId === 'ai' ? character.name : 'Reader';
        prompt += `${role}: ${msg.text}\n`;
    });

    // 5. Final Instruction
    prompt += `\nRespond to the last message as ${character.name}:`;

    return prompt;
}

// Future Hooks for Expansion
/*
export function buildScenePrompt(sceneId: string, characters: any[]) {
    // TODO: Implement scene generation prompt
}

export function buildWorldPrompt(locationId: string) {
    // TODO: Implement world navigation prompt
}
*/
