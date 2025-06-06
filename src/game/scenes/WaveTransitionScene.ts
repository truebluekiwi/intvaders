import * as Phaser from 'phaser';

export interface WaveTransitionData {
  completedWave: number;
  nextWave: number;
  score: number;
  waveScore: number;
  bonusScore: number;
  newFirepower: number;
  aliensDestroyed: {
    squid: number;
    crab: number;
    octopus: number;
    ufo: number;
  };
}

export class WaveTransitionScene extends Phaser.Scene {
  private transitionData!: WaveTransitionData;
  private countdownTime: number = 30;
  private countdownTimer!: Phaser.Time.TimerEvent;
  private countdownText!: Phaser.GameObjects.Text;
  private skipText!: Phaser.GameObjects.Text;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'WaveTransitionScene' });
  }

  init(data: WaveTransitionData): void {
    this.transitionData = data;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Create starfield background
    this.createStarfield();

    // Add semi-transparent overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

    // Main title
    const titleText = this.add.text(
      width / 2,
      80,
      `WAVE ${this.transitionData.completedWave} COMPLETE!`,
      {
        fontSize: '36px',
        color: '#00ff00',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#004400',
        strokeThickness: 3,
      }
    );
    titleText.setOrigin(0.5);

    // Create pulsing effect for title
    this.tweens.add({
      targets: titleText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Statistics panel
    this.createStatisticsPanel();

    // Next wave preview
    const nextWaveText = this.add.text(
      width / 2,
      height - 120,
      `WAVE ${this.transitionData.nextWave} INCOMING...`,
      {
        fontSize: '24px',
        color: '#ffaa00',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    nextWaveText.setOrigin(0.5);

    // Countdown display
    this.countdownText = this.add.text(
      width / 2,
      height - 80,
      `Starting in: ${this.countdownTime}`,
      {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }
    );
    this.countdownText.setOrigin(0.5);

    // Skip instruction
    this.skipText = this.add.text(
      width / 2,
      height - 40,
      'Press SPACE or ENTER to continue immediately',
      {
        fontSize: '14px',
        color: '#aaaaaa',
        fontFamily: 'Arial, sans-serif',
      }
    );
    this.skipText.setOrigin(0.5);

    // Create blinking effect for skip text
    this.tweens.add({
      targets: this.skipText,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Setup input
    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.enterKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    // Start countdown timer
    this.startCountdown();

    // Add particle effects
    this.createCelebrationEffects();
  }

  update(): void {
    // Check for skip input
    if (
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.enterKey)
    ) {
      this.completeTransition();
    }
  }

  private createStarfield(): void {
    // Create animated starfield background
    for (let i = 0; i < 150; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff);
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1.0));

      // Add twinkling effect
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 1.0),
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createStatisticsPanel(): void {
    const { width, height } = this.cameras.main;
    const panelX = width / 2;
    const panelY = height / 2;

    // Statistics background panel
    const panel = this.add.rectangle(panelX, panelY, 400, 200, 0x001122, 0.9);
    panel.setStrokeStyle(2, 0x0066cc);

    // Panel title
    const panelTitle = this.add.text(panelX, panelY - 80, 'WAVE STATISTICS', {
      fontSize: '20px',
      color: '#00aaff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    panelTitle.setOrigin(0.5);

    // Statistics content
    const stats = [
      `Score This Wave: ${this.transitionData.waveScore.toLocaleString()}`,
      `Bonus Points: ${this.transitionData.bonusScore.toLocaleString()}`,
      `Total Score: ${this.transitionData.score.toLocaleString()}`,
      `New Firepower: ${this.transitionData.newFirepower}`,
      '',
      'Aliens Destroyed:',
      `  Squids: ${this.transitionData.aliensDestroyed.squid}`,
      `  Crabs: ${this.transitionData.aliensDestroyed.crab}`,
      `  Octopi: ${this.transitionData.aliensDestroyed.octopus}`,
      `  UFOs: ${this.transitionData.aliensDestroyed.ufo}`,
    ];

    stats.forEach((stat, index) => {
      if (stat === '') return; // Skip empty lines

      const color = stat.startsWith('  ') ? '#cccccc' : '#ffffff';
      const fontSize = stat.startsWith('Aliens Destroyed:') ? '16px' : '14px';
      const fontStyle =
        stat.includes(':') && !stat.startsWith('  ') ? 'bold' : 'normal';

      const statText = this.add.text(panelX, panelY - 60 + index * 16, stat, {
        fontSize,
        color,
        fontFamily: 'Arial, sans-serif',
        fontStyle,
      });
      statText.setOrigin(0.5);

      // Add slide-in animation for each stat
      statText.setAlpha(0);
      statText.x -= 50;
      this.tweens.add({
        targets: statText,
        alpha: 1,
        x: panelX,
        duration: 300,
        delay: index * 100,
        ease: 'Back.easeOut',
      });
    });
  }

  private createCelebrationEffects(): void {
    const { width, height } = this.cameras.main;

    // Create particle emitters for celebration
    const colors = [0x00ff00, 0x00aaff, 0xffaa00, 0xff0066];

    colors.forEach((color, index) => {
      // Create particles from different corners
      const emitter = this.add.particles(0, 0, 'bullet', {
        x: index % 2 === 0 ? 0 : width,
        y: index < 2 ? 0 : height,
        speed: { min: 100, max: 200 },
        scale: { start: 0.5, end: 0 },
        lifespan: 2000,
        tint: color,
        alpha: { start: 0.8, end: 0 },
        frequency: 200,
        quantity: 2,
      });

      // Stop particles after a few seconds
      this.time.delayedCall(3000, () => {
        emitter.stop();
      });

      this.time.delayedCall(5000, () => {
        emitter.destroy();
      });
    });
  }

  private startCountdown(): void {
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateCountdown,
      callbackScope: this,
      repeat: this.countdownTime - 1,
    });
  }

  private updateCountdown(): void {
    this.countdownTime--;
    this.countdownText.setText(`Starting in: ${this.countdownTime}`);

    if (this.countdownTime <= 0) {
      this.completeTransition();
    } else if (this.countdownTime <= 3) {
      // Add urgency effect for final countdown
      this.countdownText.setColor('#ff4444');
      this.tweens.add({
        targets: this.countdownText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }
  }

  private completeTransition(): void {
    // Clean up timer
    if (this.countdownTimer) {
      this.countdownTimer.destroy();
    }

    // Return to game scene with next wave
    this.scene.stop('WaveTransitionScene');
    this.scene.resume('GameScene');

    // Trigger next wave creation in GameScene
    this.scene.get('GameScene').events.emit('startNextWave', {
      wave: this.transitionData.nextWave,
    });
  }
}
