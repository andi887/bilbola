async function loadTeams() {
  try {
    const res = await fetch('../data/teams.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    const select1 = document.getElementById('tim1');
    const select2 = document.getElementById('tim2');
    if (!select1 || !select2) return;

    select1.innerHTML = '';
    select2.innerHTML = '';

    // data bentuknya { "Premier League": [...], "La Liga": [...] }
    for (const [liga, daftarKlub] of Object.entries(data)) {
      const group1 = document.createElement('optgroup');
      group1.label = liga;
      const group2 = document.createElement('optgroup');
      group2.label = liga;

      daftarKlub.forEach(namaTim => {
        const opt1 = document.createElement('option');
        opt1.value = namaTim;
        opt1.textContent = namaTim;
        group1.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = namaTim;
        opt2.textContent = namaTim;
        group2.appendChild(opt2);
      });

      select1.appendChild(group1);
      select2.appendChild(group2);
    }

    // Set default beda tim biar tidak sama
    if (select1.options.length > 0) select1.selectedIndex = 0;
    if (select2.options.length > 1) select2.selectedIndex = 1;

  } catch (err) {
    console.error('Gagal load teams:', err);
    const container = document.getElementById('hasilPrediksi');
    if (container) container.textContent = 'Gagal load data tim: ' + err.message;
  }
}

function hasilkanPrediksi() {
  const tim1 = document.getElementById('tim1')?.value;
  const tim2 = document.getElementById('tim2')?.value;
  // ID di HTML kamu adalah oddA, oddDraw, oddB
  const odds1 = parseFloat(document.getElementById('oddA')?.value);
  const oddsDraw = parseFloat(document.getElementById('oddDraw')?.value);
  const odds2 = parseFloat(document.getElementById('oddB')?.value);
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

  // Hitung probabilitas implied dari odds
  const p1 = 1 / odds1;
  const pDraw = 1 / oddsDraw;
  const p2 = 1 / odds2;
  const total = p1 + pDraw + p2;

  const prob1 = (p1 / total * 100);
  const probDraw = (pDraw / total * 100);
  const prob2 = (p2 / total * 100);

  let prediksi = '';
  let pemenang = '';
  if (prob1 > prob2 && prob1 > probDraw) {
    prediksi = `${tim1} lebih diunggulkan menang`;
    pemenang = tim1;
  } else if (prob2 > prob1 && prob2 > probDraw) {
    prediksi = `${tim2} lebih diunggulkan menang`;
    pemenang = tim2;
  } else {
    prediksi = `Pertandingan berpotensi SERI`;
    pemenang = 'Seri';
  }

  if (hasilDiv) {
    hasilDiv.innerHTML = `
      <div style="margin-top:20px; padding:15px; background:#f8f9fa; border-radius:8px; border-left:4px solid #0d6efd;">
        <h3 style="margin-top:0;">${tim1} vs ${tim2}</h3>
        <p style="font-size:18px; font-weight:bold;">${prediksi}</p>
        <p>Probabilitas (setelah normalisasi):</p>
        <ul>
          <li>${tim1}: ${prob1.toFixed(1)}%</li>
          <li>Seri: ${probDraw.toFixed(1)}%</li>
          <li>${tim2}: ${prob2.toFixed(1)}%</li>
        </ul>
        <p style="font-size:12px; color:#666;">Dihitung dari Odds: ${odds1} | ${oddsDraw} | ${odds2}</p>
      </div>
    `;
    hasilDiv.scrollIntoView({ behavior: 'smooth' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadTeams();
  const btn = document.getElementById('btnPrediksi');
  if (btn) {
    btn.addEventListener('click', hasilkanPrediksi);
  }
});
