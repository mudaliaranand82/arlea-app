/**
 * Insert characters into Firestore
 * Run: node insert-ember.js
 */

const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'arlea-b8624' });
const db = admin.firestore();

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

async function main() {
    console.log('🔍 Searching for books...\n');

    const booksSnap = await db.collection('books').get();
    console.log(`Found ${booksSnap.size} books:`);

    booksSnap.docs.forEach(doc => {
        const d = doc.data();
        console.log(`  📚 "${d.title}" (ID: ${doc.id}) by ${d.authorId}`);
    });

    const amulet = booksSnap.docs.find(doc =>
        doc.data().title && doc.data().title.toLowerCase().includes('amulet')
    );

    if (!amulet) {
        console.log('\n❌ Could not find "The Amulet" book.');
        process.exit(1);
    }

    console.log(`\n✅ Found "${amulet.data().title}" with ID: ${amulet.id}`);
    console.log(`📝 Inserting Ember Vale...\n`);

    const ref = await db.collection('characters').add({
        ...emberVale,
        bookId: amulet.id,
        authorId: amulet.data().authorId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`🎉 Success! Character ID: ${ref.id}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
