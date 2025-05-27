'use client';

import { useEffect, useRef, useState } from 'react';

export default function GamePage() {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameManagerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && gameRef.current && !gameManagerRef.current) {
      // Dynamically import GameManager only on client side
      import('@/game/GameManager').then(({ GameManager }) => {
        if (gameRef.current) {
          gameManagerRef.current = new GameManager(gameRef.current);
          gameManagerRef.current.init();
        }
      });
    }

    return () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.destroy();
        gameManagerRef.current = null;
      }
    };
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="game-container">
        <div
          className="flex items-center justify-center"
          style={{ width: '800px', height: '600px' }}
        >
          <p className="text-xl text-cyan">Loading Game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div ref={gameRef} className="phaser-game" />
    </div>
  );
}
