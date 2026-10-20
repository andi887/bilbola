import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, doc, getDocs, addDoc, deleteDoc, query, orderBy, limit, serverTimestamp, setDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

let app = null;
let db = null;
let isConnected = false;

export async function initFirestore() {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    isConnected = true;
    console.log("Firestore terhubung:", firebaseConfig.projectId);
    return { app: app, db: db, connected: true };
  } catch (err) {
    console.error("Gagal konek Firestore:", err);
    return { connected: false, error: err.message };
  }
}

/* -------------------- PREDICTION -------------------- */
export async function savePrediction(predictionData) {
  if (!isConnected) {
    await initFirestore();
  }
  try {
    const colRef = collection(db, "predictions");
    const dataToSave = {
      tim1: predictionData.tim1,
      tim2: predictionData.tim2,
      odds1: predictionData.odds1,
      oddsDraw: predictionData.oddsDraw,
      odds2: predictionData.odds2,
      xgA: predictionData.xgA,
      xgB: predictionData.xgB,
      topScore: predictionData.topScore,
      topScoreProb: predictionData.topScoreProb,
      probAWin: predictionData.probAWin,
      probDraw: predictionData.probDraw,
      probBWin: predictionData.probBWin,
      probOver25: predictionData.probOver25,
      overUnder: predictionData.overUnder,
      gfATotal: predictionData.gfATotal,
      gaATotal: predictionData.gaATotal,
      gfBTotal: predictionData.gfBTotal,
      gaBTotal: predictionData.gaBTotal,
      matchLabel: predictionData.matchLabel,
      waktu: predictionData.waktu || new Date().toLocaleString("id-ID"),
      waktuISO: predictionData.waktuISO || new Date().toISOString(),
      createdAt: serverTimestamp(),
      source: "bilbola",
      version: "v4.5-fix-final"
    };
    
    // === LOG UNTUK DEBUG - HARUS DI SINI ===
    console.log("📤 Mau simpan ke Firestore:", firebaseConfig.projectId, dataToSave);
    
    const docRef = await addDoc(colRef, dataToSave);
    
    console.log("✅ SUKSES disimpan ke Firestore:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("❌ Gagal simpan prediksi:", err);
    console.error("Detail error:", err.code, err.message);
    if (err.code === 'permission-denied') {
      console.error("➡️ FIX: Buka Firebase Console > Firestore > Security > ganti jadi allow read, write: if true;");
    }
    throw err;
  }
}

export async function getAllPredictions() {
  if (!isConnected) {
    await initFirestore();
  }
  try {
    const q = query(collection(db, "predictions"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(function(d) {
      const data = d.data();
      let waktu = data.waktu || "Baru saja";
      if (!data.waktu && data.createdAt && data.createdAt.seconds) {
        waktu = new Date(data.createdAt.seconds * 1000).toLocaleString("id-ID");
      }
      const item = { id: d.id, waktu: waktu };
      Object.assign(item, data);
      list.push(item);
    });
    return list;
  } catch (err) {
    console.error("Gagal ambil semua prediksi:", err);
    return [];
  }
}

export async function deletePrediction(docId) {
  if (!isConnected) {
    await initFirestore();
  }
  try {
    const docRef = doc(db, "predictions", docId);
    await deleteDoc(docRef);
    console.log("Prediksi dihapus:", docId);
    return true;
  } catch (err) {
    console.error("Gagal hapus prediksi:", err);
    return false;
  }
}

export async function getPredictionHistory(max) {
  if (!max) max = 5;
  if (!isConnected) await initFirestore();
  const q = query(collection(db, "predictions"), orderBy("createdAt", "desc"), limit(max));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach(function(d) { list.push({ id: d.id, ...d.data() }); });
  return list;
}

/* -------------------- LEADERBOARD -------------------- */
export async function updateLeaderboard(userId, username, points, correct, predictions) {
  if (!isConnected) await initFirestore();
  try {
    await setDoc(doc(db, "leaderboard", userId), {
      username,
      points,
      correct,
      predictions,
      accuracy: predictions > 0 ? correct / predictions : 0,
      updatedAt: serverTimestamp()
    });
    console.log("Leaderboard updated:", userId);
  } catch (err) {
    console.error("Gagal update leaderboard:", err);
  }
}

export function listenLeaderboard(callback) {
  if (!isConnected) initFirestore();
  const q = query(collection(db, "leaderboard"), orderBy("points", "desc"));
  onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data());
    callback(data);
  });
}
