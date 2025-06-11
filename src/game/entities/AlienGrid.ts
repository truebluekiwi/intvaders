import * as Phaser from 'phaser';

// Alien types based on original 1978 Space Invaders (4 types + UFO)
export enum AlienType {
  SQUID = 'squid', // Bottom 2 rows - 10 points (numbers 1-2)
  CRAB = 'crab', // Middle 2 rows - 20 points (numbers 3-6)
  OCTOPUS = 'octopus', // Top row - 30 points (numbers 7-9)
  UFO = 'ufo', // Bonus UFO - 50-300 points (number 0)
}

export interface AlienData {
  type: AlienType;
  number: number;
  basePoints: number;
  health: number;
}

export class AlienGrid {
  private scene: Phaser.Scene;
  private aliens: Phaser.Physics.Arcade.Group;
  private ufo: Phaser.Physics.Arcade.Sprite | null = null;
  private moveDirection: number = 1; // 1 for right, -1 for left
  private moveSpeed: number = 50;
  private dropDistance: number = 20;
  private lastMoveTime: number = 0;
  private moveInterval: number = 1000; // milliseconds
  private wave: number;
  private lastUfoTime: number = 0;
  private ufoInterval: number = 25000; // UFO appears every 25 seconds
  private isCalculatingMode: boolean;

  constructor(
    scene: Phaser.Scene,
    wave: number,
    isCalculatingMode: boolean = false
  ) {
    this.scene = scene;
    this.wave = wave;
    this.isCalculatingMode = isCalculatingMode;
    this.aliens = scene.physics.add.group();

    // Adjust difficulty based on wave
    this.moveSpeed = Math.min(200, 50 + wave * 10);
    this.moveInterval = Math.max(300, 1000 - wave * 50);

    this.createGrid();
  }

  private createGrid(): void {
    const startX = 100;
    const startY = 120;
    const spacingX = 55; // Increased by 15% (48 * 1.15 = 55.2)
    const spacingY = 46; // Increased by 15% (40 * 1.15 = 46)
    const cols = 11; // Original had 11 columns
    const rows = 5; // Always 5 rows in original

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;

        // Determine alien type and number based on row (authentic to original)
        const { alienType, alienNumber } = this.getAlienTypeByRow(row, col);

        // Get alien data
        const alienData = this.getAlienData(alienNumber, alienType);

        // Create alien sprite with appropriate type
        const alien = this.scene.physics.add.sprite(
          x,
          y,
          `alien_${alienData.type}`
        );
        alien.setOrigin(0.5, 0.5);
        alien.setImmovable(true);

        // Store alien data for scoring and gameplay
        alien.setData('alienData', alienData);
        alien.setData('health', alienData.health);

        // Add number text overlay only for calculating mode
        if (this.isCalculatingMode) {
          const numberText = this.scene.add.text(
            x,
            y + 15,
            alienNumber.toString(),
            {
              fontSize: '12px',
              color: '#00ff00',
              fontFamily: 'monospace',
              fontStyle: 'bold',
              stroke: '#000000',
              strokeThickness: 2,
            }
          );
          numberText.setOrigin(0.5, 0.5);
          alien.setData('numberText', numberText);
        } else {
          // In standard mode, set numberText to null
          alien.setData('numberText', null);
        }

        this.aliens.add(alien);
      }
    }

    // Initialize UFO timer
    this.lastUfoTime = this.scene.time.now;
  }

  private getAlienTypeByRow(
    row: number,
    col: number
  ): { alienType: AlienType; alienNumber: number } {
    let alienType: AlienType;
    let alienNumber: number;

    // Authentic 1978 Space Invaders layout:
    // Row 0: Octopus (top row) - numbers 7-9
    // Row 1: Crab (upper middle) - numbers 4-6
    // Row 2: Crab (lower middle) - numbers 4-6
    // Row 3: Squid (lower) - numbers 1-3
    // Row 4: Squid (bottom) - numbers 1-3

    switch (row) {
      case 0: // Top row - Octopus
        alienType = AlienType.OCTOPUS;
        alienNumber = 7 + (col % 3); // Numbers 7, 8, 9
        break;
      case 1: // Upper middle - Crab
      case 2: // Lower middle - Crab
        alienType = AlienType.CRAB;
        alienNumber = 4 + (col % 3); // Numbers 4, 5, 6
        break;
      case 3: // Lower - Squid
      case 4: // Bottom - Squid
        alienType = AlienType.SQUID;
        alienNumber = 1 + (col % 3); // Numbers 1, 2, 3
        break;
      default:
        alienType = AlienType.SQUID;
        alienNumber = 1;
    }

    return { alienType, alienNumber };
  }

  private getAlienData(alienNumber: number, alienType: AlienType): AlienData {
    let basePoints: number;
    let health: number = 1; // All aliens have 1 health in classic Space Invaders

    // Authentic 1978 Space Invaders point system
    switch (alienType) {
      case AlienType.SQUID:
        basePoints = 10;
        break;
      case AlienType.CRAB:
        basePoints = 20;
        break;
      case AlienType.OCTOPUS:
        basePoints = 30;
        break;
      case AlienType.UFO:
        basePoints = 50; // Base UFO points (can be 50, 100, 150, 200, 250, 300)
        break;
      default:
        basePoints = 10;
    }

    return {
      type: alienType,
      number: alienNumber,
      basePoints,
      health,
    };
  }

  public getAlienScore(
    alien: Phaser.Physics.Arcade.Sprite,
    isCalculatingMode: boolean = false
  ): number {
    const alienData = alien.getData('alienData') as AlienData;
    let score = alienData.basePoints;

    // Special UFO scoring (random bonus points)
    if (alienData.type === AlienType.UFO) {
      const bonusMultipliers = [1, 2, 3, 4, 5, 6]; // 50, 100, 150, 200, 250, 300
      score = 50 * Phaser.Utils.Array.GetRandom(bonusMultipliers);
    } else {
      // Apply wave multiplier for regular aliens
      score *= this.wave;
    }

    // Bonus for mathematical mode
    if (isCalculatingMode) {
      score = Math.floor(score * 1.5); // 50% bonus for calculation kills
    }

    return score;
  }

  startMovement(): void {
    this.lastMoveTime = this.scene.time.now;
  }

  update(): void {
    if (this.scene.time.now - this.lastMoveTime > this.moveInterval) {
      this.moveGrid();
      this.lastMoveTime = this.scene.time.now;
    }

    // Handle UFO spawning
    this.updateUfo();
  }

  private updateUfo(): void {
    // Spawn UFO periodically
    if (
      !this.ufo &&
      this.scene.time.now - this.lastUfoTime > this.ufoInterval
    ) {
      this.spawnUfo();
      this.lastUfoTime = this.scene.time.now;
    }

    // Move UFO across screen
    if (this.ufo && this.ufo.active) {
      this.ufo.x += 2; // UFO moves slowly across screen

      // Remove UFO when it goes off screen
      if (this.ufo.x > this.scene.cameras.main.width + 50) {
        const numberText = this.ufo.getData(
          'numberText'
        ) as Phaser.GameObjects.Text;
        if (numberText) {
          numberText.destroy();
        }
        this.ufo.destroy();
        this.ufo = null;
      } else {
        // Update UFO number text position
        const numberText = this.ufo.getData(
          'numberText'
        ) as Phaser.GameObjects.Text;
        if (numberText) {
          numberText.x = this.ufo.x;
        }
      }
    }
  }

  private spawnUfo(): void {
    const y = 50; // UFO appears at top of screen
    const x = -50; // Start off-screen left

    const alienData = this.getAlienData(0, AlienType.UFO);

    this.ufo = this.scene.physics.add.sprite(x, y, 'alien_ufo');
    this.ufo.setOrigin(0.5, 0.5);
    this.ufo.setImmovable(true);

    // Store alien data
    this.ufo.setData('alienData', alienData);
    this.ufo.setData('health', alienData.health);

    // Add number text only for calculating mode
    if (this.isCalculatingMode) {
      const numberText = this.scene.add.text(x, y + 15, '0', {
        fontSize: '12px',
        color: '#ffff00', // Yellow for UFO
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      });
      numberText.setOrigin(0.5, 0.5);
      this.ufo.setData('numberText', numberText);
    } else {
      // In standard mode, set numberText to null
      this.ufo.setData('numberText', null);
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

  destroyAlien(alien: Phaser.Physics.Arcade.Sprite): number {
    const health = alien.getData('health') as number;
    const newHealth = health - 1;

    if (newHealth <= 0) {
      // Destroy the alien completely
      const numberText = alien.getData('numberText') as Phaser.GameObjects.Text;
      if (numberText) {
        numberText.destroy();
      }

      // Get score before destroying
      const score = this.getAlienScore(alien);

      // Check if this is the UFO
      const alienData = alien.getData('alienData') as AlienData;
      if (alienData.type === AlienType.UFO) {
        this.ufo = null; // Clear UFO reference
      }

      alien.destroy();
      return score;
    } else {
      // Reduce health and change appearance (for future multi-hit aliens)
      alien.setData('health', newHealth);
      alien.setTint(0xff0000); // Red tint to show damage

      // Flash effect
      this.scene.time.delayedCall(200, () => {
        if (alien.active) {
          alien.clearTint();
        }
      });

      return 0; // No score for partial damage
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

  getUfo(): Phaser.Physics.Arcade.Sprite | null {
    return this.ufo;
  }

  clearUfo(): void {
    this.ufo = null;
  }

  getAlienByNumber(number: number): Phaser.Physics.Arcade.Sprite | null {
    let foundAlien: Phaser.Physics.Arcade.Sprite | null = null;

    // Check regular aliens
    this.aliens.children.entries.forEach((alien) => {
      const sprite = alien as Phaser.Physics.Arcade.Sprite;
      const alienData = sprite.getData('alienData') as AlienData;
      if (alienData.number === number && !foundAlien) {
        foundAlien = sprite;
      }
    });

    // Check UFO if looking for number 0
    if (!foundAlien && number === 0 && this.ufo && this.ufo.active) {
      foundAlien = this.ufo;
    }

    return foundAlien;
  }

  // Get aliens by type for special targeting
  getAliensByType(type: AlienType): Phaser.Physics.Arcade.Sprite[] {
    const aliensOfType: Phaser.Physics.Arcade.Sprite[] = [];

    this.aliens.children.entries.forEach((alien) => {
      const sprite = alien as Phaser.Physics.Arcade.Sprite;
      const alienData = sprite.getData('alienData') as AlienData;
      if (alienData.type === type) {
        aliensOfType.push(sprite);
      }
    });

    // Include UFO if requested
    if (type === AlienType.UFO && this.ufo && this.ufo.active) {
      aliensOfType.push(this.ufo);
    }

    return aliensOfType;
  }

  // Get total remaining aliens by type for statistics
  getAlienCountByType(): { [key in AlienType]: number } {
    const counts = {
      [AlienType.SQUID]: 0,
      [AlienType.CRAB]: 0,
      [AlienType.OCTOPUS]: 0,
      [AlienType.UFO]: 0,
    };

    this.aliens.children.entries.forEach((alien) => {
      const sprite = alien as Phaser.Physics.Arcade.Sprite;
      const alienData = sprite.getData('alienData') as AlienData;
      counts[alienData.type]++;
    });

    // Count UFO if active
    if (this.ufo && this.ufo.active) {
      counts[AlienType.UFO] = 1;
    }

    return counts;
  }
}
