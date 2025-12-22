/**
 * Book Content Processing Function
 * 
 * Handles:
 * 1. Receiving raw book text from author
 * 2. Chunking into ~500 token segments
 * 3. Generating embeddings via Gemini
 * 4. Storing chunks + embeddings in Firestore
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { chunkText } from "./ragUtils";

// Re-use the shared secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Get Firestore instance (assumes admin is already initialized in index.ts)
const getDb = () => admin.firestore();

/**
 * Process and index book content
 * Called when author uploads/pastes book text
 */
export const processBookContent = onCall(
    {
        cors: true,
        secrets: [geminiApiKey],
        timeoutSeconds: 300, // 5 minutes for large books
        memory: "512MiB"
    },
    async (request) => {
        // 1. Check Authentication
        if (!request.auth) {
            throw new HttpsError(
                'unauthenticated',
                'You must be logged in to upload book content.'
            );
        }

        const { bookId, content } = request.data;

        // 2. Validate Input
        if (!bookId || !content) {
            throw new HttpsError(
                'invalid-argument',
                'Book ID and content are required.'
            );
        }

        if (typeof content !== 'string' || content.length < 100) {
            throw new HttpsError(
                'invalid-argument',
                'Content must be at least 100 characters.'
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
                    'You can only upload content to your own books.'
                );
            }

            // 4. Delete existing chunks for this book (for re-uploads)
            const existingChunks = await db.collection('book_chunks')
                .where('bookId', '==', bookId)
                .get();

            const deletePromises = existingChunks.docs.map(doc => doc.ref.delete());
            await Promise.all(deletePromises);
            console.log(`Deleted ${existingChunks.size} existing chunks for book ${bookId}`);

            // 5. Chunk the content
            const chunks = chunkText(content);
            console.log(`Split content into ${chunks.length} chunks`);

            if (chunks.length === 0) {
                throw new HttpsError(
                    'invalid-argument',
                    'Could not extract meaningful content from the text.'
                );
            }

            // 6. Setup Gemini for embeddings
            const apiKey = geminiApiKey.value();
            if (!apiKey) {
                throw new HttpsError('failed-precondition', 'Gemini API Key is not configured.');
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

            // 7. Generate embeddings and store chunks
            // Process in batches to avoid rate limits
            const BATCH_SIZE = 10;
            let processedCount = 0;

            for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                const batch = chunks.slice(i, i + BATCH_SIZE);

                const embeddingPromises = batch.map(async (chunkContent, batchIndex) => {
                    const globalIndex = i + batchIndex;

                    try {
                        // Generate embedding
                        const result = await embeddingModel.embedContent(chunkContent);
                        const embedding = result.embedding.values;

                        // Store in Firestore
                        await db.collection('book_chunks').add({
                            bookId,
                            chunkIndex: globalIndex,
                            content: chunkContent,
                            embedding,
                            wordCount: chunkContent.split(/\s+/).length,
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });

                        return true;
                    } catch (error) {
                        console.error(`Error processing chunk ${globalIndex}:`, error);
                        return false;
                    }
                });

                const results = await Promise.all(embeddingPromises);
                processedCount += results.filter(Boolean).length;

                // Small delay between batches to respect rate limits
                if (i + BATCH_SIZE < chunks.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // 8. Update book document with content metadata
            await db.collection('books').doc(bookId).update({
                hasContent: true,
                chunkCount: processedCount,
                contentLength: content.length,
                contentUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Successfully processed ${processedCount}/${chunks.length} chunks for book ${bookId}`);

            return {
                success: true,
                chunksProcessed: processedCount,
                totalChunks: chunks.length
            };

        } catch (error: any) {
            console.error("Error processing book content:", error);

            if (error instanceof HttpsError) {
                throw error;
            }

            throw new HttpsError(
                'internal',
                'Failed to process book content: ' + error.message
            );
        }
    }
);
