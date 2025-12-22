/**
 * Bulk Import Characters Cloud Function
 * 
 * Allows authors to import multiple characters via JSON
 */

import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";

const getDb = () => admin.firestore();

export const bulkImportCharacters = onCall(
    { cors: true },
    async (request) => {
        // 1. Check Authentication
        if (!request.auth) {
            throw new HttpsError(
                'unauthenticated',
                'You must be logged in to import characters.'
            );
        }

        const { bookId, characters } = request.data;

        // 2. Validate Input
        if (!bookId) {
            throw new HttpsError('invalid-argument', 'Book ID is required.');
        }

        if (!characters || !Array.isArray(characters) || characters.length === 0) {
            throw new HttpsError(
                'invalid-argument',
                'Characters must be a non-empty array.'
            );
        }

        if (characters.length > 20) {
            throw new HttpsError(
                'invalid-argument',
                'Maximum 20 characters per import.'
            );
        }

        const db = getDb();

        try {
            // 3. Verify book exists and belongs to this user
            const bookDoc = await db.collection('books').doc(bookId).get();
            if (!bookDoc.exists) {
                throw new HttpsError('not-found', 'Book not found.');
            }

            const bookData = bookDoc.data();
            if (bookData?.authorId !== request.auth.uid) {
                throw new HttpsError(
                    'permission-denied',
                    'You can only import characters to your own books.'
                );
            }

            // 4. Import each character
            const results: { name: string; id: string; success: boolean; error?: string }[] = [];

            for (const character of characters) {
                try {
                    // Validate required fields
                    if (!character.name) {
                        results.push({
                            name: 'Unknown',
                            id: '',
                            success: false,
                            error: 'Name is required'
                        });
                        continue;
                    }

                    // Create character document
                    const docRef = await db.collection('characters').add({
                        // Required fields
                        name: character.name,
                        role: character.role || 'supporting',
                        importance: character.importance || 'supporting',
                        backstory: character.backstory || '',
                        bookId,
                        authorId: request.auth.uid,

                        // NEW: Age & Maturity (for boundary handling)
                        characterAge: character.characterAge || 'adult', // "child", "teenager", "adult", "elderly"

                        // NEW: Meta-Awareness (for reality questions)
                        metaAwareness: character.metaAwareness || 'none', // "none", "partial", "full"

                        // NEW: Reading Companion Mode (opt-in spoiler protection)
                        readingCompanionMode: character.readingCompanionMode || false,

                        // Personality
                        traits: character.traits || [],
                        emotionalBaseline: character.emotionalBaseline || 'balanced',
                        emotionalBoundaries: character.emotionalBoundaries || [],

                        // Voice
                        speakingStyle: character.speakingStyle || 'natural',
                        linguisticQuirks: character.linguisticQuirks || '',
                        selfAwareness: character.selfAwareness || 'balanced',

                        // Knowledge
                        definitelyKnows: character.definitelyKnows || [],
                        partiallyUnderstands: character.partiallyUnderstands || [],
                        doesNotKnow: character.doesNotKnow || ['future events'],

                        // Privacy
                        avoidsTopics: character.avoidsTopics || [],
                        withholdsInfo: character.withholdsInfo || [],
                        opensUpWhen: character.opensUpWhen || 'trust is established',

                        // Temporal
                        anchoredChapter: character.anchoredChapter || 1,
                        knowsFuture: character.knowsFuture || false,

                        // Evolution
                        canEvolve: character.canEvolve || false,
                        evolutionType: character.evolutionType || '',

                        // Metadata
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    results.push({
                        name: character.name,
                        id: docRef.id,
                        success: true
                    });

                } catch (charError: any) {
                    results.push({
                        name: character.name || 'Unknown',
                        id: '',
                        success: false,
                        error: charError.message
                    });
                }
            }

            const successCount = results.filter(r => r.success).length;
            console.log(`Imported ${successCount}/${characters.length} characters for book ${bookId}`);

            return {
                success: true,
                imported: successCount,
                total: characters.length,
                results
            };

        } catch (error: any) {
            console.error("Error importing characters:", error);

            if (error instanceof HttpsError) {
                throw error;
            }

            throw new HttpsError(
                'internal',
                'Failed to import characters: ' + error.message
            );
        }
    }
);
