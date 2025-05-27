'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="container py-16 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1
            className="text-6xl font-bold mb-4"
            style={{ letterSpacing: '0.1em' }}
          >
            INT<span className="text-cyan">VADERS</span>
          </h1>
          <p className="text-xl text-gray mb-8">
            Master Mathematics Through Classic Arcade Gameplay
          </p>
          <div
            style={{
              width: '8rem',
              height: '4px',
              background: 'linear-gradient(45deg, #00bcd4, #9c27b0)',
              margin: '0 auto',
            }}
          ></div>
        </div>

        {/* Game Description */}
        <div
          style={{ maxWidth: '64rem', margin: '0 auto' }}
          className="text-center mb-12"
        >
          <p className="text-xl text-gray mb-8" style={{ lineHeight: '1.6' }}>
            Defend Earth from numerical alien invaders using the power of
            mathematics! Choose between standard combat or calculating attacks
            to destroy enemies and earn bonus rewards through mathematical
            precision.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Link
            href="/game"
            className="btn btn-primary"
            onClick={() => setIsLoading(true)}
          >
            {isLoading ? 'Loading...' : 'Start Game'}
          </Link>

          <Link href="/leaderboard" className="btn btn-secondary">
            Leaderboard
          </Link>
        </div>

        {/* Features Grid */}
        <div
          className="grid md:grid-cols-3 gap-8"
          style={{ maxWidth: '96rem', margin: '0 auto' }}
        >
          <div className="card">
            <div className="text-cyan text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-4">Dual Combat System</h3>
            <p className="text-gray">
              Choose between standard torpedo mode or calculating attacks that
              reward mathematical precision.
            </p>
          </div>

          <div className="card">
            <div className="text-purple text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-4">Progressive Difficulty</h3>
            <p className="text-gray">
              Face increasingly complex mathematical challenges as you advance
              through infinite waves.
            </p>
          </div>

          <div className="card">
            <div className="text-green text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-4">Competitive Play</h3>
            <p className="text-gray">
              Compete globally on leaderboards and prove your mathematical
              supremacy.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mb-16" style={{ marginTop: '4rem' }}>
          <p className="text-gray">
            &copy; 2025 IntVaders.com - Educational Arcade Gaming
          </p>
        </div>
      </div>
    </div>
  );
}
