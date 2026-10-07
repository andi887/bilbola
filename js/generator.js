// =========================================================
// FILE JS UTAMA - v3.3 MULTI-MATCH (5 Pertandingan)
// Fitur: teams.json + 5 laga + H2H + Poisson v3 + Tombol Beranda & Tambah
// =========================================================

const presets = {
  elClasico: { teamA:"Real Madrid", teamB:"FC Barcelona", oddsA:2.10, oddsDraw:3.60, oddsB:3.20, statMode:"total", gfA:11, gaA:4, gfB:13, gaB:7, h2hA:1.8, h2hB:1.6 },
  highScoring:{ teamA:"Man City", teamB:"Bayern Munich", oddsA:1.95, oddsDraw:4.00, oddsB:3.40, statMode:"total", gfA:16, gaA:8, gfB:15, gaB:9, h2hA:2.3, h2hB:2.1 },
  tactical:{ teamA:"Atletico Madrid", teamB:"Inter Milan", oddsA:2.30, oddsDraw:3.10, oddsB:3.30, statMode:"total", gfA:6, gaA:3, gfB:7, gaB:4, h2hA:0.8, h2hB:0.9 }
};

let matchCount = 1;
const MAX_MATCHES = 5;
let teamsDataCache = null;

function poissonLog(x, lambda){
  if(lambda<=0) return x===0?1:0;
  let logFact=0; for(let i=2;i<=x;i++) logFact+=Math.log(i);
  return Math.exp(-lambda + x*Math.log(lambda) - logFact);
}

function toggleStatModeFor(idx){
  const modeEl=document.getElementById(`statMode_${idx}`) || document.getElementById('statMode');
  if(!modeEl) return;
  const mode=modeEl.value;
  const nameA=document.getElementById(`tim1_${idx}`)?.value || document.getElementById(`teamA_${idx}`)?.value || `Tim A ${idx}`;
  const nameB=document.getElementById(`tim2_${idx}`)?.value || document.getElementById(`teamB_${idx}`)?.value || `Tim B ${idx}`;
  const lA=document.getElementById(`labelTeamAStat_${idx}`); if(lA) lA.textContent= mode==='total'? `${nameA} - Total 5 Laga` : `${nameA} - Rata-rata / Laga`;
  const lB=document.getElementById(`labelTeamBStat_${idx}`); if(lB) lB.textContent= mode==='total'? `${nameB} - Total 5 Laga` : `${nameB} - Rata-rata / Laga`;
}

function createMatchCard(idx){
  const isFirst = idx===1;
  return `
  <div id="matchCard_${idx}" class="match-card" data-idx="${idx}" style="margin-bottom:20px; padding:16px; border:1px solid #334155; border-radius:12px; background:#1e293b; position:relative;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <h3 style="margin:0; font-size:14px; font-weight:800; color:#fff;"><i class="fa-solid fa-futbol" style="color:#10b981;"></i> Pertandingan ${idx}</h3>
      <div style="display:flex; gap:6px;">
        ${!isFirst ? `<button type="button" onclick="hapusPrediksi(${idx})" style="background:#7f1d1d; color:#fecaca; border:1px solid #991b1b; padding:4px 10px; border-radius:8px; font-size:11px; cursor:pointer;"><i class="fa-solid fa-trash"></i> Hapus</button>` : ''}
        <span style="background:#0f172a; border:1px solid #334155; padding:4px 8px; border-radius:8px; font-size:11px; color:#94a3b8;">#${idx}/${MAX_MATCHES}</span>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
      <div>
        <label style="font-size:11px; color:#94a3b8;">Tuan Rumah (Tim 1)</label>
        <select id="tim1_${idx}" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fff; font-weight:600;"></select>
        <input type="hidden" id="teamA_${idx}" value="">
      </div>
      <div>
        <label style="font-size:11px; color:#94a3b8;">Tamu (Tim 2)</label>
        <select id="tim2_${idx}" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fff; font-weight:600;"></select>
        <input type="hidden" id="teamB_${idx}" value="">
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:14px;">
      <div><label style="font-size:11px; color:#94a3b8;">Odds A (1)</label><input type="number" step="0.01" min="1.01" id="oddA_${idx}" value="2.10" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#10b981; font-weight:700; text-align:center;"></div>
      <div><label style="font-size:11px; color:#94a3b8;">Odds Seri (X)</label><input type="number" step="0.01" min="1.01" id="oddDraw_${idx}" value="3.60" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#fbbf24; font-weight:700; text-align:center;"></div>
      <div><label style="font-size:11px; color:#94a3b8;">Odds B (2)</label><input type="number" step="0.01" min="1.01" id="oddB_${idx}" value="3.20" style="width:100%; margin-top:4px; background:#020617; border:1px solid #334155; border-radius:8px; padding:8px; color:#06b6d4; font-weight:700; text-align:center;"></div>
    </div>

    <!-- Advanced Stats -->
    <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px solid #1e293b;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span style="font-size:12px; font-weight:700; color:#e2e8f0;">📊 Statistik Manual</span>
        <div style="display:flex; gap:6px; align-items:center;">
          <select id="statMode_${idx}" onchange="toggleStatModeFor(${idx})" style="background:#020617; border:1px solid #334155; color:#cbd5e1; font-size:11px; border-radius:6px; padding:3px 6px;">
            <option value="total" selected>Total 5 Laga</option><option value="avg">Rata-rata / Laga</option>
          </select>
          <label style="font-size:11px; color:#94a3b8; display:flex; align-items:center; gap:4px; cursor:pointer;"><input type="checkbox" id="homeAdv_${idx}" checked style="accent-color:#10b981;"> Home +15%</label>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
        <div style="background:#020617; padding:10px; border-radius:8px; border:1px solid #1e293b;">
          <span id="labelTeamAStat_${idx}" style="font-size:11px; font-weight:700; color:#10b981;">Tim A - 5 Laga</span>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:6px;">
            <div><label style="font-size:10px; color:#94a3b8;">GF (Cet ak)</label><input type="number" step="0.1" id="gfA_${idx}" value="11" style="width:100%; margin-top:2px; background:#1e293b; border:1px solid #334155; border-radius:6px; padding:6px; color:#fff;"></div>
            <div><label style="font-size:10px; color:#94a3b8;">GA (Kebobolan)</label><input type="number" step="0.1" id="gaA_${idx}" value="4" style="width:100%; margin-top:2px; background:#1e293b; border:1px solid #334155; border-radius:6px; padding:6px; color:#fff;"></div>
          </div>
        </div>
        <div style="background:#020617; padding:10px; border-radius:8px; border:1px solid #1e293b;">
          <span id="labelTeamBStat_${idx}" style="font-size:11px; font-weight:700; color:#06b6d4;">Tim B - 5 Laga</span>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:6px;">
            <div><label style="font-size:10px; color:#94a3b8;">GF</label><input type="number" step="0.1" id="gfB_${idx}" value="13" style="width:100%; margin-top:2px; background:#1e293b; border:1px solid #334155; border-radius:6px; padding:6px; color:#fff;"></div>
            <div><label style="font-size:10px; color:#94a3b8;">GA</label><input type="number" step="0.1" id="gaB_${idx}" value="7" style="width:100%; margin-top:2px; background:#1e293b; border:1px solid #334155; border-radius:6px; padding:6px; color:#fff;"></div>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div><label style="font-size:10px; color:#94a3b8;">H2H Gol A vs B (rata-rata)</label><input type="number" step="0.1" id="h2hA_${idx}" value="1.8" style="width:100%; margin-top:2px; background:#020617; border:1px solid #334155; border-radius:6px; padding:6px; color:#fbbf24; font-weight:700;"></div>
        <div><label style="font-size:10px; color:#94a3b8;">H2H Gol B vs A (rata-rata)</label><input type="number" step="0.1" id="h2hB_${idx}" value="1.6" style="width:100%; margin-top:2px; background:#020617; border:1px solid #334155; border-radius:6px; padding:6px; color:#fbbf24; font-weight:700;"></div>
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
    // Isi semua select yang ada
    for(let i=1;i<=matchCount;i++){
      const s1=document.getElementById(`tim1_${i}`) || document.getElementById('tim1') || document.getElementById('teamA');
      const s2=document.getElementById(`tim2_${i}`) || document.getElementById('teamB');
      if(!s1||!s2) continue;
      // Simpan value lama
      const old1=s1.value, old2=s2.value;
      s1.innerHTML=''; s2.innerHTML='';
      for(const [liga, daftar] of Object.entries(data)){
        const g1=document.createElement('optgroup'); g1.label=liga;
        const g2=document.createElement('optgroup'); g2.label=liga;
        daftar.forEach(nm=>{
          const o1=document.createElement('option'); o1.value=nm; o1.textContent=nm; g1.appendChild(o1);
          const o2=document.createElement('option'); o2.value=nm; o2.textContent=nm; g2.appendChild(o2);
        });
        s1.appendChild(g1); s2.appendChild(g2);
      }
      // restore atau default beda
      if(old1) s1.value=old1; else if(s1.options.length>0) s1.selectedIndex=0;
      if(old2) s2.value=old2; else if(s2.options.length>1) s2.selectedIndex=1;
      if(s1.value===s2.value && s2.options.length>1){
        s2.selectedIndex = (s1.selectedIndex===0?1:0);
      }
      toggleStatModeFor(i);
    }
    const st=document.getElementById('statusTeams');
    if(st) st.textContent=`✅ ${Object.values(teamsDataCache).flat().length} tim dimuat`;
  }catch(err){
    console.error('Gagal load teams.json',err);
    const st=document.getElementById('statusTeams');
    if(st) st.textContent='⚠️ teams.json tidak ditemukan, pakai input manual: '+err.message;
  }
}

function tambahPrediksi(){
  if(matchCount>=MAX_MATCHES){
    alert(`Maksimal ${MAX_MATCHES} pertandingan!`);
    return;
  }
  matchCount++;
  const container=document.getElementById('matchesContainer');
  if(!container) return;
  container.insertAdjacentHTML('beforeend', createMatchCard(matchCount));
  loadTeams();
  updateTambahButton();
  document.getElementById(`matchCard_${matchCount}`)?.scrollIntoView({behavior:'smooth'});
}

function hapusPrediksi(idx){
  if(matchCount<=1){ alert('Minimal 1 pertandingan harus ada!'); return; }
  const card=document.getElementById(`matchCard_${idx}`);
  if(card) card.remove();
  // Re-index tidak perlu, biarkan sparse tapi hitung ulang tombol
  // Untuk simpel, kita tidak re-index, hanya kurangi counter visual
  const cards=document.querySelectorAll('.match-card');
  matchCount=cards.length;
  updateTambahButton();
}

function updateTambahButton(){
  const btn=document.getElementById('btnTambahPrediksi');
  if(!btn) return;
  if(matchCount>=MAX_MATCHES){
    btn.disabled=true; btn.style.opacity='0.5'; btn.innerHTML=`<i class="fa-solid fa-ban"></i> Maksimal ${MAX_MATCHES} Pertandingan`;
  }else{
    btn.disabled=false; btn.style.opacity='1'; btn.innerHTML=`<i class="fa-solid fa-plus"></i> Tambah Prediksi (${matchCount}/${MAX_MATCHES})`;
  }
  const counter=document.getElementById('matchCounter');
  if(counter) counter.textContent=`${document.querySelectorAll('.match-card').length} pertandingan`;
}

function kembaliKeBeranda(){
  if(confirm('Kembali ke beranda? Semua input prediksi akan di-reset.')){
    // Opsi 1: redirect ke index.html di root atau ../index.html
    // Cek apakah ada elemen beranda
    const beranda=document.getElementById('beranda') || document.getElementById('home');
    if(beranda){
      beranda.scrollIntoView({behavior:'smooth'});
    }
    // Reset semua
    const container=document.getElementById('matchesContainer');
    if(container){
      container.innerHTML=createMatchCard(1);
      matchCount=1;
      loadTeams();
      updateTambahButton();
    }
    const hasilAll=document.getElementById('hasilPrediksi');
    if(hasilAll) hasilAll.innerHTML='';
    const hasilGlobal=document.getElementById('hasilSemuaPrediksi');
    if(hasilGlobal) hasilGlobal.innerHTML='';
    window.scrollTo({top:0, behavior:'smooth'});
    // Jika kamu punya file index.html di root:
    // window.location.href = '../index.html'; // uncomment jika mau redirect beneran
  }
}

function hitungSingle(idx){
  const tim1=document.getElementById(`tim1_${idx}`)?.value || document.getElementById(`teamA_${idx}`)?.value;
  const tim2=document.getElementById(`tim2_${idx}`)?.value || document.getElementById(`teamB_${idx}`)?.value;
  const odds1=parseFloat(document.getElementById(`oddA_${idx}`)?.value);
  const oddsDraw=parseFloat(document.getElementById(`oddDraw_${idx}`)?.value);
  const odds2=parseFloat(document.getElementById(`oddB_${idx}`)?.value);

  if(!tim1||!tim2){ alert(`Pilih tim di pertandingan ${idx}!`); return null; }
  if(tim1===tim2){ alert(`Pertandingan ${idx}: Tim tidak boleh sama!`); return null; }
  if(isNaN(odds1)||isNaN(oddsDraw)||isNaN(odds2)||odds1<=1||oddsDraw<=1||odds2<=1){ alert(`Pertandingan ${idx}: Isi odds dengan benar!`); return null; }

  const p1=1/odds1, pD=1/oddsDraw, p2=1/odds2;
  const totalM=p1+pD+p2;
  const prob1M=p1/totalM, probDM=pD/totalM, prob2M=p2/totalM;
  const margin=(totalM-1)*100;

  let gfA=parseFloat(document.getElementById(`gfA_${idx}`)?.value); if(isNaN(gfA)) gfA=11;
  let gaA=parseFloat(document.getElementById(`gaA_${idx}`)?.value); if(isNaN(gaA)) gaA=4;
  let gfB=parseFloat(document.getElementById(`gfB_${idx}`)?.value); if(isNaN(gfB)) gfB=13;
  let gaB=parseFloat(document.getElementById(`gaB_${idx}`)?.value); if(isNaN(gaB)) gaB=7;
  let h2hA=parseFloat(document.getElementById(`h2hA_${idx}`)?.value); if(isNaN(h2hA)) h2hA=1.8;
  let h2hB=parseFloat(document.getElementById(`h2hB_${idx}`)?.value); if(isNaN(h2hB)) h2hB=1.6;
  const statMode=document.getElementById(`statMode_${idx}`)?.value || 'total';
  if(statMode==='total'){ gfA/=5; gaA/=5; gfB/=5; gaB/=5; }
  const homeAdv=document.getElementById(`homeAdv_${idx}`)?.checked || false;
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
  scoreMatrix.forEach(s=>s.prob/=totalProb); scoreMatrix.sort((a,b)=>b.prob-a.prob);

  const evA=(probAWin*odds1-1)*100, evD=(probDraw*oddsDraw-1)*100, evB=(probBWin*odds2-1)*100;

  return {idx, tim1, tim2, odds1, oddsDraw, odds2, prob1M, probDM, prob2M, margin, xgA, xgB, probAWin, probDraw, probBWin, probOver15, probOver25, probOver35, scoreMatrix, evA, evD, evB, statMode, homeAdv, gfA:gfA*(statMode==='total'?5:1), gaA:gaA*(statMode==='total'?5:1), gfB:gfB*(statMode==='total'?5:1), gaB:gaB*(statMode==='total'?5:1), h2hA, h2hB};
}

function renderSingleResult(data){
  if(!data) return;
  const {idx, tim1, tim2, odds1, oddsDraw, odds2, prob1M, probDM, prob2M, margin, xgA, xgB, probAWin, probDraw, probBWin, probOver25, scoreMatrix, evA, evD, evB} = data;
  const el=document.getElementById(`hasilPrediksi_${idx}`);
  if(!el) return;
  let pasar='';
  if(prob1M>prob2M && prob1M>probDM) pasar=`${tim1} unggul (pasar)`;
  else if(prob2M>prob1M && prob2M>probDM) pasar=`${tim2} unggul (pasar)`;
  else pasar=`Potensi SERI (pasar)`;

  el.innerHTML=`
    <div style="padding:12px; background:#020617; border:1px solid #1e293b; border-radius:10px; color:#e2e8f0; font-size:12px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <strong style="color:#fff;">${tim1} vs ${tim2}</strong>
        <span style="background:#0f172a; border:1px solid #334155; padding:2px 6px; border-radius:6px; font-size:10px;">xG ${xgA.toFixed(2)} - ${xgB.toFixed(2)}</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div style="background:#1e293b; padding:8px; border-radius:8px;">
          <small style="color:#94a3b8;">Pasar (margin ${margin.toFixed(2)}%)</small><br>
          ${tim1}: ${(prob1M*100).toFixed(1)}%<br>Seri: ${(probDM*100).toFixed(1)}%<br>${tim2}: ${(prob2M*100).toFixed(1)}%<br><small>${pasar}</small>
        </div>
        <div style="background:#1e293b; padding:8px; border-radius:8px;">
          <small style="color:#94a3b8;">Model Poisson + EV</small><br>
          ${tim1}: ${(probAWin*100).toFixed(1)}% <span style="color:${evA>5?'#10b981':'#94a3b8'}">EV ${evA.toFixed(1)}%${evA>5?' 🔥':''}</span><br>
          Seri: ${(probDraw*100).toFixed(1)}% <span style="color:${evD>5?'#10b981':'#94a3b8'}">EV ${evD.toFixed(1)}%</span><br>
          ${tim2}: ${(probBWin*100).toFixed(1)}% <span style="color:${evB>5?'#10b981':'#94a3b8'}">EV ${evB.toFixed(1)}%${evB>5?' 🔥':''}</span>
        </div>
      </div>
      <div style="margin-top:8px; display:flex; justify-content:space-between; font-size:11px;">
        <span>Top Skor: <strong style="color:#10b981;">${scoreMatrix[0].score}</strong> ${(scoreMatrix[0].prob*100).toFixed(1)}%</span>
        <span>Over 2.5: ${(probOver25*100).toFixed(1)}% | Under: ${((1-probOver25)*100).toFixed(1)}%</span>
      </div>
      <div style="margin-top:6px; font-size:10px; color:#64748b;">Top5: ${scoreMatrix.slice(0,5).map(s=>`${s.score} ${ (s.prob*100).toFixed(1)}%`).join(' | ')}</div>
    </div>
  `;
}

function hasilkanPrediksi(){
  // Support mode lama single + mode baru multi
  const singleCheck = document.getElementById('tim1') && !document.getElementById('tim1_1');
  if(singleCheck){
    // fallback ke logic single lama (v3.2)
    const idx=1;
    // mapping id lama ke idx
    ['tim1','tim2','oddA','oddDraw','oddB','gfA','gaA','gfB','gaB','h2hA','h2hB','statMode','homeAdv'].forEach(id=>{
      const old=document.getElementById(id);
      const nw=document.getElementById(`${id}_${idx}`) || document.getElementById(id);
      // tidak perlu copy, hitung langsung pakai id lama di hitungSingle? kita buat adapter
    });
    // gunakan versi single dari v3.2
    return hasilkanPrediksiSingleLegacy();
  }

  const cards=document.querySelectorAll('.match-card');
  if(cards.length===0){ alert('Tidak ada pertandingan!'); return; }
  const allResults=[];
  for(const card of cards){
    const idx=card.dataset.idx;
    const data=hitungSingle(idx);
    if(!data) return; // stop jika ada error
    renderSingleResult(data);
    allResults.push(data);
  }
  renderRekapGlobal(allResults);
  document.getElementById('hasilSemuaPrediksi')?.scrollIntoView({behavior:'smooth'});
}

function hasilkanPrediksiSingleLegacy(){
  // Logic v3.2 single (agar kompatibel jika HTML masih lama)
  const tim1=document.getElementById('tim1')?.value || document.getElementById('teamA')?.value;
  const tim2=document.getElementById('tim2')?.value || document.getElementById('teamB')?.value;
  const odds1=parseFloat(document.getElementById('oddA')?.value || document.getElementById('oddsA')?.value);
  const oddsDraw=parseFloat(document.getElementById('oddDraw')?.value);
  const odds2=parseFloat(document.getElementById('oddB')?.value || document.getElementById('oddsB')?.value);
  if(!tim1||!tim2){ alert('Pilih tim!'); return; }
  if(tim1===tim2){ alert('Tim sama!'); return; }
  if(isNaN(odds1)||isNaN(oddsDraw)||isNaN(odds2)){ alert('Odds salah!'); return; }
  // Panggil hitungSingle dengan idx 1 tapi pakai id lama -> buat wrapper sementara
  const container=document.getElementById('matchesContainer');
  if(!container){
    // Jika tidak ada container multi, buat hasil simple di hasilPrediksi
    const dummy={idx:1, tim1, tim2, odds1, oddsDraw, odds2};
    // gunakan fungsi hitung yang support id tanpa suffix
    const data=hitungSingleLegacyAdapter();
    if(data){ renderLegacy(data); }
  }
}

function hitungSingleLegacyAdapter(){
  // Adapter untuk HTML lama tanpa suffix _1
  const tim1=document.getElementById('tim1')?.value || document.getElementById('teamA')?.value;
  const tim2=document.getElementById('tim2')?.value || document.getElementById('teamB')?.value;
  const odds1=parseFloat(document.getElementById('oddA')?.value || document.getElementById('oddsA')?.value);
  const oddsDraw=parseFloat(document.getElementById('oddDraw')?.value);
  const odds2=parseFloat(document.getElementById('oddB')?.value || document.getElementById('oddsB')?.value);
  let gfA=parseFloat(document.getElementById('gfA')?.value); if(isNaN(gfA)) gfA=11;
  let gaA=parseFloat(document.getElementById('gaA')?.value); if(isNaN(gaA)) gaA=4;
  let gfB=parseFloat(document.getElementById('gfB')?.value); if(isNaN(gfB)) gfB=13;
  let gaB=parseFloat(document.getElementById('gaB')?.value); if(isNaN(gaB)) gaB=7;
  let h2hA=parseFloat(document.getElementById('h2hA')?.value); if(isNaN(h2hA)) h2hA=1.8;
  let h2hB=parseFloat(document.getElementById('h2hB')?.value); if(isNaN(h2hB)) h2hB=1.6;
  const statMode=document.getElementById('statMode')?.value || 'total';
  if(statMode==='total'){ gfA/=5; gaA/=5; gfB/=5; gaB/=5; }
  const homeAdv=document.getElementById('homeAdv')?.checked || false;
  let xgA=Math.max(0.2,(gfA*0.4)+(gaB*0.4)+(h2hA*0.2)); let xgB=Math.max(0.2,(gfB*0.4)+(gaA*0.4)+(h2hB*0.2));
  if(homeAdv) xgA*=1.15;
  let probAWin=0,probDraw=0,probBWin=0, probOver25=0; const scoreMatrix=[]; let totalProb=0; const rho=0.13;
  for(let i=0;i<=6;i++) for(let j=0;j<=6;j++){ let pA=poissonLog(i,xgA), pB=poissonLog(j,xgB), pC=pA*pB; if(i<=1&&j<=1){ if(i==0&&j==0) pC*=1-(xgB*rho); else if(i==0&&j==1) pC*=1+(xgA*rho); else if(i==1&&j==0) pC*=1+(xgB*rho); else if(i==1&&j==1) pC*=1-rho; } totalProb+=pC; if(i>j) probAWin+=pC; else if(i===j) probDraw+=pC; else probBWin+=pC; if((i+j)>2.5) probOver25+=pC; scoreMatrix.push({score:`${i}-${j}`, i,j, prob:pC}); }
  probAWin/=totalProb; probDraw/=totalProb; probBWin/=totalProb; probOver25/=totalProb; scoreMatrix.forEach(s=>s.prob/=totalProb); scoreMatrix.sort((a,b)=>b.prob-a.prob);
  const p1=1/odds1, pD=1/oddsDraw, p2=1/odds2, totalM=p1+pD+p2;
  return {tim1,tim2, odds1,oddsDraw,odds2, prob1M:p1/totalM, probDM:pD/totalM, prob2M:p2/totalM, margin:(totalM-1)*100, xgA,xgB, probAWin,probDraw,probBWin,probOver25, scoreMatrix, evA:(probAWin*odds1-1)*100, evD:(probDraw*oddsDraw-1)*100, evB:(probBWin*odds2-1)*100};
}

function renderLegacy(data){
  const el=document.getElementById('hasilPrediksi'); if(!el) return;
  el.classList.remove('hidden');
  el.innerHTML=`<div style="padding:16px; background:#f8f9fa; border-radius:10px; border-left:4px solid #10b981; color:#212529;"><h3>${data.tim1} vs ${data.tim2}</h3><p>xG ${data.xgA.toFixed(2)} - ${data.xgB.toFixed(2)} | Top ${data.scoreMatrix[0].score} ${(data.scoreMatrix[0].prob*100).toFixed(1)}%</p><p>Model: ${data.tim1} ${(data.probAWin*100).toFixed(1)}% EV ${data.evA.toFixed(1)}% | Seri ${(data.probDraw*100).toFixed(1)}% EV ${data.evD.toFixed(1)}% | ${data.tim2} ${(data.probBWin*100).toFixed(1)}% EV ${data.evB.toFixed(1)}%</p></div>`;
}

function renderRekapGlobal(results){
  const globalEl=document.getElementById('hasilSemuaPrediksi');
  if(!globalEl) return;
  if(results.length===0){ globalEl.innerHTML=''; return; }
  let html=`<div style="margin-top:20px; padding:16px; background:#1e293b; border:1px solid #334155; border-radius:12px;">
    <h3 style="margin:0 0 12px 0; color:#fff; font-size:14px; font-weight:800;">📋 Rekap ${results.length} Prediksi</h3>
    <div style="display:grid; gap:8px;">`;
  results.forEach(r=>{
    const best = r.probAWin>r.probBWin && r.probAWin>r.probDraw ? r.tim1 : r.probBWin>r.probDraw ? r.tim2 : 'SERI';
    const bestEv = Math.max(r.evA, r.evD, r.evB);
    html+=`<div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:10px 12px; border-radius:8px; border:1px solid #1e293b;">
      <div><strong style="color:#fff; font-size:13px;">${r.tim1} vs ${r.tim2}</strong><br><small style="color:#94a3b8;">${r.scoreMatrix[0].score} (${(r.scoreMatrix[0].prob*100).toFixed(1)}%) | Over 2.5 ${(r.probOver25*100).toFixed(1)}%</small></div>
      <div style="text-align:right;"><span style="background:${bestEv>5?'#10b981':'#334155'}; color:${bestEv>5?'#000':'#e2e8f0'}; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700;">${best} ${bestEv>5?'🔥 VALUE':''}</span><br><small style="color:#64748b;">EV ${bestEv.toFixed(1)}%</small></div>
    </div>`;
  });
  html+=`</div>
    <div style="margin-top:12px; display:flex; gap:8px;">
      <button onclick="kembaliKeBeranda()" style="background:#334155; color:#e2e8f0; border:1px solid #475569; padding:8px 16px; border-radius:8px; font-size:12px; cursor:pointer;"><i class="fa-solid fa-house"></i> Kembali ke Beranda</button>
      <button onclick="exportRekap()" style="background:#10b981; color:#000; border:none; padding:8px 16px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;"><i class="fa-solid fa-download"></i> Export TXT</button>
    </div>
  </div>`;
  globalEl.innerHTML=html;
}

function exportRekap(){
  const results=window.lastAllPredictions || [];
  if(results.length===0){ alert('Belum ada prediksi!'); return; }
  let txt=`REKAP PREDIKSI - ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;
  results.forEach((r,i)=>{
    txt+=`${i+1}. ${r.tim1} vs ${r.tim2}\n`;
    txt+=`   Odds: ${r.odds1} | ${r.oddsDraw} | ${r.odds2} (Margin ${r.margin.toFixed(2)}%)\n`;
    txt+=`   xG: ${r.xgA.toFixed(2)} - ${r.xgB.toFixed(2)} (HomeAdv ${r.homeAdv?'Ya':'Tidak'})\n`;
    txt+=`   Model: ${r.tim1} ${(r.probAWin*100).toFixed(1)}% EV ${r.evA.toFixed(1)}% | Seri ${(r.probDraw*100).toFixed(1)}% EV ${r.evD.toFixed(1)}% | ${r.tim2} ${(r.probBWin*100).toFixed(1)}% EV ${r.evB.toFixed(1)}%\n`;
    txt+=`   Top Skor: ${r.scoreMatrix[0].score} ${(r.scoreMatrix[0].prob*100).toFixed(1)}% | Over 2.5 ${(r.probOver25*100).toFixed(1)}%\n`;
    txt+=`   Top5: ${r.scoreMatrix.slice(0,5).map(s=>`${s.score} ${ (s.prob*100).toFixed(1)}%`).join(', ')}\n\n`;
  });
  const blob=new Blob([txt], {type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`prediksi_${new Date().toISOString().slice(0,10)}.txt`; a.click();
  URL.revokeObjectURL(url);
}

// Kompatibilitas
function calculatePrediction(){ return hasilkanPrediksi(); }

document.addEventListener('DOMContentLoaded', ()=>{
  // Buat struktur multi jika belum ada
  let container=document.getElementById('matchesContainer');
  if(!container){
    // Cari tempat untuk inject: sebelum hasilPrediksi atau setelah body start
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
      <div id="hasilSemuaPrediksi" style="margin-top:16px;"></div>
      <div id="statusTeams" style="margin-top:12px; font-size:11px; color:#64748b;"></div>
    `;
    if(hasil){
      hasil.parentNode.insertBefore(wrapper, hasil);
      // Sembunyikan hasil lama jika ada, pakai yang baru per card
      if(!hasil.classList.contains('force-simple')){
        hasil.style.display='none';
      }
    }else{
      document.body.prepend(wrapper);
    }
    container=document.getElementById('matchesContainer');
  }

  if(container && container.children.length===0){
    container.innerHTML=createMatchCard(1);
    matchCount=1;
  }else{
    matchCount=document.querySelectorAll('.match-card').length || 1;
  }

  loadTeams();
  updateTambahButton();

  // Event untuk tombol lama jika masih ada
  const btnLama=document.getElementById('btnPrediksi');
  if(btnLama && !btnLama.onclick){
    btnLama.addEventListener('click', hasilkanPrediksi);
  }
});

// Simpan global
window.lastAllPredictions=[];
const originalRenderRekap=renderRekapGlobal;
renderRekapGlobal=function(results){
  window.lastAllPredictions=results;
  return originalRenderRekap(results);
};
