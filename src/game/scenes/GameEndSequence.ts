import * as Phaser from 'phaser';

export interface GameEndData {
  score: number;
  wave: number;
  lives: number;
  endReason: 'player_death' | 'alien_invasion';
  finalStats: {
    aliensDestroyed: number;
    shotsfired: number;
    accuracy: number;
    timeAlive: number;
  };
}

export class GameEndSequence extends Phaser.Scene {
  private gameEndData!: GameEndData;
  private sequenceStep: number = 0;
  private backgroundOverlay!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'GameEndSequence' });
  }

  init(data: GameEndData): void {
    this.gameEndData = data;
    this.sequenceStep = 0;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Create dark overlay that will gradually intensify
    this.backgroundOverlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0
    );

    // Start the dramatic sequence
    this.startGameEndSequence();
  }

  private startGameEndSequence(): void {
    // Stage 1: Initial dramatic effects (0-1000ms)
    this.createInitialDramaticEffects();

    // Stage 2: Screen effects and buildup (1000-2500ms)
    this.time.delayedCall(1000, () => {
      this.createScreenEffectsBuildup();
    });

    // Stage 3: Climactic moment (2500-3500ms)
    this.time.delayedCall(2500, () => {
      this.createClimax();
    });

    // Stage 4: Reflection pause (3500-5000ms)
    this.time.delayedCall(3500, () => {
      this.createReflectionPause();
    });

    // Stage 5: Transition to results (5000ms)
    this.time.delayedCall(5000, () => {
      this.transitionToGameOver();
    });
  }

  private createInitialDramaticEffects(): void {
    if (this.gameEndData.endReason === 'player_death') {
      // Player death sequence
      this.createPlayerDeathEffects();
    } else {
      // Alien invasion sequence
      this.createAlienInvasionEffects();
    }

    // Start background darkening
    this.tweens.add({
      targets: this.backgroundOverlay,
      alpha: 0.3,
      duration: 1000,
      ease: 'Power2',
    });

    // Screen shake based on end reason
    const shakeIntensity =
      this.gameEndData.endReason === 'player_death' ? 8 : 12;
    this.cameras.main.shake(800, shakeIntensity * 0.01);
  }

  private createPlayerDeathEffects(): void {
    const { width, height } = this.cameras.main;

    // Create multiple explosion rings
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 150, () => {
        const explosion = this.add.circle(
          width / 2,
          height - 100,
          20 + i * 15,
          0xff4400,
          0.8 - i * 0.15
        );

        this.tweens.add({
          targets: explosion,
          scaleX: 4 + i,
          scaleY: 4 + i,
          alpha: 0,
          duration: 600,
          ease: 'Power2',
          onComplete: () => explosion.destroy(),
        });
      });
    }

    // Create debris field
    this.createDebrisField(width / 2, height - 100, 0x00ffff);

    // Screen flash effect
    this.time.delayedCall(200, () => {
      this.createScreenFlash(0xff4400, 0.4);
    });
  }

  private createAlienInvasionEffects(): void {
    const { width, height } = this.cameras.main;

    // Create descending alien shadows
    for (let i = 0; i < 8; i++) {
      const x = (width / 9) * (i + 1);
      const shadow = this.add.rectangle(x, -50, 30, 20, 0x000000, 0.7);

      this.tweens.add({
        targets: shadow,
        y: height + 50,
        duration: 1500,
        delay: i * 100,
        ease: 'Power1',
        onComplete: () => shadow.destroy(),
      });

      // Add ominous glow
      const glow = this.add.circle(x, -50, 25, 0xff0000, 0.3);
      this.tweens.add({
        targets: glow,
        y: height + 50,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 1500,
        delay: i * 100,
        ease: 'Power1',
        onComplete: () => glow.destroy(),
      });
    }

    // Screen flash with red tint
    this.time.delayedCall(300, () => {
      this.createScreenFlash(0xff0000, 0.3);
    });
  }

  private createScreenEffectsBuildup(): void {
    const { width, height } = this.cameras.main;

    // Intensify background
    this.tweens.add({
      targets: this.backgroundOverlay,
      alpha: 0.6,
      duration: 1000,
      ease: 'Power2',
    });

    // Create energy waves
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 300, () => {
        const wave = this.add.circle(width / 2, height / 2, 50, 0xffffff, 0.1);
        this.tweens.add({
          targets: wave,
          scaleX: 8,
          scaleY: 8,
          alpha: 0,
          duration: 800,
          ease: 'Power1',
          onComplete: () => wave.destroy(),
        });
      });
    }

    // Add dramatic sound effect
    this.createDramaticSound();

    // Screen distortion effect
    this.cameras.main.shake(1000, 0.02);
  }

  private createClimax(): void {
    const { width, height } = this.cameras.main;

    // Maximum background darkness
    this.tweens.add({
      targets: this.backgroundOverlay,
      alpha: 0.8,
      duration: 500,
      ease: 'Power3',
    });

    // Create climactic explosion/effect
    const climaxEffect = this.add.circle(
      width / 2,
      height / 2,
      100,
      this.gameEndData.endReason === 'player_death' ? 0xff4400 : 0xff0000,
      0.8
    );

    this.tweens.add({
      targets: climaxEffect,
      scaleX: 6,
      scaleY: 6,
      alpha: 0,
      duration: 800,
      ease: 'Power3',
      onComplete: () => climaxEffect.destroy(),
    });

    // Final screen shake
    this.cameras.main.shake(600, 0.05);

    // Climactic sound
    this.createClimaxSound();
  }

  private createReflectionPause(): void {
    const { width, height } = this.cameras.main;

    // Fade to near black
    this.tweens.add({
      targets: this.backgroundOverlay,
      alpha: 0.9,
      duration: 800,
      ease: 'Power2',
    });

    // Show brief stats preview
    const statsText = this.add.text(
      width / 2,
      height / 2,
      `Wave ${this.gameEndData.wave} • Score ${this.gameEndData.score}`,
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }
    );
    statsText.setOrigin(0.5);
    statsText.setAlpha(0);

    // Fade in stats
    this.tweens.add({
      targets: statsText,
      alpha: 0.8,
      duration: 600,
      ease: 'Power2',
    });

    // Add subtle particle effects
    this.createReflectionParticles();

    // Soft ambient sound
    this.createReflectionSound();
  }

  private createDebrisField(
    centerX: number,
    centerY: number,
    color: number
  ): void {
    for (let i = 0; i < 15; i++) {
      const debris = this.add.rectangle(
        centerX,
        centerY,
        2 + Math.random() * 4,
        2 + Math.random() * 4,
        color,
        0.8
      );

      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      const targetX = centerX + Math.cos(angle) * distance;
      const targetY = centerY + Math.sin(angle) * distance;

      this.tweens.add({
        targets: debris,
        x: targetX,
        y: targetY,
        rotation: Math.random() * Math.PI * 4,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => debris.destroy(),
      });
    }
  }

  private createScreenFlash(color: number, intensity: number): void {
    const { width, height } = this.cameras.main;
    const flash = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      color,
      intensity
    );
    flash.setDepth(1000);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  private createReflectionParticles(): void {
    const { width, height } = this.cameras.main;

    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(Math.random() * 1000, () => {
        const particle = this.add.circle(
          Math.random() * width,
          Math.random() * height,
          1,
          0xffffff,
          0.3
        );

        this.tweens.add({
          targets: particle,
          alpha: 0.8,
          scaleX: 2,
          scaleY: 2,
          duration: 1000,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete: () => particle.destroy(),
        });
      });
    }
  }

  private createDramaticSound(): void {
    try {
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Create dramatic buildup sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        120,
        audioContext.currentTime + 1.0
      );

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(
        800,
        audioContext.currentTime + 1.0
      );

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.3,
        audioContext.currentTime + 0.8
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 1.0
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.0);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  private createClimaxSound(): void {
    try {
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Create climactic crash sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        50,
        audioContext.currentTime + 0.6
      );

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(
        100,
        audioContext.currentTime + 0.6
      );

      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.6
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  private createReflectionSound(): void {
    try {
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Create soft ambient reflection sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        110,
        audioContext.currentTime + 1.5
      );

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 1.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.5);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  private transitionToGameOver(): void {
    // Fade to black completely
    this.tweens.add({
      targets: this.backgroundOverlay,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // Transition to enhanced game over scene
        this.scene.start('GameOverScene', {
          score: this.gameEndData.score,
          wave: this.gameEndData.wave,
          endReason: this.gameEndData.endReason,
          finalStats: this.gameEndData.finalStats,
        });
      },
    });
  }
}
