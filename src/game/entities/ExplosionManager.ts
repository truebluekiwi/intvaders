import * as Phaser from 'phaser';
import { AlienType } from './AlienGrid';

export interface ExplosionConfig {
  x: number;
  y: number;
  type: 'alien' | 'player' | 'ufo';
  alienType?: AlienType;
  intensity?: number;
}

export class ExplosionManager {
  private scene: Phaser.Scene;
  private particlePool: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private explosionSounds: { [key: string]: () => void } = {};

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeParticleTextures();
    this.initializeExplosionSounds();
  }

  private initializeParticleTextures(): void {
    const graphics = this.scene.add.graphics();

    // Create particle textures
    graphics.clear();
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(2, 2, 2);
    graphics.generateTexture('spark', 4, 4);

    graphics.clear();
    graphics.fillStyle(0xffaa00);
    graphics.fillRect(0, 0, 3, 3);
    graphics.generateTexture('debris', 3, 3);

    graphics.clear();
    graphics.fillStyle(0xffff00);
    graphics.fillCircle(1, 1, 1);
    graphics.generateTexture('energy', 2, 2);

    graphics.destroy();
  }

  private initializeExplosionSounds(): void {
    this.explosionSounds = {
      alien: () => this.createAlienExplosionSound(),
      player: () => this.createPlayerExplosionSound(),
      ufo: () => this.createUfoExplosionSound(),
    };
  }

  public createExplosion(config: ExplosionConfig): void {
    switch (config.type) {
      case 'alien':
        this.createAlienExplosion(config);
        break;
      case 'player':
        this.createPlayerExplosion(config);
        break;
      case 'ufo':
        this.createUfoExplosion(config);
        break;
    }

    // Play appropriate sound
    if (this.explosionSounds[config.type]) {
      this.explosionSounds[config.type]();
    }
  }

  private createAlienExplosion(config: ExplosionConfig): void {
    const { x, y, alienType } = config;
    let primaryColor: number;
    let secondaryColor: number;
    let particleCount: number;
    let debrisCount: number;
    let explosionSize: number;

    // Configure explosion based on alien type with distinct colors and effects
    switch (alienType) {
      case AlienType.SQUID:
        primaryColor = 0x00ff00; // Bright Green
        secondaryColor = 0x00aa00; // Dark Green
        particleCount = 12;
        debrisCount = 8;
        explosionSize = 25;
        break;
      case AlienType.CRAB:
        primaryColor = 0xff6600; // Bright Orange
        secondaryColor = 0xcc4400; // Dark Orange/Red
        particleCount = 16;
        debrisCount = 12;
        explosionSize = 30;
        break;
      case AlienType.OCTOPUS:
        primaryColor = 0xff0066; // Bright Pink/Magenta
        secondaryColor = 0xaa0044; // Dark Pink
        particleCount = 20;
        debrisCount = 16;
        explosionSize = 35;
        break;
      default:
        primaryColor = 0xffff00; // Yellow
        secondaryColor = 0xcccc00; // Dark Yellow
        particleCount = 14;
        debrisCount = 10;
        explosionSize = 28;
    }

    // Main explosion flash with primary color
    const flash = this.scene.add.circle(x, y, explosionSize, primaryColor, 0.9);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });

    // Secondary explosion ring with different color
    const secondaryFlash = this.scene.add.circle(
      x,
      y,
      explosionSize * 0.7,
      secondaryColor,
      0.7
    );
    this.scene.tweens.add({
      targets: secondaryFlash,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 250,
      delay: 50,
      ease: 'Power2',
      onComplete: () => secondaryFlash.destroy(),
    });

    // Inner bright white core
    const core = this.scene.add.circle(x, y, explosionSize * 0.3, 0xffffff, 1);
    this.scene.tweens.add({
      targets: core,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      ease: 'Power3',
      onComplete: () => core.destroy(),
    });

    // Enhanced particle burst with primary color
    this.createParticleBurst(x, y, particleCount, primaryColor, 'energy');

    // Additional particle burst with secondary color
    this.createParticleBurst(
      x,
      y,
      particleCount * 0.6,
      secondaryColor,
      'spark'
    );

    // Always create debris particles for all alien types
    this.createAlienDebrisParticles(
      x,
      y,
      debrisCount,
      primaryColor,
      secondaryColor,
      alienType || AlienType.SQUID
    );

    // Create alien-specific additional effects
    this.createAlienSpecificEffects(
      x,
      y,
      alienType || AlienType.SQUID,
      primaryColor,
      secondaryColor
    );

    // Screen shake for larger aliens
    if (alienType === AlienType.OCTOPUS) {
      this.createScreenShake(3, 150);
    } else if (alienType === AlienType.CRAB) {
      this.createScreenShake(2, 100);
    }
  }

  private createPlayerExplosion(config: ExplosionConfig): void {
    const { x, y } = config;

    // Stage 1: Initial white flash
    const initialFlash = this.scene.add.circle(x, y, 40, 0xffffff, 1);
    this.scene.tweens.add({
      targets: initialFlash,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 200,
      ease: 'Power3',
      onComplete: () => initialFlash.destroy(),
    });

    // Stage 2: Red/Orange fire explosion (delayed)
    this.scene.time.delayedCall(100, () => {
      const fireExplosion = this.scene.add.circle(x, y, 35, 0xff4400, 0.8);
      this.scene.tweens.add({
        targets: fireExplosion,
        scaleX: 4,
        scaleY: 4,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => fireExplosion.destroy(),
      });

      // Multiple fire rings
      for (let i = 0; i < 3; i++) {
        this.scene.time.delayedCall(i * 80, () => {
          const ring = this.scene.add.circle(
            x,
            y,
            20 + i * 10,
            0xff6600,
            0.6 - i * 0.2
          );
          this.scene.tweens.add({
            targets: ring,
            scaleX: 3 + i,
            scaleY: 3 + i,
            alpha: 0,
            duration: 300 + i * 100,
            ease: 'Power2',
            onComplete: () => ring.destroy(),
          });
        });
      }
    });

    // Stage 3: Blue energy dissipation (delayed)
    this.scene.time.delayedCall(300, () => {
      const energyRing = this.scene.add.circle(x, y, 25, 0x0088ff, 0.7);
      this.scene.tweens.add({
        targets: energyRing,
        scaleX: 5,
        scaleY: 5,
        alpha: 0,
        duration: 600,
        ease: 'Power1',
        onComplete: () => energyRing.destroy(),
      });
    });

    // Ship debris particles
    this.createShipDebris(x, y);

    // Massive particle burst
    this.createParticleBurst(x, y, 25, 0xff4400, 'spark');
    this.createParticleBurst(x, y, 20, 0xffffff, 'energy');

    // Strong screen shake
    this.createScreenShake(8, 300);

    // Screen flash effect
    this.createScreenFlash();
  }

  private createUfoExplosion(config: ExplosionConfig): void {
    const { x, y } = config;

    // Golden main explosion
    const mainExplosion = this.scene.add.circle(x, y, 45, 0xffdd00, 1);
    this.scene.tweens.add({
      targets: mainExplosion,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => mainExplosion.destroy(),
    });

    // Rainbow sparkle effects
    const colors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 30 + Math.random() * 20;
      const sparkleX = x + Math.cos(angle) * distance;
      const sparkleY = y + Math.sin(angle) * distance;
      const color = colors[i % colors.length];

      const sparkle = this.scene.add.circle(sparkleX, sparkleY, 4, color, 0.9);
      this.scene.tweens.add({
        targets: sparkle,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 400,
        delay: i * 30,
        ease: 'Power2',
        onComplete: () => sparkle.destroy(),
      });
    }

    // Energy waves
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const wave = this.scene.add.circle(x, y, 20, 0xffff00, 0.3);
        this.scene.tweens.add({
          targets: wave,
          scaleX: 6 + i * 2,
          scaleY: 6 + i * 2,
          alpha: 0,
          duration: 400,
          ease: 'Power1',
          onComplete: () => wave.destroy(),
        });
      });
    }

    // Premium particle effects
    this.createParticleBurst(x, y, 30, 0xffdd00, 'spark');
    this.createParticleBurst(x, y, 20, 0xffffff, 'energy');

    // Screen shake and flash
    this.createScreenShake(5, 200);
    this.createScreenFlash(0xffdd00);
  }

  private createParticleBurst(
    x: number,
    y: number,
    count: number,
    color: number,
    texture: string
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 20 + Math.random() * 40;

      const particle = this.scene.add.image(x, y, texture);
      particle.setTint(color);
      particle.setScale(0.5 + Math.random() * 0.5);

      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 300 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private createDebrisParticles(
    x: number,
    y: number,
    count: number,
    color: number
  ): void {
    for (let i = 0; i < count; i++) {
      const debris = this.scene.add.image(x, y, 'debris');
      debris.setTint(color);
      debris.setScale(0.8 + Math.random() * 0.4);

      const angle = Math.random() * Math.PI * 2;
      const distance = 25 + Math.random() * 35;

      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance + Math.random() * 20;

      this.scene.tweens.add({
        targets: debris,
        x: targetX,
        y: targetY,
        rotation: Math.random() * Math.PI * 4,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 400 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => debris.destroy(),
      });
    }
  }

  private createShipDebris(x: number, y: number): void {
    // Create ship-like debris pieces
    const debrisCount = 8;
    for (let i = 0; i < debrisCount; i++) {
      const debris = this.scene.add.rectangle(
        x,
        y,
        3 + Math.random() * 4,
        2 + Math.random() * 3,
        0x00ffff
      );

      const angle = (i / debrisCount) * Math.PI * 2 + Math.random() * 0.8;
      const distance = 40 + Math.random() * 60;

      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance + Math.random() * 30;

      this.scene.tweens.add({
        targets: debris,
        x: targetX,
        y: targetY,
        rotation: Math.random() * Math.PI * 6,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 600 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => debris.destroy(),
      });
    }
  }

  private createAlienDebrisParticles(
    x: number,
    y: number,
    count: number,
    primaryColor: number,
    secondaryColor: number,
    alienType: AlienType
  ): void {
    for (let i = 0; i < count; i++) {
      // Create different shaped debris based on alien type
      let debris: Phaser.GameObjects.Shape;

      if (alienType === AlienType.SQUID) {
        // Squid: Small rectangular tentacle pieces
        debris = this.scene.add.rectangle(
          x,
          y,
          2 + Math.random() * 3,
          4 + Math.random() * 6,
          i % 2 === 0 ? primaryColor : secondaryColor
        );
      } else if (alienType === AlienType.CRAB) {
        // Crab: Claw-like angular pieces
        debris = this.scene.add.triangle(
          x,
          y,
          0,
          0,
          4 + Math.random() * 3,
          2 + Math.random() * 3,
          2 + Math.random() * 2,
          4 + Math.random() * 4,
          i % 2 === 0 ? primaryColor : secondaryColor
        );
      } else {
        // Octopus: Larger, more complex pieces
        debris = this.scene.add.ellipse(
          x,
          y,
          3 + Math.random() * 4,
          2 + Math.random() * 3,
          i % 2 === 0 ? primaryColor : secondaryColor
        );
      }

      debris.setScale(0.8 + Math.random() * 0.6);

      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 50;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance + Math.random() * 25;

      this.scene.tweens.add({
        targets: debris,
        x: targetX,
        y: targetY,
        rotation: Math.random() * Math.PI * 6,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 500 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => debris.destroy(),
      });
    }
  }

  private createAlienSpecificEffects(
    x: number,
    y: number,
    alienType: AlienType,
    primaryColor: number,
    secondaryColor: number
  ): void {
    switch (alienType) {
      case AlienType.SQUID:
        // Squid: Simple energy tendrils
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const tendril = this.scene.add.line(
            x,
            y,
            0,
            0,
            Math.cos(angle) * 15,
            Math.sin(angle) * 15,
            primaryColor
          );
          tendril.setLineWidth(2);

          this.scene.tweens.add({
            targets: tendril,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            delay: i * 50,
            ease: 'Power2',
            onComplete: () => tendril.destroy(),
          });
        }
        break;

      case AlienType.CRAB:
        // Crab: Claw spark effects
        for (let i = 0; i < 6; i++) {
          const spark = this.scene.add.circle(
            x + (Math.random() - 0.5) * 20,
            y + (Math.random() - 0.5) * 20,
            1 + Math.random() * 2,
            i % 2 === 0 ? primaryColor : secondaryColor,
            0.8
          );

          this.scene.tweens.add({
            targets: spark,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 200 + Math.random() * 200,
            delay: i * 30,
            ease: 'Power3',
            onComplete: () => spark.destroy(),
          });
        }
        break;

      case AlienType.OCTOPUS:
        // Octopus: Complex tentacle wave effects
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;

          // Create wavy tentacle effect
          const tentacle = this.scene.add.graphics();
          tentacle.lineStyle(
            2,
            i % 2 === 0 ? primaryColor : secondaryColor,
            0.8
          );
          tentacle.beginPath();
          tentacle.moveTo(x, y);

          for (let j = 1; j <= 5; j++) {
            const waveX = x + Math.cos(angle) * (j * 5) + Math.sin(j) * 3;
            const waveY = y + Math.sin(angle) * (j * 5) + Math.cos(j) * 3;
            tentacle.lineTo(waveX, waveY);
          }
          tentacle.strokePath();

          this.scene.tweens.add({
            targets: tentacle,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 400,
            delay: i * 40,
            ease: 'Power2',
            onComplete: () => tentacle.destroy(),
          });
        }
        break;
    }
  }

  private createScreenShake(intensity: number, duration: number): void {
    this.scene.cameras.main.shake(duration, intensity * 0.01);
  }

  private createScreenFlash(color: number = 0xffffff): void {
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      color,
      0.3
    );
    flash.setDepth(1000);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  private createAlienExplosionSound(): void {
    try {
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        80,
        audioContext.currentTime + 0.2
      );

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  private createPlayerExplosionSound(): void {
    try {
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Multi-stage explosion sound
      const createExplosionStage = (
        frequency: number,
        duration: number,
        delay: number
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
            frequency * 0.3,
            audioContext.currentTime + duration
          );

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2000, audioContext.currentTime);
          filter.frequency.exponentialRampToValueAtTime(
            200,
            audioContext.currentTime + duration
          );

          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + duration
          );

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };

      // Three-stage explosion
      createExplosionStage(200, 0.3, 0);
      createExplosionStage(150, 0.4, 100);
      createExplosionStage(100, 0.5, 200);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  private createUfoExplosionSound(): void {
    try {
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Magical UFO explosion sound
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();

      oscillator1.connect(filter);
      oscillator2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator1.type = 'sine';
      oscillator1.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator1.frequency.exponentialRampToValueAtTime(
        800,
        audioContext.currentTime + 0.2
      );
      oscillator1.frequency.exponentialRampToValueAtTime(
        100,
        audioContext.currentTime + 0.5
      );

      oscillator2.type = 'triangle';
      oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator2.frequency.exponentialRampToValueAtTime(
        1200,
        audioContext.currentTime + 0.2
      );
      oscillator2.frequency.exponentialRampToValueAtTime(
        150,
        audioContext.currentTime + 0.5
      );

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.5);
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  public destroy(): void {
    // Clean up any remaining particles
    this.particlePool.forEach((emitter) => {
      if (emitter && emitter.active) {
        emitter.destroy();
      }
    });
    this.particlePool = [];
  }
}
