import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    // Create simple colored rectangles as placeholders for sprites
    this.load.image('background', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c0c0c);

    // Title
    const title = this.add.text(width / 2, height / 3, 'INTVADERS', {
      fontSize: '48px',
      color: '#00ffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 3 + 60, 'Educational Arcade Shooter', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    subtitle.setOrigin(0.5);

    // Start button
    const startButton = this.add.rectangle(width / 2, height / 2 + 50, 200, 50, 0x00aa00);
    const startText = this.add.text(width / 2, height / 2 + 50, 'START GAME', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    startText.setOrigin(0.5);

    // Make start button interactive
    startButton.setInteractive();
    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    startButton.on('pointerover', () => {
      startButton.setFillStyle(0x00cc00);
    });

    startButton.on('pointerout', () => {
      startButton.setFillStyle(0x00aa00);
    });

    // Instructions
    const instructions = this.add.text(width / 2, height - 100, 
      'Use ARROW KEYS to move, SPACE to fire\nPress ENTER for Calculating Attack Mode', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
    });
    instructions.setOrigin(0.5);
  }
}
