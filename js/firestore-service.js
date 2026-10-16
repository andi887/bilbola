// js/firestore-service.js - FIX PRESERVE ORI + ANTI DUPLICATE
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc,
  getDocs, 
  getDoc,
  addDoc, 
  setDoc,
  deleteDoc,
  query, 
  orderBy, 
  limit, 
  where,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

let app, db;
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
    console.log("✅ Firestore terhubung:", firebaseConfig.projectId);
    return { app, db, connected: true };
  } catch (err) {
    console.error("❌ Gagal konek Firestore:", err);
    return { connected: false, error: err.message };
  }
}

export async function getTeams() {
  try {
    if (!isConnected) await initFirestore();
    const q = query(collection(db, "teams"), orderBy("liga"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = {};
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (!data[d.liga]) data[d.liga] = [];
        data[d.liga].push(d.nama);
      });
      return data;
    }
    const res = await fetch('../data/teams.json');
    return await res.json();
  } catch (err) {
    const res = await fetch('../data/teams.json');
    return await res.json();
  }
}

export async function getStats() {
  try {
    if (!isConnected) await initFirestore();
    const q = query(collection(db, "team_stats"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const stats = {};
      snap.forEach(d => stats[d.id] = d.data());
      return stats;
    }
    const res = await fetch('../data/stat.json');
    return await res.json();
  } catch (err) {
    const res = await fetch('../data/stat.json');
    return await res.json();
  }
}

export async function savePrediction(predictionData) {
  if (!isConnected) await initFirestore();
  try {
    const docRef = await addDoc(collection(db, "predictions"), {
      ...predictionData,
      createdAt: serverTimestamp(),
      waktu: predictionData.waktu || new Date().toLocaleString("id-ID", {day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"}),
      source: "bilbola/pages/generator.html",
      version: "v4.2-preserve-ori"
    });
    console.log("Prediksi disimpan:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("Gagal simpan prediksi:", err);
    throw err;
  }
}

export async function getPredictionHistory(max = 5) {
  if (!isConnected) await initFirestore();
  const q = query(collection(db, "predictions"), orderBy("createdAt", "desc"), limit(max));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach(d => list.push({ id: d.id, ...d.data() }));
  return list;
}

export async function migrateTeamsJsonToFirestore() {
  if (!isConnected) await initFirestore();
  const res = await fetch('../data/teams.json');
  const data = await res.json();
  let count = 0;
  for (const [liga, daftar] of Object.entries(data)) {
    for (const nama of daftar) {
      await addDoc(collection(db, "teams"), { liga, nama, createdAt: serverTimestamp() });
      count++;
    }
  }
  return count;
}

export async function getAllPredictions() {
  if (!isConnected) await initFirestore();
  try {
    const q = query(collection(db, "predictions"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => {
      const data = d.data();
      let waktu = data.waktu || "Baru saja";
      if (!data.waktu && data.createdAt && data.createdAt.seconds) {
        waktu = new Date(data.createdAt.seconds * 1000).toLocaleString("id-ID", {
          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
      }
      list.push({ id: d.id, waktu, ...data });
    });
    return list;
  } catch (err) {
    console.error(" Gagal ambil semua prediksi:", err);
    return [];
  }
}

export async function deletePrediction(docId) {
  if (!isConnected) await initFirestore();
  try {
    await deleteDoc(doc(db, "predictions", docId));
    console.log("✅ Prediksi dihapus:", docId);
    return true;
  } catch (err) {
    console.error("❌ Gagal hapus prediksi:", err);
    return false;
  }
}
