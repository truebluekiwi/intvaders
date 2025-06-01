import * as Phaser from 'phaser';
import { Player, AlienGrid, Bullet } from '../entities';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private alienGrid!: AlienGrid;
  private bullets!: Phaser.Physics.Arcade.Group;
  private alienBullets!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;

  // Game state
  private score: number = 0;
  private wave: number = 1;
  private lives: number = 3;
  private firepower: number = 100;
  private armor: number = 0;
  private isCalculatingMode: boolean = false;
  private lastAlienShootTime: number = 0;
  private alienShootInterval: number = 2000; // milliseconds

  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private firepowerText!: Phaser.GameObjects.Text;
  private armorText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Create improved visual assets
    this.createImprovedAssets();

    // Create sound effects using Web Audio API
    this.createSoundEffects();
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c0c0c);
    this.createStarfield();

    // Initialize input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.enterKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    // Create game entities
    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 10,
      runChildUpdate: true,
    });

    this.alienBullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 20,
      runChildUpdate: true,
    });

    this.player = new Player(this, width / 2, height - 50);
    this.alienGrid = new AlienGrid(this, this.wave);

    // Setup collisions
    this.setupCollisions();

    // Create UI
    this.createUI();

    // Start alien movement
    this.alienGrid.startMovement();

    // Initialize alien shooting timer
    this.lastAlienShootTime = this.time.now;
  }

  update(): void {
    // Handle input
    this.handleInput();

    // Update entities
    this.player.update();
    this.alienGrid.update();

    // Handle UFO collision detection
    this.checkUfoCollisions();

    // Handle alien shooting
    this.handleAlienShooting();

    // Stop player movement when no keys are pressed
    if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
      this.player.stopMovement();
    }

    // Check for wave completion
    if (this.alienGrid.isEmpty()) {
      this.nextWave();
    }

    // Check for game over conditions
    if (this.lives <= 0 || this.alienGrid.hasReachedBottom()) {
      this.gameOver();
    }

    // Update UI
    this.updateUI();
  }

  private createPlaceholderAssets(): void {
    // Create colored rectangles as sprites
    const graphics = this.add.graphics();

    // Player ship (cyan triangle)
    graphics.fillStyle(0x00ffff);
    graphics.fillTriangle(0, 20, 10, 0, 20, 20);
    graphics.generateTexture('player', 20, 20);

    // Alien sprites (colored rectangles with numbers)
    for (let i = 1; i <= 9; i++) {
      graphics.clear();
      graphics.fillStyle(0xff0000 + i * 0x001100);
      graphics.fillRect(0, 0, 30, 20);
      graphics.generateTexture(`alien${i}`, 30, 20);
    }

    // Bullet (small white rectangle)
    graphics.clear();
    graphics.fillStyle(0xffffff);
    graphics.fillRect(0, 0, 4, 8);
    graphics.generateTexture('bullet', 4, 8);

    graphics.destroy();
  }

  private createStarfield(): void {
    // Create simple starfield background
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const star = this.add.circle(x, y, 1, 0xffffff, 0.5);
      star.setAlpha(Math.random());
    }
  }

  private setupCollisions(): void {
    // Player bullets vs aliens
    this.physics.add.overlap(
      this.bullets,
      this.alienGrid.getAliens(),
      this.bulletHitAlien,
      undefined,
      this
    );

    // Alien bullets vs player
    this.physics.add.overlap(
      this.alienBullets,
      this.player,
      this.alienBulletHitPlayer,
      undefined,
      this
    );
  }

  private handleInput(): void {
    // Movement
    if (this.cursors.left.isDown) {
      this.player.moveLeft();
    } else if (this.cursors.right.isDown) {
      this.player.moveRight();
    }

    // Shooting
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.playerShoot();
    }

    // Toggle calculating mode
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.toggleCalculatingMode();
    }
  }

  private playerShoot(): void {
    if (this.isCalculatingMode) {
      // In calculating mode, shooting is free but requires math
      this.shootCalculatingMode();
    } else {
      // Standard mode - unlimited shooting
      this.createBullet(this.player.x, this.player.y - 10, -300);
      // Play shooting sound
      this.playSound('shootSound');
    }
  }

  private shootCalculatingMode(): void {
    // For Stage 1, just create a bullet (math system will be added in Stage 2)
    this.createBullet(this.player.x, this.player.y - 10, -300);
  }

  private createBullet(x: number, y: number, velocityY: number): void {
    const bullet = this.bullets.get(x, y, 'bullet') as Bullet;
    if (bullet) {
      bullet.fire(velocityY);
    }
  }

  private bulletHitAlien(
    bullet:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
    alien:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile
  ): void {
    const bulletSprite = bullet as Bullet;
    const alienSprite = alien as Phaser.Physics.Arcade.Sprite;

    bulletSprite.destroy();

    // Play hit sound
    this.playSound('hitSound');

    // Destroy alien and get score using new scoring system
    // Pass calculating mode flag for bonus scoring
    const scoreEarned = this.alienGrid.getAlienScore(
      alienSprite,
      this.isCalculatingMode
    );
    this.alienGrid.destroyAlien(alienSprite);
    this.score += scoreEarned;

    // Bonus armor for calculating mode kills
    if (this.isCalculatingMode) {
      const alienData = alienSprite.getData('alienData');
      if (alienData) {
        this.armor += alienData.number; // Add armor equal to alien number
      }
    }

    // Add visual effect
    this.createExplosion(alienSprite.x, alienSprite.y);
  }

  private alienBulletHitPlayer(
    bullet:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile
  ): void {
    const bulletSprite = bullet as Bullet;

    bulletSprite.destroy();

    if (this.armor > 0) {
      this.armor -= 10;
    } else {
      this.lives--;
      this.player.takeDamage();
      this.createExplosion(this.player.x, this.player.y);
    }
  }

  private checkUfoCollisions(): void {
    const ufo = this.alienGrid.getUfo();
    if (!ufo || !ufo.active) return;

    // Check collision between bullets and UFO
    this.bullets.children.entries.forEach((bullet) => {
      const bulletSprite = bullet as Bullet;
      if (!bulletSprite.active) return;

      // Simple collision detection
      const distance = Phaser.Math.Distance.Between(
        bulletSprite.x,
        bulletSprite.y,
        ufo.x,
        ufo.y
      );

      if (distance < 20) {
        // UFO hit!
        bulletSprite.destroy();

        // Play hit sound
        this.playSound('hitSound');
        // Get UFO score and destroy it
        const scoreEarned = this.alienGrid.getAlienScore(
          ufo,
          this.isCalculatingMode
        );
        this.alienGrid.destroyAlien(ufo);
        this.score += scoreEarned;

        // Special UFO bonus armor
        if (this.isCalculatingMode) {
          this.armor += 50; // UFO gives big armor bonus
        }

        // Create special explosion for UFO
        this.createUfoExplosion(ufo.x, ufo.y);
      }
    });
  }

  private createExplosion(x: number, y: number): void {
    // Simple explosion effect
    const explosion = this.add.circle(x, y, 20, 0xffff00, 0.8);
    this.tweens.add({
      targets: explosion,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => explosion.destroy(),
    });
  }

  private createUfoExplosion(x: number, y: number): void {
    // Special UFO explosion effect
    const explosion = this.add.circle(x, y, 30, 0xffff00, 1.0);
    this.tweens.add({
      targets: explosion,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 400,
      onComplete: () => explosion.destroy(),
    });

    // Add sparkle effects
    for (let i = 0; i < 8; i++) {
      const sparkle = this.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-20, 20),
        3,
        0xffffff,
        0.8
      );
      this.tweens.add({
        targets: sparkle,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 300,
        delay: i * 50,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private handleAlienShooting(): void {
    if (this.time.now - this.lastAlienShootTime > this.alienShootInterval) {
      this.alienShoot();
      this.lastAlienShootTime = this.time.now;
      // Increase shooting frequency as waves progress
      this.alienShootInterval = Math.max(800, 2000 - this.wave * 100);
    }
  }

  private alienShoot(): void {
    const aliens = this.alienGrid.getAliens().children.entries;
    if (aliens.length === 0) return;

    // Pick a random alien from the bottom row to shoot
    const bottomRowAliens = this.getBottomRowAliens(
      aliens as Phaser.Physics.Arcade.Sprite[]
    );
    if (bottomRowAliens.length === 0) return;

    const shootingAlien = Phaser.Utils.Array.GetRandom(bottomRowAliens);
    this.createAlienBullet(shootingAlien.x, shootingAlien.y + 10);
  }

  private getBottomRowAliens(
    aliens: Phaser.Physics.Arcade.Sprite[]
  ): Phaser.Physics.Arcade.Sprite[] {
    const bottomRowAliens: Phaser.Physics.Arcade.Sprite[] = [];
    const columnAliens: { [key: number]: Phaser.Physics.Arcade.Sprite[] } = {};

    // Group aliens by column (x position)
    aliens.forEach((alien) => {
      const column = Math.round(alien.x / 55); // Updated for 15% larger spacing (55px)
      if (!columnAliens[column]) {
        columnAliens[column] = [];
      }
      columnAliens[column].push(alien);
    });

    // Get the bottom alien from each column
    Object.values(columnAliens).forEach((columnGroup) => {
      if (columnGroup.length > 0) {
        const bottomAlien = columnGroup.reduce((bottom, current) =>
          current.y > bottom.y ? current : bottom
        );
        bottomRowAliens.push(bottomAlien);
      }
    });

    return bottomRowAliens;
  }

  private createAlienBullet(x: number, y: number): void {
    const bullet = this.alienBullets.get(x, y, 'bullet') as Bullet;
    if (bullet) {
      bullet.setTint(0xff0000); // Red tint for alien bullets
      bullet.fire(200); // Positive velocity (downward)
    }
  }

  private toggleCalculatingMode(): void {
    this.isCalculatingMode = !this.isCalculatingMode;
  }

  private nextWave(): void {
    this.wave++;
    this.alienGrid = new AlienGrid(this, this.wave);
    this.alienGrid.startMovement();

    // Bonus for completing wave
    this.score += this.wave * 100;
    this.firepower = Math.min(100, this.firepower + 20);

    // Reset alien shooting timer
    this.lastAlienShootTime = this.time.now;
  }

  private gameOver(): void {
    this.scene.start('GameOverScene', {
      score: this.score,
      wave: this.wave,
    });
  }

  private createUI(): void {
    const padding = 20;

    this.scoreText = this.add.text(padding, padding, `Score: ${this.score}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });

    this.waveText = this.add.text(padding, padding + 25, `Wave: ${this.wave}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });

    this.livesText = this.add.text(
      padding,
      padding + 50,
      `Lives: ${this.lives}`,
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }
    );

    this.firepowerText = this.add.text(
      padding,
      padding + 75,
      `FPP: ${this.firepower}`,
      {
        fontSize: '18px',
        color: '#00ff00',
        fontFamily: 'Arial, sans-serif',
      }
    );

    this.armorText = this.add.text(
      padding,
      padding + 100,
      `Armor: ${this.armor}`,
      {
        fontSize: '18px',
        color: '#0088ff',
        fontFamily: 'Arial, sans-serif',
      }
    );

    this.modeText = this.add.text(
      this.cameras.main.width - padding,
      padding,
      this.isCalculatingMode ? 'CALCULATING MODE' : 'STANDARD MODE',
      {
        fontSize: '16px',
        color: this.isCalculatingMode ? '#ffff00' : '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }
    );
    this.modeText.setOrigin(1, 0);
  }

  private updateUI(): void {
    this.scoreText.setText(`Score: ${this.score}`);
    this.waveText.setText(`Wave: ${this.wave}`);
    this.livesText.setText(`Lives: ${this.lives}`);
    this.firepowerText.setText(`FPP: ${this.firepower}`);
    this.armorText.setText(`Armor: ${this.armor}`);
    this.modeText.setText(
      this.isCalculatingMode ? 'CALCULATING MODE' : 'STANDARD MODE'
    );
    this.modeText.setColor(this.isCalculatingMode ? '#ffff00' : '#ffffff');
  }

  private createImprovedAssets(): void {
    const graphics = this.add.graphics();

    // Enhanced Player ship (sleek spaceship design)
    graphics.clear();
    graphics.fillStyle(0x00ffff);
    graphics.fillTriangle(12, 0, 0, 24, 24, 24);
    graphics.fillStyle(0x0088cc);
    graphics.fillRect(8, 20, 8, 4);
    graphics.fillStyle(0x00aaff);
    graphics.fillCircle(12, 16, 3);
    graphics.generateTexture('player', 24, 24);

    // Create authentic 1978 Space Invaders alien types
    this.createSquidAlien(graphics);
    this.createCrabAlien(graphics);
    this.createOctopusAlien(graphics);
    this.createUfoAlien(graphics);

    // Enhanced Bullet (energy projectile)
    graphics.clear();
    graphics.fillGradientStyle(0xffffff, 0x00ffff, 0xffffff, 0x00ffff, 1);
    graphics.fillEllipse(3, 4, 6, 8);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(3, 2, 2);
    graphics.generateTexture('bullet', 6, 8);

    graphics.destroy();
  }

  private createSquidAlien(graphics: Phaser.GameObjects.Graphics): void {
    // Squid alien (10 points) - Bottom rows, simplest design
    graphics.clear();
    graphics.fillStyle(0x00ff00); // Classic green

    // Main body (rectangular with slight curve)
    graphics.fillRect(4, 6, 24, 12);

    // Eyes
    graphics.fillStyle(0x000000);
    graphics.fillRect(8, 8, 3, 3);
    graphics.fillRect(21, 8, 3, 3);

    // Tentacles (simple vertical lines)
    graphics.fillStyle(0x00ff00);
    graphics.fillRect(6, 18, 2, 6);
    graphics.fillRect(12, 18, 2, 6);
    graphics.fillRect(18, 18, 2, 6);
    graphics.fillRect(24, 18, 2, 6);

    // Mathematical circuit pattern overlay
    graphics.lineStyle(1, 0x00aa00, 0.7);
    graphics.strokeRect(6, 8, 20, 8);

    graphics.generateTexture('alien_squid', 37, 28);
  }

  private createCrabAlien(graphics: Phaser.GameObjects.Graphics): void {
    // Crab alien (20 points) - Middle rows, moderate complexity
    graphics.clear();
    graphics.fillStyle(0xffaa00); // Orange

    // Main body (wider, more complex)
    graphics.fillRect(2, 4, 28, 14);

    // Eyes (larger, more prominent)
    graphics.fillStyle(0x000000);
    graphics.fillRect(6, 6, 4, 4);
    graphics.fillRect(22, 6, 4, 4);

    // Claws/arms extending outward
    graphics.fillStyle(0xffaa00);
    graphics.fillRect(0, 8, 4, 6);
    graphics.fillRect(28, 8, 4, 6);

    // Legs (more complex pattern)
    graphics.fillRect(4, 18, 2, 4);
    graphics.fillRect(8, 18, 2, 6);
    graphics.fillRect(12, 18, 2, 4);
    graphics.fillRect(16, 18, 2, 4);
    graphics.fillRect(20, 18, 2, 6);
    graphics.fillRect(26, 18, 2, 4);

    // Mathematical pattern (geometric shapes)
    graphics.lineStyle(1, 0xcc7700, 0.8);
    graphics.strokeRect(4, 6, 24, 10);
    graphics.beginPath();
    graphics.moveTo(8, 8);
    graphics.lineTo(24, 8);
    graphics.moveTo(8, 14);
    graphics.lineTo(24, 14);
    graphics.strokePath();

    graphics.generateTexture('alien_crab', 37, 28);
  }

  private createOctopusAlien(graphics: Phaser.GameObjects.Graphics): void {
    // Octopus alien (30 points) - Top rows, most complex design
    graphics.clear();
    graphics.fillStyle(0xff0066); // Pink/magenta

    // Main body (rounded, most sophisticated)
    graphics.fillRoundedRect(2, 2, 28, 16, 4);

    // Large prominent eyes
    graphics.fillStyle(0x000000);
    graphics.fillRect(5, 5, 5, 5);
    graphics.fillRect(22, 5, 5, 5);

    // Inner eye detail
    graphics.fillStyle(0xffffff);
    graphics.fillRect(6, 6, 2, 2);
    graphics.fillRect(24, 6, 2, 2);

    // Complex tentacle pattern
    graphics.fillStyle(0xff0066);
    graphics.fillRect(2, 18, 2, 6);
    graphics.fillRect(6, 18, 2, 4);
    graphics.fillRect(10, 18, 2, 6);
    graphics.fillRect(14, 18, 2, 4);
    graphics.fillRect(18, 18, 2, 6);
    graphics.fillRect(22, 18, 2, 4);
    graphics.fillRect(26, 18, 2, 6);
    graphics.fillRect(30, 18, 2, 4);

    // Advanced mathematical circuit overlay
    graphics.lineStyle(1, 0xcc0044, 0.9);
    graphics.strokeRoundedRect(4, 4, 24, 12, 2);
    graphics.beginPath();
    graphics.moveTo(6, 8);
    graphics.lineTo(26, 8);
    graphics.moveTo(6, 12);
    graphics.lineTo(26, 12);
    graphics.moveTo(16, 6);
    graphics.lineTo(16, 14);
    graphics.strokePath();

    // Mathematical symbols overlay
    graphics.lineStyle(1, 0xffffff, 0.6);
    graphics.beginPath();
    graphics.moveTo(12, 10);
    graphics.lineTo(14, 10); // Plus sign horizontal
    graphics.moveTo(13, 9);
    graphics.lineTo(13, 11); // Plus sign vertical
    graphics.moveTo(18, 9);
    graphics.lineTo(20, 11); // Multiplication X
    graphics.moveTo(18, 11);
    graphics.lineTo(20, 9); // Multiplication X
    graphics.strokePath();

    graphics.generateTexture('alien_octopus', 37, 28);
  }

  private createUfoAlien(graphics: Phaser.GameObjects.Graphics): void {
    // UFO alien (50-300 points) - Bonus spaceship
    graphics.clear();
    graphics.fillStyle(0xffff00); // Bright yellow

    // Main UFO body (classic flying saucer shape)
    graphics.fillEllipse(16, 12, 30, 12);

    // UFO dome
    graphics.fillStyle(0xffaa00);
    graphics.fillEllipse(16, 8, 20, 8);

    // UFO lights/windows
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(8, 12, 2);
    graphics.fillCircle(16, 12, 2);
    graphics.fillCircle(24, 12, 2);

    // Mathematical circuit pattern (most advanced)
    graphics.lineStyle(1, 0xccaa00, 1.0);
    graphics.strokeEllipse(16, 12, 28, 10);
    graphics.beginPath();
    graphics.moveTo(4, 12);
    graphics.lineTo(28, 12);
    graphics.moveTo(16, 4);
    graphics.lineTo(16, 20);
    graphics.strokePath();

    // Special mathematical symbols for UFO
    graphics.lineStyle(1, 0x000000, 0.8);
    graphics.beginPath();
    // Equals sign
    graphics.moveTo(10, 10);
    graphics.lineTo(14, 10);
    graphics.moveTo(10, 14);
    graphics.lineTo(14, 14);
    // Division symbol
    graphics.moveTo(18, 10);
    graphics.lineTo(22, 14);
    graphics.strokePath();

    graphics.generateTexture('alien_ufo', 37, 28);
  }

  private createSoundEffects(): void {
    // Placeholder for sound effects - will be implemented with Web Audio API
    console.log('Sound effects initialized');
  }

  private playSound(soundKey: string): void {
    try {
      // Create Web Audio API sounds on demand
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      switch (soundKey) {
        case 'shootSound':
          this.createShootSound(audioContext);
          break;
        case 'hitSound':
          this.createHitSound(audioContext);
          break;
        case 'explosionSound':
          this.createExplosionSound(audioContext);
          break;
      }
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  private createShootSound(audioContext: AudioContext): void {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      200,
      audioContext.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.1
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  private createHitSound(audioContext: AudioContext): void {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      100,
      audioContext.currentTime + 0.15
    );

    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.15
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  }

  private createExplosionSound(audioContext: AudioContext): void {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      50,
      audioContext.currentTime + 0.3
    );

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(
      100,
      audioContext.currentTime + 0.3
    );

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }
}
