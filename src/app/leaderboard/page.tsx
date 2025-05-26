'use client';

import Link from 'next/link';

export default function LeaderboardPage() {
  // Mock leaderboard data for now
  const mockLeaderboard = [
    { rank: 1, name: 'MathMaster', score: 125000, wave: 15 },
    { rank: 2, name: 'NumberNinja', score: 98500, wave: 12 },
    { rank: 3, name: 'AlgebraAce', score: 87200, wave: 11 },
    { rank: 4, name: 'CalculusKing', score: 76800, wave: 10 },
    { rank: 5, name: 'GeometryGuru', score: 65400, wave: 9 },
    { rank: 6, name: 'StatsStar', score: 54200, wave: 8 },
    { rank: 7, name: 'TrigTitan', score: 43100, wave: 7 },
    { rank: 8, name: 'MathWhiz', score: 32500, wave: 6 },
    { rank: 9, name: 'NumberCruncher', score: 21800, wave: 5 },
    { rank: 10, name: 'EquationExpert', score: 15600, wave: 4 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            LEADERBOARD
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Top Mathematical Warriors
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto"></div>
        </div>

        {/* Leaderboard Table */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
            <div className="bg-slate-700/50 px-6 py-4">
              <div className="grid grid-cols-4 gap-4 text-white font-bold">
                <div>Rank</div>
                <div>Player</div>
                <div>Score</div>
                <div>Wave</div>
              </div>
            </div>
            
            <div className="divide-y divide-slate-700">
              {mockLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="px-6 py-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div className="flex items-center">
                      <span
                        className={`text-2xl font-bold ${
                          entry.rank === 1
                            ? 'text-yellow-400'
                            : entry.rank === 2
                            ? 'text-gray-300'
                            : entry.rank === 3
                            ? 'text-amber-600'
                            : 'text-white'
                        }`}
                      >
                        #{entry.rank}
                      </span>
                      {entry.rank <= 3 && (
                        <span className="ml-2 text-2xl">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                        </span>
                      )}
                    </div>
                    <div className="text-white font-semibold">{entry.name}</div>
                    <div className="text-cyan-400 font-mono text-lg">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-purple-400 font-semibold">
                      Wave {entry.wave}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
          <Link
            href="/game"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
          >
            Play Now
          </Link>
          
          <Link
            href="/"
            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Back to Home
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-16">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700 text-center">
            <div className="text-cyan-400 text-3xl mb-2">🎯</div>
            <h3 className="text-xl font-bold text-white mb-2">Highest Score</h3>
            <p className="text-2xl font-mono text-cyan-400">125,000</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700 text-center">
            <div className="text-purple-400 text-3xl mb-2">🌊</div>
            <h3 className="text-xl font-bold text-white mb-2">Highest Wave</h3>
            <p className="text-2xl font-mono text-purple-400">Wave 15</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700 text-center">
            <div className="text-green-400 text-3xl mb-2">👥</div>
            <h3 className="text-xl font-bold text-white mb-2">Active Players</h3>
            <p className="text-2xl font-mono text-green-400">1,247</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-400">
          <p>Leaderboard updates every 5 minutes</p>
        </div>
      </div>
    </div>
  );
}
