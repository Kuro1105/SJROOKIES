/**
 * Creates initial admin and student accounts in Firebase Auth + Firestore.
 * Run once: node scripts/seed-users.js
 *
 * Requires VITE_FIREBASE_* vars in .env at project root.
 */

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

// Load .env manually (no top-level dotenv dep assumed)
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath   = join(__dirname, '../.env.local')
try {
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const [k, ...rest] = line.split('=')
    if (k && rest.length) process.env[k.trim()] = rest.join('=').trim()
  }
} catch {
  console.error('Could not read .env — make sure it exists at project root')
  process.exit(1)
}

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
}

const app  = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db   = getFirestore(app)

// Edit these accounts as needed before running
const USERS = [
  {
    studentId:  'admin001',
    password:   'Admin123!',
    name:       'Admin User',
    role:       'admin',
    department: 'Administration',
  },
  {
    studentId:  '20231001',
    password:   'Pass1234!',
    name:       'Kim Minjun',
    role:       'student',
    department: 'Computer Science',
  },
  {
    studentId:  '20231002',
    password:   'Pass1234!',
    name:       'Lee Soyeon',
    role:       'student',
    department: 'Business',
  },
  {
    studentId:  '20231003',
    password:   'Pass1234!',
    name:       'Park Jiwoo',
    role:       'student',
    department: 'Engineering',
  },
]

async function seed() {
  console.log(`Seeding ${USERS.length} users into Firebase...\n`)

  for (const u of USERS) {
    const email = `${u.studentId}@campusvoice.app`
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, u.password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        studentId:  u.studentId,
        name:       u.name,
        role:       u.role,
        department: u.department,
        email,
        createdAt:  serverTimestamp(),
      })
      console.log(`✓  [${u.role.padEnd(7)}] ${u.studentId.padEnd(12)} ${u.name}`)
      await signOut(auth)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`-  [skip   ] ${u.studentId.padEnd(12)} already exists`)
      } else {
        console.error(`✗  [error  ] ${u.studentId}: ${err.message}`)
      }
    }
  }

  console.log('\nDone!\n')
  console.log('Admin login:')
  console.log('  Student ID : admin001')
  console.log('  Password   : Admin123!\n')
  console.log('Student logins (password for all: Pass1234!):')
  USERS.filter(u => u.role === 'student').forEach(u =>
    console.log(`  ${u.studentId}  →  ${u.name}`)
  )
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
