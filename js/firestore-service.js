import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

let db = null;
let isConnected = false;

// 1. Inisialisasi Koneksi
export async function initFirestore() {
  if (isConnected && db) return { connected: true };
  
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    isConnected = true;
    console.log("✅ Firestore siap digunakan.");
    return { connected: true };
  } catch (err) {
    console.error("❌ Gagal init Firestore:", err);
    return { connected: false, error: err.message };
  }
}

// 2. Simpan Prediksi ke Firestore
export async function savePrediction(data) {
  if (!isConnected) await initFirestore();
  if (!isConnected) throw new Error("Firestore tidak terhubung");

  try {
    const docRef = await addDoc(collection(db, "predictions"), {
      ...data,
      createdAt: serverTimestamp(),
      source: "generator_v5_clean"
    });
    console.log("✅ Berhasil simpan ke Firestore. ID:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("❌ Gagal simpan ke Firestore:", err);
    throw err; // Lempar error agar generator tahu kalau gagal
  }
}

// 3. Ambil Semua Prediksi untuk Halaman Rekap
export async function getAllPredictions() {
  if (!isConnected) await initFirestore();
  
  try {
    const q = query(collection(db, "predictions"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      // Format waktu dari serverTimestamp atau fallback ke waktu lokal
      let waktu = data.waktu || "Baru saja";
      if (!data.waktu && data.createdAt && data.createdAt.seconds) {
        waktu = new Date(data.createdAt.seconds * 1000).toLocaleString("id-ID");
      }
      return { id: docSnap.id, waktu, ...data };
    });
  } catch (err) {
    console.error("❌ Gagal ambil data rekap:", err);
    return [];
  }
}

// 4. Hapus Prediksi
export async function deletePrediction(docId) {
  if (!isConnected) await initFirestore();
  try {
    await deleteDoc(doc(db, "predictions", docId));
    return true;
  } catch (err) {
    console.error("❌ Gagal hapus:", err);
    return false;
  }
}
