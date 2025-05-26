import * as Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet');
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set physics properties
    this.setActive(false);
    this.setVisible(false);
    
    // Set origin to center
    this.setOrigin(0.5, 0.5);
  }

  fire(velocityY: number): void {
    this.setActive(true);
    this.setVisible(true);
    this.setVelocityY(velocityY);
    this.setVelocityX(0);
  }

  update(): void {
    // Destroy bullet if it goes off screen
    if (this.y < -10 || this.y > this.scene.cameras.main.height + 10) {
      this.destroy();
    }
  }

  destroy(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    super.destroy();
  }
}
