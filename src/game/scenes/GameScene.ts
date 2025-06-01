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
    // Create simple colored rectangles as placeholders for sprites
    this.createPlaceholderAssets();
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
      // Standard mode costs firepower
      if (this.firepower >= 5) {
        this.firepower -= 5;
        this.createBullet(this.player.x, this.player.y - 10, -300);
      }
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

    // Get alien number from stored data
    const alienNumber = alienSprite.getData('number') || 1;

    // Calculate score based on alien number
    const baseScore = alienNumber * 10;
    this.score += baseScore;

    // Destroy alien
    this.alienGrid.destroyAlien(alienSprite);

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
      const column = Math.round(alien.x / 50); // Assuming 50px spacing
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
}
