import * as Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  private remainingPauseTime: number = 0;
  private pauseTimeText!: Phaser.GameObjects.Text;
  private warningText!: Phaser.GameObjects.Text;
  private updateTimer!: Phaser.Time.TimerEvent;
  private pKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private isResuming: boolean = false;

  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data: { remainingTime: number }): void {
    console.log('PauseScene init called with data:', data);
    this.remainingPauseTime = data.remainingTime || 0;
  }

  create(): void {
    console.log('PauseScene create called');

    // Reset the resuming flag
    this.isResuming = false;

    const { width, height } = this.cameras.main;

    // Semi-transparent dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Main pause title
    const pauseTitle = this.add.text(width / 2, height / 3, 'GAME PAUSED', {
      fontSize: '48px',
      color: '#ffff00',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    pauseTitle.setOrigin(0.5);

    // Pause time remaining display
    this.pauseTimeText = this.add.text(
      width / 2,
      height / 2 - 20,
      this.formatPauseTime(this.remainingPauseTime),
      {
        fontSize: '24px',
        color: this.getPauseTimeColor(this.remainingPauseTime),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    this.pauseTimeText.setOrigin(0.5);

    // Warning text for low time (only show if less than 60 seconds)
    this.warningText = this.add.text(
      width / 2,
      height / 2 + 20,
      this.remainingPauseTime <= 60000
        ? 'WARNING: Low pause time remaining!'
        : '',
      {
        fontSize: '16px',
        color: '#ff4444',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      }
    );
    this.warningText.setOrigin(0.5);

    // Resume instructions
    const resumeText = this.add.text(
      width / 2,
      height / 2 + 60,
      'Press P or ESC to resume (or click anywhere)',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      }
    );
    resumeText.setOrigin(0.5);

    // Additional info
    const infoText = this.add.text(
      width / 2,
      height / 2 + 100,
      'Game state is preserved while paused',
      {
        fontSize: '14px',
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif',
      }
    );
    infoText.setOrigin(0.5);

    // Set up input handling
    this.setupInput();

    // Start countdown timer
    this.startCountdown();
  }

  update(): void {
    // Check for resume input
    if (
      Phaser.Input.Keyboard.JustDown(this.pKey) ||
      Phaser.Input.Keyboard.JustDown(this.escKey)
    ) {
      this.resumeGame();
    }
  }

  private setupInput(): void {
    // Store key references for update method
    this.pKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.escKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    // Use native DOM event listener for more reliable detection
    const handleKeyPress = (event: KeyboardEvent) => {
      console.log('Key pressed:', event.key, event.code);
      if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
        console.log('Resume key detected via DOM listener');
        event.preventDefault();
        this.resumeGame();
      }
    };

    // Add DOM event listener
    document.addEventListener('keydown', handleKeyPress);

    // Store reference to remove later
    this.events.once('shutdown', () => {
      document.removeEventListener('keydown', handleKeyPress);
    });

    // Make the entire pause screen clickable to resume as backup
    this.input.on('pointerdown', () => {
      console.log('Pause screen clicked - resuming');
      this.resumeGame();
    });
  }

  private startCountdown(): void {
    // Update the display every second
    this.updateTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updatePauseDisplay,
      callbackScope: this,
      loop: true,
    });
  }

  private updatePauseDisplay(): void {
    // Decrease remaining time
    this.remainingPauseTime = Math.max(0, this.remainingPauseTime - 1000);

    // Update display
    this.pauseTimeText.setText(this.formatPauseTime(this.remainingPauseTime));
    this.pauseTimeText.setColor(
      this.getPauseTimeColor(this.remainingPauseTime)
    );

    // Update warning text
    if (this.remainingPauseTime <= 60000 && this.remainingPauseTime > 0) {
      this.warningText.setText('WARNING: Low pause time remaining!');
      this.warningText.setVisible(true);
    } else if (this.remainingPauseTime === 0) {
      this.warningText.setText('PAUSE TIME EXHAUSTED - Auto-resuming...');
      this.warningText.setColor('#ff0000');
      this.warningText.setVisible(true);

      // Auto-resume after 2 seconds
      this.time.delayedCall(2000, () => {
        this.resumeGame();
      });
    } else {
      this.warningText.setVisible(false);
    }

    // Send updated time back to GameScene
    this.scene
      .get('GameScene')
      .events.emit('pauseTimeUpdate', this.remainingPauseTime);
  }

  private formatPauseTime(timeMs: number): string {
    const totalSeconds = Math.ceil(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `Pause time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private getPauseTimeColor(timeMs: number): string {
    if (timeMs <= 60000) return '#ff4444'; // Red for last minute
    if (timeMs <= 180000) return '#ffaa00'; // Orange for last 3 minutes
    return '#00ff00'; // Green for plenty of time
  }

  private resumeGame(): void {
    // Prevent multiple resume calls
    if (this.isResuming) {
      return;
    }

    console.log('Resuming game...');
    this.isResuming = true;

    // Stop the countdown timer
    if (this.updateTimer) {
      this.updateTimer.destroy();
    }

    // Send resume event to GameScene with remaining time
    this.scene
      .get('GameScene')
      .events.emit('resumeGame', this.remainingPauseTime);

    // Close this scene
    this.scene.stop();
  }
}
