// =========================================================
// v4.2 - FIX PRESERVE ORI + Firestore Save
// =========================================================
import { initFirestore, savePrediction } from "./firestore-service.js";

let firestoreConnected = false;

async function initFirebaseModular() {
  try {
    const res = await initFirestore();
    if (res.connected) {
      firestoreConnected = true;
      updateFirebaseStatus(`🟢 Firestore: Connected`, '#dcfce7');
      console.log("✅ Firebase via firestore-service terhubung");
    } else {
      throw new Error(res.error || 'Gagal konek');
    }
    await loadTeams();
  } catch (err) {
    console.error(" Gagal init Firebase Modular:", err);
    updateFirebaseStatus(`🔴 ${err.message}`, '#fee2e2');
    await loadTeams(); // tetap load tim meski firestore gagal
  }
}

function updateFirebaseStatus(text, bg) {
  const el = document.getElementById('firebaseStatus');
  if (el) { 
    el.textContent = text; 
    if (bg) el.style.background = bg; 
  }
}

// =========================================================
// SIMPAN KE FIRESTORE
// =========================================================
async function simpanKeFirestore(data) {
  try {
    const docId = await savePrediction(data);
    console.log("✅ Prediksi disimpan ke Firestore dengan ID:", docId);
    updateFirebaseStatus(`🟢 Tersimpan: ${data.tim1} vs ${data.tim2}`, '#dcfce7');
  } catch (err) {
    console.error("❌ Gagal simpan ke Firestore:", err);
    updateFirebaseStatus('🔴 Gagal simpan: ' + err.message + ' -> simpan lokal', '#fee2e2');
    // fallback localStorage tetap ada
    const hist = JSON.parse(localStorage.getItem('histori_bilbola') || '[]');
    hist.unshift({ ...data, createdAt: new Date().toISOString(), id: 'local-' + Date.now() });
    localStorage.setItem('histori_bilbola', JSON.stringify(hist.slice(0, 20)));
  }
}

// =========================================================
// LOGIC ORI - TETAP 100%
// =========================================================
// ... semua fungsi ORI tetap sama (poissonLog, syncStats, createMatchCard, dll)

// =========================================================
// HASILKAN PREDIKSI + SIMPAN
// =========================================================
async function hasilkanPrediksi(){
  const cards=document.querySelectorAll('.match-card');
  const all=[];
  if(cards.length===0){
    const data=hitungSingle(1) || hitungSingle('');
    if(!data){ alert('Lengkapi data!'); return; }
    renderSingle(data); all.push(data);
    await simpanKeFirestore(buildFirestorePayload(data));
  } else {
    for(const card of cards){
      const idx=card.dataset.idx;
      const data=hitungSingle(idx);
      if(!data) continue;
      renderSingle(data); all.push(data);
      await simpanKeFirestore(buildFirestorePayload(data));
    }
  }
  const globalEl=document.getElementById('hasilSemuaPrediksi');
  if(globalEl && all.length>0){
    let html=`<div style="margin-top:16px; padding:16px; background:#ffffff; border:1px solid #f9a8d4; border-radius:16px; box-shadow:0 4px 12px rgba(236,72,153,0.15);"><h3 style="margin:0 0 12px 0; color:#831843; font-size:14px;">📋 Rekap ${all.length} Prediksi ${firestoreConnected?'✅ Firestore':'⚠️ Lokal'}</h3><div style="display:grid; gap:8px;">`;
    all.forEach(r=>{ html+=`<div style="display:flex; justify-content:space-between; background:#fff1f2; padding:10px; border-radius:10px; border:1px solid #fecdd3;"><div><strong style="color:#831843;">${r.tim1} vs ${r.tim2}</strong><br><small style="color:#be185d;">Total GF ${r.gfATotal}/${r.gfBTotal} | Top ${r.scoreMatrix[0].score}</small></div><div><span style="background:#ec4899; color:#fff; padding:4px 8px; border-radius:6px; font-size:11px;">${r.probAWin>r.probBWin?r.tim1:r.tim2}</span></div></div>`; });
    html+=`</div></div>`;
    globalEl.innerHTML=html;
  }
}

// =========================================================
// BUILD PAYLOAD UNTUK FIRESTORE
// =========================================================
function buildFirestorePayload(data) {
  const now = new Date();
  const ouLines = data.lines.map((line, i) => ({
    line: line,
    over: data.oddsOver[i] || 0,
    under: data.oddsUnder[i] || 0
  }));
  
  return {
    tim1: data.tim1,
    tim2: data.tim2,
    odds1: data.odds1,
    oddsDraw: data.oddsDraw,
    odds2: data.odds2,
    xgA: data.xgA,
    xgB: data.xgB,
    topScore: data.scoreMatrix[0]?.score,
    topScoreProb: data.scoreMatrix[0]?.prob || 0,
    probAWin: data.probAWin,
    probDraw: data.probDraw,
    probBWin: data.probBWin,
    probOver25: data.probOver25,
    overUnder: ouLines,
    gfATotal: data.gfATotal,
    gaATotal: data.gaATotal,
    gfBTotal: data.gfBTotal,
    gaBTotal: data.gaBTotal,
    matchLabel: `${data.tim1} vs ${data.tim2}`,
    waktu: now.toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}),
    waktuISO: now.toISOString()
  };
}
