import React from 'react';
import { BOSS_LIST } from '../utils/bosses';

export default function Bestiary({ defeatedStats }) {
  const totalKills = Object.values(defeatedStats || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
            📚 Bestiary: Monster Codex
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Daftar monster prokrastinasi yang telah kamu taklukkan sepanjang perjalanan belajarmu.
          </p>
        </div>

        <div className="badge-pill" style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8', padding: '6px 14px' }}>
          <span>⚔️ Total K.O: <strong>{totalKills} Monster</strong></span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {BOSS_LIST.map((boss) => {
          const kills = (defeatedStats && defeatedStats[boss.id]) || 0;
          const isUnlocked = kills > 0;

          return (
            <div
              key={boss.id}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: isUnlocked ? `1px solid ${boss.accentColor}50` : '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top kill badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px',
                  border: isUnlocked ? `1px solid ${boss.accentColor}` : '1px solid var(--border-subtle)',
                  filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(40%)'
                }}>
                  {boss.avatar}
                </div>

                <div style={{
                  background: isUnlocked ? `${boss.accentColor}25` : 'rgba(255,255,255,0.05)',
                  color: isUnlocked ? boss.accentColor : 'var(--text-muted)',
                  border: isUnlocked ? `1px solid ${boss.accentColor}40` : '1px solid transparent',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '800'
                }}>
                  {isUnlocked ? `Tersungkur: ${kills}x 🏆` : 'Belum Ditaklukkan 🔒'}
                </div>
              </div>

              {/* Boss Info */}
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: '0 0 2px 0' }}>
                {boss.name}
              </h3>
              <div style={{ fontSize: '12px', color: boss.accentColor, fontWeight: '700', marginBottom: '8px' }}>
                ✦ {boss.title} ✦
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                {boss.lore}
              </p>

              {/* Stats pill */}
              <div style={{
                display: 'flex',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'rgba(0,0,0,0.25)',
                padding: '6px 10px',
                borderRadius: '8px'
              }}>
                <span>❤️ Max HP: {boss.maxHp}</span>
                <span>•</span>
                <span>✨ EXP: +{boss.rewardXp}</span>
                <span>•</span>
                <span>🪙 Koin: +{boss.rewardCoins}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
