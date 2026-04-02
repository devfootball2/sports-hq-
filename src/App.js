import React, { useState, useEffect } from 'react';

const SPORTS = {
  NBA: { icon: '🏀', color: '#C9082A', slug: 'basketball/nba' },
  NFL: { icon: '🏈', color: '#D4001A', slug: 'football/nfl' },
  MLB: { icon: '⚾', color: '#002D72', slug: 'baseball/mlb' },
  NHL: { icon: '🏒', color: '#001489', slug: 'hockey/nhl' },
};

function TeamCard({ team, slug }) {
  const [expanded, setExpanded] = useState(false);
  const [games, setGames] = useState(null);

  const toggle = () => {
    setExpanded(!expanded);
    if (!expanded && !games) {
      fetch(`https://site.api.espn.com/apis/site/v2/sports/${slug}/teams/${team.id}/schedule`)
        .then(r => r.json())
        .then(data => {
          const done = (data.events || []).filter(e => e.competitions?.[0]?.status?.type?.completed);
          const last3 = done.slice(-3).reverse().map(e => {
            const comp = e.competitions[0];
            const mine = comp.competitors.find(c => String(c.id) === String(team.id));
            const opp = comp.competitors.find(c => String(c.id) !== String(team.id));
            return {
              date: e.date?.slice(0, 10) || '-',
              opponent: opp?.team?.displayName || '-',
              myScore: mine?.score || '-',
              oppScore: opp?.score || '-',
              result: mine?.winner ? 'W' : 'L',
              homeAway: mine?.homeAway === 'home' ? 'vs' : '@',
            };
          });
          setGames(last3);
        })
        .catch(() => setGames([]));
    }
  };

  const streak = games?.length ? (() => {
    let count = 0;
    const r = games[0].result;
    for (const g of games) { if (g.result === r) count++; else break; }
    return { result: r, count };
  })() : null;

  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={toggle} style={{ background: '#0d0d10', border: '1px solid #1a1a1a', borderRadius: expanded ? '10px 10px 0 0' : 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
        {team.logo && <img src={team.logo} style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{team.name}</div>
          <div style={{ fontSize: 9, color: '#444', fontFamily: 'monospace' }}>{team.abbr}</div>
        </div>
        <div style={{ textAlign: 'right', marginRight: 8 }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 16 }}>
            <span style={{ color: '#00FF87' }}>{team.wins}</span>
            <span style={{ color: '#333' }}>-</span>
            <span style={{ color: '#FF4444' }}>{team.losses}</span>
          </div>
          {streak && <div style={{ fontSize: 9, fontFamily: 'monospace', color: streak.result === 'W' ? '#00FF87' : '#FF4444' }}>{streak.count}{streak.result} STK</div>}
        </div>
        <div style={{ color: '#444', fontSize: 11 }}>{expanded ? '▲' : '▼'}</div>
      </div>
      {expanded && (
        <div style={{ background: '#09090c', border: '1px solid #333', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px 14px' }}>
          <div style={{ fontSize: 8, letterSpacing: 4, color: '#aaa', marginBottom: 10, fontFamily: 'monospace' }}>LAST 3 GAMES</div>
          {!games ? <div style={{ color: '#444', fontFamily: 'monospace', fontSize: 11 }}>Loading...</div> : games.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#111', borderRadius: 7, marginBottom: 5 }}>
              <div style={{ width: 24, height: 24, borderRadius: 4, background: g.result === 'W' ? '#00FF8720' : '#FF444420', border: `1px solid ${g.result === 'W' ? '#00FF87' : '#FF4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, fontFamily: 'monospace', color: g.result === 'W' ? '#00FF87' : '#FF4444', flexShrink: 0 }}>{g.result}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: '#666', fontFamily: 'monospace' }}>{g.homeAway} </span>
                <span style={{ fontSize: 10, color: '#ccc', fontFamily: 'monospace' }}>{g.opponent}</span>
              </div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#aaa' }}>{g.myScore}-{g.oppScore}</div>
              <div style={{ fontSize: 9, color: '#444', fontFamily: 'monospace' }}>{g.date}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [sport, setSport] = useState('NBA');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    setTeams([]);
    fetch(`https://site.api.espn.com/apis/site/v2/sports/${SPORTS[sport].slug}/teams?limit=50`)
      .then(r => r.json())
      .then(data => {
        const list = data.sports?.[0]?.leagues?.[0]?.teams || [];
        setTeams(list.map(t => ({
          id: t.team.id,
          name: t.team.displayName,
          abbr: t.team.abbreviation,
          logo: t.team.logos?.[0]?.href || '',
          wins: t.team.record?.items?.[0]?.stats?.find(s => s.name === 'wins')?.value || 0,
          losses: t.team.record?.items?.[0]?.stats?.find(s => s.name === 'losses')?.value || 0,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sport]);

  const filtered = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.abbr.toLowerCase().includes(search.toLowerCase()));
  const active = SPORTS[sport];

  return (
    <div style={{ minHeight: '100vh', background: '#070709', color: '#e0e0e0', maxWidth: 520, margin: '0 auto', fontFamily: 'monospace' }}>
      <div style={{ background: `linear-gradient(180deg, ${active.color}18 0%, transparent 100%)`, borderBottom: '1px solid #111', padding: '20px 16px 0', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)', backgroundColor: '#070709dd' }}>
        <div style={{ fontSize: 9, letterSpacing: 5, color: active.color, marginBottom: 2 }}>DEVIN'S</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 1, marginBottom: 14 }}>{active.icon} SPORTS HQ</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
          {Object.entries(SPORTS).map(([k, v]) => (
            <button key={k} onClick={() => { setSport(k); setSearch(''); }} style={{ padding: '10px 4px', background: sport === k ? v.color : '#111', border: `1px solid ${sport === k ? v.color : '#1e1e1e'}`, borderBottom: 'none', borderRadius: '6px 6px 0 0', color: '#fff', cursor: 'pointer', fontSize: 18 }}>{v.icon}</button>
          ))}
        </div>
      </div>
      <div style={{ borderTop: `2px solid ${active.color}`, padding: '14px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team..." style={{ width: '100%', background: '#0e0e11', border: '1px solid #1c1c1c', color: '#fff', padding: '9px 12px', borderRadius: 8, fontSize: 12, marginBottom: 14, boxSizing: 'border-box', fontFamily: 'monospace' }} />
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#333' }}>LOADING...</div> : filtered.map(t => <TeamCard key={t.id} team={t} slug={active.slug} />)}
      </div>
    </div>
  );
}


