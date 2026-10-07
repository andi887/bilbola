// =========================================================
// FILE JS UTAMA - v3.1 COLLAB (JS as Main)
// Hasil kolaborasi: JS ori kamu + fungsionalitas HTML ori (Poisson Engine v3 FIXED)
// =========================================================

// --- PRESET DARI HTML ORI (diambil dari file ori) ---
const presets = {
  elClasico: {
    teamA: "Real Madrid", teamB: "FC Barcelona",
    oddsA: 2.10, oddsDraw: 3.60, oddsB: 3.20,
    statMode: "total", gfA: 11, gaA: 4, gfB: 13, gaB: 7, h2hA: 1.8, h2hB: 1.6
  },
  highScoring: {
    teamA: "Manchester City", teamB: "Bayern Munich",
    oddsA: 1.95, oddsDraw: 4.00, oddsB: 3.40,
    statMode: "total", gfA: 16, gaA: 8, gfB: 15, gaB: 9, h2hA: 2.3, h2hB: 2.1
  },
  tactical: {
    teamA: "Atletico Madrid", teamB: "Inter Milan",
    oddsA: 2.30, oddsDraw: 3.10, oddsB: 3.30,
    statMode: "total", gfA: 6, gaA: 3, gfB: 7, gaB: 4, h2hA: 0.8, h2hB: 0.9
  }
};

// --- ENGINE FIX DARI HTML ORI (diperbaiki) ---
function poissonLog(x, lambda) {
  if (lambda <= 0) return x === 0 ? 1 : 0;
  let logFact = 0;
  for (let i = 2; i <= x; i++) logFact += Math.log(i);
  return Math.exp(-lambda + x * Math.log(lambda) - logFact);
}

function toggleStatMode() {
  const modeEl = document.getElementById('statMode');
  if (!modeEl) return;
  const mode = modeEl.value;
  const labelA = document.getElementById('labelTeamAStat');
  const labelB = document.getElementById('labelTeamBStat');
  const nameA = document.getElementById('teamA')?.value || document.getElementById('tim1')?.value || 'Tim A';
  const nameB = document.getElementById('teamB')?.value || document.getElementById('tim2')?.value || 'Tim B';
  if (labelA) labelA.textContent = mode === 'total' ? `${nameA} (Total 5 Laga)` : `${nameA} (Rata-rata Per Laga)`;
  if (labelB) labelB.textContent = mode === 'total' ? `${nameB} (Total 5 Laga)` : `${nameB} (Rata-rata Per Laga)`;
  const h2hA = document.getElementById('labelH2HA'); if (h2hA) h2hA.textContent = `Rata-rata Gol ${nameA} vs ${nameB}`;
  const h2hB = document.getElementById('labelH2HB'); if (h2hB) h2hB.textContent = `Rata-rata Gol ${nameB} vs ${nameA}`;
}

function loadPreset(presetKey) {
  const data = presets[presetKey];
  if (!data) return;
  // Support 2 penamaan ID: teamA/tim1 dan oddsA/oddA
  const setVal = (id1, id2, val) => {
    const el = document.getElementById(id1) || document.getElementById(id2);
    if (el) el.value = val;
  };
  setVal('teamA', 'tim1', data.teamA);
  setVal('teamB', 'tim2', data.teamB);
  setVal('oddsA', 'oddA', data.oddsA);
  setVal('oddsDraw', 'oddDraw', data.oddsDraw);
  setVal('oddsB', 'oddB', data.oddsB);
  setVal('statMode', 'statMode', data.statMode);
  setVal('gfA', 'gfA', data.gfA);
  setVal('gaA', 'gaA', data.gaA);
  setVal('gfB', 'gfB', data.gfB);
  setVal('gaB', 'gaB', data.gaB);
  setVal('h2hA', 'h2hA', data.h2hA);
  setVal('h2hB', 'h2hB', data.h2hB);
  toggleStatMode();
  hasilkanPrediksi();
}

// --- KODE KAMU: loadTeams() dipertahankan 100% dengan kompatibilitas ID ganda ---
async function loadTeams() {
  try {
    const res = await fetch('../data/teams.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    const select1 = document.getElementById('tim1') || document.getElementById('teamA');
    const select2 = document.getElementById('tim2') || document.getElementById('teamB');
    if (!select1 || !select2) return;

    select1.innerHTML = '';
    select2.innerHTML = '';

    for (const [liga, daftarKlub] of Object.entries(data)) {
      const group1 = document.createElement('optgroup');
      group1.label = liga;
      const group2 = document.createElement('optgroup');
      group2.label = liga;

      daftarKlub.forEach(namaTim => {
        const opt1 = document.createElement('option');
        opt1.value = namaTim; opt1.textContent = namaTim; group1.appendChild(opt1);
        const opt2 = document.createElement('option');
        opt2.value = namaTim; opt2.textContent = namaTim; group2.appendChild(opt2);
      });
      select1.appendChild(group1);
      select2.appendChild(group2);
    }

    if (select1.options.length > 0) select1.selectedIndex = 0;
    if (select2.options.length > 1) select2.selectedIndex = 1;

    const statusEl = document.getElementById('statusTeams') || document.getElementById('hasilPrediksi');
    if (statusEl && statusEl.id === 'statusTeams') {
      statusEl.innerHTML = `✅ ${select1.options.length} tim dimuat dari teams.json`;
    }

  } catch (err) {
    console.error('Gagal load teams:', err);
    const container = document.getElementById('hasilPrediksi');
    if (container) {
      // Jangan overwrite jika itu adalah container hasil utama HTML ori
      if (container.id === 'hasilPrediksi' && container.classList.contains('hidden')) {
        // biarkan, akan di-handle di statusTeams
      } else {
        container.textContent = 'Gagal load data tim: ' + err.message;
      }
    }
    const statusEl = document.getElementById('statusTeams');
    if (statusEl) statusEl.textContent = 'Gagal load teams.json, pakai input manual: ' + err.message;
  }
}

// --- HELPER BARU: EV & Badge (dari HTML ori v3) ---
function calcEV(prob, odds) {
  return (prob * odds - 1) * 100;
}
function getEVBadgeClass(ev) {
  if (ev > 5) return 'ev-value';
  if (ev > 0) return 'ev-plus';
  return 'ev-minus';
}

// --- CORE: hasilkanPrediksi() = KODE KAMU + ENGINE POISSON HTML ORI ---
function hasilkanPrediksi() {
  // Support ID ganda: tim1/teamA, tim2/teamB, oddA/oddsA
  const tim1 = document.getElementById('tim1')?.value || document.getElementById('teamA')?.value;
  const tim2 = document.getElementById('tim2')?.value || document.getElementById('teamB')?.value;
  const odds1 = parseFloat(document.getElementById('oddA')?.value || document.getElementById('oddsA')?.value);
  const oddsDraw = parseFloat(document.getElementById('oddDraw')?.value);
  const odds2 = parseFloat(document.getElementById('oddB')?.value || document.getElementById('oddsB')?.value);
  const hasilDiv = document.getElementById('hasilPrediksi');

  if (!tim1 || !tim2) {
    alert('Pilih Tim 1 dan Tim 2 dulu!');
    return;
  }
  if (tim1 === tim2) {
    alert('Tim 1 dan Tim 2 tidak boleh sama!');
    return;
  }
  if (isNaN(odds1) || isNaN(oddsDraw) || isNaN(odds2) || odds1 <= 1 || oddsDraw <= 1 || odds2 <= 1) {
    alert('Isi semua Odds dengan benar! Contoh: 2.10, 3.40, 1.95');
    return;
  }

  // 1. HITUNG PASAR (dari kode kamu - dipertahankan)
  const p1 = 1 / odds1;
  const pDraw = 1 / oddsDraw;
  const p2 = 1 / odds2;
  const totalMarket = p1 + pDraw + p2;
  const prob1M = (p1 / totalMarket);
  const probDrawM = (pDraw / totalMarket);
  const prob2M = (p2 / totalMarket);
  const margin = (totalMarket - 1) * 100;

  // 2. HITUNG POISSON (diambil dari HTML ori + FIX v3)
  const statMode = document.getElementById('statMode')?.value || 'total';
  let gfA = parseFloat(document.getElementById('gfA')?.value) || 0;
  let gaA = parseFloat(document.getElementById('gaA')?.value) || 0;
  let gfB = parseFloat(document.getElementById('gfB')?.value) || 0;
  let gaB = parseFloat(document.getElementById('gaB')?.value) || 0;
  if (statMode === 'total') { gfA /= 5; gaA /= 5; gfB /= 5; gaB /= 5; }
  const h2hA = parseFloat(document.getElementById('h2hA')?.value) || 1.0;
  const h2hB = parseFloat(document.getElementById('h2hB')?.value) || 1.0;
  const homeAdv = document.getElementById('homeAdv')?.checked || false;

  let xgA = Math.max(0.2, (gfA * 0.4) + (gaB * 0.4) + (h2hA * 0.2));
  let xgB = Math.max(0.2, (gfB * 0.4) + (gaA * 0.4) + (h2hB * 0.2));
  if (homeAdv) xgA *= 1.15;

  let probAWin = 0, probDraw = 0, probBWin = 0;
  let probOver15 = 0, probOver25 = 0, probOver35 = 0;
  const scoreMatrix = [];
  let totalProb = 0;
  const rho = 0.13; // Dixon-Coles

  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= 6; j++) {
      let pA = poissonLog(i, xgA);
      let pB = poissonLog(j, xgB);
      let pCombined = pA * pB;
      // Koreksi Dixon-Coles untuk skor rendah
      if (i <= 1 && j <= 1) {
        if (i == 0 && j == 0) pCombined *= 1 - (xgB * rho);
        else if (i == 0 && j == 1) pCombined *= 1 + (xgA * rho);
        else if (i == 1 && j == 0) pCombined *= 1 + (xgB * rho);
        else if (i == 1 && j == 1) pCombined *= 1 - rho;
      }
      totalProb += pCombined;
      if (i > j) probAWin += pCombined;
      else if (i === j) probDraw += pCombined;
      else probBWin += pCombined;
      const tot = i + j;
      if (tot > 1.5) probOver15 += pCombined;
      if (tot > 2.5) probOver25 += pCombined;
      if (tot > 3.5) probOver35 += pCombined;
      scoreMatrix.push({ score: `${i} - ${j}`, i, j, prob: pCombined });
    }
  }
  // NORMALISASI 100% (fix dari v2)
  probAWin /= totalProb; probDraw /= totalProb; probBWin /= totalProb;
  probOver15 /= totalProb; probOver25 /= totalProb; probOver35 /= totalProb;
  scoreMatrix.forEach(s => s.prob /= totalProb);
  scoreMatrix.sort((a, b) => b.prob - a.prob);

  // 3. EV Calculation
  const evA = calcEV(probAWin, odds1);
  const evDraw = calcEV(probDraw, oddsDraw);
  const evB = calcEV(probBWin, odds2);

  // 4. RENDER - Kompatibel dengan 2 jenis HTML
  // Jika HTML ori v2/v3 dengan element2 detail ada, update element tersebut
  const tryUpdate = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  tryUpdate('resTeamA', tim1); tryUpdate('resTeamB', tim2);
  tryUpdate('txtTeamA', tim1); tryUpdate('txtTeamB', tim2);
  tryUpdate('xgA', xgA.toFixed(2)); tryUpdate('xgB', xgB.toFixed(2));
  tryUpdate('probA', (probAWin * 100).toFixed(1) + '%');
  tryUpdate('probDraw', (probDraw * 100).toFixed(1) + '%');
  tryUpdate('probB', (probBWin * 100).toFixed(1) + '%');
  tryUpdate('impliedA', `Pasar: ${(prob1M * 100).toFixed(1)}%`);
  tryUpdate('impliedDraw', `Pasar: ${(probDrawM * 100).toFixed(1)}%`);
  tryUpdate('impliedB', `Pasar: ${(prob2M * 100).toFixed(1)}%`);
  tryUpdate('ou15Over', (probOver15 * 100).toFixed(1) + '%');
  tryUpdate('ou15Under', ((1 - probOver15) * 100).toFixed(1) + '%');
  tryUpdate('ou25Over', (probOver25 * 100).toFixed(1) + '%');
  tryUpdate('ou25Under', ((1 - probOver25) * 100).toFixed(1) + '%');
  tryUpdate('ou35Over', (probOver35 * 100).toFixed(1) + '%');
  tryUpdate('ou35Under', ((1 - probOver35) * 100).toFixed(1) + '%');
  tryUpdate('topScoreline', scoreMatrix[0].score);
  const topProbEl = document.getElementById('topScoreProb');
  if (topProbEl) topProbEl.innerHTML = `Peluang: <span class="text-slate-200 font-semibold">${(scoreMatrix[0].prob * 100).toFixed(1)}%</span>`;

  // EV badges
  const evAEl = document.getElementById('evA'); if (evAEl) evAEl.textContent = `EV ${evA.toFixed(1)}%${evA > 5 ? ' VALUE!' : ''}`;
  const evDrawEl = document.getElementById('evDraw'); if (evDrawEl) evDrawEl.textContent = `EV ${evDraw.toFixed(1)}%${evDraw > 5 ? ' VALUE!' : ''}`;
  const evBEl = document.getElementById('evB'); if (evBEl) evBEl.textContent = `EV ${evB.toFixed(1)}%${evB > 5 ? ' VALUE!' : ''}`;

  // Top scores list
  const topList = document.getElementById('topScoresList');
  if (topList) {
    topList.innerHTML = '';
    scoreMatrix.slice(0, 5).forEach((item, index) => {
      const pct = (item.prob * 100).toFixed(1);
      const div = document.createElement('div');
      div.className = `p-3 rounded-xl border text-center ${index === 0 ? 'bg-slate-950 border-emerald-500/50 ring-1 ring-emerald-500/30' : 'bg-slate-950/60 border-slate-800'}`;
      div.innerHTML = `<span class="text-[10px] text-slate-400 block mb-0.5">Rank #${index + 1}</span><span class="text-base font-black ${index === 0 ? 'text-emerald-400' : 'text-white'} block">${item.score}</span><span class="text-xs text-slate-300 font-semibold mt-1 block">${pct}%</span>`;
      topList.appendChild(div);
    });
  }

  // Over/Under recommendation
  const ouRec = document.getElementById('ouRecommendation');
  const ouConf = document.getElementById('ouConfidence');
  if (ouRec && ouConf) {
    if (probOver25 >= 0.5) {
      ouRec.textContent = "OVER 2.5 GOL"; ouRec.className = "text-lg font-extrabold text-emerald-400";
      ouConf.innerHTML = `Probabilitas: <span class="text-slate-200 font-semibold">${(probOver25 * 100).toFixed(1)}%</span>`;
    } else {
      ouRec.textContent = "UNDER 2.5 GOL"; ouRec.className = "text-lg font-extrabold text-cyan-400";
      ouConf.innerHTML = `Probabilitas: <span class="text-slate-200 font-semibold">${((1 - probOver25) * 100).toFixed(1)}%</span>`;
    }
  }

  // 5. RENDER UTAMA UNTUK FILE JS ORI (hasilPrediksi div sederhana kamu)
  // Ini yang akan tampil jika pakai HTML sederhana kamu
  let prediksi = '';
  let pemenang = '';
  if (prob1M > prob2M && prob1M > probDrawM) {
    prediksi = `${tim1} lebih diunggulkan menang`;
    pemenang = tim1;
  } else if (prob2M > prob1M && prob2M > probDrawM) {
    prediksi = `${tim2} lebih diunggulkan menang`;
    pemenang = tim2;
  } else {
    prediksi = `Pertandingan berpotensi SERI`;
    pemenang = 'Seri';
  }

  // Jika ada canvas heatmap, gambar juga
  const canvas = document.getElementById('scoreHeatmap');
  if (canvas && typeof Chart !== 'undefined') {
    const ctx = canvas.getContext('2d');
    const bubbleData = scoreMatrix.map(s => ({ x: s.i, y: s.j, r: Math.max(3, s.prob * 100 * 2.5) }));
    if (window.heatmapChart) window.heatmapChart.destroy();
    window.heatmapChart = new Chart(ctx, {
      type: 'bubble',
      data: { datasets: [{ label: 'Prob %', data: bubbleData, backgroundColor: bubbleData.map(d => d.r > 12 ? 'rgba(16,185,129,0.9)' : d.r > 7 ? 'rgba(6,182,212,0.7)' : 'rgba(100,116,139,0.5)'), borderWidth: 1 }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `Skor ${c.raw.x}-${c.raw.y}: ${(scoreMatrix.find(s => s.i === c.raw.x && s.j === c.raw.y).prob * 100).toFixed(2)}%` } } },
        scales: { x: { title: { display: true, text: 'Gol Tuan Rumah (A)' }, min: -0.5, max: 6.5 }, y: { title: { display: true, text: 'Gol Tamu (B)' }, min: -0.5, max: 6.5 } }
      }
    });
  }

  if (hasilDiv) {
    // Jika div ini adalah yang di HTML sederhana (bukan hidden), tampilkan versi gabungan
    // Deteksi: kalau ada class hidden atau di HTML collab, kita jangan overwrite dengan versi simple
    const isSimpleMode = !document.getElementById('probA'); // kalau tidak ada element probA, berarti HTML sederhana

    if (isSimpleMode || hasilDiv.innerHTML.trim() === '' || hasilDiv.classList.contains('force-simple')) {
      hasilDiv.classList.remove('hidden');
      hasilDiv.innerHTML = `
        <div style="margin-top:20px; padding:15px; background:#f8f9fa; border-radius:8px; border-left:4px solid #0d6efd; color:#212529;">
          <h3 style="margin-top:0;">${tim1} vs ${tim2}</h3>
          <p style="font-size:18px; font-weight:bold;">${prediksi} (Pasar)</p>
          <p>Probabilitas Pasar (setelah normalisasi margin ${margin.toFixed(2)}%):</p>
          <ul>
            <li>${tim1}: ${(prob1M * 100).toFixed(1)}%</li>
            <li>Seri: ${(probDrawM * 100).toFixed(1)}%</li>
            <li>${tim2}: ${(prob2M * 100).toFixed(1)}%</li>
          </ul>
          <hr style="margin:12px 0;">
          <h4 style="margin:0 0 8px 0;">Model Poisson v3 (xG ${xgA.toFixed(2)} vs ${xgB.toFixed(2)})</h4>
          <ul>
            <li>Model 1: ${(probAWin * 100).toFixed(1)}% | EV: ${evA.toFixed(1)}% ${evA > 5 ? '🔥 VALUE!' : ''}</li>
            <li>Seri: ${(probDraw * 100).toFixed(1)}% | EV: ${evDraw.toFixed(1)}% ${evDraw > 5 ? '🔥 VALUE!' : ''}</li>
            <li>Model 2: ${(probBWin * 100).toFixed(1)}% | EV: ${evB.toFixed(1)}% ${evB > 5 ? '🔥 VALUE!' : ''}</li>
          </ul>
          <p>Top Skor: ${scoreMatrix[0].score} (${(scoreMatrix[0].prob * 100).toFixed(1)}%)</p>
          <p>Over 2.5: ${(probOver25 * 100).toFixed(1)}% | Under 2.5: ${((1 - probOver25) * 100).toFixed(1)}%</p>
          <p style="font-size:12px; color:#666;">Odds: ${odds1} | ${oddsDraw} | ${odds2} | xG HomeAdv: ${homeAdv ? 'Ya (+15%)' : 'Tidak'}</p>
        </div>
      `;
      hasilDiv.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Mode HTML ori lengkap - update simple box saja jika ada
      const simpleBox = document.getElementById('simpleOddsBox');
      if (simpleBox) {
        simpleBox.innerHTML = `<div><span class="text-xs text-slate-400">Pasar Implied (kode JS kamu)</span><p class="font-bold mt-1">${prediksi}</p><p class="text-xs mt-1 text-slate-400">${tim1} ${(prob1M * 100).toFixed(1)}% | Seri ${(probDrawM * 100).toFixed(1)}% | ${tim2} ${(prob2M * 100).toFixed(1)}% | Margin ${margin.toFixed(2)}%</p></div>`;
      }
    }
  }

  // Simpan data global untuk akses lain jika perlu
  window.lastPrediction = {
    tim1, tim2, odds: { odds1, oddsDraw, odds2 },
    market: { prob1M, probDrawM, prob2M, margin },
    poisson: { xgA, xgB, probAWin, probDraw, probBWin, probOver15, probOver25, probOver35, scoreMatrix },
    ev: { evA, evDraw, evB }
  };
}

// Alias untuk kompatibilitas HTML ori yang memanggil calculatePrediction()
function calculatePrediction() {
  return hasilkanPrediksi();
}

document.addEventListener('DOMContentLoaded', () => {
  loadTeams();
  const btn = document.getElementById('btnPrediksi');
  if (btn) {
    btn.addEventListener('click', hasilkanPrediksi);
  }
  // Jika ada form dengan onsubmit yang lama, tetap support
  const form = document.getElementById('predictorForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      hasilkanPrediksi();
    });
  }
  toggleStatMode();
});
