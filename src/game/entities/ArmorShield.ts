import * as Phaser from 'phaser';

export class ArmorShield {
  private scene: Phaser.Scene;
  private player: Phaser.GameObjects.Sprite;
  private shieldRing: Phaser.GameObjects.Arc | null = null;
  private shieldGlow: Phaser.GameObjects.Arc | null = null;
  private shieldParticles: Phaser.GameObjects.Particles.ParticleEmitter | null =
    null;
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private currentArmor: number = 0;
  private isVisible: boolean = false;

  constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Sprite) {
    this.scene = scene;
    this.player = player;
  }

  updateArmor(armor: number): void {
    this.currentArmor = armor;

    if (armor > 0) {
      if (!this.isVisible) {
        this.createShield();
      }
      this.updateShieldAppearance();
    } else {
      this.destroyShield();
    }
  }

  private createShield(): void {
    if (this.isVisible) return;

    // Create main shield ring
    this.shieldRing = this.scene.add.arc(
      this.player.x,
      this.player.y,
      35, // radius
      0, // start angle
      360, // end angle
      false, // closed path
      0x00ffff, // base color
      0.6 // alpha
    );
    this.shieldRing.setStrokeStyle(3, 0x00ffff, 0.8);
    this.shieldRing.setDepth(this.player.depth - 1);

    // Create outer glow effect
    this.shieldGlow = this.scene.add.arc(
      this.player.x,
      this.player.y,
      40, // slightly larger radius
      0,
      360,
      false,
      0x00ffff,
      0.3
    );
    this.shieldGlow.setStrokeStyle(6, 0x00ffff, 0.4);
    this.shieldGlow.setDepth(this.player.depth - 2);

    // Create subtle pulsing animation
    this.pulseTween = this.scene.tweens.add({
      targets: [this.shieldRing, this.shieldGlow],
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.4,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.isVisible = true;
  }

  private updateShieldAppearance(): void {
    if (!this.shieldRing || !this.shieldGlow) return;

    // Determine shield color based on armor level
    let shieldColor: number;
    let alpha: number;

    if (this.currentArmor >= 50) {
      shieldColor = 0x00ff00; // Green for high armor
      alpha = 0.8;
    } else if (this.currentArmor >= 20) {
      shieldColor = 0xffff00; // Yellow for medium armor
      alpha = 0.7;
    } else {
      shieldColor = 0xff4444; // Red for low armor
      alpha = 0.6;
    }

    // Update colors
    this.shieldRing.setFillStyle(shieldColor, alpha * 0.6);
    this.shieldRing.setStrokeStyle(3, shieldColor, alpha);
    this.shieldGlow.setFillStyle(shieldColor, alpha * 0.3);
    this.shieldGlow.setStrokeStyle(6, shieldColor, alpha * 0.4);

    // Update position to follow player
    this.shieldRing.setPosition(this.player.x, this.player.y);
    this.shieldGlow.setPosition(this.player.x, this.player.y);
  }

  showHitEffect(): void {
    if (!this.shieldRing || !this.shieldGlow) return;

    // Create impact flash
    const impactFlash = this.scene.add.arc(
      this.player.x,
      this.player.y,
      45,
      0,
      360,
      false,
      0xffffff,
      0.9
    );
    impactFlash.setDepth(this.player.depth + 1);

    // Flash animation
    this.scene.tweens.add({
      targets: impactFlash,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      ease: 'Power2',
      onComplete: () => impactFlash.destroy(),
    });

    // Shield ripple effect
    this.scene.tweens.add({
      targets: [this.shieldRing, this.shieldGlow],
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      ease: 'Back.easeOut',
      yoyo: true,
    });

    // Create impact particles
    this.createImpactParticles();

    // Screen shake effect (with safety check)
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.shake(100, 0.01);
    }
  }

  private createImpactParticles(): void {
    // Create temporary particle emitter for impact
    const particles = this.scene.add.particles(
      this.player.x,
      this.player.y,
      'bullet',
      {
        speed: { min: 50, max: 150 },
        scale: { start: 0.3, end: 0 },
        lifespan: 300,
        quantity: 8,
        tint: this.getCurrentShieldColor(),
      }
    );

    // Clean up particles after emission
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  private getCurrentShieldColor(): number {
    if (this.currentArmor >= 50) return 0x00ff00;
    if (this.currentArmor >= 20) return 0xffff00;
    return 0xff4444;
  }

  showArmorGainEffect(armorGained: number): void {
    // Create floating text showing armor gained
    const gainText = this.scene.add.text(
      this.player.x,
      this.player.y - 30,
      `+${armorGained} Armor`,
      {
        fontSize: '14px',
        color: '#00ff00',
        fontFamily: 'Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    gainText.setOrigin(0.5);
    gainText.setDepth(this.player.depth + 2);

    // Animate floating text
    this.scene.tweens.add({
      targets: gainText,
      y: gainText.y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => gainText.destroy(),
    });

    // Shield strengthening effect
    if (this.shieldRing && this.shieldGlow) {
      this.scene.tweens.add({
        targets: [this.shieldRing, this.shieldGlow],
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 1,
        duration: 300,
        ease: 'Back.easeOut',
        yoyo: true,
      });
    }
  }

  showShieldBreakEffect(): void {
    if (!this.shieldRing || !this.shieldGlow) return;

    // Create shattering effect
    const shatterParticles = this.scene.add.particles(
      this.player.x,
      this.player.y,
      'bullet',
      {
        speed: { min: 100, max: 200 },
        scale: { start: 0.4, end: 0.1 },
        lifespan: 600,
        quantity: 12,
        tint: 0xff4444,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 35),
          quantity: 12,
        },
      }
    );

    // Screen shake for dramatic effect (with safety check)
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.shake(200, 0.02);
    }

    // Clean up particles
    this.scene.time.delayedCall(800, () => {
      shatterParticles.destroy();
    });
  }

  update(): void {
    if (this.isVisible && this.shieldRing && this.shieldGlow) {
      // Update position to follow player
      this.shieldRing.setPosition(this.player.x, this.player.y);
      this.shieldGlow.setPosition(this.player.x, this.player.y);
    }
  }

  private destroyShield(): void {
    if (!this.isVisible) return;

    // Show break effect before destroying
    this.showShieldBreakEffect();

    // Stop pulsing animation
    if (this.pulseTween) {
      this.pulseTween.destroy();
      this.pulseTween = null;
    }

    // Fade out and destroy shield elements
    const elementsToDestroy = [this.shieldRing, this.shieldGlow].filter(
      Boolean
    );

    if (elementsToDestroy.length > 0) {
      this.scene.tweens.add({
        targets: elementsToDestroy,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          elementsToDestroy.forEach((element) => element?.destroy());
        },
      });
    }

    this.shieldRing = null;
    this.shieldGlow = null;
    this.isVisible = false;
  }

  destroy(): void {
    this.destroyShield();
    if (this.shieldParticles) {
      this.shieldParticles.destroy();
      this.shieldParticles = null;
    }
  }
}
