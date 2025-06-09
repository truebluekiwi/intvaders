import * as Phaser from 'phaser';
import {
  Player,
  AlienGrid,
  Bullet,
  ExplosionManager,
  PlayerDeathSequence,
} from '../entities';
import { WaveTransitionData } from './WaveTransitionScene';
import { AlienType } from '../entities/AlienGrid';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private alienGrid!: AlienGrid;
  private bullets!: Phaser.Physics.Arcade.Group;
  private alienBullets!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private pKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private explosionManager!: ExplosionManager;
  private playerDeathSequence!: PlayerDeathSequence;

  // Game state
  private score: number = 0;
  private wave: number = 1;
  private lives: number = 3;
  private firepower: number = 100;
  private armor: number = 0;
  private isCalculatingMode: boolean = false;
  private lastAlienShootTime: number = 0;
  private alienShootInterval: number = 2000; // milliseconds

  // Wave statistics tracking
  private waveStartScore: number = 0;
  private aliensDestroyedThisWave: {
    squid: number;
    crab: number;
    octopus: number;
    ufo: number;
  } = { squid: 0, crab: 0, octopus: 0, ufo: 0 };

  // Pause system
  private isPaused: boolean = false;
  private maxPauseTime: number = 600000; // 10 minutes in milliseconds
  private remainingPauseTime: number = 600000; // Start with full pause time
  private pauseStartTime: number = 0;

  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private firepowerText!: Phaser.GameObjects.Text;
  private armorText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private pauseTimeText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { gameMode?: 'standard' | 'calculating' }): void {
    // Set the calculating mode based on the selected mode from menu
    this.isCalculatingMode = data.gameMode === 'calculating';
  }

  preload(): void {
    // Create improved visual assets
    this.createImprovedAssets();

    // Create sound effects using Web Audio API
    this.createSoundEffects();
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Reset all game state variables (except isCalculatingMode which is set in init)
    this.score = 0;
    this.wave = 1;
    this.lives = 3;
    this.firepower = 100;
    this.armor = 0;
    // Note: isCalculatingMode is set in init() and should not be reset here
    this.lastAlienShootTime = 0;
    this.alienShootInterval = 2000;

    // Reset pause system
    this.isPaused = false;
    this.remainingPauseTime = this.maxPauseTime;
    this.pauseStartTime = 0;

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
    this.pKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.escKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    // Ensure game canvas has focus for keyboard input
    this.input.on('pointerdown', () => {
      this.game.canvas.focus();
    });

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

    // Initialize explosion manager
    this.explosionManager = new ExplosionManager(this);

    // Initialize player death sequence
    this.playerDeathSequence = new PlayerDeathSequence({
      player: this.player,
      explosionManager: this.explosionManager,
      scene: this,
      onComplete: () => {
        // Death sequence completed
      },
      onRespawn: () => {
        // Recreate player during respawn phase
        this.recreatePlayerForDeathSequence();
      },
    });

    // Setup collisions
    this.setupCollisions();

    // Create UI
    this.createUI();

    // Start alien movement
    this.alienGrid.startMovement();

    // Initialize alien shooting timer
    this.lastAlienShootTime = this.time.now;

    // Initialize wave statistics
    this.initializeWaveStats();

    // Set up event listener for wave transition
    this.events.on('startNextWave', this.handleStartNextWave, this);
  }

  update(): void {
    // Handle input (always process pause input)
    this.handleInput();

    // Skip game updates if paused
    if (this.isPaused) {
      return;
    }

    // CRITICAL DEBUG: Check player physics body status every frame
    if (!this.player.body) {
      console.log('CRITICAL: Player physics body is missing in update loop!');
      console.log('Player state:', {
        visible: this.player.visible,
        active: this.player.active,
        alpha: this.player.alpha,
        x: this.player.x,
        y: this.player.y,
      });

      // Emergency recreation
      this.physics.add.existing(this.player);
      console.log('Emergency physics body recreation in update loop');
    }

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

    // Alien bullets vs player - CRITICAL FIX: Use custom collision callback
    this.physics.add.overlap(
      this.alienBullets,
      this.player,
      this.alienBulletHitPlayer,
      this.preCollisionCheck,
      this
    );
  }

  private preCollisionCheck(): boolean {
    // CRITICAL FIX: Ensure player physics body exists BEFORE collision processing
    if (!this.player.body) {
      console.log('PRE-COLLISION: Player physics body missing - recreating');
      this.physics.add.existing(this.player);

      // Ensure physics body is properly configured
      if (this.player.body) {
        this.player.setCollideWorldBounds(true);
        this.player.setImmovable(true);
        (this.player.body as Phaser.Physics.Arcade.Body).enable = true;
      }
    }

    // Always return true to allow collision processing
    return true;
  }

  private handleInput(): void {
    // Debug: Log that handleInput is being called
    if (this.time.now % 1000 < 16) {
      // Log once per second approximately
      console.log('handleInput called, isPaused:', this.isPaused);
    }

    // Only handle pause input if not already paused (let PauseScene handle resume)
    if (!this.isPaused) {
      // Debug: Check if keys are being detected
      if (this.pKey.isDown) {
        console.log('P key is down');
      }
      if (this.escKey.isDown) {
        console.log('ESC key is down');
      }

      if (
        Phaser.Input.Keyboard.JustDown(this.pKey) ||
        Phaser.Input.Keyboard.JustDown(this.escKey)
      ) {
        console.log('Pause key detected!');
        this.pauseGame();
        return;
      }
    }

    // Skip other inputs if paused
    if (this.isPaused) {
      return;
    }

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

    // Note: Calculating mode is now set at game start and cannot be changed
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

    // Don't process hit if game is paused
    if (this.isPaused) {
      return;
    }

    bulletSprite.destroy();

    // Play hit sound
    this.playSound('hitSound');

    // Get alien data before destroying
    const alienData = alienSprite.getData('alienData');

    // Track alien destruction for statistics
    this.trackAlienDestruction(alienData);

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
      if (alienData) {
        this.armor += alienData.number; // Add armor equal to alien number
      }
    }

    // Enhanced alien destruction effect with type-specific debris
    this.createAlienDebris(alienSprite.x, alienSprite.y, alienData);
  }

  // Add collision guard to prevent multiple collisions in rapid succession
  private lastCollisionTime: number = 0;
  private collisionCooldown: number = 100; // 100ms cooldown between collisions

  private alienBulletHitPlayer(
    bullet:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile
  ): void {
    // CRITICAL GUARD: Prevent multiple collisions in rapid succession
    const currentTime = this.time.now;
    if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
      console.log('COLLISION BLOCKED: Still in cooldown period');
      return;
    }
    this.lastCollisionTime = currentTime;

    // CRITICAL FIX: IMMEDIATELY ensure physics body exists at the very start
    if (!this.player.body) {
      console.log(
        'IMMEDIATE FIX: Player physics body missing - recreating NOW'
      );
      this.physics.add.existing(this.player);
      if (this.player.body) {
        this.player.setCollideWorldBounds(true);
        this.player.setImmovable(true);
        (this.player.body as Phaser.Physics.Arcade.Body).enable = true;
      }
      console.log('IMMEDIATE physics body recreation completed');
    }

    // DEBUG: Log that collision method is being called
    console.log('=== COLLISION METHOD CALLED ===');
    console.log('Player state AT VERY START of collision method:');
    console.log('  - visible:', this.player.visible);
    console.log('  - active:', this.player.active);
    console.log('  - alpha:', this.player.alpha);
    console.log('  - armor:', this.armor);
    console.log('  - lives:', this.lives);
    console.log(
      '  - death sequence active:',
      this.playerDeathSequence.isSequenceActive()
    );

    // Don't process hit if game is paused
    if (this.isPaused) {
      console.log('COLLISION BLOCKED: Game is paused');
      return;
    }

    // Don't process hit if player is invincible
    if (this.player.getIsInvincible()) {
      console.log('COLLISION BLOCKED: Player is invincible');
      return;
    }

    // Don't process hit if death sequence is already active
    if (this.playerDeathSequence.isSequenceActive()) {
      console.log('COLLISION BLOCKED: Death sequence is already active');
      return;
    }

    // CRITICAL FIX: Ensure player is visible and active BEFORE bullet destruction
    this.player.setVisible(true);
    this.player.setActive(true);
    this.player.setAlpha(1);

    console.log('Player state AFTER forced visibility:');
    console.log('  - visible:', this.player.visible);
    console.log('  - active:', this.player.active);
    console.log('  - alpha:', this.player.alpha);

    // CRITICAL FIX: Safely disable bullet first, then destroy
    const bulletToDestroy = bullet as Bullet;
    console.log('About to safely disable and destroy bullet...');
    console.log(
      'Player physics body exists before bullet processing:',
      !!this.player.body
    );

    // Disable bullet first to prevent further collisions
    bulletToDestroy.setActive(false);
    bulletToDestroy.setVisible(false);
    if (bulletToDestroy.body) {
      bulletToDestroy.body.enable = false;
    }

    // Use delayed destruction to avoid race conditions
    this.time.delayedCall(1, () => {
      if (bulletToDestroy && bulletToDestroy.active === false) {
        bulletToDestroy.destroy();
      }
    });

    console.log(
      'Player physics body exists after bullet processing:',
      !!this.player.body
    );

    // CRITICAL FIX: Check if bullet processing affected player physics
    if (!this.player.body) {
      console.log(
        'CRITICAL ERROR: Bullet processing destroyed player physics body!'
      );
      console.log('Recreating immediately');

      // Emergency recreation
      this.physics.add.existing(this.player);
      if (this.player.body) {
        this.player.setCollideWorldBounds(true);
        this.player.setImmovable(true);
        (this.player.body as Phaser.Physics.Arcade.Body).enable = true;
      }
      console.log('Emergency physics body recreation completed');
    }

    // ALWAYS ensure physics body is enabled and player is visible
    if (this.player.body) {
      this.player.body.enable = true;
      console.log('Physics body enabled:', this.player.body.enable);
    }

    // FORCE player visibility regardless of physics body state
    this.player.setVisible(true);
    this.player.setActive(true);
    this.player.setAlpha(1);
    console.log('FORCED player visibility after physics check');

    if (this.armor > 0) {
      // RADICAL FIX: Completely bypass complex armor handling when armor > 10
      if (this.armor > 10) {
        console.log(
          'ARMOR > 10: Using COMPLETELY ISOLATED invincibility approach'
        );
        console.log('  - armor before:', this.armor);

        // Simply reduce armor - NO INVINCIBILITY SYSTEM AT ALL
        this.armor -= 10;
        console.log('  - armor after:', this.armor);

        // FORCE PLAYER VISIBILITY AND STATE
        this.player.setVisible(true);
        this.player.setActive(true);
        this.player.setAlpha(1);
        this.player.clearTint();

        // Ensure physics body is enabled
        if (this.player.body) {
          this.player.body.enable = true;
        }

        console.log('Player state after ISOLATED processing:');
        console.log('  - visible:', this.player.visible);
        console.log('  - active:', this.player.active);
        console.log('  - alpha:', this.player.alpha);
        console.log('  - body enabled:', this.player.body?.enable);

        // NO INVINCIBILITY SYSTEM - just return immediately
        console.log('ISOLATED processing complete - no invincibility used');

        return;
      }

      // Original complex handling only for armor <= 10
      console.log('ARMOR <= 10: Using original armor handling');
      this.armor -= 10;

      // Check if armor dropped to 0 or below after taking damage
      if (this.armor <= 0) {
        // Armor depleted - player loses a life
        console.log('Armor depleted after damage - player loses a life');
        this.armor = 0; // Ensure armor doesn't go negative
        this.lives--;

        // CRITICAL FIX: Only trigger death sequence if player is actually dead (no lives left)
        if (this.lives <= 0) {
          console.log('Player is dead - triggering death sequence');

          // Clear player bullets immediately
          this.clearPlayerBullets();

          // Clear alien bullets to give player a clean slate on respawn
          this.alienBullets.children.entries.forEach((alienBullet) => {
            if (alienBullet.active) {
              alienBullet.destroy();
            }
          });

          // Start the dramatic death sequence
          this.playerDeathSequence.startDeathSequence(this.lives);
        } else {
          console.log('Player still has lives - respawning with invincibility');

          // Player still has lives - just respawn with brief invincibility
          this.player.setVisible(true);
          this.player.setActive(true);
          this.player.setAlpha(1);
          this.player.clearTint();

          // Ensure physics body is enabled
          if (this.player.body) {
            this.player.body.enable = true;
          }

          // Brief invincibility period when respawning
          this.player.setInvincible(true);
          this.time.delayedCall(2000, () => {
            this.player.setInvincible(false);

            // CRITICAL FIX: Force player visibility after invincibility clears
            this.player.setVisible(true);
            this.player.setActive(true);
            this.player.setAlpha(1);

            // Ensure physics body is still enabled
            if (this.player.body) {
              this.player.body.enable = true;
            }

            console.log(
              'Respawn invincibility cleared - forced visibility restored'
            );
          });
        }
      } else {
        // Armor absorbed the damage - use original handling for armor <= 10
        console.log('Armor absorbed damage, remaining armor:', this.armor);

        // Simple invincibility for low armor
        this.player.setInvincible(true);
        this.time.delayedCall(500, () => {
          this.player.setInvincible(false);
          console.log('Low armor invincibility cleared');
        });
      }
    } else {
      // DEBUG: Log death path
      console.log('Player death - no armor remaining');
      this.lives--;

      // Clear player bullets immediately
      this.clearPlayerBullets();

      // Clear alien bullets to give player a clean slate on respawn
      this.alienBullets.children.entries.forEach((alienBullet) => {
        if (alienBullet.active) {
          alienBullet.destroy();
        }
      });

      // Start the dramatic death sequence
      this.playerDeathSequence.startDeathSequence(this.lives);
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

        // Create special explosion for UFO using ExplosionManager
        this.explosionManager.createExplosion({
          x: ufo.x,
          y: ufo.y,
          type: 'ufo',
        });
      }
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

  private recreatePlayer(): void {
    const { width, height } = this.cameras.main;

    // Destroy the old player
    if (this.player) {
      this.player.destroy();
    }

    // Create a new player
    this.player = new Player(this, width / 2, height - 50);

    // Re-establish collision detection for the new player
    this.setupCollisions();

    // Clear any frozen UFO and reset UFO timer to allow new spawning
    const ufo = this.alienGrid.getUfo();
    if (ufo && ufo.active) {
      // Destroy frozen UFO and its text
      const numberText = ufo.getData('numberText') as Phaser.GameObjects.Text;
      if (numberText) {
        numberText.destroy();
      }
      ufo.destroy();
      // Reset UFO reference in AlienGrid
      this.alienGrid.clearUfo();
    }

    // Set brief invincibility
    this.player.setInvincible(true);
    this.time.delayedCall(2000, () => {
      this.player.setInvincible(false);
    });
  }

  private recreatePlayerForDeathSequence(): void {
    const { width, height } = this.cameras.main;

    // Destroy the old player
    if (this.player) {
      this.player.destroy();
    }

    // Create a new player
    this.player = new Player(this, width / 2, height - 50);

    // Re-establish collision detection for the new player
    this.setupCollisions();

    // Update the death sequence with the new player reference
    this.playerDeathSequence = new PlayerDeathSequence({
      player: this.player,
      explosionManager: this.explosionManager,
      scene: this,
      onComplete: () => {
        // Death sequence completed
      },
      onRespawn: () => {
        // Recreate player during respawn phase
        this.recreatePlayerForDeathSequence();
      },
    });

    // Clear any frozen UFO and reset UFO timer to allow new spawning
    const ufo = this.alienGrid.getUfo();
    if (ufo && ufo.active) {
      // Destroy frozen UFO and its text
      const numberText = ufo.getData('numberText') as Phaser.GameObjects.Text;
      if (numberText) {
        numberText.destroy();
      }
      ufo.destroy();
      // Reset UFO reference in AlienGrid
      this.alienGrid.clearUfo();
    }

    // Start invincibility with visible halo effect
    this.player.startInvincibilityWithHalo();
  }

  private clearPlayerBullets(): void {
    // Clear all active player bullets
    this.bullets.children.entries.forEach((bullet) => {
      if (bullet.active) {
        bullet.destroy();
      }
    });
  }

  private clearAllBullets(): void {
    // Clear all bullets (player and alien)
    this.clearPlayerBullets();
    this.alienBullets.children.entries.forEach((bullet) => {
      if (bullet.active) {
        bullet.destroy();
      }
    });
  }

  private nextWave(): void {
    // Calculate wave statistics
    const waveScore = this.score - this.waveStartScore;
    const bonusScore = this.wave * 100;
    const newFirepower = Math.min(100, this.firepower + 20);

    // Prepare transition data
    const transitionData: WaveTransitionData = {
      completedWave: this.wave,
      nextWave: this.wave + 1,
      score: this.score + bonusScore,
      waveScore,
      bonusScore,
      newFirepower,
      aliensDestroyed: { ...this.aliensDestroyedThisWave },
    };

    // Apply bonuses
    this.score += bonusScore;
    this.firepower = newFirepower;
    this.wave++;

    // Clear all bullets before transition
    this.clearAllBullets();

    // Clean up any existing UFO from the previous wave
    const existingUfo = this.alienGrid.getUfo();
    if (existingUfo && existingUfo.active) {
      // Destroy UFO and its text
      const numberText = existingUfo.getData(
        'numberText'
      ) as Phaser.GameObjects.Text;
      if (numberText) {
        numberText.destroy();
      }
      existingUfo.destroy();
      this.alienGrid.clearUfo();
    }

    // Pause the game scene and launch transition scene
    this.scene.pause('GameScene');
    this.scene.launch('WaveTransitionScene', transitionData);
  }

  private gameOver(): void {
    // Clean up explosion manager
    if (this.explosionManager) {
      this.explosionManager.destroy();
    }

    // Determine end reason
    const endReason = this.lives <= 0 ? 'player_death' : 'alien_invasion';

    // Calculate final statistics
    const finalStats = {
      aliensDestroyed:
        this.aliensDestroyedThisWave.squid +
        this.aliensDestroyedThisWave.crab +
        this.aliensDestroyedThisWave.octopus +
        this.aliensDestroyedThisWave.ufo,
      shotsfired: 0, // TODO: Track this in future update
      accuracy: 0, // TODO: Calculate this in future update
      timeAlive: this.time.now, // Approximate time alive
    };

    // Start the dramatic game end sequence
    this.scene.start('GameEndSequence', {
      score: this.score,
      wave: this.wave,
      lives: this.lives,
      endReason: endReason,
      finalStats: finalStats,
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

    // Pause time display
    this.pauseTimeText = this.add.text(
      this.cameras.main.width - padding,
      padding + 25,
      this.formatPauseTimeDisplay(),
      {
        fontSize: '14px',
        color: this.getPauseTimeColor(),
        fontFamily: 'Arial, sans-serif',
      }
    );
    this.pauseTimeText.setOrigin(1, 0);
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

    // Update pause time display
    this.pauseTimeText.setText(this.formatPauseTimeDisplay());
    this.pauseTimeText.setColor(this.getPauseTimeColor());
  }

  private formatPauseTimeDisplay(): string {
    const totalSeconds = Math.ceil(this.remainingPauseTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `Pause: ${minutes}:${seconds.toString().padStart(2, '0')} (P/ESC)`;
  }

  private getPauseTimeColor(): string {
    if (this.remainingPauseTime <= 0) return '#ff0000'; // Red when exhausted
    if (this.remainingPauseTime <= 60000) return '#ff4444'; // Red for last minute
    if (this.remainingPauseTime <= 180000) return '#ffaa00'; // Orange for last 3 minutes
    return '#00ff00'; // Green for plenty of time
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

  private pauseGame(): void {
    // Check if pause time is available
    if (this.remainingPauseTime <= 0) {
      console.log('Cannot pause - no time remaining');
      return; // Cannot pause - no time remaining
    }

    console.log('Pausing game...');
    this.isPaused = true;
    this.pauseStartTime = this.time.now;

    // Launch pause scene with remaining time
    console.log(
      'Launching PauseScene with remaining time:',
      this.remainingPauseTime
    );
    this.scene.launch('PauseScene', { remainingTime: this.remainingPauseTime });

    // Set up event listeners for pause scene
    this.events.on('pauseTimeUpdate', this.handlePauseTimeUpdate, this);
    this.events.on('resumeGame', this.handleResumeFromPause, this);
  }

  private resumeGame(): void {
    if (!this.isPaused) {
      return;
    }

    // Calculate time spent paused
    const pauseDuration = this.time.now - this.pauseStartTime;
    this.remainingPauseTime = Math.max(
      0,
      this.remainingPauseTime - pauseDuration
    );

    this.isPaused = false;
    this.pauseStartTime = 0;

    // Adjust alien shooting timer to account for pause
    this.lastAlienShootTime += pauseDuration;

    // Stop pause scene
    this.scene.stop('PauseScene');

    // Clean up event listeners
    this.events.off('pauseTimeUpdate', this.handlePauseTimeUpdate, this);
    this.events.off('resumeGame', this.handleResumeFromPause, this);
  }

  private handlePauseTimeUpdate(remainingTime: number): void {
    this.remainingPauseTime = remainingTime;
  }

  private handleResumeFromPause(remainingTime: number): void {
    this.remainingPauseTime = remainingTime;
    this.resumeGame();
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

  private initializeWaveStats(): void {
    this.waveStartScore = this.score;
    this.aliensDestroyedThisWave = { squid: 0, crab: 0, octopus: 0, ufo: 0 };
  }

  private trackAlienDestruction(
    alienData: { type: AlienType; number: number } | null
  ): void {
    if (alienData) {
      switch (alienData.type) {
        case AlienType.SQUID:
          this.aliensDestroyedThisWave.squid++;
          break;
        case AlienType.CRAB:
          this.aliensDestroyedThisWave.crab++;
          break;
        case AlienType.OCTOPUS:
          this.aliensDestroyedThisWave.octopus++;
          break;
        case AlienType.UFO:
          this.aliensDestroyedThisWave.ufo++;
          break;
      }
    }
  }

  private createAlienDebris(
    x: number,
    y: number,
    alienData: { type: AlienType; number: number } | null
  ): void {
    // Create initial flash effect
    const flash = this.add.circle(x, y, 15, 0xffffff, 0.8);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    if (!alienData) return;

    // Create type-specific debris
    switch (alienData.type) {
      case AlienType.SQUID:
        this.createSquidDebris(x, y);
        break;
      case AlienType.CRAB:
        this.createCrabDebris(x, y);
        break;
      case AlienType.OCTOPUS:
        this.createOctopusDebris(x, y);
        break;
      case AlienType.UFO:
        this.createUfoDebris(x, y);
        break;
    }
  }

  private createSquidDebris(x: number, y: number): void {
    // Green tentacle pieces for squid
    const debrisCount = 4;
    const debrisColor = 0x00ff00;

    for (let i = 0; i < debrisCount; i++) {
      // Create small rectangular debris pieces (tentacle fragments)
      const debris = this.add.rectangle(x, y, 3, 8, debrisColor);
      const angle = (i / debrisCount) * Math.PI * 2;
      const speed = Phaser.Math.Between(50, 120);

      // Add physics to debris
      this.physics.add.existing(debris);
      const debrisBody = debris.body as Phaser.Physics.Arcade.Body;
      debrisBody.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 30
      );
      debrisBody.setGravityY(200);

      // Rotate debris as it flies
      this.tweens.add({
        targets: debris,
        rotation: Math.PI * 4,
        alpha: 0,
        duration: 1000,
        onComplete: () => debris.destroy(),
      });
    }
  }

  private createCrabDebris(x: number, y: number): void {
    // Orange claw and leg pieces for crab
    const debrisCount = 6;
    const debrisColor = 0xffaa00;

    for (let i = 0; i < debrisCount; i++) {
      // Create varied debris shapes (claws and legs)
      const isLeg = i % 2 === 0;
      const debris = isLeg
        ? this.add.rectangle(x, y, 2, 6, debrisColor) // Leg pieces
        : this.add.rectangle(x, y, 6, 3, debrisColor); // Claw pieces

      const angle = (i / debrisCount) * Math.PI * 2;
      const speed = Phaser.Math.Between(60, 140);

      // Add physics to debris
      this.physics.add.existing(debris);
      const debrisBody = debris.body as Phaser.Physics.Arcade.Body;
      debrisBody.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 20
      );
      debrisBody.setGravityY(180);

      // Tumble effect
      this.tweens.add({
        targets: debris,
        rotation: Math.PI * 3,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 1200,
        onComplete: () => debris.destroy(),
      });
    }
  }

  private createOctopusDebris(x: number, y: number): void {
    // Pink/magenta tentacle and eye pieces for octopus
    const debrisCount = 8;
    const debrisColor = 0xff0066;
    const eyeColor = 0xffffff;

    for (let i = 0; i < debrisCount; i++) {
      let debris;
      if (i < 2) {
        // Create eye debris (white circles)
        debris = this.add.circle(x, y, 3, eyeColor);
      } else {
        // Create tentacle pieces (longer rectangles)
        debris = this.add.rectangle(x, y, 2, 10, debrisColor);
      }

      const angle = (i / debrisCount) * Math.PI * 2;
      const speed = Phaser.Math.Between(70, 160);

      // Add physics to debris
      this.physics.add.existing(debris);
      const debrisBody = debris.body as Phaser.Physics.Arcade.Body;
      debrisBody.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 40
      );
      debrisBody.setGravityY(220);

      // Complex rotation and scaling
      this.tweens.add({
        targets: debris,
        rotation: Math.PI * 5,
        alpha: 0,
        scaleX: i < 2 ? 0.2 : 0.3, // Eyes shrink more
        scaleY: i < 2 ? 0.2 : 0.3,
        duration: 1400,
        ease: 'Power2',
        onComplete: () => debris.destroy(),
      });
    }
  }

  private createUfoDebris(x: number, y: number): void {
    // Yellow metallic pieces and light fragments for UFO
    const debrisCount = 10;
    const metalColor = 0xffff00;
    const lightColor = 0xffffff;

    for (let i = 0; i < debrisCount; i++) {
      let debris;
      if (i < 3) {
        // Create light debris (white circles)
        debris = this.add.circle(x, y, 2, lightColor);
      } else if (i < 6) {
        // Create dome pieces (curved fragments)
        debris = this.add.ellipse(x, y, 8, 4, 0xffaa00);
      } else {
        // Create hull pieces (rectangular fragments)
        debris = this.add.rectangle(x, y, 6, 2, metalColor);
      }

      const angle = (i / debrisCount) * Math.PI * 2;
      const speed = Phaser.Math.Between(80, 200);

      // Add physics to debris
      this.physics.add.existing(debris);
      const debrisBody = debris.body as Phaser.Physics.Arcade.Body;
      debrisBody.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 50
      );
      debrisBody.setGravityY(150); // UFO debris floats more

      // Sparkling effect for UFO debris
      this.tweens.add({
        targets: debris,
        rotation: Math.PI * 6,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 1800,
        ease: 'Power3',
        onComplete: () => debris.destroy(),
      });

      // Add extra sparkle effect for lights
      if (i < 3) {
        this.tweens.add({
          targets: debris,
          alpha: { from: 1, to: 0.3 },
          duration: 100,
          yoyo: true,
          repeat: 8,
        });
      }
    }
  }

  private handleStartNextWave(data: { wave: number }): void {
    // Create new alien grid for the next wave
    this.alienGrid = new AlienGrid(this, data.wave);

    // Re-establish collision detection for new alien grid
    this.setupCollisions();

    // Start alien movement
    this.alienGrid.startMovement();

    // Reset alien shooting timer
    this.lastAlienShootTime = this.time.now;

    // Initialize wave statistics for the new wave
    this.initializeWaveStats();
  }
}
