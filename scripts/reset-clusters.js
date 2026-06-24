import { config } from 'dotenv'
config({ path: '.env.local' })

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore'

const app = initializeApp({
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
})

const db = getFirestore(app)

async function run() {
  // 1. Delete all cluster documents
  const clustersSnap = await getDocs(collection(db, 'clusters'))
  await Promise.all(clustersSnap.docs.map(d => deleteDoc(doc(db, 'clusters', d.id))))
  console.log(`Deleted ${clustersSnap.size} cluster(s)`)

  // 2. Clear clusterId + embedding from all complaints
  const complaintsSnap = await getDocs(collection(db, 'complaints'))
  await Promise.all(
    complaintsSnap.docs.map(d =>
      updateDoc(doc(db, 'complaints', d.id), { clusterId: null, embedding: null })
    )
  )
  console.log(`Reset ${complaintsSnap.size} complaint(s)`)

  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
