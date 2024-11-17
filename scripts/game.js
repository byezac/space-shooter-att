const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const restartButton = document.getElementById('restartButton');
        const finalScoreText = document.getElementById('finalScore');

        // Definir o tamanho fixo para o canvas
        canvas.width = 800;
        canvas.height = 600;

        // Configuração do jogador
        const player = {
            x: canvas.width / 2 - 25,
            y: canvas.height / 2 - 25,
            width: 50,
            height: 50,
            color: '#FF5733',
            speed: 5,
            health: 100,
            shootCooldown: 0
        };

        // Pontuação e nível
        let score = 0;
        let level = 1;

        // Inimigos
        let enemies = [];
        let enemiesPerLevel = 5;

        // Balas do jogador
        let playerBullets = [];
        const bulletSpeed = 7;
        let shooting = false;

        // Balas dos inimigos
        let enemyBullets = [];

        // Efeitos de partículas
        let particles = [];

        // Input tracking
        const keys = {};
        window.addEventListener('keydown', (e) => keys[e.key] = true);
        window.addEventListener('keyup', (e) => keys[e.key] = false);

        // Track mouse position
        let mouseX = canvas.width / 2;
        let mouseY = canvas.height / 2;
        canvas.addEventListener('mousemove', (e) => {
            mouseX = e.clientX - canvas.getBoundingClientRect().left;
            mouseY = e.clientY - canvas.getBoundingClientRect().top;
        });

        // Track mouse click
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                shooting = true;
            }
        });
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                shooting = false;
            }
        });

        // Estado do jogo
        let isGameRunning = true;

        // Desenho do fundo do jogo
        function drawBackground() {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#111');
            gradient.addColorStop(1, '#333');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Desenho da borda do canvas
        function drawBorder() {
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
        }

        // Adicione estas variáveis globais no início do arquivo
        let playerColor = '#FF5733'; // Cor padrão
        let playerShape = 'circle';  // Forma padrão
        let bulletColor = '#FFFF00'; // Cor padrão das balas

        // Modifique a função drawPlayer()
        function drawPlayer() {
            ctx.fillStyle = playerColor;
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            
            const centerX = player.x + player.width / 2;
            const centerY = player.y + player.height / 2;
            const radius = player.width / 2;
            
            switch(playerShape) {
                case 'triangle':
                    ctx.moveTo(centerX, centerY - radius);
                    ctx.lineTo(centerX - radius, centerY + radius);
                    ctx.lineTo(centerX + radius, centerY + radius);
                    break;
                case 'square':
                    ctx.rect(player.x, player.y, player.width, player.height);
                    break;
                case 'circle':
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    break;
            }
            
            ctx.fill();
            ctx.shadowColor = 'transparent';

            // Desenho da arma
            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            const angle = Math.atan2(dy, dx);

            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(angle) * 40, centerY + Math.sin(angle) * 40);
            ctx.stroke();

            return angle;
        }

        // Desenho dos inimigos
        function drawEnemies() {
            for (const enemy of enemies) {
                if (enemy.health > 0) {
                    ctx.fillStyle = enemy.color;
                    ctx.shadowColor = 'black';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowColor = 'transparent';
                }
            }
        }

        // Modifique a função drawPlayerBullets()
        function drawPlayerBullets() {
            ctx.fillStyle = bulletColor;
            for (const bullet of playerBullets) {
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Desenho das balas dos inimigos
        function drawEnemyBullets() {
            ctx.fillStyle = '#FFA500';
            for (const bullet of enemyBullets) {
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            }
        }

        // Desenho dos efeitos de partículas
        function drawParticles() {
            for (const particle of particles) {
                ctx.fillStyle = particle.color;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = particle.size / 2;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowColor = 'transparent';
            }
        }

        // Atualização das balas do jogador
        function updatePlayerBullets() {
            playerBullets = playerBullets.map(bullet => {
                bullet.x += bullet.dx;
                bullet.y += bullet.dy;
                return bullet;
            }).filter(bullet => bullet.x > 0 && bullet.x < canvas.width && bullet.y > 0 && bullet.y < canvas.height);
        }

        // Atualização das balas dos inimigos
        function updateEnemyBullets() {
            enemyBullets = enemyBullets.map(bullet => {
                bullet.x += bullet.dx;
                bullet.y += bullet.dy;
                return bullet;
            }).filter(bullet => bullet.x > 0 && bullet.x < canvas.width && bullet.y > 0 && bullet.y < canvas.height);
        }

        // Atualização dos inimigos
        function updateEnemies() {
            for (const enemy of enemies) {
                if (enemy.health > 0) {
                    // Movimento inteligente dos inimigos
                    const dx = player.x - enemy.x;
                    const dy = player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > 0) {
                        enemy.x += (dx / distance) * enemy.speed;
                        enemy.y += (dy / distance) * enemy.speed;
                    }

                    // Restringe o movimento dos inimigos aos limites do canvas
                    enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.x));
                    enemy.y = Math.max(0, Math.min(canvas.height - enemy.height, enemy.y));

                    // Verifica se o inimigo está próximo o suficiente para atacar
                    if (distance < player.width / 2 + enemy.width / 2) {
                        player.health -= 0.5;
                    }
                    // Verifica colisão com o jogador
                    if (player.x < enemy.x + enemy.width &&
                        player.x + player.width > enemy.x &&
                        player.y < enemy.y + enemy.height &&
                        player.y + player.height > enemy.y) {
                        player.health -= 10;
                        enemy.x = -enemy.width;
                        enemy.y = -enemy.height;
                        if (player.health <= 0) {
                            gameOver();
                        }
                    }

                    // Verifica colisão com balas do jogador
                    for (const bullet of playerBullets) {
                        if (bullet.x < enemy.x + enemy.width &&
                            bullet.x + bullet.width > enemy.x &&
                            bullet.y < enemy.y + enemy.height &&
                            bullet.y + bullet.height > enemy.y) {
                            enemy.health -= 10;
                            playerBullets = playerBullets.filter(b => b !== bullet);
                            
                            // Adicionar pontos quando acertar o inimigo
                            score += 10;
                            
                            // Se matou o inimigo, dar pontos extras
                            if (enemy.health <= 0) {
                                score += 50;
                            }
                            
                            // Atualizar o display do score
                            document.getElementById('scoreDisplay').textContent = score;
                            
                            particles.push({
                                x: enemy.x + enemy.width / 2,
                                y: enemy.y + enemy.height / 2,
                                size: Math.random() * 10 + 5,
                                color: 'yellow',
                                dx: Math.random() * 4 - 2,
                                dy: Math.random() * 4 - 2
                            });
                        }
                    }
                }
            }
        }

        // Atualização dos efeitos de partículas
        function updateParticles() {
            particles = particles.map(particle => {
                particle.x += particle.dx;
                particle.y += particle.dy;
                particle.size *= 0.95;
                return particle;
            }).filter(particle => particle.size > 0.5);
        }

        // Verifica colisão entre o jogador e as balas dos inimigos
        function checkCollisions() {
            for (const enemyBullet of enemyBullets) {
                if (player.x < enemyBullet.x + enemyBullet.width &&
                    player.x + player.width > enemyBullet.x &&
                    player.y < enemyBullet.y + enemyBullet.height &&
                    player.y + player.height > enemyBullet.y) {
                    player.health -= 10;
                    enemyBullets = enemyBullets.filter(b => b !== enemyBullet);
                    particles.push({
                        x: player.x + player.width / 2,
                        y: player.y + player.height / 2,
                        size: Math.random() * 10 + 5,
                        color: 'red',
                        dx: Math.random() * 2 - 1,
                        dy: Math.random() * 2 - 1
                    });
                    if (player.health <= 0) {
                        gameOver();
                    }
                }
            }

            for (const enemy of enemies) {
                if (player.x < enemy.x + enemy.width &&
                    player.x + player.width > enemy.x &&
                    player.y < enemy.y + enemy.height &&
                    player.y + player.height > enemy.y) {
                    player.health -= 10;
                    enemy.x = -enemy.width;
                    enemy.y = -enemy.height;
                    if (player.health <= 0) {
                        gameOver();
                    }
                }
            }
        }

        // Lida com entrada do jogador
        function handleInput() {
            if (keys['w']) player.y -= player.speed;
            if (keys['s']) player.y += player.speed;
            if (keys['a']) player.x -= player.speed;
            if (keys['d']) player.x += player.speed;

            player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
            player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
        }

        // Função para disparar balas
        function shoot() {
            const angle = drawPlayer();
            playerBullets.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                width: 12,
                height: 6,
                dx: Math.cos(angle) * bulletSpeed,
                dy: Math.sin(angle) * bulletSpeed
            });
        }

        // Desenho da HUD (Heads-Up Display)
        function drawHUD() {
            // Atualizar ambas as barras de saúde
            const healthBar = document.querySelector('.health');
            const healthDisplay = document.getElementById('healthDisplay');
            
            const healthPercentage = Math.max(0, player.health);
            
            // Atualizar a barra de saúde original
            if (healthBar) {
                healthBar.style.width = `${healthPercentage}%`;
                
                // Mudar a cor baseado na saúde
                if (healthPercentage > 60) {
                    healthBar.style.backgroundColor = '#4CAF50';
                } else if (healthPercentage > 30) {
                    healthBar.style.backgroundColor = '#FFC107';
                } else {
                    healthBar.style.backgroundColor = '#f44336';
                }
            }
            
            // Atualizar a barra de saúde do HUD
            if (healthDisplay) {
                healthDisplay.style.width = `${healthPercentage}%`;
                healthDisplay.style.backgroundColor = healthPercentage > 60 ? '#4CAF50' : 
                                                   healthPercentage > 30 ? '#FFC107' : 
                                                   '#f44336';
            }
        }

        // Cria inimigos para o nível atual
        function createEnemies() {
            enemies = [];
            for (let i = 0; i < enemiesPerLevel; i++) {
                enemies.push({
                    x: Math.random() * (canvas.width - 50),
                    y: Math.random() * (canvas.height - 50),
                    width: 50,
                    height: 50,
                    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
                    health: 50,
                    speed: 1 + level * 0.5,
                    shootingCooldown: Math.random() * 100 + 50
                });
            }
        }

        // Verifica se todos os inimigos foram derrotados
        function checkLevelComplete() {
            if (enemies.every(enemy => enemy.health <= 0)) {
                level++;
                // Atualizar o display do nível
                document.getElementById('levelDisplay').textContent = level;
                
                if (level > 10) {
                    gameOver('Parabéns! Você completou todos os níveis!');
                    return;
                }
                enemiesPerLevel += 3; // Aumenta o número de inimigos por nível
                createEnemies();
            }
        }

        let playerName = '';
        let highScores = [];

        // Carregar scores salvos
        function loadHighScores() {
            const saved = localStorage.getItem('highScores');
            highScores = saved ? JSON.parse(saved) : [];
            updateHighScoresTable();
        }

        // Função para obter hora atual formatada
        function getCurrentTime() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        // Modificar a função saveScore
        function saveScore() {
            highScores.push({
                name: playerName,
                score: score,
                level: level,
                time: getCurrentTime() // Agora salvamos a hora
            });
            
            // Ordenar por pontuação
            highScores.sort((a, b) => b.score - a.score);
            
            // Salvar no localStorage
            localStorage.setItem('highScores', JSON.stringify(highScores));
            updateHighScoresTable();
        }

        // Atualizar a função updateHighScoresTable
        function updateHighScoresTable() {
            const tbody = document.getElementById('scoresBody');
            tbody.innerHTML = '';
            
            highScores.forEach((score, index) => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${index + 1}º</td>
                    <td>${score.name}</td>
                    <td>${score.score}</td>
                    <td>${score.level}</td>
                    <td>${score.time}</td>
                `;
            });
        }

        // Modificar a função startNewGame()
        function startNewGame() {
            const nameInput = document.getElementById('playerName');
            playerName = nameInput.value.trim();
            
            if (playerName) {
                document.getElementById('startScreen').style.display = 'none';
                document.getElementById('customizationScreen').style.display = 'block';
                initializeCustomization();
            } else {
                alert('Por favor, digite seu nome!');
            }
        }

        // Reiniciar jogo
        function restartGame() {
            gameOverScreen.style.display = 'none';
            canvas.style.display = 'none';
            document.getElementById('startScreen').style.display = 'block';
            
            // Resetar todas as variáveis do jogo
            playerName = '';
            document.getElementById('playerName').value = '';
            player.x = canvas.width / 2 - player.width / 2;
            player.y = canvas.height / 2 - player.height / 2;
            player.health = 100;
            score = 0;
            level = 1;
            enemiesPerLevel = 5;
            
            // Limpar arrays
            playerBullets = [];
            enemyBullets = [];
            particles = [];
            enemies = [];
            
            // Atualizar displays
            document.getElementById('scoreDisplay').textContent = '0';
            document.getElementById('levelDisplay').textContent = '1';
            
            // Resetar a barra de saúde
            const healthBar = document.querySelector('.health');
            if (healthBar) {
                healthBar.style.width = '100%';
                healthBar.style.backgroundColor = '#4CAF50';
            }
            
            isGameRunning = false;
        }

        // Modificar o event listener do botão de restart
        restartButton.onclick = () => {
            restartGame();
        };

        // Inicialização
        document.addEventListener('DOMContentLoaded', () => {
            loadHighScores();
            
            document.getElementById('startButton').addEventListener('click', startNewGame);
            document.getElementById('gameCanvas').style.display = 'none';
        });

        // Função de término de jogo
        function gameOver(message = 'Game Over!') {
            isGameRunning = false;
            cancelAnimationFrame(gameLoopId);
            
            // Salvar score
            saveScore();
            
            // Resetar sistema de avaliação
            currentRating = 0;
            resetRatingSystem();
            
            // Mostrar tela de game over
            gameOverScreen.style.display = 'flex';
            canvas.style.display = 'none';
            finalScoreText.textContent = `${playerName} - Score: ${score} | Level: ${level}`;
        }

        // Loop principal do jogo
        let gameLoopId;
        function gameLoop() {
            if (!isGameRunning) return;

            drawBackground();
            drawBorder();
            handleInput();
            if (shooting) {
                shoot();
            }
            updatePlayerBullets();
            updateEnemyBullets();
            updateEnemies();
            updateParticles();
            checkCollisions();
            checkLevelComplete();
            drawPlayer();
            drawPlayerBullets();
            drawEnemyBullets();
            drawEnemies();
            drawParticles();
            drawHUD();
            gameLoopId = requestAnimationFrame(gameLoop);
        }

        createEnemies();
        gameLoop();

        // Adicione estas funções logo após as variáveis globais existentes
        function initializeCustomization() {
            // Seleciona a primeira opção de cada categoria por padrão
            document.querySelector('.color-option').classList.add('selected');
            document.querySelector('.shape-option').classList.add('selected');
            document.querySelector('.bullet-color-option').classList.add('selected');

            // Seletores de cor do jogador
            document.querySelectorAll('.color-option').forEach(button => {
                button.addEventListener('click', function() {
                    playerColor = this.dataset.color;
                    document.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });

            // Seletores de forma
            document.querySelectorAll('.shape-option').forEach(button => {
                button.addEventListener('click', function() {
                    playerShape = this.dataset.shape;
                    document.querySelectorAll('.shape-option').forEach(b => b.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });

            // Seletores de cor das balas
            document.querySelectorAll('.bullet-color-option').forEach(button => {
                button.addEventListener('click', function() {
                    bulletColor = this.dataset.color;
                    document.querySelectorAll('.bullet-color-option').forEach(b => b.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });

            // Adicionar evento ao botão de começar jogo
            document.getElementById('startGameButton').addEventListener('click', startGameAfterCustomization);
        }

        // Adicione esta função para iniciar o jogo após a customização
        function startGameAfterCustomization() {
            document.getElementById('customizationScreen').style.display = 'none';
            canvas.style.display = 'block';
            isGameRunning = true;
            createEnemies();
            gameLoop();
        }

        // Adicione estas variáveis globais
        let gameRatings = [];
        let currentRating = 0;

        // Adicione estas novas funções para o sistema de avaliação
        function resetRatingSystem() {
            // Resetar estrelas
            document.querySelectorAll('.star').forEach(star => {
                star.classList.remove('active');
            });
            
            // Resetar feedback
            const feedbackInput = document.getElementById('feedback');
            if (feedbackInput) {
                feedbackInput.value = '';
            }
            
            // Resetar botão
            const submitButton = document.getElementById('submitRating');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Avaliação';
            }
        }

        function initializeRatingSystem() {
            // Adicionar eventos às estrelas
            document.querySelectorAll('.star').forEach(star => {
                // Evento de clique
                star.addEventListener('click', function() {
                    currentRating = parseInt(this.dataset.rating);
                    highlightStars(currentRating);
                });
            });

            // Adicionar evento ao botão de envio
            const submitButton = document.getElementById('submitRating');
            if (submitButton) {
                submitButton.addEventListener('click', submitRating);
            }
        }

        function highlightStars(rating) {
            document.querySelectorAll('.star').forEach(star => {
                star.classList.toggle('active', star.dataset.rating <= rating);
            });
        }

        function submitRating() {
            if (currentRating === 0) {
                alert('Por favor, selecione uma avaliação!');
                return;
            }

            const feedbackText = document.getElementById('feedback').value;
            const newRating = {
                player: playerName,
                score: score,
                level: level,
                rating: parseInt(currentRating),
                feedback: feedbackText,
                date: new Date().toLocaleDateString('pt-BR')
            };

            // Carregar avaliações existentes
            let ratings = [];
            try {
                const savedRatings = localStorage.getItem('gameRatings');
                if (savedRatings) {
                    ratings = JSON.parse(savedRatings);
                }
            } catch (error) {
                console.error('Erro ao carregar avaliações:', error);
            }

            // Adicionar nova avaliação
            ratings.push(newRating);
            
            // Salvar no localStorage
            try {
                localStorage.setItem('gameRatings', JSON.stringify(ratings));
                console.log('Avaliação salva:', newRating);
                console.log('Total de avaliações:', ratings.length);
            } catch (error) {
                console.error('Erro ao salvar avaliação:', error);
            }

            // Desabilitar botão e mostrar mensagem
            const submitButton = document.getElementById('submitRating');
            submitButton.disabled = true;
            submitButton.textContent = 'Avaliação Enviada!';

            // Mostrar confirmação
            alert('Avaliação enviada com sucesso!');
        }

        // Adicione este event listener na inicialização do documento
        document.addEventListener('DOMContentLoaded', () => {
            // Carregar avaliações salvas
            const savedRatings = localStorage.getItem('gameRatings');
            if (savedRatings) {
                gameRatings = JSON.parse(savedRatings);
            }

            // Inicializar sistema de avaliação
            initializeRatingSystem();
            
            // Adicionar eventos aos botões de visualização
            const viewRatingsButton = document.getElementById('viewRatingsButton');
            if (viewRatingsButton) {
                viewRatingsButton.addEventListener('click', showRatingsScreen);
            }

            const closeRatingsButton = document.getElementById('closeRatingsButton');
            if (closeRatingsButton) {
                closeRatingsButton.addEventListener('click', () => {
                    document.getElementById('ratingsScreen').style.display = 'none';
                });
            }
        });

        // Adicione estas funções para gerenciar a visualização das avaliações
        function showRatingsScreen() {
            const ratingsScreen = document.getElementById('ratingsScreen');
            const ratingsListDiv = ratingsScreen.querySelector('.ratings-list');
            ratingsListDiv.innerHTML = ''; // Limpa a lista atual
            
            // Atualiza estatísticas
            updateRatingsStats();
            
            // Ordena as avaliações por data (mais recentes primeiro)
            const sortedRatings = [...gameRatings].reverse();
            
            // Cria cards para cada avaliação
            sortedRatings.forEach(rating => {
                const ratingCard = document.createElement('div');
                ratingCard.className = 'rating-card';
                
                const stars = '★'.repeat(rating.rating) + '☆'.repeat(5 - rating.rating);
                
                ratingCard.innerHTML = `
                    <div class="rating-header">
                        <span><strong>${rating.player}</strong> - Level ${rating.level}</span>
                        <span class="rating-stars">${stars}</span>
                    </div>
                    <div>Score: ${rating.score}</div>
                    ${rating.feedback ? `<div class="rating-feedback">"${rating.feedback}"</div>` : ''}
                    <div style="font-size: 0.8em; color: #888; margin-top: 5px;">
                        ${rating.date}
                    </div>
                `;
                
                ratingsListDiv.appendChild(ratingCard);
            });
            
            ratingsScreen.style.display = 'block';
        }

        function updateRatingsStats() {
            if (gameRatings.length === 0) {
                document.getElementById('averageRatingDisplay').textContent = 'Sem avaliações';
                document.getElementById('totalRatingsDisplay').textContent = '0';
                return;
            }
            
            const total = gameRatings.reduce((sum, rating) => sum + parseInt(rating.rating), 0);
            const average = total / gameRatings.length;
            
            document.getElementById('averageRatingDisplay').textContent = 
                `${average.toFixed(1)} ★ (${gameRatings.length} avaliações)`;
            document.getElementById('totalRatingsDisplay').textContent = gameRatings.length;
        }

        // Adicione esta constante no início do arquivo (mude a senha para o que você quiser)
        const ADMIN_PASSWORD = "zac@2024";

        // Modifique a função que mostra o botão de avaliações
        function showViewRatingsButton() {
            const password = prompt("Digite a senha de administrador:");
            if (password && password === ADMIN_PASSWORD) {
                showRatingsScreen();
            } else {
                alert("Senha incorreta!");
            }
        }

        // Modifique o event listener do botão
        document.addEventListener('DOMContentLoaded', () => {
            // ... código existente ...
            
            const viewRatingsButton = document.getElementById('viewRatingsButton');
            if (viewRatingsButton) {
                viewRatingsButton.addEventListener('click', showViewRatingsButton);
            }
        });

        // Adicione uma função para acessar via console (opcional)
        function accessAdminRatings(password) {
            if (password === ADMIN_PASSWORD) {
                const ratings = JSON.parse(localStorage.getItem('gameRatings')) || [];
                console.table(ratings);
                return ratings;
            } else {
                console.log("Senha incorreta!");
                return null;
            }
        }

        function generateScoreImage() {
            // Criar um canvas temporário para gerar a imagem
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');

            // Configurar o fundo
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Adicionar borda decorativa
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 10;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

            // Configurar texto
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';

            // Título do jogo
            ctx.font = 'bold 60px Arial';
            ctx.fillStyle = '#2196F3';
            ctx.fillText('Space Shooter', canvas.width/2, 120);

            // Informações do jogador
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Jogador: ${playerName}`, canvas.width/2, 220);

            // Score com efeito de sombra
            ctx.shadowColor = '#2196F3';
            ctx.shadowBlur = 10;
            ctx.font = 'bold 70px Arial';
            ctx.fillStyle = '#2196F3';
            ctx.fillText(`Score: ${score}`, canvas.width/2, 320);
            ctx.shadowBlur = 0;

            // Level
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Level: ${level}`, canvas.width/2, 400);

            // Data
            const data = new Date().toLocaleDateString('pt-BR');
            ctx.font = '30px Arial';
            ctx.fillStyle = '#888888';
            ctx.fillText(data, canvas.width/2, 480);

            // Adicionar elementos decorativos
            drawStars(ctx);

            // Converter canvas para URL de dados
            return canvas.toDataURL('image/png');
        }

        // Função para desenhar estrelas decorativas
        function drawStars(ctx) {
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * ctx.canvas.width;
                const y = Math.random() * ctx.canvas.height;
                const radius = Math.random() * 2;
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8})`;
                ctx.fill();
            }
        }

        
        

