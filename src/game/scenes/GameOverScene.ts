import * as Phaser from 'phaser';

export interface GameOverData {
  score: number;
  wave: number;
  endReason?: 'player_death' | 'alien_invasion';
  finalStats?: {
    aliensDestroyed: number;
    shotsfired: number;
    accuracy: number;
    timeAlive: number;
  };
}

export class GameOverScene extends Phaser.Scene {
  private finalScore: number = 0;
  private finalWave: number = 0;
  private endReason: 'player_death' | 'alien_invasion' = 'player_death';
  private finalStats: {
    aliensDestroyed: number;
    shotsfired: number;
    accuracy: number;
    timeAlive: number;
  } = {
    aliensDestroyed: 0,
    shotsfired: 0,
    accuracy: 0,
    timeAlive: 0,
  };

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.finalScore = data.score || 0;
    this.finalWave = data.wave || 0;
    this.endReason = data.endReason || 'player_death';
    this.finalStats = data.finalStats || {
      aliensDestroyed: 0,
      shotsfired: 0,
      accuracy: 0,
      timeAlive: 0,
    };
  }

  create(): void {
    // Enhanced background with gradient effect
    this.createEnhancedBackground();

    // Create animated title sequence
    this.createAnimatedTitle();

    // Create animated statistics display
    this.time.delayedCall(1000, () => {
      this.createAnimatedStats();
    });

    // Create enhanced buttons
    this.time.delayedCall(2000, () => {
      this.createEnhancedButtons();
    });

    // Add ambient particles
    this.createAmbientParticles();
  }

  private createEnhancedBackground(): void {
    const { width, height } = this.cameras.main;

    // Base background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c0c0c);

    // Create subtle gradient overlay
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x0c0c0c, 0x0c0c0c, 0.8);
    graphics.fillRect(0, 0, width, height);

    // Add subtle border glow
    graphics.lineStyle(2, 0x333333, 0.5);
    graphics.strokeRect(10, 10, width - 20, height - 20);
  }

  private createAnimatedTitle(): void {
    const { width, height } = this.cameras.main;

    // Main title with dramatic entrance
    const gameOverText = this.add.text(width / 2, height / 4, 'GAME OVER', {
      fontSize: '56px',
      color: this.endReason === 'player_death' ? '#ff4444' : '#ff0000',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setAlpha(0);
    gameOverText.setScale(0.5);

    // Animate title entrance
    this.tweens.add({
      targets: gameOverText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 800,
      ease: 'Back.easeOut',
    });

    // Add pulsing effect
    this.tweens.add({
      targets: gameOverText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle based on end reason
    const subtitle =
      this.endReason === 'player_death'
        ? 'Your ship has been destroyed'
        : 'The aliens have invaded Earth';

    const subtitleText = this.add.text(width / 2, height / 4 + 60, subtitle, {
      fontSize: '18px',
      color: '#cccccc',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic',
    });
    subtitleText.setOrigin(0.5);
    subtitleText.setAlpha(0);

    this.tweens.add({
      targets: subtitleText,
      alpha: 0.8,
      duration: 600,
      delay: 400,
      ease: 'Power2',
    });
  }

  private createAnimatedStats(): void {
    const { width, height } = this.cameras.main;
    const startY = height / 2 - 60;

    // Create stats container
    const statsContainer = this.add.container(width / 2, startY);

    // Main stats with animated counters
    this.createAnimatedStat(
      statsContainer,
      0,
      0,
      'FINAL SCORE',
      this.finalScore,
      '#ffdd00',
      0
    );
    this.createAnimatedStat(
      statsContainer,
      0,
      40,
      'WAVE REACHED',
      this.finalWave,
      '#00ddff',
      200
    );

    // Additional stats if available
    if (this.finalStats.aliensDestroyed > 0) {
      this.createAnimatedStat(
        statsContainer,
        -150,
        80,
        'ALIENS DESTROYED',
        this.finalStats.aliensDestroyed,
        '#ff6600',
        400
      );
    }

    if (this.finalStats.accuracy > 0) {
      this.createAnimatedStat(
        statsContainer,
        150,
        80,
        'ACCURACY',
        Math.round(this.finalStats.accuracy),
        '#00ff66',
        600,
        '%'
      );
    }

    // Performance rating
    this.time.delayedCall(1000, () => {
      this.createPerformanceRating(statsContainer);
    });
  }

  private createAnimatedStat(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    label: string,
    value: number,
    color: string,
    delay: number,
    suffix: string = ''
  ): void {
    // Label
    const labelText = this.add.text(x, y - 15, label, {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'Arial, sans-serif',
    });
    labelText.setOrigin(0.5);
    labelText.setAlpha(0);

    // Value (starts at 0 and counts up)
    const valueText = this.add.text(x, y + 5, `0${suffix}`, {
      fontSize: '24px',
      color: color,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    valueText.setOrigin(0.5);
    valueText.setAlpha(0);

    container.add([labelText, valueText]);

    // Animate label
    this.tweens.add({
      targets: labelText,
      alpha: 0.8,
      duration: 400,
      delay: delay,
      ease: 'Power2',
    });

    // Animate value with counter
    this.tweens.add({
      targets: valueText,
      alpha: 1,
      duration: 400,
      delay: delay + 200,
      ease: 'Power2',
    });

    // Counter animation
    this.tweens.addCounter({
      from: 0,
      to: value,
      duration: 800,
      delay: delay + 400,
      ease: 'Power2',
      onUpdate: (tween) => {
        const currentValue = Math.floor(tween.getValue() || 0);
        valueText.setText(`${currentValue}${suffix}`);
      },
    });
  }

  private createPerformanceRating(
    container: Phaser.GameObjects.Container
  ): void {
    // Calculate performance rating
    let rating = 'ROOKIE';
    let ratingColor = '#888888';

    if (this.finalWave >= 10) {
      rating = 'LEGEND';
      ratingColor = '#ffdd00';
    } else if (this.finalWave >= 7) {
      rating = 'EXPERT';
      ratingColor = '#ff6600';
    } else if (this.finalWave >= 5) {
      rating = 'VETERAN';
      ratingColor = '#00ddff';
    } else if (this.finalWave >= 3) {
      rating = 'SOLDIER';
      ratingColor = '#00ff66';
    }

    const ratingText = this.add.text(0, 140, rating, {
      fontSize: '20px',
      color: ratingColor,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    ratingText.setOrigin(0.5);
    ratingText.setAlpha(0);
    ratingText.setScale(0.5);

    container.add(ratingText);

    this.tweens.add({
      targets: ratingText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });
  }

  private createEnhancedButtons(): void {
    const { width, height } = this.cameras.main;

    // Play Again button with enhanced styling
    const playAgainButton = this.createEnhancedButton(
      width / 2 - 120,
      height - 100,
      200,
      50,
      'PLAY AGAIN',
      0x00aa00,
      0x00cc00,
      () => this.scene.start('GameScene')
    );

    // Menu button
    const menuButton = this.createEnhancedButton(
      width / 2 + 120,
      height - 100,
      200,
      50,
      'MAIN MENU',
      0x0066cc,
      0x0088ff,
      () => this.scene.start('MenuScene')
    );

    // Animate buttons entrance
    [playAgainButton, menuButton].forEach((button, index) => {
      button.container.setAlpha(0);
      button.container.setY(button.container.y + 50);

      this.tweens.add({
        targets: button.container,
        alpha: 1,
        y: button.container.y - 50,
        duration: 600,
        delay: index * 200,
        ease: 'Back.easeOut',
      });
    });
  }

  private createEnhancedButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    normalColor: number,
    hoverColor: number,
    onClick: () => void
  ): {
    container: Phaser.GameObjects.Container;
    button: Phaser.GameObjects.Rectangle;
  } {
    const container = this.add.container(x, y);

    // Button background with border
    const button = this.add.rectangle(0, 0, width, height, normalColor);
    const border = this.add.rectangle(0, 0, width + 4, height + 4, 0x444444);
    border.setStrokeStyle(2, 0x666666);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);

    container.add([border, button, buttonText]);

    // Make interactive
    button.setInteractive();

    button.on('pointerover', () => {
      button.setFillStyle(hoverColor);
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Power2',
      });
    });

    button.on('pointerout', () => {
      button.setFillStyle(normalColor);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2',
      });
    });

    button.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        ease: 'Power2',
        onComplete: onClick,
      });
    });

    return { container, button };
  }

  private createAmbientParticles(): void {
    const { width, height } = this.cameras.main;

    // Create floating particles for atmosphere
    for (let i = 0; i < 15; i++) {
      this.time.delayedCall(Math.random() * 3000, () => {
        const particle = this.add.circle(
          Math.random() * width,
          height + 10,
          1 + Math.random() * 2,
          0x444444,
          0.3
        );

        this.tweens.add({
          targets: particle,
          y: -10,
          alpha: 0.6,
          duration: 8000 + Math.random() * 4000,
          ease: 'Linear',
          onComplete: () => particle.destroy(),
        });

        // Add subtle horizontal drift
        this.tweens.add({
          targets: particle,
          x: particle.x + (Math.random() - 0.5) * 100,
          duration: 8000 + Math.random() * 4000,
          ease: 'Sine.easeInOut',
        });
      });
    }
  }
}
