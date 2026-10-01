import React, { useEffect } from 'react';
import { soundManager } from '../utils/audio';

export default function LevelUpModal({ rank, onClose }) {
  useEffect(() => {
    soundManager.playLevelUp();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div
        className="glass-panel anim-victory"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
          border: '2px solid #818cf8',
          boxShadow: '0 0 50px rgba(99, 102, 241, 0.6)',
          borderRadius: '24px',
          padding: '36px 28px',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Confetti sparkle emoji */}
        <div style={{ fontSize: '72px', marginBottom: '8px' }}>
          🎉
        </div>

        <div style={{
          display: 'inline-block',
          background: 'rgba(99, 102, 241, 0.2)',
          border: '1px solid #818cf8',
          color: '#c7d2fe',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '12px'
        }}>
          NAIK LEVEL! LEVEL UP!
        </div>

        <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', margin: '0 0 6px 0' }}>
          Level {rank.level}
        </h2>

        <div style={{
          fontSize: '20px',
          fontWeight: '800',
          color: rank.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '26px' }}>{rank.icon}</span>
          <span>{rank.title}</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
          Dedikasimu membuahkan hasil luar biasa! Ksatria fokus kini semakin tangguh menghadapi godaan prokrastinasi.
        </p>

        {/* Stat Upgrade Banner */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DAYA SERANG FOKUS</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#34d399' }}>
              +{Math.round((rank.attackBonus - 1) * 100)}% DMG
            </div>
          </div>
          <div style={{ width: '1px', height: '30px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GELAR PROFIL</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#facc15' }}>
              ✦ {rank.title} ✦
            </div>
          </div>
        </div>

        {/* Claim Button */}
        <button
          className="btn-primary"
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          style={{ width: '100%', padding: '14px', fontSize: '16px' }}
        >
          ⚔️ Siap Lanjut Bertempur!
        </button>
      </div>
    </div>
  );
}
