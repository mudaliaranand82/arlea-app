import * as crypto from 'crypto';

/**
 * Generates a deterministic hash of the character's definition.
 * This ensures that if the Name, Role, Personality, or Instructions change,
 * the version hash changes.
 */
export function calculateCharacterHash(characterData: any): string {
    // Extract only the fields that define the character's behavior
    const definition = {
        name: characterData.name || '',
        role: characterData.role || '',
        personality: characterData.personality || '',
        instructions: characterData.instructions || '',
        knowledge: characterData.knowledge || [], // specific knowledge base
        voice: characterData.voice || '', // speaking style
    };

    // Stable stringify by sorting keys (optional, but good practice if structure varies)
    const stableString = JSON.stringify(definition, Object.keys(definition).sort());

    return crypto.createHash('sha256').update(stableString).digest('hex').substring(0, 12);
}
