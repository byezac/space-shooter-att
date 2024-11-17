document.addEventListener('DOMContentLoaded', function() {
    const music = document.getElementById('backgroundMusic');
    music.volume = 0.3;

    // Tenta iniciar a música com o primeiro clique
    document.addEventListener('click', function() {
        music.play().catch(function(error) {
            console.log("Não foi possível reproduzir:", error);
        });
    }, { once: true });

    // Para a música quando clicar em "Começar Jogo" na tela de customização
    document.getElementById('startGameButton').addEventListener('click', function() {
        music.pause();
        music.currentTime = 0;
    });

    // Não para a música quando clicar em "Começar Jogo" na primeira tela
    document.getElementById('startButton').addEventListener('click', function() {
        // A música continua tocando
    });

    // Reinicia a música quando clicar em "Restart" na tela de game over
    document.getElementById('restartButton').addEventListener('click', function() {
        music.play().catch(function(error) {
            console.log("Não foi possível reproduzir:", error);
        });
    });

    // Modifique a função gameOver para não afetar a música
    function gameOver(message = 'Game Over!') {
        isGameRunning = false;
        cancelAnimationFrame(gameLoopId);
        
        // Reinicia a música na tela de game over
        music.play().catch(function(error) {
            console.log("Não foi possível reproduzir:", error);
        });
        
        // Resto do código do gameOver...
        saveScore();
        currentRating = 0;
        resetRatingSystem();
        gameOverScreen.style.display = 'flex';
        canvas.style.display = 'none';
        finalScoreText.textContent = `${playerName} - Score: ${score} | Level: ${level}`;
    }

    // Função para iniciar o jogo após a customização
    function startGameAfterCustomization() {
        music.pause();
        music.currentTime = 0;
        document.getElementById('customizationScreen').style.display = 'none';
        canvas.style.display = 'block';
        isGameRunning = true;
        createEnemies();
        gameLoop();
    }
});