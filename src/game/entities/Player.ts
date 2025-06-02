import * as Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private speed: number = 200;
  private gameScene: Phaser.Scene;
  private spawnX: number;
  private spawnY: number;
  private isInvincible: boolean = false;
  private flashTimer: Phaser.Time.TimerEvent | null = null;

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
  }

  update(): void {
    // Player update logic (if needed)
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
    // Flash effect when taking damage
    this.setTint(0xff0000);
    this.gameScene.time.delayedCall(100, () => {
      this.clearTint();
    });
  }

  reset(): void {
    // Clear any existing flash timer
    if (this.flashTimer) {
      this.flashTimer.destroy();
      this.flashTimer = null;
    }

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

    // Brief invincibility period (2 seconds)
    this.setInvincible(true);

    // Simple timer to end invincibility without visual effects
    this.flashTimer = this.gameScene.time.delayedCall(2000, () => {
      this.setInvincible(false);
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

  destroy(): void {
    // Clean up flash timer when destroying player
    if (this.flashTimer) {
      this.flashTimer.destroy();
      this.flashTimer = null;
    }
    super.destroy();
  }
}
