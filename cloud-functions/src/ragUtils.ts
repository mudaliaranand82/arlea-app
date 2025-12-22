/**
 * Shared utilities for RAG functionality
 */

import * as admin from "firebase-admin";

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('Vectors must have same dimension');
    }

    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Chunk text into overlapping segments
 * @param text - Raw book text
 * @param chunkSize - Target words per chunk (not tokens, but close approximation)
 * @param overlap - Words to overlap between chunks
 */
export function chunkText(text: string, chunkSize = 400, overlap = 50): string[] {
    // Clean up the text
    const cleanedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    const words = cleanedText.split(/\s+/);
    const chunks: string[] = [];

    if (words.length <= chunkSize) {
        // Text is small enough to be a single chunk
        return [cleanedText];
    }

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk.trim().length > 50) { // Only add meaningful chunks
            chunks.push(chunk.trim());
        }
    }

    return chunks;
}

/**
 * Search for relevant chunks given a query embedding
 */
export async function searchRelevantChunks(
    bookId: string,
    queryEmbedding: number[],
    topK = 5
): Promise<{ content: string; similarity: number }[]> {
    const db = admin.firestore();

    // Get all chunks for this book
    const chunksSnapshot = await db.collection('book_chunks')
        .where('bookId', '==', bookId)
        .get();

    if (chunksSnapshot.empty) {
        return [];
    }

    // Calculate similarity for each chunk
    const scoredChunks = chunksSnapshot.docs.map(doc => {
        const data = doc.data();
        const similarity = cosineSimilarity(queryEmbedding, data.embedding);
        return {
            content: data.content as string,
            similarity,
            chunkIndex: data.chunkIndex as number
        };
    });

    // Sort by similarity and return top K
    return scoredChunks
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .filter(chunk => chunk.similarity > 0.3); // Only include reasonably similar chunks
}
