/**
 * ARLEA Type Definitions
 * 
 * Core data models for the Author-Controlled Synthetic Presence system.
 */

// ============================================
// CHARACTER BIBLE SCHEMA
// The foundation for synthetic presence behavior
// ============================================

export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'peripheral';
export type CharacterImportance = 'core' | 'supporting' | 'peripheral';
export type SelfAwareness = 'reflective' | 'naive' | 'balanced';

export interface CharacterBible {
    // === IDENTITY (Required) ===
    id?: string;                         // Firestore document ID
    name: string;                        // Character name
    role: CharacterRole;                 // Role in story
    importance: CharacterImportance;     // Narrative importance
    backstory: string;                   // Core backstory
    bookId: string;                      // Associated book
    authorId: string;                    // Author who created this

    // === PERSONALITY ===
    traits: string[];                    // e.g., ["curious", "guarded", "playful"]
    emotionalBaseline: string;           // e.g., "calm but anxious underneath"
    emotionalBoundaries: string[];       // Topics that trigger discomfort

    // === VOICE ===
    speakingStyle: string;               // "formal", "poetic", "casual", "clipped"
    linguisticQuirks: string;            // e.g., "uses mechanical metaphors"
    selfAwareness: SelfAwareness;        // How reflective the character is

    // === KNOWLEDGE SCOPE ===
    definitelyKnows: string[];           // Facts they know for certain
    partiallyUnderstands: string[];      // Things they have vague understanding of
    doesNotKnow: string[];               // Explicitly unknown topics

    // === PRIVACY & REFUSAL RULES ===
    avoidsTopics: string[];              // Topics they won't discuss
    withholdsInfo: string[];             // Information they know but won't share
    opensUpWhen: string;                 // Conditions for opening up

    // === TEMPORAL AWARENESS ===
    anchoredChapter: number;             // Where in story timeline (default: 1)
    knowsFuture: boolean;                // Usually false

    // === GROWTH RULES ===
    canEvolve: boolean;                  // Can the character change over time?
    evolutionType: string;               // "emotional depth", "trust building", etc.

    // === METADATA ===
    createdAt?: Date;
    updatedAt?: Date;
}

// Default values for optional fields
export const DEFAULT_CHARACTER_BIBLE: Partial<CharacterBible> = {
    role: 'supporting',
    importance: 'supporting',
    traits: [],
    emotionalBaseline: 'balanced',
    emotionalBoundaries: [],
    speakingStyle: 'natural',
    linguisticQuirks: '',
    selfAwareness: 'balanced',
    definitelyKnows: [],
    partiallyUnderstands: [],
    doesNotKnow: ['future events', 'information from later chapters'],
    avoidsTopics: [],
    withholdsInfo: ['plot spoilers', 'events the reader hasn\'t reached'],
    opensUpWhen: 'trust is established through conversation',
    anchoredChapter: 1,
    knowsFuture: false,
    canEvolve: false,
    evolutionType: '',
};

// ============================================
// BOOK SCHEMA
// ============================================

export interface Book {
    id?: string;
    title: string;
    genre: string;
    summary: string;
    authorId: string;
    chapterCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// ============================================
// USER PROGRESS (for reader tracking)
// ============================================

export interface UserProgress {
    id?: string;                         // Composite: ${userId}_${bookId}
    userId: string;
    bookId: string;
    currentChapter: number;
    lastReadAt?: Date;
}

// ============================================
// CONVERSATION MEMORY (future feature)
// ============================================

export interface ConversationMemory {
    id?: string;
    userId: string;
    characterId: string;

    // Relational memory
    trustLevel: number;                  // 0-100
    emotionalTone: string;               // "friendly", "cautious", "warm"
    significantMoments: string[];        // Key conversation highlights

    // Ephemeral (current session)
    lastInteractionAt?: Date;
}
