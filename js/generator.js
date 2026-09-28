/ BILBOLA - Generator Final sesuai Flowchart (Odds + Statistik)
// Path file: js/generator.js

async function loadTeams() {
  try {
    const res = await fetch('../data/teams.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const sel1 = document.getElementById('tim1');
    const sel2 = document.getElementById('tim2');
    if (!sel1 || !sel2) return;
    sel1.innerHTML = ''; sel2.innerHTML = '';
    for (const [liga, daftarKlub] of Object.entries(data)) {
      const g1 = document.createElement('optgroup'); g1.label = liga;
      const g2 = document.createElement('optgroup'); g2.label = liga;
      daftarKlub.forEach(n => {
        g1.appendChild(new Option(n, n));
        g2.appendChild(new Option(n, n));
      });
      sel1.appendChild(g1);
      sel2.appendChild(g2);
    }
    if (sel1.options.length > 0) sel1.selectedIndex = 0;
    if (sel2.options.length > 1) sel2.selectedIndex = 1;
  } catch (e) {
    console.error('Gagal load teams', e);
  }
}

let STATS_CACHE = null;
async function getStats() {
  if (STATS_CACHE) return STATS_CACHE;
  try {
    const r = await fetch('../data/stats.json');
    if (!r.ok) return null;
    STATS_CACHE = await r.json();
    return STATS_CACHE;
  } catch { return null; }
}

function hitungForm(formArr) {
  if (!formArr || !formArr.length) return 0;
  let skor = 0;
  formArr.forEach(h => {
    if (h === 'W') skor += 3;
    else if (h === 'D') skor += 1;
  });
  return skor; // max 15
}

function hitungProbDariOdds(o1, oD, o2) {
  const p1 = 1 / o1;
  const pD = 1 / oD;
  const p2 = 1 / o2;
  const total = p1 + pD + p2;
  const vig = (total - 1) * 100;
  return {
    p1, pD, p2, total, vig,
    norm1: (p1/total)*100,
    normD: (pD/total)*100,
    norm2: (p2/total)*100
  };
}

function hitungProbStatistik(tim1, tim2, stats) {
  if (!stats || !stats[tim1] || !stats[tim2]) {
    return { s1: 33.33, sD: 33.33, s2: 33.33, detail: 'Statistik belum tersedia, pakai default' };
  }
  const t1 = stats[tim1];
  const t2 = stats[tim2];
  const form1 = hitungForm(t1.form);
  const form2 = hitungForm(t2.form);
  
  // Komponen: ELO (40%) + WinRate (30%) + Form (20%) + Gol (10%)
  const skor1 = (t1.elo/10)*0.4 + t1.winRate*0.3 + (form1/15*100)*0.2 + (t1.golRata*10)*0.1;
  const skor2 = (t2.elo/10)*0.4 + t2.winRate*0.3 + (form2/15*100)*0.2 + (t2.golRata*10)*0.1;
  const totalSkor = skor1 + skor2;
  
  // Cek H2H
  let h2hKey1 = `${tim1} vs ${tim2}`;
  let h2hKey2 = `${tim2} vs ${tim1}`;
  let h2h = null;
  if (stats._H2H) {
    h2h = stats._H2H[h2hKey1] || stats._H2H[h2hKey2] || null;
  }
  let bonusH2H1 = 0, bonusH2H2 = 0;
  if (h2h) {
    const totalMain = h2h.main || 10;
    const menang1 = h2h[tim1] || 0;
    const menang2 = h2h[tim2] || 0;
    bonusH2H1 = (menang1/totalMain)*5; // max +5
    bonusH2H2 = (menang2/totalMain)*5;
  }
  
  const final1 = skor1 + bonusH2H1;
  const final2 = skor2 + bonusH2H2;
  const totalFinal = final1 + final2;
  
  // Konversi ke probabilitas, sisakan 22% untuk seri (rata-rata seri di Eropa)
  const probSeriStat = 22;
  const sisa = 100 - probSeriStat;
  const s1 = (final1/totalFinal)*sisa;
  const s2 = (final2/totalFinal)*sisa;
  
  return {
    s1, s2, sD: probSeriStat,
    detail: `${tim1} Form:${t1.form.join('')} ELO:${t1.elo} | ${tim2} Form:${t2.form.join('')} ELO:${t2.elo}` + (h2h ? ` | H2H ${h2h[tim1]||0}-${h2h.Seri||0}-${h2h[tim2]||0}` : '')
  };
}

async function hasilkanPrediksi() {
  const tim1 = document.getElementById('tim1')?.value;
  const tim2 = document.getElementById('tim2')?.value;
  const odds1 = parseFloat(document.getElementById('oddA')?.value);
  const oddsDraw = parseFloat(document.getElementById('oddDraw')?.value);
  const odds2 = parseFloat(document.getElementById('oddB')?.value);
  const out = document.getElementById('hasilPrediksi');
  
  if (!tim1 || !tim2) { alert('Pilih tim dulu'); return; }
  if (tim1 === tim2) { alert('Tim tidak boleh sama'); return; }
  if (isNaN(odds1) || isNaN(oddsDraw) || isNaN(odds2)) { alert('Isi semua odds'); return; }

  const oddsCalc = hitungProbDariOdds(odds1, oddsDraw, odds2);
  const stats = await getStats();
  const statCalc = hitungProbStatistik(tim1, tim2, stats);

  // GABUNGKAN: 60% Odds (karena bandar punya data besar) + 40% Statistik kita
  const BOBOT_ODDS = 0.6;
  const BOBOT_STAT = 0.4;
  const akhir1 = (oddsCalc.norm1 * BOBOT_ODDS) + (statCalc.s1 * BOBOT_STAT);
  const akhirD = (oddsCalc.normD * BOBOT_ODDS) + (statCalc.sD * BOBOT_STAT);
  const akhir2 = (oddsCalc.norm2 * BOBOT_ODDS) + (statCalc.s2 * BOBOT_STAT);

  let prediksi = '';
  let warna = '#0d6efd';
  if (akhir1 > akhir2 && akhir1 > akhirD) { prediksi = `${tim1} MENANG`; warna = '#198754'; }
  else if (akhir2 > akhir1 && akhir2 > akhirD) { prediksi = `${tim2} MENANG`; warna = '#0d6efd'; }
  else { prediksi = 'SERI'; warna = '#fd7e14'; }

  out.innerHTML = `
    <div style="margin-top:20px; padding:16px; background:#fff; border-radius:12px; border:1px solid #ddd; border-left:6px solid ${warna}; box-shadow:0 2px 8px rgba(0,0,0,0.06)">
      <h3 style="margin:0 0 8px 0;">${tim1} vs ${tim2}</h3>
      <p style="margin:0; font-size:20px; font-weight:800; color:${warna}">${prediksi}</p>
      <hr style="margin:12px 0; border:none; border-top:1px solid #eee">
      <p style="margin:4px 0; font-size:14px;"><b>Probabilitas Akhir (Odds 60% + Statistik 40%):</b><br>
      ${tim1}: <b>${akhir1.toFixed(1)}%</b> | Seri: <b>${akhirD.toFixed(1)}%</b> | ${tim2}: <b>${akhir2.toFixed(1)}%</b></p>
      <details style="margin-top:10px; font-size:13px; color:#555">
        <summary>Lihat detail perhitungan (sesuai flowchart)</summary>
        <ul style="margin:8px 0; padding-left:18px;">
          <li>Implied dari Odds: ${oddsCalc.p1.toFixed(3)} | ${oddsCalc.pD.toFixed(3)} | ${oddsCalc.p2.toFixed(3)}</li>
          <li>Total Prob: ${oddsCalc.total.toFixed(3)} -> Margin Bandar (Vig): ${oddsCalc.vig.toFixed(2)}%</li>
          <li>Normalisasi Odds: ${oddsCalc.norm1.toFixed(1)}% | ${oddsCalc.normD.toFixed(1)}% | ${oddsCalc.norm2.toFixed(1)}%</li>
          <li>Prob Statistik: ${statCalc.s1.toFixed(1)}% | ${statCalc.sD.toFixed(1)}% | ${statCalc.s2.toFixed(1)}%</li>
          <li>${statCalc.detail}</li>
        </ul>
      </details>
    </div>
  `;
  out.scrollIntoView({behavior:'smooth'});
}

document.addEventListener('DOMContentLoaded', () => {
  loadTeams();
  document.getElementById('btnPrediksi')?.addEventListener('click', hasilkanPrediksi);
});
