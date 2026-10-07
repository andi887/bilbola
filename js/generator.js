// =========================================================
// FILE JS UTAMA - v3.2 COLLAB (JS as Main) - FINAL
// Fitur: teams.json + input manual 5 laga + H2H + Poisson v3 + EV
// =========================================================

const presets = {
  elClasico: { teamA:"Real Madrid", teamB:"FC Barcelona", oddsA:2.10, oddsDraw:3.60, oddsB:3.20, statMode:"total", gfA:11, gaA:4, gfB:13, gaB:7, h2hA:1.8, h2hB:1.6 },
  highScoring:{ teamA:"Man City", teamB:"Bayern Munich", oddsA:1.95, oddsDraw:4.00, oddsB:3.40, statMode:"total", gfA:16, gaA:8, gfB:15, gaB:9, h2hA:2.3, h2hB:2.1 },
  tactical:{ teamA:"Atletico Madrid", teamB:"Inter Milan", oddsA:2.30, oddsDraw:3.10, oddsB:3.30, statMode:"total", gfA:6, gaA:3, gfB:7, gaB:4, h2hA:0.8, h2hB:0.9 }
};

// --- ENGINE POISSON FIX ---
function poissonLog(x, lambda){
  if(lambda<=0) return x===0?1:0;
  let logFact=0; for(let i=2;i<=x;i++) logFact+=Math.log(i);
  return Math.exp(-lambda + x*Math.log(lambda) - logFact);
}

function toggleStatMode(){
  const modeEl=document.getElementById('statMode'); if(!modeEl) return;
  const mode=modeEl.value;
  const nameA=document.getElementById('tim1')?.value || document.getElementById('teamA')?.value || 'Tim A';
  const nameB=document.getElementById('tim2')?.value || document.getElementById('teamB')?.value || 'Tim B';
  const lA=document.getElementById('labelTeamAStat'); if(lA) lA.textContent= mode==='total'? `${nameA} - Total 5 Laga (GF/GA)` : `${nameA} - Rata-rata / Laga`;
  const lB=document.getElementById('labelTeamBStat'); if(lB) lB.textContent= mode==='total'? `${nameB} - Total 5 Laga (GF/GA)` : `${nameB} - Rata-rata / Laga`;
  const hA=document.getElementById('labelH2HA'); if(hA) hA.textContent=`Rata-rata Gol ${nameA} vs ${nameB} (H2H)`;
  const hB=document.getElementById('labelH2HB'); if(hB) hB.textContent=`Rata-rata Gol ${nameB} vs ${nameA} (H2H)`;
}

function loadPreset(k){
  const d=presets[k]; if(!d) return;
  const setVal=(a,b,v)=>{ const el=document.getElementById(a)||document.getElementById(b); if(el) el.value=v; };
  setVal('tim1','teamA',d.teamA); setVal('tim2','teamB',d.teamB);
  setVal('oddA','oddsA',d.oddsA); setVal('oddDraw','oddsDraw',d.oddsDraw); setVal('oddB','oddsB',d.oddsB);
  setVal('statMode','statMode',d.statMode);
  setVal('gfA','gfA',d.gfA); setVal('gaA','gaA',d.gaA); setVal('gfB','gfB',d.gfB); setVal('gaB','gaB',d.gaB);
  setVal('h2hA','h2hA',d.h2hA); setVal('h2hB','h2hB',d.h2hB);
  toggleStatMode(); hasilkanPrediksi();
}

// --- INJECTOR: Tambah input manual H2H & 5 laga jika belum ada di HTML ---
function ensureAdvancedInputs(){
  // Cek apakah input sudah ada (dari HTML ori)
  if(document.getElementById('gfA') && document.getElementById('h2hA')) return;

  // Cari anchor: setelah odds atau sebelum hasilPrediksi
  const anchor = document.getElementById('oddsContainer') || document.getElementById('oddA')?.parentElement?.parentElement || document.getElementById('teamA')?.parentElement?.parentElement || document.getElementById('hasilPrediksi');
  if(!anchor) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'advancedStatsWrapper';
  wrapper.innerHTML = `
    <div style="margin:20px 0; padding:16px; border:1px solid #334155; border-radius:12px; background:#1e293b;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0; font-size:14px; font-weight:700; color:#fff;">📊 Statistik Manual (dari HTML ori)</h3>
        <select id="statMode" onchange="toggleStatMode()" style="background:#0f172a; border:1px solid #334155; color:#cbd5e1; font-size:12px; border-radius:8px; padding:4px 8px;">
          <option value="total" selected>Total 5 Laga</option>
          <option value="avg">Rata-rata / Laga</option>
        </select>
      </div>
      
      <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin-bottom:14px; color:#94a3b8; cursor:pointer;">
        <input type="checkbox" id="homeAdv" checked style="accent-color:#10b981;"> Home Advantage +15% untuk Tuan Rumah
      </label>

      <!-- 5 LAGA TERAKHIR -->
      <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid #1e293b; margin-bottom:12px;">
        <span id="labelTeamAStat" style="font-size:12px; font-weight:700; color:#10b981; display:block; margin-bottom:8px;">Tim A - 5 Laga Terakhir</span>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>
            <label style="font-size:11px; color:#94a3b8;">Gol Dicetak (GF) - Total 5 Laga</label>
            <input type="number" step="0.1" min="0" id="gfA" value="11" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fff; font-weight:600;">
            <small style="font-size:10px; color:#64748b;">Contoh: 11 gol dalam 5 laga</small>
          </div>
          <div>
            <label style="font-size:11px; color:#94a3b8;">Kebobolan (GA) - Total 5 Laga</label>
            <input type="number" step="0.1" min="0" id="gaA" value="4" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fff; font-weight:600;">
          </div>
        </div>
      </div>

      <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid #1e293b; margin-bottom:12px;">
        <span id="labelTeamBStat" style="font-size:12px; font-weight:700; color:#06b6d4; display:block; margin-bottom:8px;">Tim B - 5 Laga Terakhir</span>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>
            <label style="font-size:11px; color:#94a3b8;">Gol Dicetak (GF)</label>
            <input type="number" step="0.1" min="0" id="gfB" value="13" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fff; font-weight:600;">
          </div>
          <div>
            <label style="font-size:11px; color:#94a3b8;">Kebobolan (GA)</label>
            <input type="number" step="0.1" min="0" id="gaB" value="7" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fff; font-weight:600;">
          </div>
        </div>
      </div>

      <!-- H2H MANUAL -->
      <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid #1e293b;">
        <h4 style="margin:0 0 8px 0; font-size:12px; font-weight:700; color:#f59e0b;">⚔️ Head-to-Head (H2H) Manual</h4>
        <p style="font-size:11px; color:#64748b; margin:0 0 10px 0;">Isi rata-rata gol dari 3-5 pertemuan terakhir kedua tim</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>
            <label id="labelH2HA" style="font-size:11px; color:#94a3b8;">Rata-rata Gol Tim A vs Tim B</label>
            <input type="number" step="0.1" min="0" id="h2hA" value="1.8" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fbbf24; font-weight:700;">
          </div>
          <div>
            <label id="labelH2HB" style="font-size:11px; color:#94a3b8;">Rata-rata Gol Tim B vs Tim A</label>
            <input type="number" step="0.1" min="0" id="h2hB" value="1.6" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fbbf24; font-weight:700;">
          </div>
        </div>
      </div>
    </div>
  `;

  // Sisipkan sebelum hasilPrediksi jika ada, atau setelah odds
  const hasil = document.getElementById('hasilPrediksi');
  if(hasil && hasil.parentNode){
    hasil.parentNode.insertBefore(wrapper, hasil);
  } else {
    anchor.parentNode.insertBefore(wrapper, anchor.nextSibling);
  }
}

async function loadTeams(){
  try{
    const res=await fetch('../data/teams.json');
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data=await res.json();
    const s1=document.getElementById('tim1')||document.getElementById('teamA');
    const s2=document.getElementById('tim2')||document.getElementById('teamB');
    if(!s1||!s2) return;
    s1.innerHTML=''; s2.innerHTML='';
    for(const [liga, daftarKlub] of Object.entries(data)){
      const g1=document.createElement('optgroup'); g1.label=liga;
      const g2=document.createElement('optgroup'); g2.label=liga;
      daftarKlub.forEach(namaTim=>{
        const o1=document.createElement('option'); o1.value=namaTim; o1.textContent=namaTim; g1.appendChild(o1);
        const o2=document.createElement('option'); o2.value=namaTim; o2.textContent=namaTim; g2.appendChild(o2);
      });
      s1.appendChild(g1); s2.appendChild(g2);
    }
    if(s1.options.length>0) s1.selectedIndex=0;
    if(s2.options.length>1) s2.selectedIndex=1;
    toggleStatMode();
  }catch(err){
    console.error('Gagal load teams:',err);
    const st=document.getElementById('statusTeams');
    if(st) st.textContent='Gagal load teams.json: '+err.message+' - pakai input manual';
  }
}

function calcEV(prob, odds){ return (prob*odds-1)*100; }

function hasilkanPrediksi(){
  const tim1=document.getElementById('tim1')?.value || document.getElementById('teamA')?.value;
  const tim2=document.getElementById('tim2')?.value || document.getElementById('teamB')?.value;
  const odds1=parseFloat(document.getElementById('oddA')?.value || document.getElementById('oddsA')?.value);
  const oddsDraw=parseFloat(document.getElementById('oddDraw')?.value);
  const odds2=parseFloat(document.getElementById('oddB')?.value || document.getElementById('oddsB')?.value);
  const hasilDiv=document.getElementById('hasilPrediksi');

  if(!tim1||!tim2){ alert('Pilih Tim 1 dan Tim 2 dulu!'); return; }
  if(tim1===tim2){ alert('Tim 1 dan Tim 2 tidak boleh sama!'); return; }
  if(isNaN(odds1)||isNaN(oddsDraw)||isNaN(odds2)||odds1<=1||oddsDraw<=1||odds2<=1){
    alert('Isi semua Odds dengan benar! Contoh: 2.10, 3.40, 1.95'); return;
  }

  // Pasar
  const p1=1/odds1, pD=1/oddsDraw, p2=1/odds2;
  const totalM=p1+pD+p2;
  const prob1M=p1/totalM, probDM=pD/totalM, prob2M=p2/totalM;
  const margin=(totalM-1)*100;

  // Poisson input - DENGAN DEFAULT JIKA KOSONG (dari HTML ori)
  const statMode=document.getElementById('statMode')?.value || 'total';
  let gfA=parseFloat(document.getElementById('gfA')?.value); if(isNaN(gfA)) gfA=11;
  let gaA=parseFloat(document.getElementById('gaA')?.value); if(isNaN(gaA)) gaA=4;
  let gfB=parseFloat(document.getElementById('gfB')?.value); if(isNaN(gfB)) gfB=13;
  let gaB=parseFloat(document.getElementById('gaB')?.value); if(isNaN(gaB)) gaB=7;
  let h2hA=parseFloat(document.getElementById('h2hA')?.value); if(isNaN(h2hA)) h2hA=1.8;
  let h2hB=parseFloat(document.getElementById('h2hB')?.value); if(isNaN(h2hB)) h2hB=1.6;
  
  if(statMode==='total'){ gfA/=5; gaA/=5; gfB/=5; gaB/=5; }

  const homeAdv=document.getElementById('homeAdv')?.checked || false;
  let xgA=Math.max(0.2,(gfA*0.4)+(gaB*0.4)+(h2hA*0.2));
  let xgB=Math.max(0.2,(gfB*0.4)+(gaA*0.4)+(h2hB*0.2));
  if(homeAdv) xgA*=1.15;

  let probAWin=0,probDraw=0,probBWin=0, probOver15=0, probOver25=0, probOver35=0;
  const scoreMatrix=[]; let totalProb=0; const rho=0.13;
  for(let i=0;i<=6;i++){
    for(let j=0;j<=6;j++){
      let pA=poissonLog(i,xgA), pB=poissonLog(j,xgB), pC=pA*pB;
      if(i<=1&&j<=1){
        if(i==0&&j==0) pC*=1-(xgB*rho);
        else if(i==0&&j==1) pC*=1+(xgA*rho);
        else if(i==1&&j==0) pC*=1+(xgB*rho);
        else if(i==1&&j==1) pC*=1-rho;
      }
      totalProb+=pC;
      if(i>j) probAWin+=pC; else if(i===j) probDraw+=pC; else probBWin+=pC;
      const tot=i+j; if(tot>1.5) probOver15+=pC; if(tot>2.5) probOver25+=pC; if(tot>3.5) probOver35+=pC;
      scoreMatrix.push({score:`${i} - ${j}`, i,j, prob:pC});
    }
  }
  probAWin/=totalProb; probDraw/=totalProb; probBWin/=totalProb;
  probOver15/=totalProb; probOver25/=totalProb; probOver35/=totalProb;
  scoreMatrix.forEach(s=>s.prob/=totalProb);
  scoreMatrix.sort((a,b)=>b.prob-a.prob);

  const evA=calcEV(probAWin,odds1), evD=calcEV(probDraw,oddsDraw), evB=calcEV(probBWin,odds2);

  // Render ke element HTML ori jika ada
  const setT=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  setT('resTeamA',tim1); setT('resTeamB',tim2); setT('txtTeamA',tim1); setT('txtTeamB',tim2);
  setT('xgA',xgA.toFixed(2)); setT('xgB',xgB.toFixed(2));
  setT('probA',(probAWin*100).toFixed(1)+'%'); setT('probDraw',(probDraw*100).toFixed(1)+'%'); setT('probB',(probBWin*100).toFixed(1)+'%');
  setT('impliedA',`Pasar: ${(prob1M*100).toFixed(1)}%`); setT('impliedDraw',`Pasar: ${(probDM*100).toFixed(1)}%`); setT('impliedB',`Pasar: ${(prob2M*100).toFixed(1)}%`);
  setT('ou15Over',(probOver15*100).toFixed(1)+'%'); setT('ou15Under',((1-probOver15)*100).toFixed(1)+'%');
  setT('ou25Over',(probOver25*100).toFixed(1)+'%'); setT('ou25Under',((1-probOver25)*100).toFixed(1)+'%');
  setT('ou35Over',(probOver35*100).toFixed(1)+'%'); setT('ou35Under',((1-probOver35)*100).toFixed(1)+'%');
  setT('topScoreline',scoreMatrix[0].score);
  const tp=document.getElementById('topScoreProb'); if(tp) tp.innerHTML=`Peluang: <span style="font-weight:600;">${(scoreMatrix[0].prob*100).toFixed(1)}%</span>`;
  const evAEl=document.getElementById('evA'); if(evAEl) evAEl.textContent=`EV ${evA.toFixed(1)}%${evA>5?' VALUE!':''}`;
  const evDEl=document.getElementById('evDraw'); if(evDEl) evDEl.textContent=`EV ${evD.toFixed(1)}%${evD>5?' VALUE!':''}`;
  const evBEl=document.getElementById('evB'); if(evBEl) evBEl.textContent=`EV ${evB.toFixed(1)}%${evB>5?' VALUE!':''}`;

  const topList=document.getElementById('topScoresList');
  if(topList){ topList.innerHTML=''; scoreMatrix.slice(0,5).forEach((it,idx)=>{ const d=document.createElement('div'); d.style.cssText=`padding:12px; border-radius:12px; border:1px solid ${idx===0?'#10b981':'#334155'}; text-align:center; background:#020617;`; d.innerHTML=`<span style="font-size:10px; color:#94a3b8;">Rank #${idx+1}</span><br><span style="font-size:16px; font-weight:900; color:${idx===0?'#10b981':'#fff'};">${it.score}</span><br><span style="font-size:12px; color:#cbd5e1; font-weight:600;">${(it.prob*100).toFixed(1)}%</span>`; topList.appendChild(d); }); }

  // Prediksi pasar simple
  let prediksiPasar='';
  if(prob1M>prob2M && prob1M>probDM) prediksiPasar=`${tim1} diunggulkan (pasar)`;
  else if(prob2M>prob1M && prob2M>probDM) prediksiPasar=`${tim2} diunggulkan (pasar)`;
  else prediksiPasar=`Berpotensi SERI (pasar)`;

  // Heatmap jika ada Chart.js
  const canvas=document.getElementById('scoreHeatmap');
  if(canvas && typeof Chart!=='undefined'){
    const ctx=canvas.getContext('2d');
    const bubbleData=scoreMatrix.map(s=>({x:s.i, y:s.j, r:Math.max(3,s.prob*100*2.5)}));
    if(window.heatmapChart) window.heatmapChart.destroy();
    window.heatmapChart=new Chart(ctx,{
      type:'bubble',
      data:{datasets:[{label:'Prob %', data:bubbleData, backgroundColor:bubbleData.map(d=>d.r>12?'rgba(16,185,129,0.9)':d.r>7?'rgba(6,182,212,0.7)':'rgba(100,116,139,0.5)')}]},
      options:{responsive:true, plugins:{legend:{display:false}, tooltip:{callbacks:{label:(c)=>`Skor ${c.raw.x}-${c.raw.y}: ${(scoreMatrix.find(s=>s.i===c.raw.x&&s.j===c.raw.y).prob*100).toFixed(2)}%`}}}, scales:{x:{title:{display:true, text:'Gol Tuan Rumah'}, min:-0.5,max:6.5}, y:{title:{display:true, text:'Gol Tamu'}, min:-0.5,max:6.5}}}
    });
  }

  if(hasilDiv){
    const isSimple=!document.getElementById('probA');
    if(isSimple || hasilDiv.classList.contains('force-simple') || !document.getElementById('topScoresList')){
      hasilDiv.classList.remove('hidden');
      hasilDiv.innerHTML=`
        <div style="margin-top:20px; padding:16px; background:#f8f9fa; border-radius:10px; border-left:4px solid #10b981; color:#212529; font-family:sans-serif;">
          <h3 style="margin:0 0 8px 0;">${tim1} vs ${tim2}</h3>
          <p style="font-size:16px; font-weight:800; margin:4px 0;">${prediksiPasar}</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:12px 0; font-size:13px;">
            <div style="background:#fff; padding:10px; border-radius:8px; border:1px solid #e2e8f0;">
              <strong>Pasar Implied (dari Odds)</strong><br>
              ${tim1}: ${(prob1M*100).toFixed(1)}%<br>
              Seri: ${(probDM*100).toFixed(1)}%<br>
              ${tim2}: ${(prob2M*100).toFixed(1)}%<br>
              <small style="color:#64748b;">Margin: ${margin.toFixed(2)}%</small>
            </div>
            <div style="background:#fff; padding:10px; border-radius:8px; border:1px solid #e2e8f0;">
              <strong>Model Poisson v3 (xG)</strong><br>
              xG ${tim1}: ${xgA.toFixed(2)} | xG ${tim2}: ${xgB.toFixed(2)}<br>
              ${tim1}: ${(probAWin*100).toFixed(1)}% (EV ${evA.toFixed(1)}% ${evA>5?'🔥':''})<br>
              Seri: ${(probDraw*100).toFixed(1)}% (EV ${evD.toFixed(1)}% ${evD>5?'🔥':''})<br>
              ${tim2}: ${(probBWin*100).toFixed(1)}% (EV ${evB.toFixed(1)}% ${evB>5?'🔥':''})
            </div>
          </div>
          <div style="background:#fff; padding:10px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:10px;">
            <strong>Input Manual yang dipakai:</strong><br>
            <small style="color:#475569;">
              Mode: ${statMode} | HomeAdv: ${homeAdv?'Ya (+15%)':'Tidak'}<br>
              5 Laga ${tim1}: GF=${document.getElementById('gfA')?.value || 11} GA=${document.getElementById('gaA')?.value || 4} → per laga GF=${(parseFloat(document.getElementById('gfA')?.value||11)/ (statMode==='total'?5:1)).toFixed(2)}<br>
              5 Laga ${tim2}: GF=${document.getElementById('gfB')?.value || 13} GA=${document.getElementById('gaB')?.value || 7}<br>
              H2H: ${tim1} ${h2hA} - ${h2hB} ${tim2} (rata-rata)
            </small>
          </div>
          <p><strong>Top Skor:</strong> ${scoreMatrix[0].score} (${(scoreMatrix[0].prob*100).toFixed(1)}%) | Over 2.5: ${(probOver25*100).toFixed(1)}% | Under 2.5: ${((1-probOver25)*100).toFixed(1)}%</p>
          <p style="font-size:11px; color:#64748b;">Top 5: ${scoreMatrix.slice(0,5).map(s=>`${s.score} ${ (s.prob*100).toFixed(1)}%`).join(' | ')}</p>
          <p style="font-size:11px; color:#94a3b8; margin-top:8px;">Odds: ${odds1} | ${oddsDraw} | ${odds2}</p>
        </div>
      `;
      hasilDiv.scrollIntoView({behavior:'smooth'});
    }
  }

  window.lastPrediction={tim1,tim2, odds:{odds1,oddsDraw,odds2}, market:{prob1M,probDM,prob2M,margin}, poisson:{xgA,xgB,probAWin,probDraw,probBWin,probOver15,probOver25,probOver35,scoreMatrix, inputs:{gfA,gaA,gfB,gaB,h2hA,h2hB,statMode,homeAdv}}, ev:{evA,evD,evB}};
}

function calculatePrediction(){ return hasilkanPrediksi(); }

document.addEventListener('DOMContentLoaded', ()=>{
  ensureAdvancedInputs();
  loadTeams();
  const btn=document.getElementById('btnPrediksi');
  if(btn) btn.addEventListener('click', hasilkanPrediksi);
  const form=document.getElementById('predictorForm');
  if(form) form.addEventListener('submit', e=>{ e.preventDefault(); hasilkanPrediksi(); });
  setTimeout(()=>toggleStatMode(), 300);
});
