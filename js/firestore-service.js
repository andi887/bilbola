// v4.1 UNIFIED - Satu-satunya sumber Firestore untuk Generator & Rekap
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let db = null;
let app = null;
let isConnected = false;

export async function initFirestore() {
  if (db && isConnected) return db;
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isConnected = true;
    console.log("✅ Firestore Unified Connected:", firebaseConfig.projectId);
    return db;
  } catch (err) {
    console.error("❌ Gagal init Firestore:", err);
    isConnected = false;
    throw err;
  }
}

export function getDb() { return db; }
export function isFirestoreConnected() { return isConnected; }

const COLLECTION_NAME = 'predictions'; // HARUS SAMA DI GENERATOR DAN REKAP

export async function savePrediction(payload) {
  const firestoreDb = await initFirestore();
  const docRef = await addDoc(collection(firestoreDb, COLLECTION_NAME), {
    ...payload,
    createdAt: serverTimestamp(),
    source: 'bilbola-unified-v4.1',
    version: 'v4.1-unified'
  });
  console.log("✅ Saved to Firestore:", docRef.id);
  return docRef.id;
}

export async function getAllPredictions() {
  const firestoreDb = await initFirestore();
  try {
    // coba order by createdAt, kalau gagal karena index belum ada, fallback tanpa order
    let snapshot;
    try {
      const q = query(collection(firestoreDb, COLLECTION_NAME), orderBy("createdAt", "desc"));
      snapshot = await getDocs(q);
    } catch (e) {
      console.warn("OrderBy gagal, fallback getDocs biasa:", e.message);
      snapshot = await getDocs(collection(firestoreDb, COLLECTION_NAME));
    }
    
    const data = [];
    snapshot.forEach(d => {
      const val = d.data();
      data.push({
        id: d.id,
        ...val,
        // Normalisasi field biar rekap.html lama tetap jalan
        waktu: val.waktu || formatWaktu(val.createdAt),
        tim1: val.tim1 || val.team1 || 'Tuan Rumah',
        tim2: val.tim2 || val.team2 || 'Tamu',
      });
    });
    // sort manual di JS jika orderBy gagal
    data.sort((a,b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    });
    return data;
  } catch (err) {
    console.error("❌ getAllPredictions error:", err);
    return [];
  }
}

export async function deletePrediction(id) {
  const firestoreDb = await initFirestore();
  try {
    await deleteDoc(doc(firestoreDb, COLLECTION_NAME, id));
    console.log("🗑️ Deleted:", id);
    return true;
  } catch (err) {
    console.error("❌ Delete gagal:", err);
    return false;
  }
}

function formatWaktu(createdAt) {
  try {
    if (!createdAt) return new Date().toLocaleString('id-ID');
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleString('id-ID');
    }
    if (createdAt.toDate) {
      return createdAt.toDate().toLocaleString('id-ID');
    }
    return new Date().toLocaleString('id-ID');
  } catch { return new Date().toLocaleString('id-ID'); }
}
