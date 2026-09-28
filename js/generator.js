async function loadTeams() {
  const response = await fetch("../data/teams.json");
  const teams = await response.json();

  const tim1Select = document.getElementById("tim1");
  const tim2Select = document.getElementById("tim2");

  teams.forEach(team => {
    const opt1 = document.createElement("option");
    opt1.value = team;
    opt1.textContent = team;
    tim1Select.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = team;
    opt2.textContent = team;
    tim2Select.appendChild(opt2);
  });
}

async function buatPrediksi() {
  const tim1 = document.getElementById("tim1").value;
  const tim2 = document.getElementById("tim2").value;

  const oddA = parseFloat(document.getElementById("oddA").value);
  const oddDraw = parseFloat(document.getElementById("oddDraw").value);
  const oddB = parseFloat(document.getElementById("oddB").value);

  // Konversi odds ke probabilitas tersirat
  let pA = 1 / oddA;
  let pDraw = 1 / oddDraw;
  let pB = 1 / oddB;
  let margin = (pA + pDraw + pB) - 1;

  // Normalisasi
  let pA_adj = pA / (1 + margin);
  let pDraw_adj = pDraw / (1 + margin);
  let pB_adj = pB / (1 + margin);

  // Ambil data statistik tim
  const statsResponse = await fetch("../data/predictions.json");
  const stats = await statsResponse.json();
  let statA = stats[tim1]?.win_rate || 0.5;
  let statB = stats[tim2]?.win_rate || 0.5;

  // Gabungkan odds + statistik (70% odds, 30% statistik)
  let pA_final = (pA_adj * 0.7) + (statA * 0.3);
  let pB_final = (pB_adj * 0.7) + (statB * 0.3);
  let pDraw_final = pDraw_adj;

  // Tentukan hasil
  let hasil;
  if (pA_final > pB_final && pA_final > pDraw_final) hasil = `${tim1} diprediksi menang`;
  else if (pB_final > pA_final && pB_final > pDraw_final) hasil = `${tim2} diprediksi menang`;
  else hasil = "Pertandingan diprediksi seri";

  document.getElementById("hasilPrediksi").innerHTML = `
    <p>Probabilitas ${tim1}: ${(pA_final*100).toFixed(2)}%</p>
    <p>Probabilitas Seri: ${(pDraw_final*100).toFixed(2)}%</p>
    <p>Probabilitas ${tim2}: ${(pB_final*100).toFixed(2)}%</p>
    <h3>${hasil}</h3>
  `;
}

document.getElementById("btnPrediksi").addEventListener("click", buatPrediksi);
loadTeams();
