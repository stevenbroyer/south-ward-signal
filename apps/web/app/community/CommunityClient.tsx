'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PredictionForm } from '@/components/community/PredictionForm';
import { PlayerRating } from '@/components/community/PlayerRating';
import { PollCard } from '@/components/community/PollCard';
import { Leaderboard } from '@/components/community/Leaderboard';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

/* ── Mock Data ── */

const NEXT_MATCH = {
  matchId: 'match-2026-03-15',
  homeTeam: 'New York Red Bulls',
  awayTeam: 'Inter Miami',
  matchDate: 'Mar 15, 2026',
};

const PLAYERS = [
  { playerId: 'p1', playerName: 'Carlos Coronel', position: 'GK' },
  { playerId: 'p2', playerName: 'Sean Nealis', position: 'CB' },
  { playerId: 'p3', playerName: 'Emil Forsberg', position: 'AM' },
  { playerId: 'p4', playerName: 'Lewis Morgan', position: 'RW' },
  { playerId: 'p5', playerName: 'Dante Vanzeir', position: 'ST' },
];

const ACTIVE_POLL = {
  id: 'poll-001',
  question: 'Who should start at striker against Inter Miami?',
  options: [
    { label: 'Dante Vanzeir' },
    { label: 'Elias Manoel' },
    { label: 'Tom Barlow' },
  ],
  totalVotes: 247,
  results: [142, 78, 27],
  userVoted: null,
  expiresAt: '2026-03-15T00:00:00Z',
};

const SECOND_POLL = {
  id: 'poll-002',
  question: 'What is our biggest strength this season?',
  options: [
    { label: 'High press intensity' },
    { label: 'Set piece delivery' },
    { label: 'Midfield depth' },
    { label: 'Goalkeeper distribution' },
  ],
  totalVotes: 183,
  results: [89, 42, 38, 14],
  userVoted: null,
};

const LEADERBOARD_DATA = [
  { rank: 1, userId: 'u1', displayName: 'MetroBullsFan99', totalPoints: 142, exactScores: 8, correctResults: 22, totalPredictions: 34 },
  { rank: 2, userId: 'u2', displayName: 'SouthWardSteve', totalPoints: 128, exactScores: 6, correctResults: 20, totalPredictions: 34 },
  { rank: 3, userId: 'u3', displayName: 'RedBullRising', totalPoints: 115, exactScores: 5, correctResults: 19, totalPredictions: 32 },
  { rank: 4, userId: 'u4', displayName: 'ArenaNoirFC', totalPoints: 98, exactScores: 3, correctResults: 17, totalPredictions: 30 },
  { rank: 5, userId: 'u5', displayName: 'NJUltras_2015', totalPoints: 87, exactScores: 2, correctResults: 15, totalPredictions: 28 },
];

export function CommunityClient() {
  return (
    <Tabs defaultValue="predictions" className="w-full">
      <TabsList className="bg-bg-elevated border border-sws-600/30 h-auto p-1 flex-wrap gap-1">
        <TabsTrigger
          value="predictions"
          className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-red data-[state=active]:text-white data-[state=active]:shadow-none text-sws-400 px-4 py-2"
        >
          Predictions
        </TabsTrigger>
        <TabsTrigger
          value="ratings"
          className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-red data-[state=active]:text-white data-[state=active]:shadow-none text-sws-400 px-4 py-2"
        >
          Player Ratings
        </TabsTrigger>
        <TabsTrigger
          value="polls"
          className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-red data-[state=active]:text-white data-[state=active]:shadow-none text-sws-400 px-4 py-2"
        >
          Polls
        </TabsTrigger>
        <TabsTrigger
          value="leaderboard"
          className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-red data-[state=active]:text-white data-[state=active]:shadow-none text-sws-400 px-4 py-2"
        >
          Leaderboard
        </TabsTrigger>
      </TabsList>

      {/* ── Predictions Tab ── */}
      <TabsContent value="predictions" className="mt-8">
        <RevealOnScroll>
          <div className="max-w-lg">
            <h2 className="text-xl md:text-2xl font-display font-black text-sws-white mb-2">
              Next Match
            </h2>
            <p className="text-sws-400 text-sm mb-6">
              Lock in your score prediction before kickoff.
            </p>
            <PredictionForm
              matchId={NEXT_MATCH.matchId}
              homeTeam={NEXT_MATCH.homeTeam}
              awayTeam={NEXT_MATCH.awayTeam}
              matchDate={NEXT_MATCH.matchDate}
            />
          </div>
        </RevealOnScroll>
      </TabsContent>

      {/* ── Player Ratings Tab ── */}
      <TabsContent value="ratings" className="mt-8">
        <RevealOnScroll>
          <div className="max-w-2xl">
            <h2 className="text-xl md:text-2xl font-display font-black text-sws-white mb-2">
              Rate the Squad
            </h2>
            <p className="text-sws-400 text-sm mb-6">
              How did each player perform? Rate them 1-10.
            </p>
            <div className="space-y-2">
              {PLAYERS.map((player) => (
                <PlayerRating
                  key={player.playerId}
                  playerId={player.playerId}
                  playerName={player.playerName}
                  position={player.position}
                  matchId={NEXT_MATCH.matchId}
                />
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </TabsContent>

      {/* ── Polls Tab ── */}
      <TabsContent value="polls" className="mt-8">
        <RevealOnScroll>
          <div className="max-w-lg">
            <h2 className="text-xl md:text-2xl font-display font-black text-sws-white mb-2">
              Community Polls
            </h2>
            <p className="text-sws-400 text-sm mb-6">
              Have your say on the big questions.
            </p>
            <div className="space-y-4">
              <PollCard poll={ACTIVE_POLL} />
              <PollCard poll={SECOND_POLL} />
            </div>
          </div>
        </RevealOnScroll>
      </TabsContent>

      {/* ── Leaderboard Tab ── */}
      <TabsContent value="leaderboard" className="mt-8">
        <RevealOnScroll>
          <div className="max-w-3xl">
            <h2 className="text-xl md:text-2xl font-display font-black text-sws-white mb-2">
              Prediction Leaderboard
            </h2>
            <p className="text-sws-400 text-sm mb-6">
              Top predictors this season. 3 points for an exact score, 1 for the correct result.
            </p>
            <Leaderboard entries={LEADERBOARD_DATA} />
          </div>
        </RevealOnScroll>
      </TabsContent>
    </Tabs>
  );
}
