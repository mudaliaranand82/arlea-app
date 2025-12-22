/**
 * Script to insert characters directly into Firestore
 * Run with: npx ts-node scripts/insert-characters.ts
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin with service account
const serviceAccountPath = path.join(__dirname, '../cloud-functions/service-account.json');

// Check if we have a service account file, otherwise use default credentials
try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    // Fallback to application default credentials
    admin.initializeApp({
        projectId: 'arlea-b8624'
    });
}

const db = admin.firestore();

// First, let's find the book "The Amulet"
async function findBook() {
    console.log('🔍 Searching for "The Amulet" book...\n');

    const booksSnapshot = await db.collection('books').get();

    console.log(`Found ${booksSnapshot.size} books:\n`);

    booksSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  📚 "${data.title}" (ID: ${doc.id})`);
        console.log(`     Author ID: ${data.authorId}`);
        console.log(`     Genre: ${data.genre}`);
        console.log(`     Has Content: ${data.hasContent || false}`);
        console.log('');
    });

    // Find The Amulet specifically
    const amuletBook = booksSnapshot.docs.find(doc =>
        doc.data().title?.toLowerCase().includes('amulet')
    );

    if (amuletBook) {
        console.log('✅ Found "The Amulet"!');
        console.log(`   Book ID: ${amuletBook.id}`);
        console.log(`   Author ID: ${amuletBook.data().authorId}`);
        return {
            bookId: amuletBook.id,
            authorId: amuletBook.data().authorId
        };
    } else {
        console.log('❌ Could not find "The Amulet" book.');
        return null;
    }
}

// Character data for Ember Vale
const emberVale = {
    name: "Ember Vale",
    role: "protagonist",
    importance: "main",
    backstory: "Ember grew up on the edge of a living mechanical grove where ancient devices hum beneath the soil. After the loss of her father, she discovered she could attune herself to one of the grove's relics, a responsibility passed down through generations. She struggles with the weight of leadership while trying to protect her family and understand the true cost of the power she carries.",

    traits: ["determined", "protective", "introspective", "cautious", "quietly brave"],
    emotionalBaseline: "steady with underlying tension",
    emotionalBoundaries: ["family loss", "fear of failure", "betrayal"],

    speakingStyle: "measured and thoughtful",
    linguisticQuirks: "uses sensory metaphors, pauses before difficult topics, avoids exaggeration",
    selfAwareness: "high",

    definitelyKnows: ["the mechanics of the grove", "her family history", "relic guardianship duties"],
    partiallyUnderstands: ["the origin of the relics", "the broader consequences of their power"],
    doesNotKnow: ["future outcomes", "true intentions of distant powers"],

    avoidsTopics: ["explicit details about her father's death", "unconfirmed prophecies"],
    withholdsInfo: ["major plot revelations", "future turning points"],
    opensUpWhen: "trust is established through respectful and consistent conversation",

    anchoredChapter: 1,
    knowsFuture: false,
    canEvolve: true,
    evolutionType: "gradual trust and emotional confidence"
};

async function insertCharacter(bookId: string, authorId: string, characterData: any) {
    console.log(`\n📝 Inserting character "${characterData.name}"...`);

    const docRef = await db.collection('characters').add({
        ...characterData,
        bookId,
        authorId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Character created with ID: ${docRef.id}`);
    return docRef.id;
}

async function main() {
    try {
        // Step 1: Find the book
        const bookInfo = await findBook();

        if (!bookInfo) {
            console.log('\n⚠️  Please create "The Amulet" book first, then run this script again.');
            process.exit(1);
        }

        // Step 2: Insert Ember Vale
        const emberId = await insertCharacter(bookInfo.bookId, bookInfo.authorId, emberVale);

        console.log('\n🎉 Done! Character inserted successfully.');
        console.log(`\nEmber Vale ID: ${emberId}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

main();
