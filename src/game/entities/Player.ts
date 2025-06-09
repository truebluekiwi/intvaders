import * as Phaser from 'phaser';
import { ArmorShield } from './ArmorShield';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private speed: number = 200;
  private gameScene: Phaser.Scene;
  private spawnX: number;
  private spawnY: number;
  private isInvincible: boolean = false;
  private flashTimer: Phaser.Time.TimerEvent | null = null;
  private haloEffect: Phaser.GameObjects.Arc | null = null;
  private haloTween: Phaser.Tweens.Tween | null = null;
  private haloParticles: Phaser.GameObjects.Arc[] = [];
  private armorShield: ArmorShield;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    this.gameScene = scene;
    this.spawnX = x;
    this.spawnY = y;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Ensure physics body is created
    if (this.body) {
      // Set physics properties
      this.setCollideWorldBounds(true);
      this.setImmovable(true);
    }

    // Set origin to center
    this.setOrigin(0.5, 0.5);

    // Initialize armor shield
    this.armorShield = new ArmorShield(scene, this);
  }

  update(): void {
    // Update armor shield
    this.armorShield.update();
  }

  moveLeft(): void {
    if (this.body) {
      this.setVelocityX(-this.speed);
    }
  }

  moveRight(): void {
    if (this.body) {
      this.setVelocityX(this.speed);
    }
  }

  stopMovement(): void {
    if (this.body) {
      this.setVelocityX(0);
    }
  }

  takeDamage(): void {
    // Ensure player remains visible and active
    this.setVisible(true);
    this.setActive(true);
    this.setAlpha(1);

    // Ensure physics body remains enabled
    if (this.body) {
      this.body.enable = true;
    }

    // Flash effect when taking damage (armor absorbed the hit)
    this.setTint(0xff0000);
    this.gameScene.time.delayedCall(100, () => {
      this.clearTint();
      // Ensure player is still visible after tint clears
      this.setVisible(true);
      this.setActive(true);
      this.setAlpha(1);

      // Ensure physics body remains enabled
      if (this.body) {
        this.body.enable = true;
      }
    });

    // Brief invincibility period when taking armor damage (0.5 seconds)
    // Set invincibility directly without triggering halo effects
    this.isInvincible = true;
    this.gameScene.time.delayedCall(500, () => {
      this.isInvincible = false;
    });
  }

  reset(): void {
    // Clear any existing flash timer
    if (this.flashTimer) {
      this.flashTimer.destroy();
      this.flashTimer = null;
    }

    // Clear any existing halo effects
    this.clearHaloEffect();

    // Reset position to spawn point
    this.setPosition(this.spawnX, this.spawnY);

    // Ensure player is visible and normal first
    this.clearTint();
    this.setAlpha(1);
    this.setVisible(true);
    this.setActive(true);

    // Recreate physics body if needed
    if (!this.body) {
      this.gameScene.physics.add.existing(this);
    }

    // Ensure physics body is properly enabled and configured
    if (this.body) {
      this.setVelocity(0, 0);
      this.body.enable = true;

      // Re-enable physics properties only if body exists
      this.setCollideWorldBounds(true);
      this.setImmovable(true);

      // Ensure body is properly sized and positioned
      this.body.setSize(this.width, this.height);
      this.refreshBody();
    }

    // Brief invincibility period (2 seconds) with visual halo effect
    this.setInvincible(true);
    this.createHaloEffect();

    // Timer to end invincibility and remove halo
    this.flashTimer = this.gameScene.time.delayedCall(2000, () => {
      this.setInvincible(false);
      this.clearHaloEffect();
      this.clearTint();
      this.flashTimer = null;
    });
  }

  setInvincible(invincible: boolean): void {
    this.isInvincible = invincible;
  }

  getIsInvincible(): boolean {
    return this.isInvincible;
  }

  public startInvincibilityWithHalo(): void {
    // Clear any existing effects first
    this.clearHaloEffect();
    if (this.flashTimer) {
      this.flashTimer.destroy();
      this.flashTimer = null;
    }

    // Start invincibility with visual halo effect
    this.setInvincible(true);
    this.createHaloEffect();

    // Timer to end invincibility and remove halo
    this.flashTimer = this.gameScene.time.delayedCall(2000, () => {
      this.setInvincible(false);
      this.clearHaloEffect();
      this.clearTint();
      this.flashTimer = null;
    });
  }

  private createHaloEffect(): void {
    // Create main halo ring
    this.haloEffect = this.gameScene.add.arc(
      this.x,
      this.y,
      40, // radius
      0, // start angle
      360, // end angle
      false, // closed path
      0x00ffff, // cyan color
      0.8 // higher alpha for visibility
    );
    this.haloEffect.setStrokeStyle(4, 0x00ffff, 1.0); // Thicker, more visible stroke
    this.haloEffect.setDepth(100); // High depth to ensure visibility

    // Create pulsing animation for main halo
    this.haloTween = this.gameScene.tweens.add({
      targets: this.haloEffect,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.4,
      duration: 600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Create orbiting particles around the halo
    this.createHaloParticles();

    // Update halo position to follow player
    this.gameScene.time.addEvent({
      delay: 16, // ~60fps
      callback: this.updateHaloPosition,
      callbackScope: this,
      loop: true,
    });
  }

  private createHaloParticles(): void {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 45;

      const particle = this.gameScene.add.arc(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance,
        3, // small radius
        0,
        360,
        false,
        0xffffff, // white color
        0.8
      );
      particle.setDepth(this.depth - 1);

      this.haloParticles.push(particle);

      // Create orbiting animation for each particle
      this.gameScene.tweens.add({
        targets: particle,
        angle: angle + Math.PI * 2, // Full rotation
        duration: 2000 + i * 100, // Staggered timing
        ease: 'Linear',
        repeat: -1,
        onUpdate: () => {
          if (particle.active) {
            const currentAngle = particle.angle;
            particle.setPosition(
              this.x + Math.cos(currentAngle) * distance,
              this.y + Math.sin(currentAngle) * distance
            );
          }
        },
      });

      // Pulsing effect for particles
      this.gameScene.tweens.add({
        targets: particle,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0.4,
        duration: 600 + i * 50,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private updateHaloPosition(): void {
    if (this.haloEffect && this.haloEffect.active) {
      this.haloEffect.setPosition(this.x, this.y);
    }

    // Update particle positions to follow player
    this.haloParticles.forEach((particle, index) => {
      if (particle && particle.active) {
        const angle = (index / this.haloParticles.length) * Math.PI * 2;
        const distance = 45;
        const currentAngle = angle + this.gameScene.time.now * 0.002; // Continuous rotation
        particle.setPosition(
          this.x + Math.cos(currentAngle) * distance,
          this.y + Math.sin(currentAngle) * distance
        );
      }
    });
  }

  private clearHaloEffect(): void {
    // Stop and destroy main halo tween
    if (this.haloTween) {
      this.haloTween.destroy();
      this.haloTween = null;
    }

    // Destroy main halo effect
    if (this.haloEffect) {
      this.haloEffect.destroy();
      this.haloEffect = null;
    }

    // Destroy all halo particles
    this.haloParticles.forEach((particle) => {
      if (particle && particle.active) {
        particle.destroy();
      }
    });
    this.haloParticles = [];
  }

  // Armor shield methods
  updateArmorShield(armor: number): void {
    this.armorShield.updateArmor(armor);
  }

  showArmorHitEffect(): void {
    this.armorShield.showHitEffect();
  }

  showArmorGainEffect(armorGained: number): void {
    this.armorShield.showArmorGainEffect(armorGained);
  }

  destroy(): void {
    // Clean up armor shield
    if (this.armorShield) {
      this.armorShield.destroy();
    }

    // Clean up halo effects
    this.clearHaloEffect();

    // Clean up flash timer when destroying player
    if (this.flashTimer) {
      this.flashTimer.destroy();
      this.flashTimer = null;
    }
    super.destroy();
  }
}
