// =========================================================
// v3.4 DUAL MODE - Total 5 Laga & Rata-rata/Laga tampil bersamaan
// =========================================================
let matchCount = 1;
const MAX_MATCHES = 5;
let teamsDataCache = null;

function poissonLog(x, lambda){
  if(lambda<=0) return x===0?1:0;
  let logFact=0; for(let i=2;i<=x;i++) logFact+=Math.log(i);
  return Math.exp(-lambda + x*Math.log(lambda) - logFact);
}

// Sync function: ketika total diubah, avg otomatis, dan sebaliknya
function syncStats(idx, team, type){
  // team = A atau B, type = GF atau GA, field = total atau avg
  const totalEl = document.getElementById(`${type}_${idx}_${team}_total`) || document.getElementById(`gfA_${idx}`); // fallback
  // Implementasi generik untuk dual input
  const gfTotal = document.getElementById(`gf_${idx}_${team}_total`);
  const gfAvg = document.getElementById(`gf_${idx}_${team}_avg`);
  const gaTotal = document.getElementById(`ga_${idx}_${team}_total`);
  const gaAvg = document.getElementById(`ga_${idx}_${team}_avg`);

  if(team==='A' || team==='B'){
    // Sync GF
    if(type==='GF'){
      const tEl = document.getElementById(`gf_${idx}_${team}_total`);
      const aEl = document.getElementById(`gf_${idx}_${team}_avg`);
      if(!tEl||!aEl) return;
      if(event && event.target===tEl){
        const v=parseFloat(tEl.value); if(!isNaN(v)) aEl.value=(v/5).toFixed(2);
      }else if(event && event.target===aEl){
        const v=parseFloat(aEl.value); if(!isNaN(v)) tEl.value=(v*5).toFixed(1);
      }
    }
    if(type==='GA'){
      const tEl = document.getElementById(`ga_${idx}_${team}_total`);
      const aEl = document.getElementById(`ga_${idx}_${team}_avg`);
      if(!tEl||!aEl) return;
      if(event && event.target===tEl){
        const v=parseFloat(tEl.value); if(!isNaN(v)) aEl.value=(v/5).toFixed(2);
      }else if(event && event.target===aEl){
        const v=parseFloat(aEl.value); if(!isNaN(v)) tEl.value=(v*5).toFixed(1);
      }
    }
  }

  // Update label xG preview
  updateXgPreview(idx);
}

function updateXgPreview(idx){
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
  if(preview) preview.innerHTML = `xG: <span style="color:#10b981;">${xgA.toFixed(2)}</span> - <span style="color:#06b6d4;">${xgB.toFixed(2)}</span> <small style="color:#64748b;">(dari Total/5)</small>`;
}

function createMatchCard(idx){
  return `
  <div id="matchCard_${idx}" class="match-card" data-idx="${idx}" style="margin-bottom:20px; padding:16px; border:1px solid #334155; border-radius:12px; background:#1e293b; position:relative;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <h3 style="margin:0; font-size:14px; font-weight:800; color:#fff;"><i class="fa-solid fa-futbol" style="color:#10b981;"></i> Pertandingan ${idx} <span id="xgPreview_${idx}" style="font-size:11px; font-weight:400; margin-left:8px; color:#94a3b8;">xG: 1.84 - 1.72</span></h3>
      <div style="display:flex; gap:6px;">
        ${idx>1?`<button type="button" onclick="hapusPrediksi(${idx})" style="background:#7f1d1d; color:#fecaca; border:1px solid #991b1b; padding:4px 10px; border-radius:8px; font-size:11px; cursor:pointer;"><i class="fa-solid fa-trash"></i> Hapus</button>`:''}
        <span style="background:#0f172a; border:1px solid #334155; padding:4px 8px; border-radius:8px; font-size:11px; color:#94a3b8;">#${idx}/5</span>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
      <div><label style="font-size:11px; color:#94a3b8;">Tuan Rumah (Tim 1)</label><select id="tim1_${idx}" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fff; font-weight:600;"></select></div>
      <div><label style="font-size:11px; color:#94a3b8;">Tamu (Tim 2)</label><select id="tim2_${idx}" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fff; font-weight:600;"></select></div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:14px;">
      <div><label style="font-size:11px; color:#94a3b8;">Odds A (1)</label><input type="number" step="0.01" id="oddA_${idx}" value="2.10" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#10b981; font-weight:700; text-align:center;"></div>
      <div><label style="font-size:11px; color:#94a3b8;">Odds Seri (X)</label><input type="number" step="0.01" id="oddDraw_${idx}" value="3.60" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fbbf24; font-weight:700; text-align:center;"></div>
      <div><label style="font-size:11px; color:#94a3b8;">Odds B (2)</label><input type="number" step="0.01" id="oddB_${idx}" value="3.20" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#06b6d4; font-weight:700; text-align:center;"></div>
    </div>

    <!-- DUAL MODE STATISTIK MANUAL - KEDUANYA MUNCUL BERSAMAAN -->
    <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid #1e293b;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-size:12px; font-weight:700; color:#e2e8f0;"><i class="fa-solid fa-chart-simple" style="color:#10b981;"></i> Statistik Manual (Dual Mode)</span>
        <label style="font-size:11px; color:#94a3b8; display:flex; align-items:center; gap:4px; cursor:pointer;"><input type="checkbox" id="homeAdv_${idx}" checked onchange="updateXgPreview(${idx})" style="accent-color:#10b981;"> Home +15%</label>
      </div>

      <!-- ARSENAL / TIM A -->
      <div style="background:#020617; padding:12px; border-radius:8px; border:1px solid #1e293b; margin-bottom:10px;">
        <div id="labelTeamAStat_${idx}" style="font-size:11px; font-weight:700; color:#10b981; margin-bottom:10px;">Arsenal - 5 Laga Terakhir</div>
        
        <!-- Baris GF -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px; padding:8px; background:#1e293b; border-radius:8px;">
          <div>
            <label style="font-size:10px; color:#10b981; font-weight:700;">GF - Total 5 Laga</label>
            <input type="number" step="0.1" id="gf_${idx}_A_total" value="11" oninput="syncStats(${idx},'A','GF')" style="width:100%; margin-top:4px; background:#0f172a; border:1px solid #10b98150; border-radius:6px; padding:8px; color:#fff; font-weight:700;">
            <small style="font-size:9px; color:#64748b;">Total gol 5 laga terakhir</small>
          </div>
          <div>
            <label style="font-size:10px; color:#10b981; font-weight:700;">GF - Rata-rata / Laga</label>
            <input type="number" step="0.01" id="gf_${idx}_A_avg" value="2.20" oninput="syncStats(${idx},'A','GF')" style="width:100%; margin-top:4px; background:#0f172a; border:1px solid #10b98150; border-radius:6px; padding:8px; color:#10b981; font-weight:700;">
            <small style="font-size:9px; color:#64748b;">= Total / 5 (auto-sync)</small>
          </div>
        </div>

        <!-- Baris GA -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:8px; background:#1e293b; border-radius:8px;">
          <div>
            <label style="font-size:10px; color:#f87171; font-weight:700;">GA - Total 5 Laga (Kebobolan)</label>
            <input type="number" step="0.1" id="ga_${idx}_A_total" value="4" oninput="syncStats(${idx},'A','GA')" style="width:100%; margin-top:4px; background:#0f172a; border:1px solid #f8717150; border-radius:6px; padding:8px; color:#fff; font-weight:700;">
            <small style="font-size:9px; color:#64748b;">Total kebobolan 5 laga</small>
          </div>
          <div>
            <label style="font-size:10px; color:#f87171; font-weight:700;">GA - Rata-rata / Laga</label>
            <input type="number" step="0.01" id="ga_${idx}_A_avg" value="0.80" oninput="syncStats(${idx},'A','GA')" style="width:100%; margin-top:4px; background:#0f172a; border:1px solid #f8717150; border-radius:6px; padding:8px; color:#f87171; font-weight:700;">
            <small style="font-size:9px; color:#64748b;">= Total / 5 (auto-sync)</small>
          </div>
        </div>
      </div>

      <!-- ASTON VILLA / TIM B -->
      <div style="background:#020617; padding:12px; border-radius:8px; border:1px solid #1e293b; margin-bottom:10px;">
        <div id="labelTeamBStat_${idx}" style="font-size:11px; font-weight:700; color:#06b6d4; margin-bottom:10px;">Aston Villa - 5 Laga Terakhir</div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px; padding:8px; background:#1e293b; border-radius:8px;">
          <div>
            <label style="font-size:10px; color:#06b6d4; font-weight:700;">GF - Total 5 Laga</label>
            <input type="number" step="0.1" id="gf_${idx}_B_total" value="13" oninput="syncStats(${idx},'B','GF')" style="width:100%; margin-top:4px; background:#0f172a; border:1px solid #06b6d450; border-radius:6px; padding:8px; color:#fff; font-weight:700;">
          </div>
          <div>
            <label style="font-size:10px; color:#06b6d4; font-weight:700;">GF - Rata-rata / Laga</label>
            <input type="number" step="0.01" id="gf_${idx}_B_avg" value="2.60" oninput="syncStats(${idx},'B','GF')" style="width:100%; margin-top:4px; background:#0f172a; border:1px solid #06b6d450; border-radius:6px; padding:8px; color:#06b6d4; font-weight:700;">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:8px; background:#1e293b; border-radius:8px;">
          <div>
            <label style="font-size:10px; color:#f87171; font-weight:700;">GA - Total 5 Laga</label>
            <input type="number" step="0.1" id="ga_${idx}_B_total" value="7" oninput="syncStats(${idx},'B','GA')" style="width:100%; margin-top:4px; background:#0f172a; border:1px solid #f8717150; border-radius:6px; padding:8px; color:#fff; font-weight:700;">
          </div>
          <div>
            <label style="font-size:10px; color:#f87171; font-weight:700;">GA - Rata-rata / Laga</label>
            <input type="number" step="0.01" id="ga_${idx}_B_avg" value="1.40" oninput="syncStats(${idx},'B','GA')" style="width:100%; margin-top:4px; background:#0f172a; border:1px solid #f8717150; border-radius:6px; padding:8px; color:#f87171; font-weight:700;">
          </div>
        </div>
      </div>

      <!-- H2H TETAP -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#020617; padding:10px; border-radius:8px; border:1px solid #1e293b;">
        <div><label style="font-size:10px; color:#fbbf24; font-weight:700;">H2H Gol A vs B (rata-rata)</label><input type="number" step="0.1" id="h2hA_${idx}" value="1.8" oninput="updateXgPreview(${idx})" style="width:100%; margin-top:4px; background:#1e293b; border:1px solid #fbbf24; border-radius:6px; padding:8px; color:#fbbf24; font-weight:700;"></div>
        <div><label style="font-size:10px; color:#fbbf24; font-weight:700;">H2H Gol B vs A (rata-rata)</label><input type="number" step="0.1" id="h2hB_${idx}" value="1.6" oninput="updateXgPreview(${idx})" style="width:100%; margin-top:4px; background:#1e293b; border:1px solid #fbbf24; border-radius:6px; padding:8px; color:#fbbf24; font-weight:700;"></div>
      </div>
    </div>

    <div id="hasilPrediksi_${idx}" style="margin-top:12px;"></div>
  </div>`;
}

async function loadTeams(){
  try{
    if(!teamsDataCache){
      const res=await fetch('../data/teams.json');
      if(!res.ok) throw new Error('HTTP '+res.status);
      teamsDataCache=await res.json();
    }
    const data=teamsDataCache;
    for(let i=1;i<=MAX_MATCHES;i++){
      const s1=document.getElementById(`tim1_${i}`), s2=document.getElementById(`tim2_${i}`);
      if(!s1||!s2) continue;
      const old1=s1.value, old2=s2.value;
      s1.innerHTML=''; s2.innerHTML='';
      for(const [liga,daftar] of Object.entries(data)){
        const g1=document.createElement('optgroup'); g1.label=liga;
        const g2=document.createElement('optgroup'); g2.label=liga;
        daftar.forEach(nm=>{
          const o1=document.createElement('option'); o1.value=nm; o1.textContent=nm; g1.appendChild(o1);
          const o2=document.createElement('option'); o2.value=nm; o2.textContent=nm; g2.appendChild(o2);
        });
        s1.appendChild(g1); s2.appendChild(g2);
      }
      if(old1) s1.value=old1; else if(s1.options.length>0) s1.selectedIndex=0;
      if(old2) s2.value=old2; else if(s2.options.length>1) s2.selectedIndex=1;
      const lbA=document.getElementById(`labelTeamAStat_${i}`), lbB=document.getElementById(`labelTeamBStat_${i}`);
      if(lbA) lbA.textContent=`${s1.value} - 5 Laga Terakhir`;
      if(lbB) lbB.textContent=`${s2.value} - 5 Laga Terakhir`;
      s1.addEventListener('change', ()=>{ if(lbA) lbA.textContent=`${s1.value} - 5 Laga Terakhir`; updateXgPreview(i); });
      s2.addEventListener('change', ()=>{ if(lbB) lbB.textContent=`${s2.value} - 5 Laga Terakhir`; updateXgPreview(i); });
    }
  }catch(err){
    console.error(err);
    const st=document.getElementById('statusTeams');
    if(st) st.textContent='⚠️ teams.json tidak ditemukan, pakai manual';
  }
}

function tambahPrediksi(){
  if(matchCount>=MAX_MATCHES){ alert(`Maksimal ${MAX_MATCHES}!`); return; }
  matchCount++;
  document.getElementById('matchesContainer').insertAdjacentHTML('beforeend', createMatchCard(matchCount));
  loadTeams(); updateTambahButton(); updateXgPreview(matchCount);
  document.getElementById(`matchCard_${matchCount}`)?.scrollIntoView({behavior:'smooth'});
}
function hapusPrediksi(idx){
  if(document.querySelectorAll('.match-card').length<=1){ alert('Minimal 1!'); return; }
  document.getElementById(`matchCard_${idx}`)?.remove();
  matchCount=document.querySelectorAll('.match-card').length;
  updateTambahButton();
}
function updateTambahButton(){
  const btn=document.getElementById('btnTambahPrediksi');
  if(!btn) return;
  const cur=document.querySelectorAll('.match-card').length;
  if(cur>=MAX_MATCHES){ btn.disabled=true; btn.style.opacity='0.5'; btn.innerHTML=`<i class="fa-solid fa-ban"></i> Maksimal ${MAX_MATCHES}`; }
  else{ btn.disabled=false; btn.style.opacity='1'; btn.innerHTML=`<i class="fa-solid fa-plus"></i> Tambah Prediksi (${cur}/${MAX_MATCHES})`; }
  const cnt=document.getElementById('matchCounter'); if(cnt) cnt.textContent=`${cur} pertandingan`;
}
function kembaliKeBeranda(){
  if(confirm('Kembali ke beranda? Reset semua?')){
    const container=document.getElementById('matchesContainer');
    if(container){ container.innerHTML=createMatchCard(1); matchCount=1; loadTeams(); updateTambahButton(); }
    document.getElementById('hasilSemuaPrediksi').innerHTML='';
    window.scrollTo({top:0, behavior:'smooth'});
    // window.location.href='../index.html'; // uncomment jika mau redirect
  }
}

function hitungSingle(idx){
  const tim1=document.getElementById(`tim1_${idx}`)?.value;
  const tim2=document.getElementById(`tim2_${idx}`)?.value;
  const odds1=parseFloat(document.getElementById(`oddA_${idx}`)?.value);
  const oddsDraw=parseFloat(document.getElementById(`oddDraw_${idx}`)?.value);
  const odds2=parseFloat(document.getElementById(`oddB_${idx}`)?.value);
  if(!tim1||!tim2){ alert(`Pilih tim di pertandingan ${idx}!`); return null; }
  if(tim1===tim2){ alert(`Pertandingan ${idx}: Tim sama!`); return null; }
  if(isNaN(odds1)||isNaN(oddsDraw)||isNaN(odds2)){ alert(`Pertandingan ${idx}: Odds salah!`); return null; }

  const p1=1/odds1, pD=1/oddsDraw, p2=1/odds2;
  const totalM=p1+pD+p2;
  const prob1M=p1/totalM, probDM=pD/totalM, prob2M=p2/totalM;

  // AMBIL DARI TOTAL (yang utama), avg hanya untuk display
  let gfATotal=parseFloat(document.getElementById(`gf_${idx}_A_total`)?.value); if(isNaN(gfATotal)) gfATotal=11;
  let gaATotal=parseFloat(document.getElementById(`ga_${idx}_A_total`)?.value); if(isNaN(gaATotal)) gaATotal=4;
  let gfBTotal=parseFloat(document.getElementById(`gf_${idx}_B_total`)?.value); if(isNaN(gfBTotal)) gfBTotal=13;
  let gaBTotal=parseFloat(document.getElementById(`ga_${idx}_B_total`)?.value); if(isNaN(gaBTotal)) gaBTotal=7;
  let h2hA=parseFloat(document.getElementById(`h2hA_${idx}`)?.value); if(isNaN(h2hA)) h2hA=1.8;
  let h2hB=parseFloat(document.getElementById(`h2hB_${idx}`)?.value); if(isNaN(h2hB)) h2hB=1.6;

  let gfA=gfATotal/5, gaA=gaATotal/5, gfB=gfBTotal/5, gaB=gaBTotal/5;
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

  return {idx, tim1,tim2, odds1,oddsDraw,odds2, prob1M,probDM,prob2M, xgA,xgB, probAWin,probDraw,probBWin, probOver25, scoreMatrix, evA:(probAWin*odds1-1)*100, evD:(probDraw*oddsDraw-1)*100, evB:(probBWin*odds2-1)*100, gfATotal, gaATotal, gfBTotal, gaBTotal, h2hA, h2hB, homeAdv};
}

function renderSingle(data){
  const el=document.getElementById(`hasilPrediksi_${data.idx}`); if(!el) return;
  const best = data.probAWin>data.probBWin && data.probAWin>data.probDraw ? data.tim1 : data.probBWin>data.probDraw ? data.tim2 : 'SERI';
  el.innerHTML=`
    <div style="padding:12px; background:#020617; border:1px solid #1e293b; border-radius:10px; color:#e2e8f0; font-size:12px;">
      <div style="display:flex; justify-content:space-between;"><strong style="color:#fff;">${data.tim1} vs ${data.tim2}</strong><span style="background:#0f172a; padding:2px 6px; border-radius:6px; font-size:10px;">xG ${data.xgA.toFixed(2)}-${data.xgB.toFixed(2)}</span></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">
        <div style="background:#1e293b; padding:8px; border-radius:8px;"><small style="color:#94a3b8;">Pasar</small><br>${data.tim1} ${(data.prob1M*100).toFixed(1)}%<br>Seri ${(data.probDM*100).toFixed(1)}%<br>${data.tim2} ${(data.prob2M*100).toFixed(1)}%</div>
        <div style="background:#1e293b; padding:8px; border-radius:8px;"><small style="color:#94a3b8;">Model + EV</small><br>${data.tim1} ${(data.probAWin*100).toFixed(1)}% EV ${data.evA.toFixed(1)}%${data.evA>5?' 🔥':''}<br>Seri ${(data.probDraw*100).toFixed(1)}% EV ${data.evD.toFixed(1)}%<br>${data.tim2} ${(data.probBWin*100).toFixed(1)}% EV ${data.evB.toFixed(1)}%${data.evB>5?' 🔥':''}</div>
      </div>
      <div style="margin-top:8px; font-size:11px; display:flex; justify-content:space-between;"><span>Top: <strong style="color:#10b981;">${data.scoreMatrix[0].score}</strong> ${(data.scoreMatrix[0].prob*100).toFixed(1)}%</span><span>Over 2.5 ${(data.probOver25*100).toFixed(1)}%</span></div>
      <div style="margin-top:6px; font-size:10px; color:#64748b;">Input: Total GF ${data.gfATotal}/${data.gfBTotal} = Avg ${(data.gfATotal/5).toFixed(2)}/${(data.gfBTotal/5).toFixed(2)} | GA ${data.gaATotal}/${data.gaBTotal} = ${(data.gaATotal/5).toFixed(2)}/${(data.gaBTotal/5).toFixed(2)} | H2H ${data.h2hA}-${data.h2hB}</div>
    </div>`;
}

function hasilkanPrediksi(){
  const cards=document.querySelectorAll('.match-card');
  if(cards.length===0){ alert('Tidak ada pertandingan!'); return; }
  const all=[];
  for(const card of cards){
    const idx=card.dataset.idx;
    const data=hitungSingle(idx);
    if(!data) return;
    renderSingle(data);
    all.push(data);
  }
  renderRekap(all);
  document.getElementById('hasilSemuaPrediksi')?.scrollIntoView({behavior:'smooth'});
}

function renderRekap(results){
  const globalEl=document.getElementById('hasilSemuaPrediksi'); if(!globalEl) return;
  let html=`<div style="margin-top:16px; padding:16px; background:#1e293b; border:1px solid #334155; border-radius:12px;"><h3 style="margin:0 0 12px 0; color:#fff; font-size:14px;">📋 Rekap ${results.length} Prediksi (Dual Mode)</h3><div style="display:grid; gap:8px;">`;
  results.forEach(r=>{
    const best = r.probAWin>r.probBWin && r.probAWin>r.probDraw ? r.tim1 : r.probBWin>r.probDraw ? r.tim2 : 'SERI';
    const bestEv=Math.max(r.evA,r.evD,r.evB);
    html+=`<div style="display:flex; justify-content:space-between; background:#0f172a; padding:10px; border-radius:8px;"><div><strong style="color:#fff; font-size:13px;">${r.tim1} vs ${r.tim2}</strong><br><small style="color:#94a3b8;">Total: GF ${r.gfATotal}-${r.gfBTotal} | GA ${r.gaATotal}-${r.gaBTotal} → Avg ${(r.gfATotal/5).toFixed(2)}/${(r.gfBTotal/5).toFixed(2)} | Top ${r.scoreMatrix[0].score}</small></div><div style="text-align:right;"><span style="background:${bestEv>5?'#10b981':'#334155'}; color:${bestEv>5?'#000':'#e2e8f0'}; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700;">${best}</span><br><small style="color:#64748b;">EV ${bestEv.toFixed(1)}%</small></div></div>`;
  });
  html+=`</div><div style="margin-top:12px; display:flex; gap:8px;"><button onclick="kembaliKeBeranda()" style="background:#334155; color:#e2e8f0; border:1px solid #475569; padding:8px 16px; border-radius:8px; font-size:12px; cursor:pointer;"><i class="fa-solid fa-house"></i> Kembali ke Beranda</button></div></div>`;
  globalEl.innerHTML=html;
  window.lastAll=results;
}

document.addEventListener('DOMContentLoaded', ()=>{
  let container=document.getElementById('matchesContainer');
  if(!container){
    const hasil=document.getElementById('hasilPrediksi');
    const wrapper=document.createElement('div');
    wrapper.innerHTML=`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; gap:8px;">
          <button type="button" id="btnKembaliBeranda" onclick="kembaliKeBeranda()" style="background:#0f172a; color:#e2e8f0; border:1px solid #334155; padding:8px 14px; border-radius:8px; font-size:12px; cursor:pointer;"><i class="fa-solid fa-house"></i> Kembali ke Beranda</button>
          <span id="matchCounter" style="background:#1e293b; border:1px solid #334155; padding:8px 12px; border-radius:8px; font-size:12px; color:#94a3b8;">1 pertandingan</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" id="btnTambahPrediksi" onclick="tambahPrediksi()" style="background:#10b981; color:#000; border:none; padding:8px 16px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;"><i class="fa-solid fa-plus"></i> Tambah Prediksi (1/5)</button>
          <button type="button" id="btnPrediksi" onclick="hasilkanPrediksi()" style="background:#0ea5e9; color:#fff; border:none; padding:8px 16px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;"><i class="fa-solid fa-calculator"></i> Hitung Semua</button>
        </div>
      </div>
      <div id="matchesContainer"></div>
      <div id="hasilSemuaPrediksi"></div>
      <div id="statusTeams" style="margin-top:12px; font-size:11px; color:#64748b;"></div>
    `;
    if(hasil){ hasil.parentNode.insertBefore(wrapper, hasil); hasil.style.display='none'; }
    else document.body.prepend(wrapper);
    container=document.getElementById('matchesContainer');
  }
  if(container && container.children.length===0){ container.innerHTML=createMatchCard(1); matchCount=1; }
  loadTeams(); updateTambahButton(); updateXgPreview(1);
});
