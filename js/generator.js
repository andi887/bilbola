async function loadTeams() {
  try {
    const res = await fetch('../data/teams.json');
    if (!res.ok) throw new Error(res.status);
    const data = await res.json(); // data = { "Premier League": [...], "La Liga": [...] }

    const select1 = document.getElementById('tim1'); // cek id di html kamu, sesuaikan
    const select2 = document.getElementById('tim2');
    
    if (!select1 || !select2) return;

    select1.innerHTML = '';
    select2.innerHTML = '';

    // Loop per liga biar rapi pakai optgroup
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
      select2.appendChild(group2.cloneNode(true)); // clone biar sama
      // kalau cloneNode true tidak bawa option di beberapa browser, pakai loop kedua
      // lebih aman append group2 langsung kalau sudah buat 2 group
      // di kode atas aku sudah buat 2 group terpisah
    }
    // perbaikan: karena diatas aku buat group1 & group2 terpisah, append group2 bukan clone
    // versi paling aman:
    // select2.appendChild(group2);
    
  } catch (err) {
    console.error('Gagal load teams:', err);
  }
}

loadTeams();
