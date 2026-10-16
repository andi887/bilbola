// =========================================================
// v4.1 - GENERATOR FIX UNIFIED (pakai firestore-service.js)
// Copy file ini menjadi /js/generator.js
// =========================================================

import { initFirestore, savePrediction, isFirestoreConnected } from "./firestore-service.js";

// UI status
let dbReady = false;
function updateFirebaseStatus(text, bg) {
  const el = document.getElementById('firebaseStatus');
  if (el) { 
    el.textContent = text; 
    if (bg) el.style.background = bg; 
  }
}

// ================= LOGIC ORI TETAP 100% =================
let matchCount = 1;
const MAX_MATCHES = 5;
let teamsDataCache = null;

function poissonLog(x, lambda){
  if(lambda<=0) return x===0?1:0;
  let logFact=0; for(let i=2;i<=x;i++) logFact+=Math.log(i);
  return Math.exp(-lambda + x*Math.log(lambda) - logFact);
}

window.syncStats = function(idx,team,type){
  const t = event ? event.target : null;
  if(type==='GF'){
    const total = document.getElementById(`gf_${idx}_${team}_total`);
    const avg = document.getElementById(`gf_${idx}_${team}_avg`);
    if(!total||!avg) return;
    if(t===total){ const v=parseFloat(total.value); if(!isNaN(v)) avg.value=(v/5).toFixed(2); }
    else if(t===avg){ const v=parseFloat(avg.value); if(!isNaN(v)) total.value=(v*5).toFixed(1); }
  }
  if(type==='GA'){
    const total = document.getElementById(`ga_${idx}_${team}_total`);
    const avg = document.getElementById(`ga_${idx}_${team}_avg`);
    if(!total||!avg) return;
    if(t===total){ const v=parseFloat(total.value); if(!isNaN(v)) avg.value=(v/5).toFixed(2); }
    else if(t===avg){ const v=parseFloat(avg.value); if(!isNaN(v)) total.value=(v*5).toFixed(1); }
  }
  window.updateXgPreview(idx);
}

window.updateXgPreview = function(idx){
  const gfATotal = parseFloat(document.getElementById(`gf_${idx}_A_total`)?.value) || 0;
  const gaATotal = parseFloat(document.getElementById(`ga_${idx}_A_total`)?.value) || 0;
  const gfBTotal = parseFloat(document.getElementById(`gf_${idx}_B_total`)?.value) || 0;
  const gaBTotal = parseFloat(document.getElementById(`ga_${idx}_B_total`)?.value) || 0;
  const h2hA = parseFloat(document.getElementById(`h2hA_${idx}`)?.value) || 1.8;
  const h2hB = parseFloat(document.getElementById(`h2hB_${idx}`)?.value) || 1.6;
  const homeAdv = document.getElementById(`homeAdv_${idx}`)?.checked;
  let gfA = gfATotal/5, gaA = gaATotal/5, gfB = gfBTotal/5, gaB = gaBTotal/5;
  let xgA = Math.max(0.2,(gfA*0.4)+(gaB*0.4)+(h2hA*0.2));
  let xgB = Math.max(0.2,(gfB*0.4)+(gaA*0.4)+(h2hB*0.2));
  if(homeAdv) xgA*=1.15;
  const preview = document.getElementById(`xgPreview_${idx}`);
  if(preview) preview.innerHTML = `xG: <span style="color:#db2777;">${xgA.toFixed(2)}</span> - <span style="color:#7c3aed;">${xgB.toFixed(2)}</span>`;
}

async function loadTeams(){
  try{
    const res=await fetch('../data/teams.json');
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    teamsDataCache=await res.json();
    const teams=teamsDataCache.teams||teamsDataCache;
    document.querySelectorAll('select[id^="tim1_"], select[id^="tim2_"]').forEach(sel=>{
      sel.innerHTML='';
      teams.forEach(t=>{
        const opt=document.createElement('option');
        opt.value=t.name||t; opt.textContent=t.name||t; sel.appendChild(opt);
      });
    });
    document.getElementById('statusTeams') && (document.getElementById('statusTeams').textContent=`✅ ${teams.length} tim loaded`);
  }catch(err){
    console.error(err);
    document.getElementById('statusTeams') && (document.getElementById('statusTeams').textContent=`❌ Gagal load teams.json: ${err.message}`);
  }
}

function createMatchCard(idx){
  let ouInputsHtml = '';
  const defaultLines = [2.5, 2.75, 3.0, 3.25];
  for (let i = 1; i <= 4; i++) {
    ouInputsHtml += `
      <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px; align-items:end; background:#ffffff; padding:8px; border-radius:8px; border:1px solid #bbf7d0;">
        <div>
          <label style="font-size:10px; font-weight:700; color:#15803d; display:block; margin-bottom:2px;">Line ${i}</label>
          <input type="number" step="0.25" id="ou_line_${i}_${idx}" value="${defaultLines[i-1]}" style="width:100%; background:#f0fdf4; border:1px solid #86efac; border-radius:4px; padding:6px; font-size:12px; font-weight:700; color:#15803d; text-align:center;">
        </div>
        <div>
          <label style="font-size:10px; font-weight:700; color:#15803d; display:block; margin-bottom:2px;">Odds Over</label>
          <input type="number" step="0.01" id="ou_o_${i}_${idx}" placeholder="1.90" style="width:100%; background:#f0fdf4; border:1px solid #86efac; border-radius:4px; padding:6px; font-size:12px; font-weight:700; color:#15803d; text-align:center;">
        </div>
        <div>
          <label style="font-size:10px; font-weight:700; color:#b91c1c; display:block; margin-bottom:2px;">Odds Under</label>
          <input type="number" step="0.01" id="ou_u_${i}_${idx}" placeholder="1.95" style="width:100%; background:#fef2f2; border:1px solid #fca5a5; border-radius:4px; padding:6px; font-size:12px; font-weight:700; color:#b91c1c; text-align:center;">
        </div>
      </div>
    `;
  }
  return `
  <div id="matchCard_${idx}" class="match-card" data-idx="${idx}" style="margin-bottom:20px; padding:16px; border:1px solid #f9a8d4; border-radius:16px; background:#ffffff; box-shadow:0 4px 12px rgba(236,72,153,0.15); position:relative;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <h3 style="margin:0; font-size:14px; font-weight:800; color:#831843;"><i class="fa-solid fa-futbol" style="color:#ec4899;"></i> Pertandingan ${idx} <span id="xgPreview_${idx}" style="font-size:11px; font-weight:400; margin-left:8px; color:#be185d;">xG: 1.84 - 1.72</span></h3>
      <div style="display:flex; gap:6px;">
        ${idx>1?`<button type="button" onclick="hapusPrediksi(${idx})" style="background:#ffe4e6; color:#be123c; border:1px solid #fecdd3; padding:4px 10px; border-radius:8px; font-size:11px; cursor:pointer;"><i class="fa-solid fa-trash"></i> Hapus</button>`:''}
        <span style="background:#fce7f3; border:1px solid #f9a8d4; padding:4px 8px; border-radius:8px; font-size:11px; color:#be185d;">#${idx}/5</span>
      </div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
      <div><label style="font-size:11px; color:#9d174d; font-weight:600;">Tuan Rumah (Tim 1)</label><select id="tim1_${idx}" style="width:100%; margin-top:4px; background:#fff1f2; border:1px solid #f9a8d4; border-radius:8px; padding:8px; color:#831843; font-weight:600;"></select></div>
      <div><label style="font-size:11px; color:#9d174d; font-weight:600;">Tamu (Tim 2)</label><select id="tim2_${idx}" style="width:100%; margin-top:4px; background:#fff1f2; border:1px solid #f9a8d4; border-radius:8px; padding:8px; color:#831843; font-weight:600;"></select></div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:14px;">
      <div><label style="font-size:11px; color:#9d174d;">Odds A (1)</label><input type="number" step="0.01" id="oddA_${idx}" value="2.10" style="width:100%; margin-top:4px; background:#fff7f8; border:1px solid #f9a8d4; border-radius:8px; padding:8px; color:#db2777; font-weight:700; text-align:center;"></div>
      <div><label style="font-size:11px; color:#9d174d;">Odds Seri (X)</label><input type="number" step="0.01" id="oddDraw_${idx}" value="3.60" style="width:100%; margin-top:4px; background:#fff7f8; border:1px solid #f9a8d4; border-radius:8px; padding:8px; color:#d97706; font-weight:700; text-align:center;"></div>
      <div><label style="font-size:11px; color:#9d174d;">Odds B (2)</label><input type="number" step="0.01" id="oddB_${idx}" value="3.20" style="width:100%; margin-top:4px; background:#fff7f8; border:1px solid #f9a8d4; border-radius:8px; padding:8px; color:#7c3aed; font-weight:700; text-align:center;"></div>
    </div>
    <div style="background:#f0fdf4; padding:12px; border-radius:12px; border:1px solid #bbf7d0; margin-bottom:14px;">
      <div style="font-size:12px; font-weight:700; color:#15803d; margin-bottom:8px; display:flex; align-items:center; gap:6px;"><i class="fa-solid fa-sliders"></i> Input Odds Over/Under (4 Line)</div>
      <div style="display:grid; grid-template-columns: 1fr; gap:8px;">${ouInputsHtml}</div>
    </div>
    <div style="background:#fdf2f8; padding:12px; border-radius:12px; border:1px solid #fbcfe8;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-size:12px; font-weight:700; color:#831843;"><i class="fa-solid fa-chart-simple" style="color:#ec4899;"></i> Statistik Manual</span>
        <label style="font-size:11px; color:#9d174d; display:flex; align-items:center; gap:4px; cursor:pointer;"><input type="checkbox" id="homeAdv_${idx}" checked onchange="updateXgPreview(${idx})" style="accent-color:#ec4899;"> Home +15%</label>
      </div>
      <div style="background:#ffffff; padding:12px; border-radius:10px; border:1px solid #f9a8d4; margin-bottom:10px;">
        <div style="font-size:11px; font-weight:700; color:#db2777; margin-bottom:10px;">Tim A - 5 Laga Terakhir</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
          <div><label style="font-size:10px; color:#be185d;">GF Total</label><input type="number" step="0.1" id="gf_${idx}_A_total" value="11" oninput="syncStats(${idx},'A','GF')" style="width:100%; margin-top:4px; background:#ffffff; border:1px solid #f9a8d4; border-radius:6px; padding:8px;"></div>
          <div><label style="font-size:10px; color:#be185d;">GF Avg</label><input type="number" step="0.01" id="gf_${idx}_A_avg" value="2.20" oninput="syncStats(${idx},'A','GF')" style="width:100%; margin-top:4px; background:#ffffff; border:1px solid #f9a8d4; border-radius:6px; padding:8px;"></div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div><label style="font-size:10px; color:#9f1239;">GA Total</label><input type="number" step="0.1" id="ga_${idx}_A_total" value="4" oninput="syncStats(${idx},'A','GA')" style="width:100%; margin-top:4px; background:#ffffff; border:1px solid #f9a8d4; border-radius:6px; padding:8px;"></div>
          <div><label style="font-size:10px; color:#9f1239;">GA Avg</label><input type="number" step="0.01" id="ga_${idx}_A_avg" value="0.80" oninput="syncStats(${idx},'A','GA')" style="width:100%; margin-top:4px; background:#ffffff; border:1px solid #f9a8d4; border-radius:6px; padding:8px;"></div>
        </div>
      </div>
      <div style="background:#ffffff; padding:12px; border-radius:10px; border:1px solid #f9a8d4; margin-bottom:10px;">
        <div style="font-size:11px; font-weight:700; color:#7c3aed; margin-bottom:10px;">Tim B - 5 Laga Terakhir</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
          <div><label style="font-size:10px; color:#6d28d9;">GF Total</label><input type="number" step="0.1" id="gf_${idx}_B_total" value="13" oninput="syncStats(${idx},'B','GF')" style="width:100%; margin-top:4px; background:#ffffff; border:1px solid #f9a8d4; border-radius:6px; padding:8px;"></div>
          <div><label style="font-size:10px; color:#6d28d9;">GF Avg</label><input type="number" step="0.01" id="gf_${idx}_B_avg" value="2.60" oninput="syncStats(${idx},'B','GF')" style="width:100%; margin-top:4px; background:#ffffff; border:1px solid #f9a8d4; border-radius:6px; padding:8px;"></div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div><label style="font-size:10px; color:#9f1239;">GA Total</label><input type="number" step="0.1" id="ga_${idx}_B_total" value="6" oninput="syncStats(${idx},'B','GA')" style="width:100%; margin-top:4px; background:#ffffff; border:1px solid #f9a8d4; border-radius:6px; padding:8px;"></div>
          <div><label style="font-size:10px; color:#9f1239;">GA Avg</label><input type="number" step="0.01" id="ga_${idx}_B_avg" value="1.20" oninput="syncStats(${idx},'B','GA')" style="width:100%; margin-top:4px; background:#ffffff; border:1px solid #f9a8d4; border-radius:6px; padding:8px;"></div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div><label style="font-size:10px; color:#9d174d;">H2H xG A</label><input type="number" step="0.1" id="h2hA_${idx}" value="1.8" oninput="updateXgPreview(${idx})" style="width:100%; margin-top:4px; background:#ffffff; border:1px solid #f9a8d4; border-radius:6px; padding:8px;"></div>
        <div><label style="font-size:10px; color:#9d174d;">H2H xG B</label><input type="number" step="0.1" id="h2hB_${idx}" value="1.6" oninput="updateXgPreview(${idx})" style="width:100%; margin-top:4px; background:#ffffff; border:1px solid #f9a8d4; border-radius:6px; padding:8px;"></div>
      </div>
    </div>
    <div id="hasilPrediksi_${idx}" style="margin-top:12px;"></div>
  </div>
  `;
}

window.tambahPrediksi = function(){
  if(matchCount>=MAX_MATCHES){ alert(`Maksimal ${MAX_MATCHES}!`); return; }
  matchCount++;
  const container=document.getElementById('matchesContainer');
  container.insertAdjacentHTML('beforeend', createMatchCard(matchCount));
  loadTeams(); window.updateTambahButton(); window.updateXgPreview(matchCount);
}

window.hapusPrediksi = function(idx){
  if(document.querySelectorAll('.match-card').length<=1){ alert('Minimal 1!'); return; }
  document.getElementById(`matchCard_${idx}`)?.remove();
  matchCount=document.querySelectorAll('.match-card').length;
  window.updateTambahButton();
}

window.updateTambahButton = function(){
  const btn=document.getElementById('btnTambahPrediksi');
  if(!btn) return;
  const cur=document.querySelectorAll('.match-card').length || 1;
  const counter=document.getElementById('matchCounter');
  if(counter) counter.textContent=`${cur} pertandingan`;
  if(cur>=MAX_MATCHES){ btn.disabled=true; btn.style.opacity='0.5'; btn.innerHTML=`<i class="fa-solid fa-ban"></i> Maksimal ${MAX_MATCHES}`; }
  else{ btn.disabled=false; btn.style.opacity='1'; btn.innerHTML=`<i class="fa-solid fa-plus"></i> Tambah Prediksi (${cur}/${MAX_MATCHES})`; }
}

window.kembaliKeBeranda = function(){
  if(confirm('Yakin kembali ke beranda?')) window.location.href='../index.html';
}

function hitungSingle(idx){
  const tim1=document.getElementById(`tim1_${idx}`)?.value;
  const tim2=document.getElementById(`tim2_${idx}`)?.value;
  const odds1=parseFloat(document.getElementById(`oddA_${idx}`)?.value);
  const oddsDraw=parseFloat(document.getElementById(`oddDraw_${idx}`)?.value);
  const odds2=parseFloat(document.getElementById(`oddB_${idx}`)?.value);
  if(!tim1||!tim2||isNaN(odds1)) return null;

  const lines = [], oddsOver = [], oddsUnder = [];
  for (let i = 1; i <= 4; i++) {
    const lineVal = parseFloat(document.getElementById(`ou_line_${i}_${idx}`)?.value);
    const oVal = parseFloat(document.getElementById(`ou_o_${i}_${idx}`)?.value);
    const uVal = parseFloat(document.getElementById(`ou_u_${i}_${idx}`)?.value);
    if (!isNaN(lineVal) && lineVal > 0) {
      lines.push(lineVal);
      oddsOver.push(isNaN(oVal)?0:oVal);
      oddsUnder.push(isNaN(uVal)?0:uVal);
    }
  }

  const p1=1/odds1, pD=1/oddsDraw, p2=1/odds2;
  const totalM=p1+pD+p2;
  const prob1M=p1/totalM, probDM=pD/totalM, prob2M=p2/totalM;

  let gfATotal=parseFloat(document.getElementById(`gf_${idx}_A_total`)?.value) || 11;
  let gaATotal=parseFloat(document.getElementById(`ga_${idx}_A_total`)?.value) || 4;
  let gfBTotal=parseFloat(document.getElementById(`gf_${idx}_B_total`)?.value) || 13;
  let gaBTotal=parseFloat(document.getElementById(`ga_${idx}_B_total`)?.value) || 6;

  let gfA=gfATotal/5, gaA=gaATotal/5, gfB=gfBTotal/5, gaB=gaBTotal/5;
  let h2hA=parseFloat(document.getElementById(`h2hA_${idx}`)?.value) || 1.8;
  let h2hB=parseFloat(document.getElementById(`h2hB_${idx}`)?.value) || 1.6;
  const homeAdv=document.getElementById(`homeAdv_${idx}`)?.checked;
  let xgA=Math.max(0.2,(gfA*0.4)+(gaB*0.4)+(h2hA*0.2));
  let xgB=Math.max(0.2,(gfB*0.4)+(gaA*0.4)+(h2hB*0.2));
  if(homeAdv) xgA*=1.15;

  let probAWin=0,probDraw=0,probBWin=0, probOver25=0; const scoreMatrix=[]; let totalProb=0; const rho=0.13;
  for(let i=0;i<=6;i++) for(let j=0;j<=6;j++){
    let pA=poissonLog(i,xgA), pB=poissonLog(j,xgB), pC=pA*pB;
    if(i<=1&&j<=1){ if(i==0&&j==0) pC*=1-(xgB*rho); else if(i==0&&j==1) pC*=1+(xgA*rho); else if(i==1&&j==0) pC*=1+(xgB*rho); else if(i==1&&j==1) pC*=1-rho; }
    totalProb+=pC;
    if(i>j) probAWin+=pC; else if(i===j) probDraw+=pC; else probBWin+=pC;
    if((i+j)>2.5) probOver25+=pC;
    scoreMatrix.push({score:`${i}-${j}`, i,j, prob:pC});
  }
  probAWin/=totalProb; probDraw/=totalProb; probBWin/=totalProb; probOver25/=totalProb;
  scoreMatrix.forEach(s=>s.prob/=totalProb); scoreMatrix.sort((a,b)=>b.prob-a.prob);

  return {idx, tim1,tim2, odds1,oddsDraw,odds2, lines, oddsOver, oddsUnder, prob1M,probDM,prob2M, xgA,xgB, probAWin,probDraw,probBWin, probOver25, scoreMatrix, evA:(probAWin*odds1-1)*100, evD:(probDraw*oddsDraw-1)*100, evB:(probBWin*odds2-1)*100, gfATotal, gaATotal, gfBTotal, gaBTotal};
}

function buildFirestorePayload(data) {
  const now = new Date();
  const ouLines = data.lines.map((line, i) => ({
    line: line, over: data.oddsOver[i] || 0, under: data.oddsUnder[i] || 0
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
    waktu: now.toLocaleString('id-ID', {dateStyle:'full', timeStyle:'short'}), // <-- FIX untuk rekap.html
    waktuISO: now.toISOString()
  };
}

function renderSingle(data){
  const el=document.getElementById(`hasilPrediksi_${data.idx}`);
  if(!el) return;
  el.innerHTML=`
    <div style="padding:12px; background:#ffffff; border:1px solid #f9a8d4; border-radius:12px; color:#831843; font-size:12px; box-shadow:0 2px 8px rgba(236,72,153,0.1);">
      <div style="display:flex; justify-content:space-between;"><strong style="color:#831843;">${data.tim1} vs ${data.tim2}</strong><span style="background:#fce7f3; border:1px solid #f9a8d4; padding:2px 6px; border-radius:6px; font-size:10px;">xG ${data.xgA.toFixed(2)}-${data.xgB.toFixed(2)}</span></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">
        <div style="background:#fff1f2; padding:8px; border-radius:8px; border:1px solid #fecdd3;"><small style="color:#be185d;">Pasar</small><br>${data.tim1} ${(data.prob1M*100).toFixed(1)}%<br>Seri ${(data.probDM*100).toFixed(1)}%<br>${data.tim2} ${(data.prob2M*100).toFixed(1)}%</div>
        <div style="background:#fdf2f8; padding:8px; border-radius:8px; border:1px solid #f9a8d4;"><small style="color:#be185d;">Model + EV</small><br>${data.tim1} ${(data.probAWin*100).toFixed(1)}% EV ${data.evA.toFixed(1)}%${data.evA>5?' 🔥':''}<br>Seri ${(data.probDraw*100).toFixed(1)}% EV ${data.evD.toFixed(1)}%<br>${data.tim2} ${(data.probBWin*100).toFixed(1)}% EV ${data.evB.toFixed(1)}%${data.evB>5?' 🔥':''}</div>
      </div>
      <div style="margin-top:8px; font-size:11px; display:flex; justify-content:space-between; color:#9d174d;"><span>Top: <strong style="color:#db2777;">${data.scoreMatrix[0].score}</strong> ${(data.scoreMatrix[0].prob*100).toFixed(1)}%</span><span>Over 2.5 ${(data.probOver25*100).toFixed(1)}%</span></div>
    </div>`;
}

window.hasilkanPrediksi = async function(){
  const btn = document.getElementById('btnPrediksi');
  if(btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; }
  updateFirebaseStatus('💾 Menyimpan prediksi...', '#fef3c7');

  const cards=document.querySelectorAll('.match-card');
  const all=[];
  try {
    if(cards.length===0){
      alert('Tidak ada kartu pertandingan!');
      return;
    }
    for(const card of cards){
      const idx=card.dataset.idx;
      const data=hitungSingle(idx);
      if(!data) continue;
      renderSingle(data); 
      all.push(data);
      // SIMPAN PAKAI SERVICE UNIFIED
      try {
        const payload = buildFirestorePayload(data);
        await savePrediction(payload);
        updateFirebaseStatus(`✅ ${data.tim1} vs ${data.tim2} tersimpan`, '#dcfce7');
      } catch (err) {
        console.error("Gagal simpan Firestore:", err);
        updateFirebaseStatus(`🔴 Gagal simpan: ${err.message}`, '#fee2e2');
        // Fallback localStorage
        const hist = JSON.parse(localStorage.getItem('histori_bilbola') || '[]');
        hist.unshift({ ...buildFirestorePayload(data), id: 'local-' + Date.now() });
        localStorage.setItem('histori_bilbola', JSON.stringify(hist.slice(0, 20)));
      }
    }

    const globalEl=document.getElementById('hasilSemuaPrediksi');
    if(globalEl && all.length>0){
      let html=`<div style="margin-top:16px; padding:16px; background:#ffffff; border:1px solid #f9a8d4; border-radius:16px; box-shadow:0 4px 12px rgba(236,72,153,0.15);"><h3 style="margin:0 0 12px 0; color:#831843; font-size:14px;">📋 Rekap ${all.length} Prediksi ${dbReady?'✅ Firestore':'⚠️ Lokal'}</h3><div style="display:grid; gap:8px;">`;
      all.forEach(r=>{ html+=`<div style="display:flex; justify-content:space-between; background:#fff1f2; padding:10px; border-radius:10px; border:1px solid #fecdd3;"><div><strong style="color:#831843;">${r.tim1} vs ${r.tim2}</strong><br><small style="color:#be185d;">Total GF ${r.gfATotal}/${r.gfBTotal} | Top ${r.scoreMatrix[0].score}</small></div><div><span style="background:#ec4899; color:#fff; padding:4px 8px; border-radius:6px; font-size:11px;">${r.probAWin>r.probBWin?r.tim1:r.tim2}</span></div></div>`; });
      html+=`</div><div style="margin-top:12px; text-align:center;"><a href="rekap.html" style="background:#be185d; color:#fff; padding:8px 16px; border-radius:8px; text-decoration:none; font-size:12px; font-weight:700;">Lihat di Halaman Rekap →</a></div></div>`;
      globalEl.innerHTML=html;
    }

  } finally {
    if(btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-calculator"></i> Hitung Semua'; }
  }
}

// INIT
document.addEventListener('DOMContentLoaded', async ()=>{
  document.body.style.background='#ffe4e6';
  document.body.style.backgroundImage='linear-gradient(135deg, #ffe4e6 0%, #fce7f3 50%, #fbcfe8 100%)';
  document.body.style.minHeight='100vh';
  updateFirebaseStatus('🔄 Menghubungkan Firestore...', '#fef3c7');

  let container=document.getElementById('matchesContainer');
  if(!container){
    const hasil=document.getElementById('hasilPrediksi');
    const wrapper=document.createElement('div');
    wrapper.innerHTML=`
      <div style="display:flex; justify-content:space-between; align-items:center; margin:16px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; gap:8px;">
          <button type="button" onclick="kembaliKeBeranda()" style="background:#ffffff; color:#831843; border:1px solid #f9a8d4; padding:8px 14px; border-radius:10px; font-size:12px; cursor:pointer;"><i class="fa-solid fa-house"></i> Kembali</button>
          <span id="matchCounter" style="background:#ffffff; border:1px solid #f9a8d4; padding:8px 12px; border-radius:10px; font-size:12px; color:#be185d;">1 pertandingan</span>
          <span id="firebaseStatus" style="background:#ffffff; border:1px solid #f9a8d4; padding:8px 12px; border-radius:10px; font-size:11px; color:#be185d;">🔄 Menghubungkan...</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" id="btnTambahPrediksi" onclick="tambahPrediksi()" style="background:#ec4899; color:#ffffff; border:none; padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer;"><i class="fa-solid fa-plus"></i> Tambah</button>
          <button type="button" id="btnPrediksi" onclick="hasilkanPrediksi()" style="background:#be185d; color:#fff; border:none; padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer;"><i class="fa-solid fa-calculator"></i> Hitung Semua</button>
        </div>
      </div>
      <div id="matchesContainer"></div>
      <div id="hasilSemuaPrediksi"></div>
      <div id="historiBox" style="display:none; margin:16px;"></div>
      <div id="statusTeams" style="margin:16px; font-size:11px; color:#be185d;"></div>
    `;
    if(hasil && hasil.parentNode){ hasil.parentNode.insertBefore(wrapper, hasil); }
    else { document.body.prepend(wrapper); }
    container=document.getElementById('matchesContainer');
  }
  if(container && container.children.length===0){ container.innerHTML=createMatchCard(1); matchCount=1; }
  
  try {
    await initFirestore();
    dbReady = true;
    updateFirebaseStatus(`🟢 Firestore: ${isFirestoreConnected() ? 'Connected' : 'Ready'}`, '#dcfce7');
  } catch (err) {
    updateFirebaseStatus(`🔴 ${err.message}`, '#fee2e2');
  }
  
  window.updateTambahButton();
  window.updateXgPreview(1);
  await loadTeams();
})
