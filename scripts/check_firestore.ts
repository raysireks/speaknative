import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
    projectId: 'speaknative-8ce5c'
});

const db = getFirestore();

async function check() {
    const snapshot = await db.collection('phrases').count().get();
    console.log('Total phrases in Firestore:', snapshot.data().count);
}

check();
