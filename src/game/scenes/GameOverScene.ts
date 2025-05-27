import * as Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private finalScore: number = 0;
  private finalWave: number = 0;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score: number; wave: number }): void {
    this.finalScore = data.score || 0;
    this.finalWave = data.wave || 0;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c0c0c);

    // Game Over title
    const gameOverText = this.add.text(width / 2, height / 3, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    gameOverText.setOrigin(0.5);

    // Score display
    const scoreText = this.add.text(
      width / 2,
      height / 2 - 40,
      `Final Score: ${this.finalScore}`,
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }
    );
    scoreText.setOrigin(0.5);

    // Wave display
    const waveText = this.add.text(
      width / 2,
      height / 2,
      `Wave Reached: ${this.finalWave}`,
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }
    );
    waveText.setOrigin(0.5);

    // Play Again button
    const playAgainButton = this.add.rectangle(
      width / 2 - 100,
      height / 2 + 80,
      180,
      50,
      0x00aa00
    );
    const playAgainText = this.add.text(
      width / 2 - 100,
      height / 2 + 80,
      'PLAY AGAIN',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    playAgainText.setOrigin(0.5);

    // Menu button
    const menuButton = this.add.rectangle(
      width / 2 + 100,
      height / 2 + 80,
      180,
      50,
      0x0066cc
    );
    const menuText = this.add.text(
      width / 2 + 100,
      height / 2 + 80,
      'MAIN MENU',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    menuText.setOrigin(0.5);

    // Make buttons interactive
    playAgainButton.setInteractive();
    playAgainButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    playAgainButton.on('pointerover', () => {
      playAgainButton.setFillStyle(0x00cc00);
    });

    playAgainButton.on('pointerout', () => {
      playAgainButton.setFillStyle(0x00aa00);
    });

    menuButton.setInteractive();
    menuButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    menuButton.on('pointerover', () => {
      menuButton.setFillStyle(0x0088ff);
    });

    menuButton.on('pointerout', () => {
      menuButton.setFillStyle(0x0066cc);
    });
  }
}
