
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}
const db = admin.firestore();

async function checkDuplicates(text: string, locale: string) {
    console.log(`Checking for duplicates of "${text}" in ${locale}...`);
    const snapshot = await db.collection('phrases')
        .where('locale', '==', locale)
        .where('text', '==', text)
        .get();

    console.log(`Found ${snapshot.size} documents.`);
    snapshot.docs.forEach(doc => {
        console.log(`- ${doc.id}: ${doc.data().text}, slang: ${doc.data().is_slang}`);
    });
}

// Check for the reported duplicate
checkDuplicates('¿Qué es esto?', 'es-CO-MDE');
checkDuplicates('¿Qué es esto?', 'es-CO-CTG');
// Also check "Where's a good place to get"
checkDuplicates("Where's a good place to get", 'en-US-CA');
