import React, { useState, useEffect, useRef } from 'react';
import { BOSS_LIST, getRankInfo } from '../utils/bosses';
import { soundManager } from '../utils/audio';

export default function BossBattle({
  xp,
  onAddXp,
  onAddCoins,
  onBossDefeated,
  instantDamageTrigger,
  onClearDamageTrigger
}) {
  const [selectedBossIndex, setSelectedBossIndex] = useState(0);
  const boss = BOSS_LIST[selectedBossIndex];

  // Boss Health
  const [bossHp, setBossHp] = useState(boss.maxHp);
  const [isHitAnim, setIsHitAnim] = useState(false);
  const [damageFloaters, setDamageFloaters] = useState([]);
  const [currentDialogue, setCurrentDialogue] = useState(boss.dialogues.idle[0]);

  // Pomodoro Timer States
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isVictory, setIsVictory] = useState(false);

  const rank = getRankInfo(xp);
  const totalSecondsRef = useRef(25 * 60);

  // Sync health when boss changes
  useEffect(() => {
    setBossHp(boss.maxHp);
    setIsVictory(false);
    setCurrentDialogue(boss.dialogues.idle[0]);
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
    totalSecondsRef.current = durationMinutes * 60;
  }, [selectedBossIndex]);

  // Handle external instant damage trigger (e.g. from completing a quest or potion)
  useEffect(() => {
    if (instantDamageTrigger && instantDamageTrigger.damage > 0) {
      applyDamageToBoss(instantDamageTrigger.damage, instantDamageTrigger.isCritical || false);
      if (onClearDamageTrigger) onClearDamageTrigger();
    }
  }, [instantDamageTrigger]);

  // Helper to spawn damage number animation
  const spawnDamageFloater = (amount, isCrit) => {
    const id = Date.now() + Math.random();
    const xOffset = Math.floor(Math.random() * 80) - 40;
    setDamageFloaters((prev) => [...prev, { id, amount, isCrit, xOffset }]);
    setTimeout(() => {
      setDamageFloaters((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  // Attack boss function
  const applyDamageToBoss = (rawDamage, forceCrit = false) => {
    if (bossHp <= 0 || isVictory) return;

    // Rank damage multiplier
    const scaledDamage = Math.max(1, Math.round(rawDamage * (rank.attackBonus || 1)));
    const isCrit = forceCrit || Math.random() < 0.25;
    const finalDamage = isCrit ? Math.round(scaledDamage * 1.5) : scaledDamage;

    if (isCrit) {
      soundManager.playCritical();
    } else {
      soundManager.playAttack();
    }

    setIsHitAnim(true);
    setTimeout(() => setIsHitAnim(false), 400);

    spawnDamageFloater(finalDamage, isCrit);

    setBossHp((prev) => {
      const nextHp = Math.max(0, prev - finalDamage);
      if (nextHp === 0) {
        handleBossDefeated();
      } else {
        const hitPhrases = boss.dialogues.hit;
        setCurrentDialogue(hitPhrases[Math.floor(Math.random() * hitPhrases.length)]);
      }
      return nextHp;
    });
  };

  const handleBossDefeated = () => {
    setIsVictory(true);
    setIsRunning(false);
    soundManager.playVictory();
    setCurrentDialogue(boss.dialogues.defeat[0]);

    // Give rewards
    onAddXp(boss.rewardXp);
    onAddCoins(boss.rewardCoins);
    onBossDefeated(boss.id);
  };

  // Timer Tick & periodic attack calculation
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;

          // Damage boss every 30 seconds of focus
          if (mode === 'focus' && next > 0 && next % 30 === 0) {
            // Periodic attack: damage is calculated based on session duration & boss maxHp
            const sliceDamage = Math.max(8, Math.round((boss.maxHp / (durationMinutes * 2)) * (rank.attackBonus || 1)));
            applyDamageToBoss(sliceDamage);
          }

          return next;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (mode === 'focus') {
        // Finished full session! If boss still has HP, land finishing critical strike!
        if (bossHp > 0) {
          applyDamageToBoss(bossHp + 10, true);
        } else {
          handleBossDefeated();
        }
      } else {
        // Break ended
        soundManager.playVictory();
        alert('☕ Waktu istirahat selesai! Energi terisi kembali, siap bertarung lagi?');
        setMode('focus');
        setTimeLeft(durationMinutes * 60);
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, bossHp, boss]);

  const toggleTimer = () => {
    soundManager.playClick();
    if (!isRunning) {
      // Starting
      setIsRunning(true);
      if (bossHp > 0) {
        setCurrentDialogue(boss.dialogues.hit[0] || 'Kekuatan fokusmu mulai membakarku!');
      }
    } else {
      // Pausing
      setIsRunning(false);
      setCurrentDialogue('Hehe, mau buka sosmed dulu ya? Godaan kemalasan menang!');
    }
  };

  const resetTimer = () => {
    soundManager.playClick();
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
    setBossHp(boss.maxHp);
    setIsVictory(false);
    setCurrentDialogue(boss.dialogues.idle[0]);
  };

  const handleSelectPreset = (minutes, newMode = 'focus') => {
    soundManager.playClick();
    setDurationMinutes(minutes);
    setMode(newMode);
    setTimeLeft(minutes * 60);
    totalSecondsRef.current = minutes * 60;
    setIsRunning(false);
    setIsVictory(false);
    setBossHp(boss.maxHp);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hpPercentage = Math.round((bossHp / boss.maxHp) * 100);
  const timerPercentage = 100 - Math.round((timeLeft / totalSecondsRef.current) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Boss Selector Tabs */}
      <div className="glass-panel" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚔️ Pilih Lawan Prokrastinasi
          </span>
          <span style={{ fontSize: '11px', color: '#818cf8' }}>
            Bonus ATK: +{Math.round((rank.attackBonus - 1) * 100)}% (Lv.{rank.level})
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {BOSS_LIST.map((b, idx) => {
            const isSelected = selectedBossIndex === idx;
            return (
              <button
                key={b.id}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedBossIndex(idx);
                }}
                style={{
                  background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                  border: isSelected ? `2px solid ${b.accentColor}` : '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '8px 10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '24px' }}>{b.avatar}</span>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: isSelected ? '#fff' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}>
                    {b.name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    HP: {b.maxHp}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Battle Stage Card */}
      <div
        className="glass-panel"
        style={{
          padding: '32px 24px',
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${boss.accentColor}40`,
          boxShadow: `0 10px 40px -10px ${boss.glowColor}`
        }}
      >
        {/* Floating Damage Text Overlay */}
        <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 30 }}>
          {damageFloaters.map((floater) => (
            <div
              key={floater.id}
              className="damage-floater"
              style={{
                left: `${floater.xOffset}px`,
                color: floater.isCrit ? '#facc15' : '#ef4444',
                fontSize: floater.isCrit ? '24px' : '18px'
              }}
            >
              {floater.isCrit ? 'CRITICAL! 💥 ' : ''}-{floater.amount} DMG
            </div>
          ))}
        </div>

        {/* Victory Overlay Modal */}
        {isVictory && (
          <div
            className="anim-victory"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              zIndex: 40,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '8px' }}>🏆</div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#facc15', margin: '0 0 6px 0' }}>
              VICTORY! MONSTER DITAKLUKKAN!
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '14px', marginBottom: '20px' }}>
              Kamu berhasil menumbangkan <strong style={{ color: '#fff' }}>{boss.name}</strong> dengan disiplin dan fokus baja!
            </p>

            {/* Bounty Card */}
            <div style={{
              display: 'flex',
              gap: '16px',
              background: 'rgba(30, 41, 59, 0.8)',
              padding: '12px 24px',
              borderRadius: '16px',
              border: '1px solid rgba(250, 204, 21, 0.3)',
              marginBottom: '24px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>EXP REWARD</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#818cf8' }}>+{boss.rewardXp} XP</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>KOIN EMAS</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#facc15' }}>+{boss.rewardCoins} 🪙</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  soundManager.playClick();
                  // Switch to next boss or reset
                  const nextIndex = (selectedBossIndex + 1) % BOSS_LIST.length;
                  setSelectedBossIndex(nextIndex);
                }}
              >
                ⚔️ Tantang Boss Berikutnya
              </button>
              <button
                className="btn-secondary"
                onClick={resetTimer}
              >
                🔄 Lawan Lagi Boss Ini
              </button>
            </div>
          </div>
        )}

        {/* Boss Display & Speech Bubble */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
          
          {/* Boss Dialog Bubble */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '8px 16px',
            fontSize: '13px',
            color: '#e2e8f0',
            maxWidth: '380px',
            marginBottom: '16px',
            position: 'relative',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            fontStyle: 'italic'
          }}>
            💬 "{currentDialogue}"
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(30, 41, 59, 0.9)'
            }} />
          </div>

          {/* Boss Avatar */}
          <div
            className={`anim-float ${isHitAnim ? 'anim-hit' : ''}`}
            style={{
              fontSize: '84px',
              userSelect: 'none',
              filter: `drop-shadow(0 0 20px ${boss.glowColor})`,
              cursor: 'pointer',
              transition: 'transform 0.1s ease'
            }}
            title="Klik untuk Serangan Instan!"
            onClick={() => {
              applyDamageToBoss(12);
            }}
          >
            {boss.avatar}
          </div>

          {/* Boss Title & Name */}
          <div style={{ marginTop: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>
              {boss.name}
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: boss.accentColor, fontWeight: '600' }}>
              ✦ {boss.title} ✦
            </p>
          </div>

          {/* Boss Health Bar */}
          <div style={{ width: '100%', maxWidth: '420px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: '700' }}>
              <span style={{ color: '#ef4444' }}>HP BOSS</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {bossHp} / {boss.maxHp} ({hpPercentage}%)
              </span>
            </div>
            <div className="progress-track" style={{ height: '14px', padding: '2px' }}>
              <div
                className="progress-fill-hp"
                style={{ width: `${hpPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pomodoro Timer Modes */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleSelectPreset(25, 'focus')}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: mode === 'focus' && durationMinutes === 25 ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
              background: mode === 'focus' && durationMinutes === 25 ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.7)',
              color: mode === 'focus' && durationMinutes === 25 ? '#a5b4fc' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ⚔️ Fokus Standar (25M)
          </button>
          <button
            onClick={() => handleSelectPreset(15, 'focus')}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: mode === 'focus' && durationMinutes === 15 ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
              background: mode === 'focus' && durationMinutes === 15 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.7)',
              color: mode === 'focus' && durationMinutes === 15 ? '#7dd3fc' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ⚡ Serangan Kilat (15M)
          </button>
          <button
            onClick={() => handleSelectPreset(50, 'focus')}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: mode === 'focus' && durationMinutes === 50 ? '1px solid #ec4899' : '1px solid var(--border-subtle)',
              background: mode === 'focus' && durationMinutes === 50 ? 'rgba(236, 72, 153, 0.25)' : 'rgba(15, 23, 42, 0.7)',
              color: mode === 'focus' && durationMinutes === 50 ? '#f472b6' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            🏰 Deep Dungeon (50M)
          </button>
          <button
            onClick={() => handleSelectPreset(5, 'break')}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: mode === 'break' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
              background: mode === 'break' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.7)',
              color: mode === 'break' ? '#6ee7b7' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ☕ Istirahat (5M)
          </button>
        </div>

        {/* Digital Clock Display */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            fontSize: '68px',
            fontWeight: '800',
            fontFamily: 'var(--font-mono)',
            color: mode === 'break' ? '#34d399' : '#f8fafc',
            letterSpacing: '2px',
            textShadow: isRunning ? '0 0 25px rgba(99, 102, 241, 0.6)' : 'none'
          }}>
            {formatTimer(timeLeft)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {mode === 'focus' ? (
              <span>🎯 Setiap 30 detik fokus melancarkan serangan otomatis ke Boss!</span>
            ) : (
              <span>🌿 Istirahatkan mata & pikiranmu, jangan buka sosmed dulu!</span>
            )}
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
          <button
            className="btn-primary"
            onClick={toggleTimer}
            style={{ minWidth: '170px', fontSize: '15px' }}
          >
            {isRunning ? '⏸️ Jeda Pertempuran' : '▶️ Mulai Fokus & Serang'}
          </button>

          <button
            className="btn-secondary"
            onClick={resetTimer}
            title="Reset Timer & Reset Boss"
          >
            🔄 Reset
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              applyDamageToBoss(15);
            }}
            title="Serangan Manual Fokus (+15 DMG)"
            style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
          >
            ⚔️ Serang Manual
          </button>
        </div>

      </div>

    </div>
  );
}
