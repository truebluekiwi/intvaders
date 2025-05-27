import * as Phaser from 'phaser';

export class AlienGrid {
  private scene: Phaser.Scene;
  private aliens: Phaser.Physics.Arcade.Group;
  private moveDirection: number = 1; // 1 for right, -1 for left
  private moveSpeed: number = 50;
  private dropDistance: number = 20;
  private lastMoveTime: number = 0;
  private moveInterval: number = 1000; // milliseconds

  constructor(scene: Phaser.Scene, wave: number) {
    this.scene = scene;
    this.aliens = scene.physics.add.group();

    // Adjust difficulty based on wave
    this.moveSpeed = Math.min(200, 50 + wave * 10);
    this.moveInterval = Math.max(300, 1000 - wave * 50);

    this.createGrid(wave);
  }

  private createGrid(wave: number): void {
    const startX = 100;
    const startY = 100;
    const spacingX = 50;
    const spacingY = 40;
    const cols = 10;
    const rows = Math.min(5, 2 + Math.floor(wave / 3)); // More rows as waves progress

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;

        // Determine alien number (1-9) based on position and wave
        const alienNumber = ((row * cols + col) % 9) + 1;

        const alien = this.scene.physics.add.sprite(
          x,
          y,
          `alien${alienNumber}`
        );
        alien.setOrigin(0.5, 0.5);
        alien.setImmovable(true);

        // Store alien number as data for scoring
        alien.setData('number', alienNumber);
        alien.setData('health', this.getAlienHealth(alienNumber));

        // Add number text overlay
        const numberText = this.scene.add.text(x, y, alienNumber.toString(), {
          fontSize: '14px',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold',
        });
        numberText.setOrigin(0.5, 0.5);
        alien.setData('numberText', numberText);

        this.aliens.add(alien);
      }
    }
  }

  private getAlienHealth(alienNumber: number): number {
    // Health based on alien number as per game design
    if (alienNumber <= 3) return 1;
    if (alienNumber <= 6) return 2;
    return 3; // 7-9
  }

  startMovement(): void {
    this.lastMoveTime = this.scene.time.now;
  }

  update(): void {
    if (this.scene.time.now - this.lastMoveTime > this.moveInterval) {
      this.moveGrid();
      this.lastMoveTime = this.scene.time.now;
    }
  }

  private moveGrid(): void {
    let shouldDrop = false;

    // Check if any alien has reached the edge
    this.aliens.children.entries.forEach((alien) => {
      const sprite = alien as Phaser.Physics.Arcade.Sprite;
      if (
        this.moveDirection > 0 &&
        sprite.x > this.scene.cameras.main.width - 50
      ) {
        shouldDrop = true;
      } else if (this.moveDirection < 0 && sprite.x < 50) {
        shouldDrop = true;
      }
    });

    if (shouldDrop) {
      // Drop down and reverse direction
      this.moveDirection *= -1;
      this.aliens.children.entries.forEach((alien) => {
        const sprite = alien as Phaser.Physics.Arcade.Sprite;
        sprite.y += this.dropDistance;

        // Update number text position
        const numberText = sprite.getData(
          'numberText'
        ) as Phaser.GameObjects.Text;
        if (numberText) {
          numberText.y += this.dropDistance;
        }
      });
    } else {
      // Move horizontally
      this.aliens.children.entries.forEach((alien) => {
        const sprite = alien as Phaser.Physics.Arcade.Sprite;
        sprite.x += this.moveSpeed * this.moveDirection * 0.1;

        // Update number text position
        const numberText = sprite.getData(
          'numberText'
        ) as Phaser.GameObjects.Text;
        if (numberText) {
          numberText.x += this.moveSpeed * this.moveDirection * 0.1;
        }
      });
    }
  }

  destroyAlien(alien: Phaser.Physics.Arcade.Sprite): void {
    const health = alien.getData('health') as number;
    const newHealth = health - 1;

    if (newHealth <= 0) {
      // Destroy the alien completely
      const numberText = alien.getData('numberText') as Phaser.GameObjects.Text;
      if (numberText) {
        numberText.destroy();
      }
      alien.destroy();
    } else {
      // Reduce health and change appearance
      alien.setData('health', newHealth);
      alien.setTint(0xff0000); // Red tint to show damage

      // Flash effect
      this.scene.time.delayedCall(200, () => {
        if (alien.active) {
          alien.clearTint();
        }
      });
    }
  }

  isEmpty(): boolean {
    return this.aliens.children.size === 0;
  }

  hasReachedBottom(): boolean {
    let reachedBottom = false;
    this.aliens.children.entries.forEach((alien) => {
      const sprite = alien as Phaser.Physics.Arcade.Sprite;
      if (sprite.y > this.scene.cameras.main.height - 100) {
        reachedBottom = true;
      }
    });
    return reachedBottom;
  }

  getAliens(): Phaser.Physics.Arcade.Group {
    return this.aliens;
  }

  getAlienByNumber(number: number): Phaser.Physics.Arcade.Sprite | null {
    let foundAlien: Phaser.Physics.Arcade.Sprite | null = null;

    this.aliens.children.entries.forEach((alien) => {
      const sprite = alien as Phaser.Physics.Arcade.Sprite;
      if (sprite.getData('number') === number && !foundAlien) {
        foundAlien = sprite;
      }
    });

    return foundAlien;
  }
}
