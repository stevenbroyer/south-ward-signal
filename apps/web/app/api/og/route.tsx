import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const MLS_TEAM_IDS: Record<string, number> = {
  'Red Bull New York': 383, 'New York Red Bulls': 383, 'New York RB': 383, 'RBNY': 383,
  'New York City FC': 3627, 'New York City': 3627,
  'Inter Miami CF': 239235, 'Inter Miami': 239235,
  'FC Cincinnati': 3636, 'Cincinnati': 3636,
  'Columbus Crew': 577, 'Charlotte FC': 260119, 'Charlotte': 260119,
  'Orlando City SC': 204, 'Orlando City': 204,
  'Philadelphia Union': 275, 'Atlanta United FC': 3645, 'Atlanta United': 3645,
  'Nashville SC': 148048, 'CF Montréal': 3736, 'CF Montreal': 3736,
  'D.C. United': 182, 'DC United': 182, 'Toronto FC': 111, 'Toronto': 111,
  'New England Revolution': 641, 'New England': 641,
  'Chicago Fire FC': 75, 'Chicago Fire': 75,
  'Los Angeles FC': 81832, 'LAFC': 81832,
  'LA Galaxy': 413, 'Seattle Sounders FC': 2649, 'Seattle Sounders': 2649,
  'Portland Timbers': 607, 'Real Salt Lake': 1062,
  'Minnesota United FC': 3639, 'Minnesota United': 3639,
  'Colorado Rapids': 179, 'FC Dallas': 583, 'Dallas': 583,
  'Austin FC': 254172, 'Austin': 254172,
  'Houston Dynamo FC': 478, 'Houston Dynamo': 478,
  'San Jose Earthquakes': 287, 'Sporting Kansas City': 323, 'Sporting KC': 323,
  'Vancouver Whitecaps FC': 292, 'Vancouver Whitecaps': 292,
  'St. Louis City SC': 267299, 'St. Louis City': 267299,
  'San Diego FC': 275650, 'San Diego': 275650,
};

function smLogoUrl(teamId: number): string {
  return `https://cdn.sportmonks.com/images/soccer/teams/${teamId % 32}/${teamId}.png`;
}

function extractTeams(title: string): [string, string] | null {
  const names = Object.keys(MLS_TEAM_IDS).sort((a, b) => b.length - a.length);
  const found: { name: string; index: number }[] = [];
  const titleLower = title.toLowerCase();
  for (const name of names) {
    const idx = titleLower.indexOf(name.toLowerCase());
    if (idx !== -1) {
      const isDuplicate = found.some(
        (f) => Math.abs(f.index - idx) < 3 || MLS_TEAM_IDS[f.name] === MLS_TEAM_IDS[name]
      );
      if (!isDuplicate) found.push({ name, index: idx });
    }
    if (found.length >= 2) break;
  }
  if (found.length < 2) return null;
  found.sort((a, b) => a.index - b.index);
  return [found[0].name, found[1].name];
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title') || 'South Ward Signal';
  const type = searchParams.get('type') || '';

  const teams = extractTeams(title);
  const homeId = teams ? MLS_TEAM_IDS[teams[0]] : null;
  const awayId = teams ? MLS_TEAM_IDS[teams[1]] : null;

  const isMatchType = type === 'match-recap' || type === 'player-ratings';
  const label = type === 'player-ratings' ? 'PLAYER RATINGS' : type === 'match-recap' ? 'MATCH RECAP' : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '630',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0A0C',
          position: 'relative',
        }}
      >
        {/* Red gradient glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(237,26,61,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Red top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#ED1A3D' }} />

        {/* Team logos for match types */}
        {isMatchType && homeId && awayId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 60, marginBottom: 40 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={smLogoUrl(homeId)} width={120} height={120} style={{ objectFit: 'contain' }} alt="" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#5D5D6B', fontSize: 14, fontFamily: 'monospace', letterSpacing: '0.2em' }}>
                {label}
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={smLogoUrl(awayId)} width={120} height={120} style={{ objectFit: 'contain' }} alt="" />
          </div>
        ) : null}

        {/* Title */}
        <div
          style={{
            display: 'flex',
            maxWidth: 900,
            textAlign: 'center',
            color: '#F5F5F7',
            fontSize: title.length > 60 ? 36 : 44,
            fontWeight: 900,
            lineHeight: 1.15,
            padding: '0 40px',
          }}
        >
          {title}
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ color: '#5D5D6B', fontSize: 14, fontFamily: 'monospace', letterSpacing: '0.15em' }}>
            SOUTH WARD SIGNAL
          </span>
          <span style={{ color: '#ED1A3D', fontSize: 14 }}>|</span>
          <span style={{ color: '#5D5D6B', fontSize: 12, fontFamily: 'monospace' }}>
            southwardsignal.com
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
