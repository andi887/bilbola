// js/firestore-service.js
// TARUH DI: bilbola/js/firestore-service.js
// Service untuk koneksi Firestore sesuai struktur repo kamu

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc,
  getDocs, 
  getDoc,
  addDoc, 
  setDoc,
  deleteDoc, // <--- [BARU] Ditambahkan untuk fungsi hapus di halaman Rekap
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
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isConnected = true;
    console.log("✅ Firestore terhubung:", firebaseConfig.projectId);
    return { app, db, connected: true };
  } catch (err) {
    console.error("❌ Gagal konek Firestore:", err);
    return { connected: false, error: err.message };
  }
}

// === SESUAI STRUKTUR data/teams.json & data/stat.json ===

// Ambil teams dari Firestore, fallback ke ../data/teams.json kalau kosong
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
      console.log("Teams dari Firestore:", data);
      return data;
    }
    // Fallback ke file JSON lokal (struktur repo kamu)
    console.log("Firestore teams kosong, fallback ke ../data/teams.json");
    const res = await fetch('../data/teams.json');
    return await res.json();
  } catch (err) {
    console.warn("getTeams fallback ke JSON:", err.message);
    const res = await fetch('../data/teams.json');
    return await res.json();
  }
}

// Ambil stat.json (GF/GA 5 laga) - kamu punya data/stat.json
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

// Simpan prediksi (dari generator.html)
export async function savePrediction(predictionData) {
  if (!isConnected) await initFirestore();
  try {
    const docRef = await addDoc(collection(db, "predictions"), {
      ...predictionData,
      createdAt: serverTimestamp(),
      source: "bilbola/pages/generator.html",
      version: "v3.6-pink-firestore"
    });
    console.log("Prediksi disimpan:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("Gagal simpan prediksi:", err);
    throw err;
  }
}

// Ambil histori prediksi (max 5 sesuai fitur kamu)
export async function getPredictionHistory(max = 5) {
  if (!isConnected) await initFirestore();
  const q = query(collection(db, "predictions"), orderBy("createdAt", "desc"), limit(max));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach(d => list.push({ id: d.id, ...d.data() }));
  return list;
}

// Untuk admin: migrasi teams.json ke Firestore (sekali saja)
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
  console.log(`Migrasi ${count} tim ke Firestore selesai`);
  return count;
}

// ==========================================
// 🆕 FUNGSI KHUSUS UNTUK HALAMAN REKAP
// ==========================================

// Ambil semua histori prediksi untuk halaman Rekap
export async function getAllPredictions() {
  if (!isConnected) await initFirestore();
  try {
    const q = query(collection(db, "predictions"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => {
      const data = d.data();
      let waktu = "Baru saja";
      if (data.createdAt && data.createdAt.seconds) {
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

// Hapus satu prediksi dari Firestore
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
