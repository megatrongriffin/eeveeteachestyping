// Utility function to shuffle arrays
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to check if all digits are the same
function allDigitsSame(number) {
    const str = number.toString();
    return str.split('').every(char => char === str[0]);
}

// Global game state
let gameState = {
    score: 0,
    highScores: [],
    level: 1,
    wpm: 0,
    missedKeys: 0,
    totalTime: 0,
    bonusMeter: 0,
    bonusMax: 80,
    secretTimer: 0,
    paused: false,
    keysTyped: 0,
    startTime: null
};

try {
    const storedHighScores = localStorage.getItem('highScores');
    if (storedHighScores) gameState.highScores = JSON.parse(storedHighScores);
} catch (e) {
    console.warn('localStorage not available or corrupted:', e);
}

// Preload Scene
class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        let progressBar = this.add.graphics();
        let progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(this.cameras.main.width / 2 - 160, this.cameras.main.height / 2 - 25, 320, 50);

        let loadingText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, 'Loading...', {
            font: '20px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        let percentText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '0%', {
            font: '18px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(this.cameras.main.width / 2 - 150, this.cameras.main.height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        this.load.on('filecomplete', (key, type, success) => {
            if (!success) console.error(`Failed to load ${type} '${key}'`);
        });

        this.load.image('bg_desert', 'assets/bg_desert.png');
        this.load.image('shroomleft', 'assets/shroomleft.png');
        this.load.image('shroommid', 'assets/shroommid.png');
        this.load.image('shroomright', 'assets/shroomright.png');
        this.load.image('shroomstem', 'assets/shroomstem.png');
        this.load.spritesheet('eevee-spin', 'assets/eevee-spin.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('eevee-winning', 'assets/eevee-winning.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('bg_grasslands', 'assets/bg_grasslands.png');
        this.load.image('cloud1', 'assets/cloud1.png');
        this.load.image('cloud2', 'assets/cloud2.png');
        this.load.image('cloud3', 'assets/cloud3.png');
        this.load.image('grass', 'assets/grass.png');
        this.load.spritesheet('eevee-standing', 'assets/eevee-standing.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('boxEmpty', 'assets/boxEmpty.png');
        this.load.spritesheet('eevee-running', 'assets/eevee-running.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('eevee-kick', 'assets/eevee-kick.png');
        this.load.image('eevee-punchtwo', 'assets/eevee-punchtwo.png');
        this.load.image('eevee-punchone', 'assets/eevee-punchone.png');
        this.load.image('eevee-jumping', 'assets/eevee-jumping.png');
        this.load.spritesheet('eevee-walking', 'assets/eevee-walking.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('bg_castle', 'assets/bg_castle.png');
        this.load.image('flyFly1', 'assets/flyFly1.png');
        this.load.image('flyFly2', 'assets/flyFly2.png');
        this.load.image('flyDead', 'assets/flyDead.png');
        this.load.spritesheet('eevee-damage', 'assets/eevee-damage.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('eevee-attack', 'assets/eevee-attack.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('boxsecret', 'assets/boxsecret.png');
        this.load.image('bg_shroom', 'assets/bg_shroom.png');
        this.load.image('bush', 'assets/bush.png');
        this.load.image('boulder', 'assets/boulder.png');
        this.load.image('tree', 'assets/tree.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('enemyright', 'assets/enemyright.png');
        this.load.spritesheet('eevee-climbing', 'assets/eevee-climbing.png', { frameWidth: 64, frameHeight: 64 });

        this.load.audio('wario', 'assets/wario.mp3');
        this.load.audio('smbflag', 'assets/smbflag.mp3');
        this.load.audio('tetris-1', 'assets/tetris-1.mp3');
        this.load.audio('warning', 'assets/warning.mp3');
        this.load.audio('smbdeath', 'assets/smbdeath.mp3');
        this.load.audio('brick_break', 'assets/brick_break.mp3');
    }

    create() {
        WebFont.load({
            google: {
                families: ['Press Start 2P']
            },
            active: () => {
                this.scene.start('StartScreenScene');
            }
        });

        this.anims.create({
            key: 'eevee-spin',
            frames: this.anims.generateFrameNumbers('eevee-spin', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'eevee-winning',
            frames: this.anims.generateFrameNumbers('eevee-winning', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'eevee-standing',
            frames: this.anims.generateFrameNumbers('eevee-standing', { start: 0, end: 9 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'eevee-running',
            frames: this.anims.generateFrameNumbers('eevee-running', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: 'eevee-walking',
            frames: this.anims.generateFrameNumbers('eevee-walking', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'eevee-damage',
            frames: this.anims.generateFrameNumbers('eevee-damage', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: 0
        });
        this.anims.create({
            key: 'eevee-attack',
            frames: this.anims.generateFrameNumbers('eevee-attack', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: 0
        });
        this.anims.create({
            key: 'eevee-climbing',
            frames: this.anims.generateFrameNumbers('eevee-climbing', { start: 0, end: 1 }),
            frameRate: 5,
            repeat: -1
        });
    }
}

// Start Screen Scene
class StartScreenScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScreenScene' });
    }

    create() {
        this.add.image(0, 0, 'bg_desert').setOrigin(0, 0).setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        const bottomY = this.cameras.main.height - 64;
        const centerX = this.cameras.main.width / 2;
        this.add.image(centerX - 32, bottomY, 'shroomstem');
        const capY = bottomY - 64;
        this.add.image(centerX - 96, capY, 'shroomleft');
        this.add.image(centerX - 32, capY, 'shroommid');
        this.add.image(centerX + 32, capY, 'shroomright');
        const eeveeScale = (this.cameras.main.width / 3) / 64;
        this.eeveeSprite = this.add.sprite(centerX, capY - 128, 'eevee-spin').setScale(eeveeScale).play('eevee-spin');

        const topScale = this.cameras.main.width / (7 * 64);
        const topY = 64;
        this.add.image(0, topY, 'shroomleft').setScale(topScale, topScale).setOrigin(0, 0.5);
        for (let i = 1; i < 6; i++) {
            this.add.image(i * 64 * topScale, topY, 'shroommid').setScale(topScale, topScale).setOrigin(0, 0.5);
        }
        this.add.image(6 * 64 * topScale, topY, 'shroomright').setScale(topScale, topScale).setOrigin(0, 0.5);
        this.add.text(this.cameras.main.width / 2, topY + 32, 'EEVEE TEACHES TYPING', { font: '48px "Press Start 2P"', fill: '#ffffff' }).setOrigin(0.5);

        const highScoreText = gameState.highScores.length > 0 ?
            'High Scores:\n' + gameState.highScores.slice(0, 5).map((s, i) => `${i + 1}. ${s.name}: ${s.score}`).join('\n') :
            'No High Scores Yet';
        this.add.text(50, this.cameras.main.height / 2 - 50, highScoreText, { font: '24px "Press Start 2P"', fill: '#000000' });

        const startString = "start typing";
        const fontStyle = { font: '48px "Press Start 2P"', fill: '#000000' };
        const totalWidth = this.cameras.main.width * 0.6;
        const charSpacing = totalWidth / (startString.length - 1);
        const startX = (this.cameras.main.width - totalWidth) / 2;
        const startY = this.cameras.main.height / 2;
        this.letters = [];
        startString.split('').forEach((char, i) => {
            const x = startX + i * charSpacing;
            const letter = this.add.text(x, startY, char, fontStyle).setOrigin(0.5);
            this.letters.push(letter);
        });
        this.startContainer = this.add.container(0, 0, this.letters);
        this.tweens.add({
            targets: this.startContainer,
            scale: 1.05,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.backgroundMusic = this.sound.add('wario', { loop: true });
        this.backgroundMusic.play();
        this.musicStarted = true;

        this.typedIndex = 0;
        this.input.keyboard.on('keydown', (event) => {
            if (this.typedIndex < startString.length && event.key === startString[this.typedIndex]) {
                this.letters[this.typedIndex].setFill('#00ff00');
                this.typedIndex++;
                if (this.typedIndex === startString.length) this.startGame();
            }
        });
    }

    startGame() {
        this.backgroundMusic.stop();
        this.sound.play('smbflag');
        this.eeveeSprite.setTexture('eevee-winning').play('eevee-winning');
        this.tweens.add({
            targets: this.eeveeSprite,
            x: this.cameras.main.width + 100,
            y: this.eeveeSprite.y - 100,
            duration: 500,
            yoyo: true,
            ease: 'Sine.easeOut'
        });
        this.tweens.add({
            targets: this.eeveeSprite,
            x: this.cameras.main.width + 100,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => this.scene.start('MainGameScene', { newGame: true })
        });
    }
}

// Main Game Scene
class MainGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainGameScene' });
    }

    create(data) {
        if (data.newGame) {
            gameState.score = 0;
            gameState.level = 1;
            gameState.wpm = 0;
            gameState.missedKeys = 0;
            gameState.totalTime = 0;
            gameState.bonusMeter = 0;
            gameState.secretTimer = 0;
            gameState.keysTyped = 0;
            gameState.startTime = this.time.now;
        }
        gameState.paused = false;

        this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'bg_grasslands').setOrigin(0);
        const floorY = this.cameras.main.height * 0.75;
        this.hudRect = this.add.rectangle(0, floorY, this.cameras.main.width, this.cameras.main.height / 4, 0x8B4513).setOrigin(0);
        this.floorTiles = this.add.tileSprite(0, floorY, this.cameras.main.width, 64, 'grass').setOrigin(0, 0);

        this.clouds = this.add.group();
        for (let i = 0; i < Phaser.Math.Between(2, 5); i++) {
            const cloud = `cloud${Phaser.Math.Between(1, 3)}`;
            this.clouds.create(Phaser.Math.Between(0, this.cameras.main.width), Phaser.Math.Between(0, floorY / 2), cloud);
        }

        this.characterX = this.cameras.main.width / 4;
        this.character = this.add.sprite(this.characterX, floorY, 'eevee-walking').setOrigin(0.5, 1).setScale(2).play('eevee-walking');
        this.tweens.add({
            targets: this.character,
            x: this.characterX,
            y: floorY - 100,
            duration: 500,
            ease: 'Sine.easeOut',
            yoyo: true,
            onComplete: () => this.character.play('eevee-walking')
        });

        this.levelText = this.add.text(10, 10, `Level: ${gameState.level}`, { font: '24px "Press Start 2P"', fill: '#000000' });
        this.pauseButton = this.add.text(this.cameras.main.width - 100, 10, 'PAUSE', {
            font: `${this.cameras.main.height / 8}px "Press Start 2P"`,
            fill: '#000000',
            backgroundColor: '#ff0000'
        }).setOrigin(1, 0).setInteractive().on('pointerdown', () => this.togglePause());
        this.timeText = this.add.text(10, floorY + 10, 'Time: 0s', { font: '24px "Press Start 2P"', fill: '#000000' });
        this.wpmText = this.add.text(10, floorY + 40, 'WPM: 0', { font: '24px "Press Start 2P"', fill: '#000000' });
        this.missedText = this.add.text(10, floorY + 70, 'Missed: 0', { font: '24px "Press Start 2P"', fill: '#000000' });
        this.scoreText = this.add.text(this.cameras.main.width / 2, floorY + 50, '0000000', { font: '48px "Press Start 2P"', fill: '#000000' }).setOrigin(0.5);
        this.keyText = this.add.text(this.cameras.main.width - 100, floorY + 10, '', { font: '24px "Press Start 2P"', fill: '#000000' }).setOrigin(1, 0);
        this.bonusMeterBg = this.add.rectangle(this.cameras.main.width / 2 - 100, 20, 204, 24, 0x000000).setOrigin(0);
        this.bonusMeterRed = this.add.rectangle(this.cameras.main.width / 2 - 100 + 2, 20 + 2, 200, 20, 0xff0000).setOrigin(0);
        this.bonusMeterFill = this.add.rectangle(this.cameras.main.width / 2 - 100 + 2, 20 + 2, 0, 20, 0xffff00).setOrigin(0);
        this.bonusMeterText = this.add.text(this.cameras.main.width / 2, 22, 'BONUS', { font: '24px "Press Start 2P"', fill: '#ff0000' }).setOrigin(0.5);
        this.highScoreButton = this.add.text(this.cameras.main.width - 100, 100, 'Post High Score', {
            font: '24px "Press Start 2P"',
            fill: '#000000',
            backgroundColor: '#0000ff'
        }).setOrigin(1, 0).setInteractive().on('pointerdown', () => this.postHighScore()).setVisible(false);
        this.nextGoalsText = this.add.text(10, floorY + 100, '', { font: '40px "Press Start 2P"', fill: '#000000' });

        this.goals = this.add.group();
        this.spawnGoal(true);
        this.time.delayedCall(1500, () => this.spawnGoal());

        this.secretBox = null;
        this.typedSequence = '';

        this.backgroundMusic = this.sound.add('tetris-1', { loop: true });
        this.backgroundMusic.play();

        this.input.keyboard.on('keydown', this.handleKeyPress, this);
    }

    update(time) {
        if (gameState.paused) return;

        gameState.totalTime = Math.floor((time - gameState.startTime) / 1000);
        gameState.secretTimer += this.time.delta / 1000;

        if (allDigitsSame(gameState.totalTime) && !this.secretBox) this.spawnSecretBox();

        this.background.tilePositionX -= 2;
        this.floorTiles.tilePositionX -= 2;
        this.clouds.getChildren().forEach(cloud => cloud.x -= 2);
        const minX = 64;
        this.goals.getChildren().forEach(goal => {
            if (!goal.pushing || goal.x > minX) {
                goal.x -= 2;
                goal.text.x = goal.x;
            }
            if (goal.x <= this.characterX && !goal.pushing) {
                goal.pushing = true;
                this.character.setTexture('eevee-standing');
            }
            if (goal.pushing && goal.x > minX) {
                this.character.x = goal.x;
            } else if (goal.pushing && goal.x <= minX) {
                this.character.x = minX;
                gameState.paused = true;
                this.highScoreButton.setVisible(true);
                this.highScoreButton.y = this.pauseButton.y + this.pauseButton.height + 10;
            }
        });
        if (this.secretBox) {
            this.secretBox.x -= 2;
            if (this.secretBox.x < -70) {
                this.secretBox.destroy();
                this.secretBox = null;
            }
        }

        this.timeText.setText(`Time: ${gameState.totalTime}s`);
        this.wpmText.setText(`WPM: ${gameState.wpm}`);
        this.missedText.setText(`Missed: ${gameState.missedKeys}`);
        this.scoreText.setText(String(gameState.score).padStart(7, '0'));
        this.bonusMeterFill.width = (gameState.bonusMeter / gameState.bonusMax) * 200;
        const onScreenGoals = this.goals.getChildren().filter(g => g.x < this.cameras.main.width);
        const nextGoals = onScreenGoals.slice(0, 2).map(g => g.key).join(' ');
        this.nextGoalsText.setText(`Next: ${nextGoals}`);

        if (gameState.score >= 1500 && gameState.score % 1500 === 0) this.scene.start('BossFightScene');
        if (gameState.bonusMeter >= gameState.bonusMax) this.scene.start('BonusLevelScene');
    }

    spawnGoal(initial = false) {
        const keys = '1234567890abcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,.<>?'.split('');
        const key = keys[Phaser.Math.Between(0, keys.length - 1)];
        const floorY = this.cameras.main.height * 0.75;
        const yPositions = [floorY - 100, floorY - 200, floorY - 300];
        const y = yPositions[Phaser.Math.Between(0, 2)];
        const scale = Phaser.Math.FloatBetween(0.9, 1.1);
        const goal = this.goals.create(this.cameras.main.width + 70, y, 'boxEmpty').setScale(scale);
        goal.text = this.add.text(goal.x, goal.y, key, { font: `${Math.floor(70 * scale * 5 / 8)}px monospace`, fill: '#000000' }).setOrigin(0.5);
        goal.key = key;
        goal.pushing = false;
        if (!initial) this.keyText.setText(`Key: ${key}`);
    }

    spawnSecretBox() {
        const y = this.cameras.main.height * 0.75 - 400;
        this.secretBox = this.add.image(this.cameras.main.width + 70, y, 'boxsecret');
        this.time.delayedCall(5000, () => {
            if (this.secretBox) {
                this.secretBox.destroy();
                this.secretBox = null;
            }
        });
    }

    handleKeyPress(event) {
        if (event.key === 'Shift') return;

        this.typedSequence += event.key;
        if (this.typedSequence.endsWith('eevee') && this.secretBox) {
            this.scene.start('SecretLevelScene');
            this.secretBox.destroy();
            this.secretBox = null;
            this.typedSequence = '';
            return;
        }

        const goal = this.goals.getChildren().find(g => !g.pushing || (gameState.paused && g.pushing));
        if (goal && event.key === goal.key) {
            gameState.paused = false;
            this.tweens.add({
                targets: goal,
                x: this.character.x,
                y: this.character.y,
                duration: 200,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    const actionSprite = Phaser.Math.Between(0, 2) === 0 ? 'eevee-punchone' : (Phaser.Math.Between(0, 1) ? 'eevee-kick' : 'eevee-punchtwo');
                    this.character.setTexture(actionSprite);
                    this.sound.play('brick_break');
                    goal.destroy();
                    goal.text.destroy();
                    gameState.score += 10;
                    gameState.bonusMeter++;
                    gameState.keysTyped++;
                    gameState.wpm = Math.round(gameState.keysTyped / (gameState.totalTime / 60) || 0);
                    this.time.delayedCall(500, () => {
                        this.character.setTexture('eevee-walking').play('eevee-walking');
                        this.spawnGoal();
                        this.keyText.setText('');
                        this.highScoreButton.setVisible(false);
                    });
                }
            });
        } else if (!goal || event.key !== goal.key) {
            gameState.score = Math.max(0, gameState.score - 10);
            gameState.missedKeys++;
            gameState.bonusMeter = Math.max(0, gameState.bonusMeter - 1);
        }
    }

    togglePause() {
        gameState.paused = !gameState.paused;
        if (gameState.paused) {
            this.character.setTexture('eevee-standing').play('eevee-standing');
            this.backgroundMusic.pause();
            this.highScoreButton.setVisible(true);
            this.highScoreButton.y = this.pauseButton.y + this.pauseButton.height + 10;
        } else {
            this.character.setTexture('eevee-walking').play('eevee-walking');
            this.backgroundMusic.resume();
            this.highScoreButton.setVisible(false);
        }
    }

    postHighScore() {
        const name = prompt('Enter your name (max 7 characters):', 'Player').slice(0, 7);
        gameState.highScores.push({ name, score: gameState.score });
        gameState.highScores.sort((a, b) => b.score - a.score);
        try {
            localStorage.setItem('highScores', JSON.stringify(gameState.highScores));
        } catch (e) {
            console.warn('Could not save high scores:', e);
        }
        this.scene.start('StartScreenScene');
    }
}

// Boss Fight Scene
class BossFightScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossFightScene' });
    }

    create() {
        const bossText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'BOSS FLYGHT', {
            font: '96px "Press Start 2P"',
            fill: '#ff0000'
        }).setOrigin(0.5).setScale(0.01);

        this.tweens.add({
            targets: bossText,
            scale: 1,
            duration: 1000,
            ease: 'Sine.easeInOut',
            onStart: () => bossText.setFill('#ff0000'),
            onComplete: () => {
                bossText.setFill('#ffff00');
                this.tweens.add({
                    targets: bossText,
                    scale: 0.01,
                    duration: 1000,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        bossText.destroy();
                        this.createBossLevel();
                    }
                });
            }
        });
    }

    createBossLevel() {
        this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'bg_castle').setOrigin(0);
        const floorY = this.cameras.main.height * 0.75;
        this.hudRect = this.add.rectangle(0, floorY, this.cameras.main.width, this.cameras.main.height / 4, 0x8B4513).setOrigin(0);
        this.floorTiles = this.add.tileSprite(0, floorY, this.cameras.main.width, 64, 'grass').setOrigin(0, 0);

        this.character = this.add.sprite(64 * 3, floorY, 'eevee-standing').setOrigin(0.5, 1).setScale(2).play('eevee-standing');

        this.boss = this.add.sprite(this.cameras.main.width - 100, this.cameras.main.height / 2, 'flyFly1').setScale(2);
        this.boss.health = 100;
        this.bossMeterBg = this.add.rectangle(this.cameras.main.width / 2 - 100, 20, 200, 20, 0xff0000);
        this.bossMeterFill = this.add.rectangle(this.cameras.main.width / 2 - 100, 20, 200, 20, 0x00ff00).setOrigin(0);

        this.words = ['Hoyt', 'Alec', 'Bananas', 'Mississippi', 'EEVEE', 'automobile', 'courthouse', 'seven', 'WIN!', 'monkey',
            'calendar', 'two words', 'bomberman', 'saturday', 'sunday', 'guilty', 'fruit', 'Tricky', 'hello', 'frankenstein',
            'typing', 'school', 'math', 'pokemon', 'computer', 'keyboard'];
        this.currentWord = null;
        this.wordText = null;
        this.wordIndex = 0;

        this.sound.play('warning');
        this.time.addEvent({ delay: 4000, callback: this.shootWord, callbackScope: this, loop: true });

        this.input.keyboard.on('keydown', this.handleKeyPress, this);
    }

    update() {
        this.boss.setTexture((Math.floor(this.time.now / 700) % 2) ? 'flyFly1' : 'flyFly2');
        this.bossMeterFill.width = (this.boss.health / 100) * 200;

        if (this.currentWord) {
            this.currentWord.x -= this.boss.health < 30 ? 2 : 1.5;
            this.wordText.x = this.currentWord.x;
            if (this.currentWord.x <= this.character.x) {
                this.boss.health = Math.min(100, this.boss.health + 10);
                this.character.setTexture('eevee-damage').play('eevee-damage');
                gameState.score = Math.max(0, gameState.score - 500);
                this.time.delayedCall(3000, () => this.character.setTexture('eevee-standing').play('eevee-standing'));
                this.currentWord.destroy();
                this.wordText.destroy();
                this.currentWord = null;
            }
        }

        if (this.boss.health <= 0) this.endBossFight();
    }

    shootWord() {
        if (!this.currentWord) {
            const word = this.words[Phaser.Math.Between(0, this.words.length - 1)];
            this.currentWord = this.add.rectangle(this.boss.x, this.boss.y, 10, 10, 0x000000, 0);
            this.wordText = this.add.text(this.boss.x, this.boss.y, word, { font: '18px "Press Start 2P"', fill: '#000000' }).setOrigin(0.5);
            this.currentWord.word = word;
            this.wordIndex = 0;
        }
    }

    handleKeyPress(event) {
        if (this.currentWord && event.key === this.currentWord.word[this.wordIndex]) {
            this.wordIndex++;
            this.wordText.setText(this.currentWord.word.slice(0, this.wordIndex) + this.currentWord.word.slice(this.wordIndex));
            if (this.wordIndex === this.currentWord.word.length) {
                this.currentWord.x -= 10;
                this.character.setTexture('eevee-attack').play('eevee-attack');
                this.time.delayedCall(1000, () => {
                    this.character.setTexture('eevee-standing').play('eevee-standing');
                    this.boss.health -= 10;
                    gameState.score += 1000;
                    this.currentWord.destroy();
                    this.wordText.destroy();
                    this.currentWord = null;
                });
            }
        } else if (this.currentWord) {
            this.wordIndex = 0;
            this.wordText.setText(this.currentWord.word);
        }
    }

    endBossFight() {
        this.boss.setTexture('flyDead');
        this.tweens.add({
            targets: this.boss,
            y: this.cameras.main.height * 0.75,
            duration: 2000,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.sound.play('smbflag');
                this.add.particles('cloud1').createEmitter({
                    x: { min: 0, max: this.cameras.main.width },
                    y: { min: 0, max: this.cameras.main.height },
                    speed: 100,
                    lifespan: 2000,
                    quantity: 5,
                    scale: { start: 0.5, end: 0 },
                    duration: 5000,
                    on: true
                });
                this.time.delayedCall(5000, () => {
                    gameState.level++;
                    this.scene.start('MainGameScene', { newGame: false });
                });
            }
        });
    }
}

// Bonus Level Scene
class BonusLevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BonusLevelScene' });
    }

    create() {
        const bonusText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'BONUS', {
            font: '96px "Press Start 2P"',
            fill: '#ff0000'
        }).setOrigin(0.5).setScale(0.01);

        this.tweens.add({
            targets: bonusText,
            scale: 1,
            duration: 1000,
            ease: 'Sine.easeInOut',
            onStart: () => bonusText.setFill('#ff0000'),
            onComplete: () => {
                bonusText.setFill('#ffff00');
                this.tweens.add({
                    targets: bonusText,
                    scale: 0.01,
                    duration: 1000,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        bonusText.destroy();
                        this.createBonusLevel();
                    }
                });
            }
        });
    }

    createBonusLevel() {
        this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'bg_desert').setOrigin(0);
        const floorY = this.cameras.main.height * 0.75;
        this.hudRect = this.add.rectangle(0, floorY, this.cameras.main.width, this.cameras.main.height / 4, 0x8B4513).setOrigin(0);
        this.floorTiles = this.add.tileSprite(0, floorY, this.cameras.main.width, 64, 'grass').setOrigin(0, 0);

        this.character = this.add.sprite(this.cameras.main.width / 2, floorY, 'eevee-climbing').setOrigin(0.5, 1).setScale(2).play('eevee-climbing');

        const objects = [
            { key: 'bush', label: 'bush', x: this.cameras.main.width / 4, y: floorY - 100 },
            { key: 'boulder', label: 'boulder', x: 3 * this.cameras.main.width / 4, y: floorY - 100 },
            { key: 'tree', label: 'tree', x: this.cameras.main.width / 4, y: floorY - 300 },
            { key: 'cloud1', label: 'cloud', x: 3 * this.cameras.main.width / 4, y: floorY - 300 }
        ];
        this.objects = objects.map(obj => ({
            image: this.add.image(obj.x, obj.y, obj.key).setScale(1.5),
            label: this.add.text(obj.x, obj.y + 30, obj.label, { font: '18px "Press Start 2P"', fill: '#000000' }).setOrigin(0.5),
            name: obj.label
        }));

        this.enemy = this.add.sprite(this.cameras.main.width / 2, 0, 'enemy');
        this.tweens.add({
            targets: this.enemy,
            y: this.cameras.main.height / 2,
            duration: 2000,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                this.time.delayedCall(1000, () => this.enemy.setTexture('enemyright').setFlipX(true));
                this.time.delayedCall(2000, () => this.enemy.setTexture('enemyright').setFlipX(false));
                this.time.delayedCall(3000, () => {
                    this.enemy.setTexture('enemy');
                    this.startHidingWords();
                });
            }
        });

        this.hiddenWords = [];
    }

    startHidingWords() {
        const words = ['Bee', 'Skunk', 'Flower', 'Dog'];
        const order = shuffle([0, 1, 2, 3]);
        const centerX = this.cameras.main.width / 2;
        words.forEach((word, i) => {
            this.time.delayedCall(i * 5000, () => {
                const objIndex = order[i];
                this.enemy.setTexture('enemy');
                this.tweens.add({
                    targets: this.enemy,
                    x: centerX,
                    y: this.objects[objIndex].image.y,
                    duration: 2000,
                    onComplete: () => {
                        this.enemy.setTexture(this.objects[objIndex].image.x < centerX ? 'enemyright' : 'enemyright').setFlipX(this.objects[objIndex].image.x > centerX);
                        const wordText = this.add.text(this.enemy.x, this.enemy.y - 30, word, {
                            font: '24px "Press Start 2P"',
                            fill: '#ffffff',
                            stroke: '#000000',
                            strokeThickness: 3
                        }).setOrigin(0.5);
                        this.tweens.add({
                            targets: this.enemy,
                            x: this.objects[objIndex].image.x,
                            duration: 3000
                        });
                        this.tweens.add({
                            targets: wordText,
                            x: this.objects[objIndex].image.x,
                            y: this.objects[objIndex].image.y - 30,
                            duration: 3000,
                            onComplete: () => {
                                wordText.destroy();
                                this.hiddenWords.push({ word, object: this.objects[objIndex].name });
                                if (i === 3) this.showInput();
                            }
                        });
                    }
                });
            });
        });
    }

    showInput() {
        const correct = this.hiddenWords[Phaser.Math.Between(0, 3)];
        this.question = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, `Which object hid "${correct.word}"?`, {
            font: '24px "Press Start 2P"',
            fill: '#000000'
        }).setOrigin(0.5);
        this.inputField = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '', {
            font: '24px "Press Start 2P"',
            fill: '#000000',
            backgroundColor: 'rgba(0,0,0,0.5)'
        }).setOrigin(0.5);
        this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, 200, 40, 0x000000, 0).setStrokeStyle(2, 0xffffff);
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 30, '<press enter>', { font: '18px "Press Start 2P"', fill: '#000000' }).setOrigin(0.5);

        let inputText = '';
        this.input.keyboard.on('keydown', (event) => {
            if (event.key === 'Enter' && ['bush', 'boulder', 'tree', 'cloud'].includes(inputText)) {
                if (inputText === correct.object) {
                    this.sound.play('smbflag');
                    gameState.score += 5000;
                } else {
                    this.sound.play('smbdeath');
                }
                gameState.bonusMeter = 0;
                this.scene.start('MainGameScene', { newGame: false });
            } else if (event.key.length === 1 && inputText.length < 7) {
                inputText += event.key;
                this.inputField.setText(inputText);
            } else if (event.key === 'Backspace') {
                inputText = inputText.slice(0, -1);
                this.inputField.setText(inputText);
            }
        });
    }
}

// Secret Level Scene
class SecretLevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SecretLevelScene' });
    }

    create() {
        const secretText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'EEEVEEE', {
            font: '96px "Press Start 2P"',
            fill: '#ff0000'
        }).setOrigin(0.5).setScale(0.01);

        this.tweens.add({
            targets: secretText,
            scale: 1,
            duration: 1000,
            ease: 'Sine.easeInOut',
            onStart: () => secretText.setFill('#ff0000'),
            onComplete: () => {
                secretText.setFill('#ffff00');
                this.tweens.add({
                    targets: secretText,
                    scale: 0.01,
                    duration: 1000,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        secretText.destroy();
                        this.createSecretLevel();
                    }
                });
            }
        });
    }

    createSecretLevel() {
        this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'bg_shroom').setOrigin(0);
        const floorY = this.cameras.main.height * 0.75;
        this.hudRect = this.add.rectangle(0, floorY, this.cameras.main.width, this.cameras.main.height / 4, 0x8B4513).setOrigin(0);
        this.floorTiles = this.add.tileSprite(0, floorY, this.cameras.main.width, 64, 'grass').setOrigin(0, 0);

        this.character = this.add.sprite(this.cameras.main.width / 4, floorY, 'eevee-walking').setOrigin(0.5, 1).setScale(2).play('eevee-walking');

        const sentence = 'eeveeeeveeeeveeeeveeeeveeeeveeeeveeeevee';
        this.goals = this.add.group();
        sentence.split('').forEach((char, i) => {
            const goal = this.goals.create(this.cameras.main.width + i * 70, floorY, 'boxEmpty');
            goal.text = this.add.text(goal.x, goal.y, char, { font: '43px monospace', fill: '#000000' }).setOrigin(0.5);
            goal.key = char;
            goal.index = i;
        });
        this.currentIndex = 0;

        this.input.keyboard.on('keydown', this.handleKeyPress, this);
    }

    update() {
        this.background.tilePositionX -= 2;
        this.floorTiles.tilePositionX -= 2;
        this.goals.getChildren().forEach(goal => {
            goal.x -= 2;
            goal.text.x = goal.x;
        });
    }

    handleKeyPress(event) {
        const goal = this.goals.getChildren().find(g => g.index === this.currentIndex);
        if (goal && event.key === goal.key) {
            this.character.setTexture('eevee-running').play('eevee-running');
            this.tweens.add({
                targets: this.character,
                y: goal.y - 100,
                duration: 200,
                ease: 'Sine.easeOut',
                yoyo: true,
                onComplete: () => {
                    this.sound.play('brick_break');
                    goal.destroy();
                    goal.text.destroy();
                    gameState.score += 100;
                    this.character.setTexture('eevee-walking').play('eevee-walking');
                    this.currentIndex++;
                    if (this.currentIndex === this.goals.getChildren().length) {
                        gameState.level++;
                        this.scene.start('MainGameScene', { newGame: false });
                    }
                }
            });
        }
    }
}

// Phaser game configuration and initialization
function initializeGame() {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        console.error('Game container not found');
        return;
    }

    // Create and append the canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    gameContainer.appendChild(canvas);

    // Ensure the canvas is in the DOM before getting context
    if (!document.getElementById('gameCanvas')) {
        console.error('Canvas was not appended to the DOM correctly');
        return;
    }

    // Get the context after appending to DOM
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
        console.error('Failed to get 2D context from canvas');
        return;
    }

    const config = {
        type: Phaser.CANVAS,
        canvas: canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        scene: [PreloadScene, StartScreenScene, MainGameScene, BossFightScene, BonusLevelScene, SecretLevelScene],
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        audio: {
            disableWebAudio: false
        },
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };

    try {
        const game = new Phaser.Game(config);
        window.addEventListener('resize', () => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        });
    } catch (e) {
        console.error('Failed to initialize Phaser game:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Phaser === 'undefined') {
        console.error('Phaser library not loaded');
        return;
    }
    initializeGame();
});