import * as Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { GameOverScene } from './scenes/GameOverScene';
import { PauseScene } from './scenes/PauseScene';
import { WaveTransitionScene } from './scenes/WaveTransitionScene';

export class GameManager {
  private game: Phaser.Game | null = null;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  init(): void {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: this.container,
      backgroundColor: '#0c0c0c',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [
        MenuScene,
        GameScene,
        GameOverScene,
        PauseScene,
        WaveTransitionScene,
      ],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    this.game = new Phaser.Game(config);
  }

  destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }

  getGame(): Phaser.Game | null {
    return this.game;
  }
}
