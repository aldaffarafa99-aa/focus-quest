import React, { useState } from 'react';
import { getRankInfo } from '../utils/bosses';
import { soundManager } from '../utils/audio';

export default function Navbar({
  xp,
  coins,
  streak,
  soundMuted,
  setSoundMuted,
  onOpenShop,
  onResetData
}) {
  const [isRainActive, setIsRainActive] = useState(false);
  const rank = getRankInfo(xp);

  const prevXp = rank.minXp;
  const nextXp = rank.maxXp;
  const currentLevelProgress = Math.min(100, Math.max(0, ((xp - prevXp) / (nextXp - prevXp)) * 100));

  const handleToggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundManager.setMuted(next);
    if (!next) soundManager.playClick();
  };

  const handleToggleRain = () => {
    const active = soundManager.toggleAmbientNoise();
    setIsRainActive(active);
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(11, 17, 32, 0.85)',
      backdropFilter: 'blur(14px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
          }}>
            ⚔️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '19px', fontWeight: '800', color: '#fff', margin: 0, lineHeight: 1.2 }}>
                FocusQuest <span style={{ color: '#818cf8', fontSize: '15px' }}>RPG</span>
              </h1>
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.4)'
              }}>
                v2.0
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Kalahkan Monster Prokrastinasi
            </p>
          </div>
        </div>

        {/* Center / Right Player Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          {/* Streak Badge */}
          <div className="badge-pill" style={{ borderColor: 'rgba(245, 158, 11, 0.35)', color: '#fbbf24' }}>
            <span style={{ fontSize: '14px' }}>🔥</span>
            <span>{streak} Hari Konsisten</span>
          </div>

          {/* Coins Pouch */}
          <div className="badge-pill" style={{ borderColor: 'rgba(234, 179, 8, 0.35)', color: '#fef08a' }}>
            <span style={{ fontSize: '14px' }}>🪙</span>
            <span style={{ fontWeight: '700' }}>{coins} Koin</span>
          </div>

          {/* Player Level & XP Gauge */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ fontSize: '24px' }}>{rank.icon}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', fontSize: '12px' }}>
                <span style={{ color: rank.color, fontWeight: '800' }}>
                  Lv.{rank.level} {rank.title}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  {xp} XP
                </span>
              </div>
              <div className="progress-track" style={{ width: '130px', height: '6px', marginTop: '4px' }}>
                <div
                  className="progress-fill-xp"
                  style={{ width: `${currentLevelProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Control Utility Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Ambient Rain Noise */}
            <button
              onClick={handleToggleRain}
              title={isRainActive ? "Matikan Suara Hujan Fokus" : "Putar Suara Hujan Fokus (Lo-Fi Ambient)"}
              style={{
                background: isRainActive ? 'rgba(6, 182, 212, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                border: isRainActive ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
                color: isRainActive ? '#67e8f9' : 'var(--text-secondary)',
                borderRadius: '10px',
                padding: '7px 11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              <span>🌧️</span>
              <span style={{ fontSize: '11px' }}>{isRainActive ? 'Hujan ON' : 'Hujan'}</span>
            </button>

            {/* Mute/Sound Toggle */}
            <button
              onClick={handleToggleSound}
              title={soundMuted ? "Aktifkan Efek Suara SFX" : "Matikan Efek Suara"}
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '7px 10px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {soundMuted ? '🔕' : '🔔'}
            </button>

            {/* Focus Shop Modal trigger */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenShop();
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 179, 8, 0.3))',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: '#fef08a',
                borderRadius: '10px',
                padding: '7px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              <span>🛒</span>
              <span>Toko</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
