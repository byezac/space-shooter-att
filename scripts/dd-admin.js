if (!localStorage.getItem('adminPassword')) {
    localStorage.setItem('adminPassword', 'zac@2024');
}

const ADMIN_PASSWORD = localStorage.getItem('adminPassword');

document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('adminPassword');
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
});

function login() {
    const password = document.getElementById('adminPassword').value;
    if (password && password === ADMIN_PASSWORD) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('ratingsContainer').style.display = 'block';
        loadRatings();
    } else {
        alert('Senha incorreta!');
    }
}

function loadRatings() {
    const ratings = JSON.parse(localStorage.getItem('gameRatings')) || [];
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    
    if (ratings.length > 0) {
        const average = ratings.reduce((sum, r) => sum + parseInt(r.rating), 0) / ratings.length;
        const highestScore = Math.max(...highScores.map(score => score.score), 0);
        
        document.getElementById('totalRatings').textContent = ratings.length;
        document.getElementById('averageRating').textContent = `${average.toFixed(1)} ★`;
        document.getElementById('highestScore').textContent = highestScore;
    }

    const ratingsList = document.getElementById('ratingsList');
    ratingsList.innerHTML = '';

    const highScoresSection = `
        <div class="high-scores-section">
            <h2>Ranking de Jogadores</h2>
            <table>
                <thead>
                    <tr>
                        <th>Posição</th>
                        <th>Nome</th>
                        <th>Pontos</th>
                        <th>Level</th>
                        <th>Hora</th>
                    </tr>
                </thead>
                <tbody>
                    ${highScores.map((score, index) => `
                        <tr>
                            <td>${index + 1}º</td>
                            <td>${score.name}</td>
                            <td>${score.score}</td>
                            <td>${score.level}</td>
                            <td>${score.time}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="button-group">
                <button class="clear-button" onclick="clearHighScores()">Limpar Ranking</button>
            </div>
        </div>
    `;

    if (ratings.length === 0) {
        ratingsList.innerHTML = highScoresSection + '<div class="rating-card">Nenhuma avaliação encontrada.</div>';
        return;
    }

    let ratingsHTML = '';
    ratings.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(rating => {
        ratingsHTML += `
            <div class="rating-card">
                <h3>${rating.player}</h3>
                <div class="rating-stars">${'★'.repeat(rating.rating)}${'☆'.repeat(5-rating.rating)}</div>
                <p>Pontuação: ${rating.score} | Nível: ${rating.level}</p>
                ${rating.feedback ? `<div class="rating-feedback">"${rating.feedback}"</div>` : ''}
                <div class="rating-date">${rating.date}</div>
            </div>
        `;
    });

    ratingsList.innerHTML = highScoresSection + ratingsHTML;
}

function exportToExcel() {
    const ratings = JSON.parse(localStorage.getItem('gameRatings')) || [];
    if (ratings.length === 0) {
        alert('Não há avaliações para exportar.');
        return;
    }

    const data = ratings.map(r => ({
        'Data': r.date,
        'Jogador': r.player,
        'Avaliação': '★'.repeat(r.rating) + '☆'.repeat(5-r.rating),
        'Nota': r.rating,
        'Pontuação': r.score,
        'Nível': r.level,
        'Comentário': r.feedback || 'Sem comentário'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    const colWidths = [
        { wch: 12 },  // Data
        { wch: 20 },  // Jogador
        { wch: 15 },  // Avaliação
        { wch: 8 },   // Nota
        { wch: 10 },  // Pontuação
        { wch: 8 },   // Nível
        { wch: 50 }   // Comentário
    ];
    ws['!cols'] = colWidths;

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (!ws[cell_ref]) continue;
            
            if (R === 0) {
                ws[cell_ref].s = {
                    fill: { fgColor: { rgb: "4F81BD" } },
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    alignment: { horizontal: "center" }
                };
            }
            else {
                ws[cell_ref].s = {
                    fill: { fgColor: { rgb: R % 2 ? "E9EFF7" : "FFFFFF" } },
                    alignment: { horizontal: C === 6 ? "left" : "center" }
                };
            }
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Avaliações");

    const fileName = `Avaliacoes_SpaceShooter_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

function clearRatings() {
    if (confirm('Tem certeza que deseja limpar todas as avaliações? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('gameRatings');
        loadRatings(); // Recarrega a página para mostrar que está vazia
        alert('Todas as avaliações foram removidas com sucesso!');
    }
}

function clearHighScores() {
    if (confirm('Tem certeza que deseja limpar todo o ranking? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('highScores');
        loadRatings(); // Recarregar a página para atualizar as visualizações
        alert('Ranking limpo com sucesso!');
    }
}