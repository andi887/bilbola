// ==================== GLOBAL STATE ====================
let matchCount = 0;
let favoriteTeams = [];
let sketsaHistory = [];
let discussions = [];

// ==================== TAB NAVIGATION ====================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        updateStats();
    });
});

// ==================== TAB 1: ANALISIS PARLAY + O/U ====================

function createMatchCard(index) {
    return `
        <div class="match-card" id="match-${index}">
            <h4>Pertandingan ${index}</h4>
            <div class="match-fields">
                <div class="field-group">
                    <label>Tanggal:</label>
                    <input type="date" class="match-date">
                </div>
                <div class="field-group">
                    <label>Nama Tim A:</label>
                    <input type="text" class="match-team-a" placeholder="Tim A" value="Tim A">
                </div>
                <div class="field-group">
                    <label>Odds A:</label>
                    <input type="number" class="match-odds-a" placeholder="0" step="0.01" min="0" value="0">
                </div>
                <div class="field-group">
                    <label>Draw:</label>
                    <input type="number" class="match-draw" placeholder="0" step="0.01" min="0" value="0">
                </div>
                <div class="field-group">
                    <label>Nama Tim B:</label>
                    <input type="text" class="match-team-b" placeholder="Tim B" value="Tim B">
                </div>
                <div class="field-group">
                    <label>Odds B:</label>
                    <input type="number" class="match-odds-b" placeholder="0" step="0.01" min="0" value="0">
                </div>
                <div class="field-group">
                    <label>Over:</label>
                    <input type="number" class="match-over" placeholder="0" step="0.01" min="0" value="0">
                </div>
                <div class="field-group">
                    <label>Under:</label>
                    <input type="number" class="match-under" placeholder="0" step="0.01" min="0" value="0">
                </div>
            </div>
        </div>
    `;
}

function addMatch() {
    matchCount++;
    const container = document.getElementById('matches-container');
    container.insertAdjacentHTML('beforeend', createMatchCard(matchCount));
}

function removeMatch() {
    if (matchCount <= 0) {
        alert('Tidak ada pertandingan untuk dihapus!');
        return;
    }
    const lastMatch = document.getElementById(`match-${matchCount}`);
    if (lastMatch) {
        lastMatch.remove();
        matchCount--;
    }
}

document.getElementById('btn-add-match').addEventListener('click', addMatch);
document.getElementById('btn-remove-match').addEventListener('click', removeMatch);

// Initialize with 1 match
addMatch();

// ==================== FAIR ODDS CALCULATION ====================
document.getElementById('btn-fair-odds').addEventListener('click', () => {
    const matches = document.querySelectorAll('.match-card');
    if (matches.length === 0) {
        alert('Tambahkan pertandingan terlebih dahulu!');
        return;
    }

    let html = '<div class="result-card"><h4>📊 Odds Adil per Laga</h4>';
    html += '<table class="fair-odds-table"><thead><tr><th>Laga</th><th>Tim A</th><th>Tim B</th><th>Odds A</th><th>Odds B</th><th>Draw</th><th>Margin Bandar</th><th>Odds Adil A</th><th>Odds Adil B</th><th>Odds Adil Draw</th></tr></thead><tbody>';

    matches.forEach((match, i) => {
        const teamA = match.querySelector('.match-team-a').value || 'Tim A';
        const teamB = match.querySelector('.match-team-b').value || 'Tim B';
        const oddsA = parseFloat(match.querySelector('.match-odds-a').value) || 0;
        const oddsB = parseFloat(match.querySelector('.match-odds-b').value) || 0;
        const draw = parseFloat(match.querySelector('.match-draw').value) || 0;

        if (oddsA > 0 && oddsB > 0 && draw > 0) {
            const impliedA = 1 / oddsA;
            const impliedB = 1 / oddsB;
            const impliedDraw = 1 / draw;
            const totalImplied = impliedA + impliedB + impliedDraw;
            const margin = ((totalImplied - 1) * 100).toFixed(2);

            const fairA = (oddsA * totalImplied).toFixed(2);
            const fairB = (oddsB * totalImplied).toFixed(2);
            const fairDraw = (draw * totalImplied).toFixed(2);

            html += `<tr>
                <td>${i + 1}</td>
                <td>${teamA}</td>
                <td>${teamB}</td>
                <td>${oddsA}</td>
                <td>${oddsB}</td>
                <td>${draw}</td>
                <td>${margin}%</td>
                <td><strong>${fairA}</strong></td>
                <td><strong>${fairB}</strong></td>
                <td><strong>${fairDraw}</strong></td>
            </tr>`;
        } else {
            html += `<tr>
                <td>${i + 1}</td>
                <td>${teamA}</td>
                <td>${teamB}</td>
                <td>${oddsA}</td>
                <td>${oddsB}</td>
                <td>${draw}</td>
                <td colspan="4" style="color:red;">Odds tidak lengkap</td>
            </tr>`;
        }
    });

    html += '</tbody></table></div>';
    document.getElementById('results-container').innerHTML = html;
});

// ==================== PARLAY & EV CALCULATION ====================
document.getElementById('btn-calculate').addEventListener('click', () => {
    const matches = document.querySelectorAll('.match-card');
    if (matches.length === 0) {
        alert('Tambahkan pertandingan terlebih dahulu!');
        return;
    }

    const parlayOdds = parseFloat(document.getElementById('parlay-odds').value) || 0;
    let html = '';
    let totalParlayProb = 1;
    let matchDetails = [];

    matches.forEach((match, i) => {
        const teamA = match.querySelector('.match-team-a').value || 'Tim A';
        const teamB = match.querySelector('.match-team-b').value || 'Tim B';
        const oddsA = parseFloat(match.querySelector('.match-odds-a').value) || 0;
        const oddsB = parseFloat(match.querySelector('.match-odds-b').value) || 0;
        const draw = parseFloat(match.querySelector('.match-draw').value) || 0;
        const over = parseFloat(match.querySelector('.match-over').value) || 0;
        const under = parseFloat(match.querySelector('.match-under').value) || 0;

        let matchHtml = `<div class="result-card"><h4>🏟 Pertandingan ${i + 1}: ${teamA} vs ${teamB}</h4>`;

        // Probability calculations
        if (oddsA > 0 && oddsB > 0 && draw > 0) {
            const impliedA = 1 / oddsA;
            const impliedB = 1 / oddsB;
            const impliedDraw = 1 / draw;
            const totalImplied = impliedA + impliedB + impliedDraw;

            const probA = (impliedA / totalImplied * 100).toFixed(2);
            const probB = (impliedB / totalImplied * 100).toFixed(2);
            const probDraw = (impliedDraw / totalImplied * 100).toFixed(2);

            matchHtml += `<p>Probabilitas Tim A Menang: <span class="highlight">${probA}%</span></p>`;
            matchHtml += `<p>Probabilitas Draw: <span class="highlight">${probDraw}%</span></p>`;
            matchHtml += `<p>Probabilitas Tim B Menang: <span class="highlight">${probB}%</span></p>`;

            // EV Calculation (assuming 1 unit stake)
            const evA = (probA / 100 * oddsA - 1).toFixed(4);
            const evB = (probB / 100 * oddsB - 1).toFixed(4);
            const evDraw = (probDraw / 100 * draw - 1).toFixed(4);

            matchHtml += `<p>EV Tim A: <strong>${evA}</strong> ${evA > 0 ? '✅ Value Bet' : '❌ Negative EV'}</p>`;
            matchHtml += `<p>EV Draw: <strong>${evDraw}</strong> ${evDraw > 0 ? '✅ Value Bet' : '❌ Negative EV'}</p>`;
            matchHtml += `<p>EV Tim B: <strong>${evB}</strong> ${evB > 0 ? '✅ Value Bet' : '❌ Negative EV'}</p>`;

            totalParlayProb *= (parseFloat(probA) + parseFloat(probB) + parseFloat(probDraw)) / 100;

            matchDetails.push({ teamA, teamB, probA, probB, probDraw, evA, evB, evDraw });
        }

        // Over/Under Analysis
        if (over > 0 && under > 0) {
            const impliedOver = 1 / over;
            const impliedUnder = 1 / under;
            const totalOU = impliedOver + impliedUnder;
            const probOver = (impliedOver / totalOU * 100).toFixed(2);
            const probUnder = (impliedUnder / totalOU * 100).toFixed(2);

            matchHtml += `<hr style="margin:10px 0; border:none; border-top:1px solid #ccc;">`;
            matchHtml += `<p><strong>Over/Under:</strong></p>`;
            matchHtml += `<p>Probabilitas Over: <span class="highlight">${probOver}%</span></p>`;
            matchHtml += `<p>Probabilitas Under: <span class="highlight">${probUnder}%</span></p>`;

            const evOver = (probOver / 100 * over - 1).toFixed(4);
            const evUnder = (probUnder / 100 * under - 1).toFixed(4);

            matchHtml += `<p>EV Over: <strong>${evOver}</strong> ${evOver > 0 ? '✅' : '❌'}</p>`;
            matchHtml += `<p>EV Under: <strong>${evUnder}</strong> ${evUnder > 0 ? '✅' : '❌'}</p>`;

            // Recommendation
            const recOver = probOver > 55 ? 'OVER' : probUnder > 55 ? 'UNDER' : 'TIDAK ADA REKOMENDASI KUAT';
            matchHtml += `<p><strong>Rekomendasi O/U:</strong> <span class="highlight">${recOver}</span></p>`;
        }

        matchHtml += '</div>';
        html += matchHtml;
    });

    // Parlay Analysis
    if (parlayOdds > 0 && matchDetails.length > 0) {
        // Calculate combined probability (using highest prob for each match)
        let combinedProb = 1;
        matchDetails.forEach(m => {
            const maxProb = Math.max(parseFloat(m.probA), parseFloat(m.probB), parseFloat(m.probDraw));
            combinedProb *= maxProb / 100;
        });

        const fairParlayOdds = (1 / combinedProb).toFixed(2);
        const parlayEV = (combinedProb * parlayOdds - 1).toFixed(4);
        const parlayMargin = ((1 / parlayOdds - combinedProb) * 100).toFixed(2);

        html += `<div class="result-card ${parlayEV > 0 ? '' : 'warning'}">
            <h4>🎯 Analisis Parlay</h4>
            <p>Jumlah Laga: <strong>${matchDetails.length}</strong></p>
            <p>Probabilitas Gabungan: <span class="highlight">${(combinedProb * 100).toFixed(4)}%</span></p>
            <p>Odds Parlay Bandar: <strong>${parlayOdds}</strong></p>
            <p>Odds Parlay Adil: <span class="highlight">${fairParlayOdds}</span></p>
            <p>Margin Bandar: <strong>${parlayMargin}%</strong></p>
            <p>Expected Value Parlay: <strong>${parlayEV}</strong></p>
            <p><strong>Rekomendasi:</strong> ${parlayEV > 0 ? '✅ Parlay memiliki nilai positif (Value Bet)' : '⚠️ Parlay memiliki nilai negatif, pertimbangkan ulang'}</p>
        </div>`;
    }

    document.getElementById('results-container').innerHTML = html;
});

// ==================== SAVE DATA ====================
document.getElementById('btn-save-data').addEventListener('click', () => {
    const matches = document.querySelectorAll('.match-card');
    const data = [];

    matches.forEach((match, i) => {
        data.push({
            index: i + 1,
            date: match.querySelector('.match-date').value,
            teamA: match.querySelector('.match-team-a').value,
            oddsA: match.querySelector('.match-odds-a').value,
            draw: match.querySelector('.match-draw').value,
            teamB: match.querySelector('.match-team-b').value,
            oddsB: match.querySelector('.match-odds-b').value,
            over: match.querySelector('.match-over').value,
            under: match.querySelector('.match-under').value
        });
    });

    const parlayOdds = document.getElementById('parlay-odds').value;

    const saveData = {
        matches: data,
        parlayOdds: parlayOdds,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem('sportsAnalysisData', JSON.stringify(saveData));
    alert('✅ Data pertandingan berhasil disimpan!');
    updateStats();
});

// Load saved data on page load
function loadSavedData() {
    const saved = localStorage.getItem('sportsAnalysisData');
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('parlay-odds').value = data.parlayOdds || 30;

        data.matches.forEach(m => {
            matchCount++;
            const container = document.getElementById('matches-container');
            container.insertAdjacentHTML('beforeend', createMatchCard(matchCount));

            const matchEl = document.getElementById(`match-${matchCount}`);
            matchEl.querySelector('.match-date').value = m.date || '';
            matchEl.querySelector('.match-team-a').value = m.teamA || '';
            matchEl.querySelector('.match-odds-a').value = m.oddsA || 0;
            matchEl.querySelector('.match-draw').value = m.draw || 0;
            matchEl.querySelector('.match-team-b').value = m.teamB || '';
            matchEl.querySelector('.match-odds-b').value = m.oddsB || 0;
            matchEl.querySelector('.match-over').value = m.over || 0;
            matchEl.querySelector('.match-under').value = m.under || 0;
        });
    }
}

loadSavedData();

// ==================== TAB 2: KUMPULAN TIM FAVORIT ====================
document.getElementById('btn-add-fav').addEventListener('click', () => {
    const name = document.getElementById('fav-team-name').value.trim();
    const league = document.getElementById('fav-team-league').value.trim();
    const rating = parseInt(document.getElementById('fav-team-rating').value);

    if (!name) {
        alert('Masukkan nama tim!');
        return;
    }

    favoriteTeams.push({
        name,
        league: league || 'Umum',
        rating: rating || 5,
        wins: Math.floor(Math.random() * 20) + 5,
        draws: Math.floor(Math.random() * 10) + 2,
        losses: Math.floor(Math.random() * 10) + 1
    });

    document.getElementById('fav-team-name').value = '';
    document.getElementById('fav-team-league').value = '';
    document.getElementById('fav-team-rating').value = '';

    renderFavTable();
    updateStats();
});

function renderFavTable() {
    const tbody = document.getElementById('fav-tbody');
    tbody.innerHTML = '';

    favoriteTeams.forEach((team, i) => {
        const total = team.wins + team.draws + team.losses;
        const winRate = ((team.wins / total) * 100).toFixed(1);

        tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${team.name}</strong></td>
                <td>${team.league}</td>
                <td>${team.rating}/10</td>
                <td>${team.wins}</td>
                <td>${team.draws}</td>
                <td>${team.losses}</td>
                <td><strong>${winRate}%</strong></td>
                <td><button class="btn btn-red" onclick="removeFavTeam(${i})">Hapus</button></td>
            </tr>
        `;
    });
}

function removeFavTeam(index) {
    favoriteTeams.splice(index, 1);
    renderFavTable();
    updateStats();
}

document.getElementById('btn-analyze-fav').addEventListener('click', () => {
    if (favoriteTeams.length === 0) {
        alert('Tambahkan tim favorit terlebih dahulu!');
        return;
    }

    let html = '<div class="result-card"><h4>📊 Analisis Tim Favorit</h4>';

    favoriteTeams.forEach(team => {
        const total = team.wins + team.draws + team.losses;
        const winRate = (team.wins / total * 100).toFixed(1);
        const formScore = (team.rating * winRate / 100).toFixed(1);
        const recommendation = formScore > 6 ? '🟢 Sangat Direkomendasikan' : formScore > 4 ? '🟡 Cukup Baik' : ' Kurang Direkomendasikan';

        html += `<p><strong>${team.name}</strong> (${team.league}) — Rating: ${team.rating}/10, Win Rate: ${winRate}%, Form Score: ${formScore} → ${recommendation}</p>`;
    });

    html += '</div>';
    document.getElementById('fav-results').innerHTML = html;
});

// ==================== TAB 3: SKETSA BIL (PREDIKSI SKOR) ====================
document.getElementById('btn-predict-score').addEventListener('click', () => {
    const teamA = document.getElementById('sketsa-team-a').value.trim();
    const goalsA = parseFloat(document.getElementById('sketsa-goals-a').value);
    const teamB = document.getElementById('sketsa-team-b').value.trim();
    const goalsB = parseFloat(document.getElementById('sketsa-goals-b').value);

    if (!teamA || !teamB || isNaN(goalsA) || isNaN(goalsB)) {
        alert('Lengkapi semua data!');
        return;
    }

    // Poisson distribution prediction
    function poissonProbability(lambda, k) {
        return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
    }

    function factorial(n) {
        if (n <= 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    // Find most likely scores
    let maxProb = 0;
    let bestScoreA = 0, bestScoreB = 0;
    let scoreProbabilities = [];

    for (let a = 0; a <= 6; a++) {
        for (let b = 0; b <= 6; b++) {
            const prob = poissonProbability(goalsA, a) * poissonProbability(goalsB, b);
            scoreProbabilities.push({ a, b, prob });
            if (prob > maxProb) {
                maxProb = prob;
                bestScoreA = a;
                bestScoreB = b;
            }
        }
    }

    // Calculate outcome probabilities
    let probAWin = 0, probDraw = 0, probBWin = 0, probOver25 = 0, probUnder25 = 0;

    scoreProbabilities.forEach(s => {
        if (s.a > s.b) probAWin += s.prob;
        else if (s.a === s.b) probDraw += s.prob;
        else probBWin += s.prob;

        if (s.a + s.b > 2.5) probOver25 += s.prob;
        else probUnder25 += s.prob;
    });

    const confidence = (maxProb * 100).toFixed(2);

    let html = `<div class="result-card">
        <h4>🔮 Prediksi Skor: ${teamA} vs ${teamB}</h4>
        <p>Skor Paling Mungkin: <span class="highlight">${bestScoreA} - ${bestScoreB}</span> (Confidence: ${confidence}%)</p>
        <hr style="margin:10px 0; border:none; border-top:1px solid #ccc;">
        <p>Probabilitas ${teamA} Menang: <span class="highlight">${(probAWin * 100).toFixed(2)}%</span></p>
        <p>Probabilitas Draw: <span class="highlight">${(probDraw * 100).toFixed(2)}%</span></p>
        <p>Probabilitas ${teamB} Menang: <span class="highlight">${(probBWin * 100).toFixed(2)}%</span></p>
        <hr style="margin:10px 0; border:none; border-top:1px solid #ccc;">
        <p>Probabilitas Over 2.5: <span class="highlight">${(probOver25 * 100).toFixed(2)}%</span></p>
        <p>Probabilitas Under 2.5: <span class="highlight">${(probUnder25 * 100).toFixed(2)}%</span></p>
        <p><strong>Rekomendasi:</strong> ${probAWin > probBWin ? teamA + ' lebih diunggulkan' : teamB + ' lebih diunggulkan'} | ${(probOver25 * 100) > 50 ? 'Over 2.5' : 'Under 2.5'} lebih mungkin</p>
    </div>`;

    document.getElementById('sketsa-results').innerHTML = html;

    // Add to history
    sketsaHistory.push({
        date: new Date().toLocaleDateString('id-ID'),
        teamA, teamB,
        predA: bestScoreA, predB: bestScoreB,
        confidence: confidence + '%'
    });

    renderSketsaHistory();
    updateStats();
});

function renderSketsaHistory() {
    const tbody = document.getElementById('sketsa-tbody');
    tbody.innerHTML = '';

    sketsaHistory.forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td>${s.date}</td>
                <td>${s.teamA}</td>
                <td>${s.teamB}</td>
                <td><strong>${s.predA}</strong></td>
                <td><strong>${s.predB}</strong></td>
                <td>${s.confidence}</td>
            </tr>
        `;
    });
}

// ==================== TAB 4: ROOM DISKUSI ====================
document.getElementById('btn-send-discuss').addEventListener('click', () => {
    const name = document.getElementById('discuss-name').value.trim();
    const topic = document.getElementById('discuss-topic').value.trim();
    const message = document.getElementById('discuss-message').value.trim();

    if (!name || !message) {
        alert('Nama dan pesan wajib diisi!');
        return;
    }

    discussions.push({
        name,
        topic: topic || 'Umum',
        message,
        time: new Date().toLocaleString('id-ID')
    });

    document.getElementById('discuss-name').value = '';
    document.getElementById('discuss-topic').value = '';
    document.getElementById('discuss-message').value = '';

    renderDiscussions();
    updateStats();
});

document.getElementById('btn-clear-discuss').addEventListener('click', () => {
    if (confirm('Hapus semua pesan diskusi?')) {
        discussions = [];
        renderDiscussions();
        updateStats();
    }
});

function renderDiscussions() {
    const container = document.getElementById('discussion-container');
    container.innerHTML = '';

    if (discussions.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Belum ada pesan diskusi. Mulai percakapan!</p>';
        return;
    }

    discussions.slice().reverse().forEach(d => {
        container.innerHTML += `
            <div class="discuss-item">
                <div class="discuss-header">
                    <span class="discuss-name">${d.name}</span>
                    <span class="discuss-topic">${d.topic}</span>
                </div>
                <p class="discuss-msg">${d.message}</p>
                <span class="discuss-time">${d.time}</span>
            </div>
        `;
    });
}

renderDiscussions();

// ==================== TAB 5: SERBA SERBI ====================

// Odds Calculator
document.getElementById('btn-calc-odds').addEventListener('click', () => {
    const stake = parseFloat(document.getElementById('calc-stake').value);
    const odds = parseFloat(document.getElementById('calc-odds').value);

    if (isNaN(stake) || isNaN(odds) || stake <= 0 || odds <= 0) {
        alert('Masukkan stake dan odds yang valid!');
        return;
    }

    const potentialWin = (stake * odds).toFixed(2);
    const profit = (potentialWin - stake).toFixed(2);

    document.getElementById('calc-results').innerHTML = `
        <div class="result-card" style="margin-top:10px;">
            <p>Stake: <strong>Rp ${stake.toLocaleString('id-ID')}</strong></p>
            <p>Odds: <strong>${odds}</strong></p>
            <p>Total Payout: <span class="highlight">Rp ${parseFloat(potentialWin).toLocaleString('id-ID')}</span></p>
            <p>Profit: <span class="highlight">Rp ${parseFloat(profit).toLocaleString('id-ID')}</span></p>
        </div>
    `;
});

// Odds Converter
document.getElementById('btn-convert').addEventListener('click', () => {
    const odds = parseFloat(document.getElementById('convert-odds').value);

    if (isNaN(odds) || odds <= 1) {
        alert('Masukkan odds decimal yang valid (> 1)!');
        return;
    }

    const impliedProb = (1 / odds * 100).toFixed(2);
    const americanOdds = odds >= 2 ? `+${((odds - 1) * 100).toFixed(0)}` : `${(-100 / (odds - 1)).toFixed(0)}`;
    const fractionalOdds = `${(odds - 1).toFixed(2)}/1`;

    document.getElementById('convert-results').innerHTML = `
        <div class="result-card" style="margin-top:10px;">
            <p>Odds Decimal: <strong>${odds}</strong></p>
            <p>Implied Probability: <span class="highlight">${impliedProb}%</span></p>
            <p>American Odds: <strong>${americanOdds}</strong></p>
            <p>Fractional Odds: <strong>${fractionalOdds}</strong></p>
        </div>
    `;
});

// ==================== UPDATE STATS ====================
function updateStats() {
    document.getElementById('stat-matches').textContent = matchCount;
    document.getElementById('stat-fav').textContent = favoriteTeams.length;
    document.getElementById('stat-sketsa').textContent = sketsaHistory.length;
    document.getElementById('stat-discuss').textContent = discussions.length;
}

updateStats();
