import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private selectedMode: 'standard' | 'calculating' = 'standard';

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    // Create simple colored rectangles as placeholders for sprites
    this.load.image(
      'background',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c0c0c);

    // Title
    const title = this.add.text(width / 2, height / 4, 'INTVADERS', {
      fontSize: '48px',
      color: '#00ffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(
      width / 2,
      height / 4 + 60,
      'Educational Arcade Shooter',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }
    );
    subtitle.setOrigin(0.5);

    // Mode selection title
    const modeTitle = this.add.text(
      width / 2,
      height / 2 - 60,
      'SELECT GAME MODE',
      {
        fontSize: '24px',
        color: '#ffff00',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    modeTitle.setOrigin(0.5);

    // Standard mode button
    const standardButton = this.add.rectangle(
      width / 2 - 120,
      height / 2,
      200,
      60,
      this.selectedMode === 'standard' ? 0x00aa00 : 0x444444
    );
    const standardText = this.add.text(
      width / 2 - 120,
      height / 2,
      'STANDARD\nMODE',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        align: 'center',
      }
    );
    standardText.setOrigin(0.5);

    // Calculating mode button
    const calculatingButton = this.add.rectangle(
      width / 2 + 120,
      height / 2,
      200,
      60,
      this.selectedMode === 'calculating' ? 0x00aa00 : 0x444444
    );
    const calculatingText = this.add.text(
      width / 2 + 120,
      height / 2,
      'CALCULATING\nMODE',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        align: 'center',
      }
    );
    calculatingText.setOrigin(0.5);

    // Mode descriptions
    const standardDesc = this.add.text(
      width / 2 - 120,
      height / 2 + 50,
      'Unlimited shooting\nClassic gameplay',
      {
        fontSize: '12px',
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
      }
    );
    standardDesc.setOrigin(0.5);

    const calculatingDesc = this.add.text(
      width / 2 + 120,
      height / 2 + 50,
      'Math-based shooting\nBonus armor & score',
      {
        fontSize: '12px',
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
      }
    );
    calculatingDesc.setOrigin(0.5);

    // Make mode buttons interactive
    standardButton.setInteractive();
    standardButton.on('pointerdown', () => {
      this.selectedMode = 'standard';
      this.updateModeButtons(standardButton, calculatingButton);
    });

    calculatingButton.setInteractive();
    calculatingButton.on('pointerdown', () => {
      this.selectedMode = 'calculating';
      this.updateModeButtons(standardButton, calculatingButton);
    });

    // Start button
    const startButton = this.add.rectangle(
      width / 2,
      height / 2 + 120,
      200,
      50,
      0x0066cc
    );
    const startText = this.add.text(width / 2, height / 2 + 120, 'START GAME', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    startText.setOrigin(0.5);

    // Make start button interactive
    startButton.setInteractive();
    startButton.on('pointerdown', () => {
      this.scene.start('GameScene', { gameMode: this.selectedMode });
    });

    startButton.on('pointerover', () => {
      startButton.setFillStyle(0x0088ff);
    });

    startButton.on('pointerout', () => {
      startButton.setFillStyle(0x0066cc);
    });

    // Instructions
    const instructions = this.add.text(
      width / 2,
      height - 80,
      'Use ARROW KEYS to move, SPACE to fire\nMode cannot be changed once game starts',
      {
        fontSize: '14px',
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
      }
    );
    instructions.setOrigin(0.5);
  }

  private updateModeButtons(
    standardButton: Phaser.GameObjects.Rectangle,
    calculatingButton: Phaser.GameObjects.Rectangle
  ): void {
    if (this.selectedMode === 'standard') {
      standardButton.setFillStyle(0x00aa00);
      calculatingButton.setFillStyle(0x444444);
    } else {
      standardButton.setFillStyle(0x444444);
      calculatingButton.setFillStyle(0x00aa00);
    }
  }
}
