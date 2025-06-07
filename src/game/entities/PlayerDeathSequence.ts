import * as Phaser from 'phaser';
import { Player } from './Player';
import { ExplosionManager } from './ExplosionManager';

export interface PlayerDeathConfig {
  player: Player;
  explosionManager: ExplosionManager;
  scene: Phaser.Scene;
  onComplete: () => void;
  onRespawn: () => void;
}

export class PlayerDeathSequence {
  private scene: Phaser.Scene;
  private player: Player;
  private explosionManager: ExplosionManager;
  private onComplete: () => void;
  private onRespawn: () => void;
  private isActive: boolean = false;

  // Visual elements
  private screenOverlay: Phaser.GameObjects.Rectangle | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private lifeIndicator: Phaser.GameObjects.Text | null = null;

  constructor(config: PlayerDeathConfig) {
    this.scene = config.scene;
    this.player = config.player;
    this.explosionManager = config.explosionManager;
    this.onComplete = config.onComplete;
    this.onRespawn = config.onRespawn;
  }

  public startDeathSequence(remainingLives: number): void {
    if (this.isActive) return;

    this.isActive = true;
    const playerX = this.player.x;
    const playerY = this.player.y;

    // Phase 1: Dramatic Death (0-1.5 seconds)
    this.executePhase1_Death(playerX, playerY, remainingLives);
  }

  private executePhase1_Death(
    x: number,
    y: number,
    remainingLives: number
  ): void {
    // Enhanced multi-stage player explosion
    this.createSpectacularExplosion(x, y);

    // Screen shake and slow motion effect
    this.scene.cameras.main.shake(500, 0.02);
    this.scene.physics.world.timeScale = 0.3; // Slow motion

    // Create ship debris with realistic physics
    this.createShipDebris(x, y);

    // Play dramatic explosion sound
    this.playPlayerDeathSound();

    // Hide the player immediately
    this.player.setVisible(false);
    this.player.setActive(false);

    // Start Phase 2 after 1.5 seconds
    this.scene.time.delayedCall(1500, () => {
      this.executePhase2_Pause(remainingLives);
    });
  }

  private executePhase2_Pause(remainingLives: number): void {
    // Restore normal time scale
    this.scene.physics.world.timeScale = 1.0;

    // Create screen fade effect
    this.screenOverlay = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x000000,
      0
    );
    this.screenOverlay.setDepth(999);

    // Fade to dark
    this.scene.tweens.add({
      targets: this.screenOverlay,
      alpha: 0.7,
      duration: 500,
      ease: 'Power2',
    });

    // Show dramatic life counter animation
    this.animateLifeCounter(remainingLives);

    // Clear battlefield of alien bullets
    this.clearAlienBullets();

    // Start Phase 3 after 1.5 seconds
    this.scene.time.delayedCall(1500, () => {
      if (remainingLives > 0) {
        this.executePhase3_Respawn();
      } else {
        this.executeGameOver();
      }
    });
  }

  private executePhase3_Respawn(): void {
    // Show respawn status
    this.showRespawnStatus();

    // Fade out the overlay
    if (this.screenOverlay) {
      this.scene.tweens.add({
        targets: this.screenOverlay,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          if (this.screenOverlay) {
            this.screenOverlay.destroy();
            this.screenOverlay = null;
          }
        },
      });
    }

    // Trigger player recreation
    this.onRespawn();

    // Start materialization effect after player is recreated
    this.scene.time.delayedCall(500, () => {
      this.createMaterializationEffect();
    });

    // Complete the sequence
    this.scene.time.delayedCall(2000, () => {
      this.completeSequence();
    });
  }

  private executeGameOver(): void {
    // Show game over status
    this.showGameOverStatus();

    // Complete the sequence and trigger game over
    this.scene.time.delayedCall(2000, () => {
      this.completeSequence();
    });
  }

  private createSpectacularExplosion(x: number, y: number): void {
    // Stage 1: Initial white flash
    const initialFlash = this.scene.add.circle(x, y, 50, 0xffffff, 1);
    this.scene.tweens.add({
      targets: initialFlash,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 300,
      ease: 'Power3',
      onComplete: () => initialFlash.destroy(),
    });

    // Stage 2: Multiple fire rings (delayed)
    for (let i = 0; i < 4; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const fireRing = this.scene.add.circle(
          x,
          y,
          30 + i * 15,
          i % 2 === 0 ? 0xff4400 : 0xff6600,
          0.8 - i * 0.15
        );
        this.scene.tweens.add({
          targets: fireRing,
          scaleX: 3 + i * 0.5,
          scaleY: 3 + i * 0.5,
          alpha: 0,
          duration: 400 + i * 100,
          ease: 'Power2',
          onComplete: () => fireRing.destroy(),
        });
      });
    }

    // Stage 3: Energy dissipation waves
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(200 + i * 150, () => {
        const energyWave = this.scene.add.circle(x, y, 20, 0x0088ff, 0.6);
        this.scene.tweens.add({
          targets: energyWave,
          scaleX: 6 + i * 2,
          scaleY: 6 + i * 2,
          alpha: 0,
          duration: 600,
          ease: 'Power1',
          onComplete: () => energyWave.destroy(),
        });
      });
    }

    // Screen flash effect
    const screenFlash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0xffffff,
      0.4
    );
    screenFlash.setDepth(1000);

    this.scene.tweens.add({
      targets: screenFlash,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => screenFlash.destroy(),
    });
  }

  private createShipDebris(x: number, y: number): void {
    const debrisCount = 12;
    const debrisColors = [0x00ffff, 0x0088cc, 0x00aaff, 0xffffff];

    for (let i = 0; i < debrisCount; i++) {
      // Create varied debris shapes
      let debris: Phaser.GameObjects.Shape;
      const shapeType = i % 3;
      const color = debrisColors[i % debrisColors.length];

      if (shapeType === 0) {
        // Triangular ship pieces
        debris = this.scene.add.triangle(
          x,
          y,
          0,
          0,
          4 + Math.random() * 4,
          2 + Math.random() * 3,
          2 + Math.random() * 2,
          6 + Math.random() * 4,
          color
        );
      } else if (shapeType === 1) {
        // Rectangular hull pieces
        debris = this.scene.add.rectangle(
          x,
          y,
          3 + Math.random() * 5,
          2 + Math.random() * 4,
          color
        );
      } else {
        // Circular engine/component pieces
        debris = this.scene.add.circle(x, y, 1 + Math.random() * 3, color);
      }

      // Add physics to debris
      this.scene.physics.add.existing(debris);
      const debrisBody = debris.body as Phaser.Physics.Arcade.Body;

      // Realistic explosion physics
      const angle =
        (i / debrisCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const speed = 80 + Math.random() * 120;

      debrisBody.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 50 // Upward bias
      );
      debrisBody.setGravityY(300); // Gravity pulls debris down
      debrisBody.setAngularVelocity((Math.random() - 0.5) * 600); // Spinning

      // Fade out debris over time
      this.scene.tweens.add({
        targets: debris,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 1500 + Math.random() * 1000,
        ease: 'Power2',
        onComplete: () => debris.destroy(),
      });
    }
  }

  private animateLifeCounter(remainingLives: number): void {
    // Create dramatic life indicator
    this.lifeIndicator = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY - 50,
      remainingLives > 0 ? `LIVES REMAINING: ${remainingLives}` : 'GAME OVER',
      {
        fontSize: '32px',
        color: remainingLives > 0 ? '#ff4444' : '#ff0000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    this.lifeIndicator.setOrigin(0.5);
    this.lifeIndicator.setDepth(1000);
    this.lifeIndicator.setAlpha(0);

    // Animate life counter appearance
    this.scene.tweens.add({
      targets: this.lifeIndicator,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 1,
    });

    // Pulse effect for dramatic emphasis
    this.scene.tweens.add({
      targets: this.lifeIndicator,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 3,
      delay: 500,
    });
  }

  private showRespawnStatus(): void {
    this.statusText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY + 20,
      'SHIP MATERIALIZING...',
      {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#00ffff',
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 4,
          fill: true,
        },
      }
    );
    this.statusText.setOrigin(0.5);
    this.statusText.setDepth(1000);
    this.statusText.setAlpha(0);

    // Animate status text with more dramatic entrance
    this.scene.tweens.add({
      targets: this.statusText,
      alpha: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Gentle pulsing effect instead of blinking for better readability
    this.scene.tweens.add({
      targets: this.statusText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Color cycling effect for extra visibility
    this.scene.tweens.add({
      targets: this.statusText,
      alpha: 0.8,
      duration: 600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private showGameOverStatus(): void {
    this.statusText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY + 20,
      'FINAL DESTRUCTION',
      {
        fontSize: '28px',
        color: '#ff0000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    this.statusText.setOrigin(0.5);
    this.statusText.setDepth(1000);
    this.statusText.setAlpha(0);

    // Dramatic appearance
    this.scene.tweens.add({
      targets: this.statusText,
      alpha: 1,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 800,
      ease: 'Back.easeOut',
    });
  }

  private createMaterializationEffect(): void {
    if (!this.player || !this.player.active) return;

    const x = this.player.x;
    const y = this.player.y;

    // Energy materialization rings
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const ring = this.scene.add.circle(x, y, 40 - i * 6, 0x00ffff, 0.6);
        this.scene.tweens.add({
          targets: ring,
          scaleX: 0.2,
          scaleY: 0.2,
          alpha: 0,
          duration: 400,
          ease: 'Power2',
          onComplete: () => ring.destroy(),
        });
      });
    }

    // Particle materialization effect
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const distance = 30 + Math.random() * 20;

      const particle = this.scene.add.circle(
        x + Math.cos(angle) * distance,
        y + Math.sin(angle) * distance,
        1 + Math.random() * 2,
        0x00ffff,
        0.8
      );

      this.scene.tweens.add({
        targets: particle,
        x: x,
        y: y,
        alpha: 0,
        duration: 600,
        delay: i * 30,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    // Player fade-in effect
    this.player.setAlpha(0);
    this.scene.tweens.add({
      targets: this.player,
      alpha: 1,
      duration: 800,
      ease: 'Power2',
    });

    // Play materialization sound
    this.playMaterializationSound();
  }

  private clearAlienBullets(): void {
    // This will be called by the GameScene to clear alien bullets
    // We'll trigger this through the callback system
  }

  private playPlayerDeathSound(): void {
    try {
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Multi-stage dramatic explosion sound
      const createExplosionStage = (
        frequency: number,
        duration: number,
        delay: number,
        volume: number
      ) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          const filter = audioContext.createBiquadFilter();

          oscillator.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(
            frequency,
            audioContext.currentTime
          );
          oscillator.frequency.exponentialRampToValueAtTime(
            frequency * 0.2,
            audioContext.currentTime + duration
          );

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(3000, audioContext.currentTime);
          filter.frequency.exponentialRampToValueAtTime(
            100,
            audioContext.currentTime + duration
          );

          gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + duration
          );

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };

      // Three-stage dramatic explosion
      createExplosionStage(250, 0.4, 0, 0.5); // Initial blast
      createExplosionStage(180, 0.6, 150, 0.4); // Secondary explosion
      createExplosionStage(120, 0.8, 300, 0.3); // Final rumble
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  private playMaterializationSound(): void {
    try {
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Sci-fi materialization sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        800,
        audioContext.currentTime + 0.8
      );

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(
        1200,
        audioContext.currentTime + 0.8
      );

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.8
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  private completeSequence(): void {
    // Clean up visual elements
    if (this.screenOverlay) {
      this.screenOverlay.destroy();
      this.screenOverlay = null;
    }

    if (this.statusText) {
      this.scene.tweens.add({
        targets: this.statusText,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.statusText) {
            this.statusText.destroy();
            this.statusText = null;
          }
        },
      });
    }

    if (this.lifeIndicator) {
      this.scene.tweens.add({
        targets: this.lifeIndicator,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.lifeIndicator) {
            this.lifeIndicator.destroy();
            this.lifeIndicator = null;
          }
        },
      });
    }

    this.isActive = false;
    this.onComplete();
  }

  public isSequenceActive(): boolean {
    return this.isActive;
  }

  public destroy(): void {
    if (this.screenOverlay) {
      this.screenOverlay.destroy();
    }
    if (this.statusText) {
      this.statusText.destroy();
    }
    if (this.lifeIndicator) {
      this.lifeIndicator.destroy();
    }
    this.isActive = false;
  }
}
