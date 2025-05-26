## intvaders.com Development Plan (v1.5)

### Document Version History
| Version | Date       | Summary                                                          |
|---------|------------|------------------------------------------------------------------|
| v1.3    | 2025-05-26 | Original uploaded version                                        |
| v1.4    | 2025-05-26 | Refined structure, removed duplication, naming consistency       |
| v1.5    | 2025-05-26 | Added phase deliverables, gameplay examples, updated architecture|

---

## Project Overview

**Game Title:** IntVaders (hosted at [intvaders.com](https://intvaders.com))  
**Genre:** Educational Arcade Shooter  
**Platform:** Web Browser (Desktop & Mobile)  
**Target Audience:** Students, educators, math enthusiasts, competitive gamers  
**Development Approach:** AI-assisted development via VS Code + Cline plugin  
**Team:** 1 Project Manager + 1 Developer + AI Assistant (Claude Sonnet 4 via Cline)  
**Development Philosophy:** AI-first development with human oversight and validation

---

## Explicit Deliverables by Development Phase

**Phase 1 – Core Game Engine**  
- VS Code environment with all extensions configured  
- Next.js + React + Phaser integrated  
- Basic gameplay loop implemented  
- Player ship movement and torpedo mode functional  
- Basic alien formation and wave progression

**Phase 2 – Mathematical Combat**  
- PEMDAS parser working with UI feedback  
- Calculating Attack Mode integrated into core gameplay  
- Correct/incorrect calculation feedback and reward/penalty system active

**Phase 3 – Backend & User System**  
- Secure user login and registration  
- Score history and leaderboard persistence  
- User profile and session tracking

**Phase 4 – Educational & Power-Up Systems**  
- All 3 power-up categories implemented with point system  
- Learning analytics and adaptive difficulty working  
- Achievement unlock and tracking operational

**Phase 5 – Multiplayer & Competitive Modes**  
- Real-time game sync via Socket.io  
- Matchmaking, tournaments, anti-cheat systems integrated

**Phase 6 – Optimization & Launch**  
- Full mobile and accessibility compliance  
- End-to-end and load testing complete  
- Deployment to production-ready infrastructure

---

## Gameplay Examples: Enemies, Bonuses, and Power-Ups

**Special Alien Types:**
- **Prime Aliens**: More armored; bonus points if destroyed using multiplication of primes.
- **Zero Aliens**: Can only be eliminated using subtraction equations (e.g., 4 - 4 = 0).
- **Boss Aliens**: Multi-digit numbers requiring multi-step equations.
- **Power Aliens**: Require exponent use in higher difficulty tiers (e.g., 2² = 4).

**Power-Up Categories:**

*Mathematical Enhancers:*
- Equation Hint – 500 pts
- Auto-Parentheses – 1000 pts
- Double Result – 1500 pts

*Combat Enhancers:*
- Armor Boost – 300 pts
- FPP Surge – 400 pts
- Time Freeze – 2000 pts

*Strategic Tools:*
- Alien Scanner – 750 pts
- Multi-Shot – 1200 pts
- Shield Generator – 2500 pts

**Bonus Scenarios:**
- **Speed Bonus**: Completing a correct equation within 2 seconds adds +50 pts
- **Streak Multiplier**: Each 3 consecutive math kills increases points by 10%
- **Complexity Bonus**: Solving using fractions or roots yields +100 pts

---

## Updated Technical Architecture

### Frontend Architecture
```
app/
├── (auth)/             # Auth route group
├── game/               # Game UI
├── leaderboard/        # Leaderboards
├── profile/            # User profiles
├── api/                # Internal API routes
└── globals.css         # Styling

src/
├── components/         # UI and layout
│   ├── ui/
│   ├── game/
│   └── layout/
├── game/               # Phaser logic
│   ├── scenes/
│   ├── entities/
│   ├── systems/        # Math validator, audio
│   └── config/
├── hooks/              # Custom React hooks
├── store/              # Redux store
├── lib/                # Utility libs
├── services/           # API calls
└── types/              # Shared types
```

### Backend Architecture
```
src/
├── api/                # REST endpoints
├── auth/               # JWT auth logic
├── controllers/        # Request handlers
├── middleware/         # Express middleware
├── models/             # DB models
├── services/           # Business logic
├── validators/         # Input validation
├── websocket/          # Real-time event handlers
└── utils/              # Shared utilities
```

### Database Schema
```sql
-- Core Tables
Users (id, email, password_hash, created_at)
Profiles (user_id, display_name, avatar_url, total_score)
Sessions (id, user_id, score, wave_reached, duration)
Leaderboards (id, user_id, score, period)

-- Learning Tables
Analytics (user_id, operation_type, accuracy_rate, last_updated)
Progress (user_id, skill_area, proficiency_level)

-- Competitive Tables
Tournaments (id, name, prize_pool, status)
Participants (tournament_id, user_id, final_rank)
Matches (id, match_type, participants, winner_id)
```

---

## Final Notes

This document is a live development blueprint. All contributors (human or AI) must reference this for architecture, naming, design principles, and development stage scope.
