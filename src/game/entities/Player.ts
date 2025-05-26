import * as Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private speed: number = 200;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set physics properties
    this.setCollideWorldBounds(true);
    this.setImmovable(true);
    
    // Set origin to center
    this.setOrigin(0.5, 0.5);
  }

  update(): void {
    // Player update logic (if needed)
  }

  moveLeft(): void {
    this.setVelocityX(-this.speed);
  }

  moveRight(): void {
    this.setVelocityX(this.speed);
  }

  stopMovement(): void {
    this.setVelocityX(0);
  }

  takeDamage(): void {
    // Flash effect when taking damage
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
  }
}
