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
    let health: number;

    // Authentic 1978 Space Invaders point system with new health system
    switch (alienType) {
      case AlienType.SQUID:
        basePoints = 10;
        health = this.getMaxHealthForAlienType(AlienType.SQUID);
        break;
      case AlienType.CRAB:
        basePoints = 20;
        health = this.getMaxHealthForAlienType(AlienType.CRAB);
        break;
      case AlienType.OCTOPUS:
        basePoints = 30;
        health = this.getMaxHealthForAlienType(AlienType.OCTOPUS);
        break;
      case AlienType.UFO:
        basePoints = 50; // Base UFO points (can be 50, 100, 150, 200, 250, 300)
        health = this.getMaxHealthForAlienType(AlienType.UFO);
        break;
      default:
        basePoints = 10;
        health = 1;
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

  destroyAlien(
    alien: Phaser.Physics.Arcade.Sprite,
    damage: number = 1
  ): number {
    const health = alien.getData('health') as number;
    const alienData = alien.getData('alienData') as AlienData;
    const maxHealth = this.getMaxHealthForAlienType(alienData.type);
    const newHealth = Math.max(0, health - damage);

    // CRITICAL DEBUG: Log every damage calculation
    console.log('=== ALIEN DAMAGE DEBUG ===');
    console.log(`Alien Type: ${alienData.type}`);
    console.log(`Max Health: ${maxHealth}`);
    console.log(`Current Health: ${health}`);
    console.log(`Damage Applied: ${damage}`);
    console.log(`New Health: ${newHealth}`);
    console.log(
      `Health Percentage: ${((newHealth / maxHealth) * 100).toFixed(1)}%`
    );
    console.log(`Alien Visible Before: ${alien.visible}`);
    console.log(`Alien Active Before: ${alien.active}`);
    console.log(`Alien Alpha Before: ${alien.alpha}`);

    if (newHealth <= 0) {
      console.log('ALIEN DESTROYED - Health reached 0');

      // Clean up all associated objects
      const numberText = alien.getData('numberText') as Phaser.GameObjects.Text;
      if (numberText) {
        numberText.destroy();
      }

      // Get score before destroying
      const score = this.getAlienScore(alien);

      // Check if this is the UFO
      if (alienData.type === AlienType.UFO) {
        this.ufo = null; // Clear UFO reference
      }

      alien.destroy();
      return score;
    } else {
      console.log('ALIEN DAMAGED - Applying damage state');

      // Reduce health and show damage state
      alien.setData('health', newHealth);

      // CRITICAL DEBUG: Check alien state before damage visualization
      console.log(`Alien state before showAlienDamageState:`);
      console.log(`  - visible: ${alien.visible}`);
      console.log(`  - active: ${alien.active}`);
      console.log(`  - alpha: ${alien.alpha}`);
      console.log(`  - scale: ${alien.scaleX}, ${alien.scaleY}`);

      this.showAlienDamageState(alien, newHealth);

      // CRITICAL DEBUG: Check alien state after damage visualization
      console.log(`Alien state after showAlienDamageState:`);
      console.log(`  - visible: ${alien.visible}`);
      console.log(`  - active: ${alien.active}`);
      console.log(`  - alpha: ${alien.alpha}`);
      console.log(`  - scale: ${alien.scaleX}, ${alien.scaleY}`);
      console.log('=== END ALIEN DAMAGE DEBUG ===');

      return 0; // No score for partial damage
    }
  }

  private showAlienDamageState(
    alien: Phaser.Physics.Arcade.Sprite,
    health: number
  ): void {
    const alienData = alien.getData('alienData') as AlienData;
    const maxHealth = this.getMaxHealthForAlienType(alienData.type);
    const healthPercent = health / maxHealth;

    // SAFE FIX: Kill ALL tweens and effects to prevent ANY interference
    this.scene.tweens.killTweensOf(alien);

    // SAFE FIX: Force alien to be completely visible and stable
    alien.setVisible(true);
    alien.setActive(true);
    alien.setAlpha(1.0);
    alien.setScale(1.0);

    // Clear any existing tint first
    alien.clearTint();

    // DRAMATIC VISUAL SYSTEM: Applied to ALL alien types for maximum visibility
    console.log(`🎆 ${alienData.type.toUpperCase()} DRAMATIC EFFECTS DEBUG:`);
    console.log(`  - Health Percent: ${(healthPercent * 100).toFixed(1)}%`);
    console.log(`  - Current Health: ${health}`);
    console.log(`  - Max Health: ${maxHealth}`);

    if (healthPercent <= 0.25) {
      // CRITICAL: Massive scale + rapid flashing + bright white
      alien.setTint(0xffffff);
      alien.setScale(1.5); // 50% larger

      // Rapid flashing effect
      this.scene.tweens.add({
        targets: alien,
        alpha: { from: 1.0, to: 0.3 },
        duration: 150,
        ease: 'Power2',
        yoyo: true,
        repeat: -1,
      });

      console.log('  - Applied CRITICAL: 1.5x scale + rapid flashing + white');
    } else if (healthPercent <= 0.5) {
      // MODERATE: Large scale + slow pulsing + bright yellow
      alien.setTint(0xffff00);
      alien.setScale(1.3); // 30% larger

      // Slow pulsing effect
      this.scene.tweens.add({
        targets: alien,
        scaleX: { from: 1.3, to: 1.4 },
        scaleY: { from: 1.3, to: 1.4 },
        duration: 400,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      console.log('  - Applied MODERATE: 1.3x scale + pulsing + yellow');
    } else if (healthPercent <= 0.75) {
      // LIGHT: Medium scale + gentle glow + bright orange
      alien.setTint(0xff4000);
      alien.setScale(1.15); // 15% larger

      // Gentle glow effect
      this.scene.tweens.add({
        targets: alien,
        alpha: { from: 1.0, to: 0.8 },
        duration: 600,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      console.log('  - Applied LIGHT: 1.15x scale + glow + orange');
    } else if (healthPercent < 1.0) {
      // FIRST HIT: Slight scale + bright magenta
      alien.setTint(0xff00ff);
      alien.setScale(1.1); // 10% larger

      console.log('  - Applied FIRST HIT: 1.1x scale + magenta');
    } else {
      console.log('  - No effects applied (full health)');
    }

    // Create damage indicator particles for ALL aliens
    this.createAlienDamageParticles(alien, healthPercent);

    console.log(`  - Final scale: ${alien.scaleX}`);
    console.log(`  - Final tint: 0x${alien.tintTopLeft.toString(16)}`);
    console.log(`  - Alien visible: ${alien.visible}`);
    console.log(`  - Alien alpha: ${alien.alpha}`);

    // Store the damage state
    alien.setData(
      'damageState',
      healthPercent <= 0.25
        ? 'critical'
        : healthPercent <= 0.5
          ? 'moderate'
          : healthPercent <= 0.75
            ? 'light'
            : 'healthy'
    );

    console.log(
      `DAMAGE STATE: ${alien.getData('damageState')} (${(healthPercent * 100).toFixed(1)}% health)`
    );
  }

  private createAlienDamageParticles(
    alien: Phaser.Physics.Arcade.Sprite,
    healthPercent: number
  ): void {
    const particleCount =
      healthPercent <= 0.25 ? 8 : healthPercent <= 0.5 ? 5 : 3;
    const particleColor =
      healthPercent <= 0.25
        ? 0xffffff
        : healthPercent <= 0.5
          ? 0xffff00
          : 0xff4000;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 25 + Math.random() * 15;

      const particle = this.scene.add.circle(
        alien.x + Math.cos(angle) * distance,
        alien.y + Math.sin(angle) * distance,
        2 + Math.random() * 2,
        particleColor,
        0.8
      );

      // Animate particles
      this.scene.tweens.add({
        targets: particle,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        x: particle.x + Math.cos(angle) * 20,
        y: particle.y + Math.sin(angle) * 20,
        duration: 800,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private getMaxHealthForAlienType(type: AlienType): number {
    switch (type) {
      case AlienType.SQUID:
        return 2; // Requires 2 base firepower shots
      case AlienType.CRAB:
        return 3; // Requires 3 base firepower shots
      case AlienType.OCTOPUS:
        return 4; // Requires 4 base firepower shots
      case AlienType.UFO:
        return 1; // UFO always dies in 1 hit
      default:
        return 1;
    }
  }

  private createDamageSparks(x: number, y: number): void {
    // Create small spark particles for critical damage
    for (let i = 0; i < 3; i++) {
      const spark = this.scene.add.circle(x, y, 1, 0xffff00, 0.8);
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 30;

      this.scene.physics.add.existing(spark);
      const sparkBody = spark.body as Phaser.Physics.Arcade.Body;
      sparkBody.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 10
      );

      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        duration: 500,
        onComplete: () => spark.destroy(),
      });
    }
  }

  private createCriticalPulseEffect(alien: Phaser.Physics.Arcade.Sprite): void {
    // Critical damage - intense pulsing scale effect
    this.scene.tweens.add({
      targets: alien,
      scaleX: { from: 1.0, to: 1.1 },
      scaleY: { from: 1.0, to: 1.1 },
      duration: 150,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private createModerateDamageEffect(
    alien: Phaser.Physics.Arcade.Sprite
  ): void {
    // Moderate damage - gentle scale flickering
    this.scene.tweens.add({
      targets: alien,
      scaleX: { from: 1.0, to: 0.95 },
      scaleY: { from: 1.0, to: 0.95 },
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      repeat: 2,
    });
  }

  private createLightDamageEffect(alien: Phaser.Physics.Arcade.Sprite): void {
    // Light damage - brief scale bump
    this.scene.tweens.add({
      targets: alien,
      scaleX: { from: 1.0, to: 1.05 },
      scaleY: { from: 1.0, to: 1.05 },
      duration: 100,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 1,
    });
  }

  private createHitFlashEffect(
    alien: Phaser.Physics.Arcade.Sprite,
    healthPercent: number
  ): void {
    // Brief white flash to indicate hit, then restore damage state
    alien.setTint(0xffffff);

    this.scene.time.delayedCall(50, () => {
      if (alien.active) {
        // Restore appropriate damage state tint
        if (healthPercent <= 0.25) {
          alien.setTint(0x880000);
        } else if (healthPercent <= 0.5) {
          alien.setTint(0xaa0000);
        } else if (healthPercent <= 0.75) {
          alien.setTint(0xcc4444);
        } else {
          alien.clearTint();
        }
      }
    });
  }

  private createFlickerEffect(alien: Phaser.Physics.Arcade.Sprite): void {
    // Legacy method - replaced by new damage effects but kept for compatibility
    this.createModerateDamageEffect(alien);
  }

  public calculateDamage(firepower: number, alienType: AlienType): number {
    const maxHealth = this.getMaxHealthForAlienType(alienType);

    console.log('🔥 DAMAGE CALCULATION DEBUG:');
    console.log(`  - Firepower: ${firepower}`);
    console.log(`  - Alien Type: ${alienType}`);
    console.log(`  - Max Health: ${maxHealth}`);

    // CRITICAL FIX: Use integer-based damage calculation to prevent floating-point issues
    let damage: number;

    if (firepower >= 81) {
      // Ultimate power - always kills in 1 hit
      damage = maxHealth;
      console.log(`  - Ultimate power branch: damage = ${damage}`);
    } else if (firepower >= 61) {
      // High power - kills most aliens in 1 hit, octopus in 2
      damage = Math.max(1, Math.floor(maxHealth * 0.9));
      console.log(
        `  - High power branch: damage = ${damage} (${maxHealth} * 0.9 = ${maxHealth * 0.9})`
      );
    } else if (firepower >= 41) {
      // Medium power - requires 2 hits for most aliens
      damage = Math.max(1, Math.floor(maxHealth * 0.6));
      console.log(
        `  - Medium power branch: damage = ${damage} (${maxHealth} * 0.6 = ${maxHealth * 0.6})`
      );
    } else if (firepower >= 21) {
      // Low power - requires 2-3 hits
      damage = Math.max(1, Math.floor(maxHealth * 0.4));
      console.log(
        `  - Low power branch: damage = ${damage} (${maxHealth} * 0.4 = ${maxHealth * 0.4})`
      );
    } else {
      // Very low power - requires multiple hits
      damage = 1; // Always at least 1 damage
      console.log(`  - Very low power branch: damage = ${damage}`);
    }

    // Ensure damage is always at least 1 and never exceeds max health
    const finalDamage = Math.min(maxHealth, Math.max(1, damage));
    console.log(`  - Final damage after clamping: ${finalDamage}`);
    console.log(
      `  - Expected hits to kill: ${Math.ceil(maxHealth / finalDamage)}`
    );

    return finalDamage;
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
