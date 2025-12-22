/**
 * Script to insert characters directly into Firestore
 * Run with: npx ts-node insert-characters.ts
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
    projectId: 'arlea-b8624'
});

const db = admin.firestore();

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

async function findBookAndInsert() {
    console.log('🔍 Searching for "The Amulet" book...\n');

    const booksSnapshot = await db.collection('books').get();

    console.log(`Found ${booksSnapshot.size} books:\n`);

    booksSnapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        console.log(`  📚 "${data.title}" (ID: ${doc.id})`);
        console.log(`     Author ID: ${data.authorId}`);
        console.log(`     Has Content: ${data.hasContent || false}`);
        console.log('');
    });

    // Find The Amulet specifically
    const amuletBook = booksSnapshot.docs.find((doc: admin.firestore.QueryDocumentSnapshot) =>
        doc.data().title?.toLowerCase().includes('amulet')
    );

    if (!amuletBook) {
        console.log('❌ Could not find "The Amulet" book.');
        return;
    }

    const bookId = amuletBook.id;
    const authorId = amuletBook.data().authorId;

    console.log(`✅ Found "The Amulet"!`);
    console.log(`   Book ID: ${bookId}`);
    console.log(`   Author ID: ${authorId}\n`);

    // Insert Ember Vale
    console.log(`📝 Inserting character "${emberVale.name}"...`);

    const docRef = await db.collection('characters').add({
        ...emberVale,
        bookId,
        authorId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Character created with ID: ${docRef.id}`);
    console.log('\n🎉 Done! Ember Vale inserted successfully.');
}

findBookAndInsert()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err);
        process.exit(1);
    });
