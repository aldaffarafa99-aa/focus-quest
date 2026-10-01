import { useCallback, useEffect, useState } from 'react';

const XP_PER_LEVEL = 200;
const STORAGE_PREFIX = 'fq_';

const RANKS = [
  { min: 1, max: 3, title: 'Novice Scholar', mascot: '🐣', color: '#a8b5c4' },
  { min: 4, max: 7, title: 'Apprentice Mage', mascot: '🦊', color: '#f2b84b' },
  { min: 8, max: 11, title: 'Adept Strategist', mascot: '🦅', color: '#63c6b4' },
  { min: 12, max: 99, title: 'Grandmaster Archmage', mascot: '🐉', color: '#f27b70' },
];

const MESSAGES = [
  'Satu sesi fokus lebih berharga daripada rencana sempurna.',
  'Langkah kecil hari ini adalah momentum untuk besok.',
  'Kamu sedang menempa versi dirimu yang lebih tangguh.',
  'Tarik napas. Pilih satu quest. Mulai dari sana.',
  'Fokus adalah sihir yang bisa kamu latih setiap hari.',
];

const ENEMIES = [
  { name: 'Raksasa Kemalasan', icon: '🦥', xp: 80 },
  { name: 'Iblis Doomscroll', icon: '📱', xp: 100 },
  { name: 'Naga Overthinking', icon: '🌀', xp: 130 },
  { name: 'Raja Prokrastinasi', icon: '⏳', xp: 180 },
];

const SKILLS = [
  { id: 'doubler', name: 'XP Booster 2x', icon: '✦', cost: 50, description: 'Gandakan XP dari quest dan sesi fokus selama 15 menit.', color: '#e8bd70' },
  { id: 'freeze', name: 'Timer Freeze', icon: '❄', cost: 35, description: 'Bekukan hitungan timer fokus selama 5 menit.', color: '#88a8e8' },
  { id: 'rest', name: 'Quick Rest', icon: '◷', cost: 30, description: 'Selesaikan waktu istirahat sekarang, atau pulihkan 20 energi.', color: '#70c9ad' },
  { id: 'shield', name: 'Streak Shield', icon: '⬡', cost: 40, description: 'Lindungi streak dari satu sesi fokus yang dibatalkan.', color: '#e18b77' },
];

const INITIAL_TASKS = [
  { id: 1, text: 'Rangkum catatan kuliah bab 3', done: false, boss: false, reward: 30 },
  { id: 2, text: 'Kerjakan 5 soal latihan matematika', done: false, boss: true, enemy: 0, reward: 80 },
  { id: 3, text: 'Hafalkan 10 kosa kata bahasa Inggris', done: true, boss: false, reward: 25 },
];

const load = (key, fallback) => {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
};

const save = (key, value) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
};

let audioContext;
const playTone = (frequency, delay = 0, duration = 0.12, type = 'sine') => {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  } catch {
    // Audio is an enhancement; the app remains usable when Web Audio is blocked.
  }
};

const sound = {
  click: () => playTone(560, 0, 0.05),
  xp: () => { playTone(520); playTone(760, 0.08); },
  buy: () => { playTone(600); playTone(780, 0.08); playTone(960, 0.16); },
  level: () => [523, 659, 784, 1047].forEach((note, index) => playTone(note, index * 0.09, 0.22)),
};

const getRank = (level) => RANKS.find((rank) => level >= rank.min && level <= rank.max) || RANKS[0];
const getMessage = () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [xp, setXp] = useState(() => load('xp', 0));
  const [level, setLevel] = useState(() => load('level', 1));
  const [earnedXp, setEarnedXp] = useState(() => load('earnedXp', load('xp', 0)));
  const [tasks, setTasks] = useState(() => load('tasks', INITIAL_TASKS));
  const [inventory, setInventory] = useState(() => ({ doubler: 0, freeze: 0, rest: 0, shield: 0, ...load('skills', {}) }));
  const [doublerUntil, setDoublerUntil] = useState(() => load('doublerUntil', 0));
  const [freezeUntil, setFreezeUntil] = useState(() => load('freezeUntil', 0));
  const [shieldArmed, setShieldArmed] = useState(() => load('shieldArmed', false));
  const [streak, setStreak] = useState(() => load('streak', 3));
  const [hp, setHp] = useState(() => load('hp', 100));
  const [energy, setEnergy] = useState(() => load('energy', 100));
  const [soundOn, setSoundOn] = useState(() => load('soundOn', true));
  const [tab, setTab] = useState('timer');
  const [timerMode, setTimerMode] = useState(() => load('timerMode', 'work'));
  const [timeLeft, setTimeLeft] = useState(() => load('timeLeft', 25 * 60));
  const [running, setRunning] = useState(() => load('running', false));
  const [sessionStarted, setSessionStarted] = useState(() => load('sessionStarted', false));
  const [longBreak, setLongBreak] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [isBoss, setIsBoss] = useState(false);
  const [enemyIndex, setEnemyIndex] = useState(0);
  const [mascotMessage, setMascotMessage] = useState(getMessage);
  const [bossMessage, setBossMessage] = useState(null);
  const [levelToast, setLevelToast] = useState(false);
  const [now, setNow] = useState(0);

  const rank = getRank(level);
  const activeDoubler = doublerUntil > now;
  const timerFrozen = freezeUntil > now;
  const xpProgress = earnedXp % XP_PER_LEVEL;
  const activeQuests = tasks.filter((task) => !task.done).length;
  const totalSeconds = timerMode === 'work' ? 25 * 60 : timerMode === 'break' ? 5 * 60 : 15 * 60;
  const timerProgress = Math.min(100, Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  useEffect(() => {
    const values = { xp, level, earnedXp, tasks, skills: inventory, doublerUntil, freezeUntil, shieldArmed, streak, hp, energy, soundOn, timerMode, timeLeft, running, sessionStarted };
    Object.entries(values).forEach(([key, value]) => save(key, value));
  }, [xp, level, earnedXp, tasks, inventory, doublerUntil, freezeUntil, shieldArmed, streak, hp, energy, soundOn, timerMode, timeLeft, running, sessionStarted]);

  useEffect(() => {
    const syncClock = () => setNow(Date.now());
    const initialSync = window.setTimeout(syncClock, 0);
    const timer = window.setInterval(syncClock, 1000);
    return () => {
      window.clearTimeout(initialSync);
      window.clearInterval(timer);
    };
  }, []);

  const awardXP = useCallback((amount) => {
    const total = Math.round(amount * (activeDoubler ? 2 : 1));
    if (soundOn) sound.xp();
    setEarnedXp((previous) => previous + total);
    setXp((previous) => {
      const next = previous + total;
      const nextLevel = Math.floor((earnedXp + total) / XP_PER_LEVEL) + 1;
      setLevel((current) => {
        if (nextLevel > current) {
          setLevelToast(true);
          if (soundOn) window.setTimeout(sound.level, 120);
          window.setTimeout(() => setLevelToast(false), 2600);
          setMascotMessage(getMessage());
        }
        return nextLevel;
      });
      return next;
    });
  }, [activeDoubler, earnedXp, soundOn]);

  useEffect(() => {
    if (!running) return undefined;
    if (timerMode === 'work' && timerFrozen) return undefined;
    const timer = window.setTimeout(() => {
      if (timeLeft <= 1) {
        setRunning(false);
        setSessionStarted(false);
        if (timerMode === 'work') {
          awardXP(50);
          setStreak((previous) => previous + 1);
          setHp((previous) => Math.min(100, previous + 5));
          setEnergy((previous) => Math.min(100, previous + 30));
          setTimerMode(longBreak ? 'long' : 'break');
          setTimeLeft(longBreak ? 15 * 60 : 5 * 60);
          setLongBreak((previous) => !previous);
        } else {
          setTimerMode('work');
          setTimeLeft(25 * 60);
        }
      } else {
        setTimeLeft((previous) => previous - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [running, timeLeft, timerMode, longBreak, timerFrozen, awardXP]);

  const play = () => {
    if (soundOn) sound.click();
    if (running) {
      setRunning(false);
      return;
    }
    if (timerMode === 'work' && !sessionStarted) {
      if (energy < 20) return;
      setEnergy((previous) => Math.max(0, previous - 20));
      setSessionStarted(true);
    }
    setRunning(true);
  };

  const setMode = (mode) => {
    if (soundOn) sound.click();
    setRunning(false);
    setSessionStarted(false);
    setTimerMode(mode);
    setTimeLeft(mode === 'work' ? 25 * 60 : mode === 'break' ? 5 * 60 : 15 * 60);
  };

  const resetTimer = () => {
    if (soundOn) sound.click();
    if (sessionStarted && timerMode === 'work' && timeLeft < 25 * 60) {
      if (shieldArmed) {
        setShieldArmed(false);
      } else {
        setStreak((previous) => Math.max(0, previous - 1));
        setHp((previous) => Math.max(0, previous - 10));
      }
    }
    setRunning(false);
    setSessionStarted(false);
    setTimeLeft(timerMode === 'work' ? 25 * 60 : timerMode === 'break' ? 5 * 60 : 15 * 60);
  };

  const handleUseSkill = (skillId) => {
    if (!inventory[skillId]) return;
    if (soundOn) sound.click();
    setInventory((previous) => ({ ...previous, [skillId]: previous[skillId] - 1 }));
    if (skillId === 'doubler') {
      setDoublerUntil(now + 15 * 60 * 1000);
    } else if (skillId === 'freeze') {
      setFreezeUntil(now + 5 * 60 * 1000);
    } else if (skillId === 'rest') {
      if (timerMode === 'break' || timerMode === 'long') {
        setRunning(false);
        setTimerMode('work');
        setTimeLeft(25 * 60);
      } else {
        setEnergy((previous) => Math.min(100, previous + 20));
      }
    } else if (skillId === 'shield') {
      setShieldArmed(true);
    }
  };

  const buySkill = (skill) => {
    if (xp < skill.cost) return;
    if (soundOn) sound.buy();
    setXp((previous) => previous - skill.cost);
    setInventory((previous) => ({ ...previous, [skill.id]: (previous[skill.id] || 0) + 1 }));
  };

  const addTask = (event) => {
    event.preventDefault();
    if (!newTask.trim()) return;
    if (soundOn) sound.click();
    const enemy = ENEMIES[enemyIndex];
    setTasks((previous) => [{ id: Date.now(), text: newTask.trim(), done: false, boss: isBoss, enemy: enemyIndex, reward: isBoss ? enemy.xp : 30 }, ...previous]);
    setNewTask('');
  };

  const completeTask = (task) => {
    if (task.done) return;
    setTasks((previous) => previous.map((item) => item.id === task.id ? { ...item, done: true } : item));
    if (task.boss) {
      const enemy = ENEMIES[task.enemy || 0];
      setBossMessage({ enemy, xp: task.reward * 2 * (activeDoubler ? 2 : 1) });
      setHp((previous) => Math.min(100, previous + 15));
      window.setTimeout(() => setBossMessage(null), 2800);
    }
    awardXP(task.reward * (task.boss ? 2 : 1));
  };

  const container = { width: 'min(100% - 40px, 1050px)', margin: '0 auto' };
  const panel = { background: 'rgba(21, 31, 42, .86)', border: '1px solid rgba(202, 218, 218, .12)', borderRadius: 16, boxShadow: '0 18px 55px rgba(0,0,0,.16)' };
  const button = { border: 0, borderRadius: 9, padding: '11px 16px', fontWeight: 750, cursor: 'pointer', color: '#102421', background: '#a8dfc5', transition: 'transform .18s ease, background .18s ease' };
  const quietButton = { ...button, background: 'rgba(226, 237, 232, .08)', border: '1px solid rgba(226, 237, 232, .14)', color: '#e1e9e4' };

  return (
    <div style={{ minHeight: '100vh', color: '#e8eeea', background: 'radial-gradient(ellipse at 82% 4%, rgba(106, 153, 122, .19), transparent 35%), radial-gradient(ellipse at 8% 75%, rgba(199, 153, 91, .10), transparent 34%), #101816', fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        *{box-sizing:border-box} button,input,select{font:inherit} button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #e6c783;outline-offset:3px}
        @keyframes fq-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fq-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes fq-pop{0%{opacity:0;transform:translate(-50%,-45%) scale(.9)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes fq-ko{0%{transform:scale(1) rotate(0)}35%{transform:scale(1.24) rotate(-12deg)}70%{transform:scale(.78) rotate(12deg);opacity:.55}100%{transform:scale(.2) rotate(25deg);opacity:0}}
        @media(max-width:680px){.fq-hero{grid-template-columns:1fr!important;padding-top:50px!important}.fq-hero-art{display:none!important}.fq-feature-grid{grid-template-columns:1fr!important}.fq-header-actions{width:100%;justify-content:space-between}.fq-tabs{overflow:auto}.fq-tab{white-space:nowrap}.fq-content-grid{grid-template-columns:1fr!important}.fq-task-row{align-items:flex-start!important}.fq-desktop-label{display:none}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
      `}</style>

      <header style={{ borderBottom: '1px solid rgba(218, 231, 220, .1)', background: 'rgba(14, 22, 19, .82)', position: 'sticky', top: 0, zIndex: 5, backdropFilter: 'blur(16px)' }}>
        <div style={{ ...container, minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '10px 0' }}>
          <button onClick={() => { if (soundOn) sound.click(); setPage('dashboard'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, border: 0, background: 'transparent', color: '#f0f1e9', cursor: 'pointer', padding: 0 }} aria-label="FocusQuest dashboard">
            <span style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, background: '#d3ad69', color: '#18221d', borderRadius: 11, fontSize: 20 }}>✦</span>
            <span style={{ textAlign: 'left' }}><strong style={{ display: 'block', fontSize: 17, letterSpacing: '.02em' }}>FOCUSQUEST</strong><small style={{ color: '#9caea3', fontSize: 10, letterSpacing: '.16em' }}>MAKE FOCUS YOUR MAGIC</small></span>
          </button>
          <div className="fq-header-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, flex: 1, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 180 }}>
              <span style={{ fontSize: 29, width: 40, textAlign: 'center' }}>{rank.mascot}</span>
              <div><strong style={{ display: 'block', color: rank.color, fontSize: 12 }}>Lv. {level} · {rank.title}</strong><span style={{ color: '#c3cec5', fontSize: 11 }}>✦ {xp} XP</span></div>
            </div>
            <div style={{ display: 'grid', gap: 6, width: 'min(100%, 310px)' }}>
              {[[`HP ${hp}/100`, hp, '#e17770'], [`ENERGY ${energy}/100`, energy, '#79c9a7'], [`XP ${xpProgress}/${XP_PER_LEVEL}`, xpProgress / XP_PER_LEVEL * 100, '#d3ad69']].map(([label, value, color]) => <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aab8ae', fontSize: 9, fontWeight: 800, letterSpacing: '.08em', marginBottom: 3 }}><span>{label}</span></div>
                <div style={{ height: 5, background: '#34423b', borderRadius: 9, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: color, transition: 'width .35s ease' }} /></div>
              </div>)}
            </div>
            <button style={{ ...quietButton, padding: '9px 12px' }} onClick={() => setSoundOn((previous) => !previous)} aria-label={soundOn ? 'Matikan suara' : 'Nyalakan suara'}>{soundOn ? '♫' : '♪'}</button>
          </div>
        </div>
      </header>

      {page === 'landing' ? (
        <main>
          <section className="fq-hero" style={{ ...container, minHeight: 'min(720px, calc(100vh - 74px))', display: 'grid', gridTemplateColumns: '1.12fr .88fr', alignItems: 'center', gap: 48, padding: '72px 0 88px', animation: 'fq-rise .7s ease both' }}>
            <div>
              <div style={{ display: 'inline-flex', gap: 9, alignItems: 'center', padding: '7px 11px', border: '1px solid rgba(211,173,105,.38)', borderRadius: 99, color: '#e2c58d', fontSize: 11, letterSpacing: '.13em', fontWeight: 800, textTransform: 'uppercase' }}><span>✧</span> Your focus, reimagined</div>
              <h1 style={{ maxWidth: 650, margin: '24px 0 18px', fontSize: 'clamp(48px, 7vw, 82px)', lineHeight: .99, letterSpacing: '-.045em', color: '#f2f0e7' }}>Ubah fokus jadi <span style={{ color: '#d3ad69' }}>kekuatan.</span></h1>
              <p style={{ maxWidth: 520, margin: '0 0 30px', color: '#aab8ae', lineHeight: 1.8, fontSize: 17 }}>Selesaikan tugas, kumpulkan XP, dan naikkan rank. Perjalanan belajar yang terasa seperti petualangan, satu quest pada satu waktu.</p>
              <button style={{ ...button, padding: '15px 21px', background: '#d3ad69', fontSize: 15 }} onClick={() => { if (soundOn) sound.click(); setPage('dashboard'); }}>Mulai Quest Sekarang <span aria-hidden="true"> ↗</span></button>
              <div style={{ display: 'flex', gap: 20, marginTop: 38, color: '#a9b8ab', fontSize: 12, flexWrap: 'wrap' }}><span>◉ Fokus terukur</span><span>◇ Progress tersimpan</span><span>✦ Reward nyata</span></div>
            </div>
            <div className="fq-hero-art" style={{ minHeight: 410, position: 'relative', display: 'grid', placeItems: 'center' }}>
              <div style={{ position: 'absolute', width: 'min(92%, 390px)', aspectRatio: '1', border: '1px solid rgba(211,173,105,.27)', borderRadius: '50%', boxShadow: '0 0 0 34px rgba(211,173,105,.025), 0 0 0 70px rgba(211,173,105,.018)' }} />
              <div style={{ fontSize: 150, filter: 'drop-shadow(0 20px 35px rgba(0,0,0,.35))', animation: 'fq-bob 4s ease-in-out infinite', zIndex: 1 }}>🦊</div>
              <div style={{ ...panel, position: 'absolute', right: 0, top: 62, padding: '13px 16px', animation: 'fq-rise .8s .15s both' }}><small style={{ color: '#a5b5aa' }}>CURRENT QUEST</small><div style={{ marginTop: 4, fontWeight: 800 }}>Deep work · 25 min</div></div>
              <div style={{ ...panel, position: 'absolute', left: 0, bottom: 56, padding: '13px 16px', animation: 'fq-rise .8s .3s both' }}><small style={{ color: '#a5b5aa' }}>LEVEL PROGRESS</small><div style={{ color: '#e1c07e', fontWeight: 800, marginTop: 4 }}>✦ 120 / 200 XP</div></div>
              <div style={{ position: 'absolute', top: '16%', left: '13%', color: '#ddc17f', fontSize: 24 }}>✧</div><div style={{ position: 'absolute', bottom: '18%', right: '12%', color: '#91bea8', fontSize: 18 }}>✦</div>
            </div>
          </section>

          <section style={{ borderTop: '1px solid rgba(218,231,220,.1)', background: 'rgba(220,235,221,.025)', padding: '56px 0 72px' }}>
            <div style={container}>
              <div style={{ marginBottom: 25 }}><small style={{ color: '#d3ad69', letterSpacing: '.15em', fontWeight: 800 }}>THE QUEST SYSTEM</small><h2 style={{ fontSize: 27, margin: '8px 0 0' }}>Kebiasaan baik, dengan sedikit keajaiban.</h2></div>
              <div className="fq-feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  ['01', 'RPG Leveling System', 'Setiap progres menambah XP. Naik level dan temukan rank baru sepanjang perjalananmu.', '✧', '#d3ad69'],
                  ['02', 'Focus Timer & Boosters', 'Bangun ritme fokus dengan timer dan gunakan skill untuk memperkuat sesi.', '◷', '#81c9ab'],
                  ['03', 'Quest Log & Boss Battles', 'Ubah daftar tugas menjadi quest. Hadapi boss untuk meraih reward XP dua kali lipat.', '⚔', '#e18b77'],
                ].map(([number, title, description, icon, color]) => <article key={number} style={{ ...panel, borderRadius: 12, padding: 22, minHeight: 185 }}><div style={{ display: 'flex', justifyContent: 'space-between', color, fontWeight: 800 }}><span>{number} / FEATURE</span><span style={{ fontSize: 21 }}>{icon}</span></div><h3 style={{ fontSize: 17, margin: '18px 0 8px', color: '#eff2e9' }}>{title}</h3><p style={{ margin: 0, color: '#aab7ad', fontSize: 13, lineHeight: 1.7 }}>{description}</p></article>)}
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main style={{ ...container, padding: '30px 0 68px', animation: 'fq-rise .45s ease both' }}>
          <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 22 }}>
            <div><div style={{ color: '#d3ad69', fontSize: 11, fontWeight: 800, letterSpacing: '.15em' }}>PLAYER DASHBOARD</div><h1 style={{ fontSize: 28, margin: '5px 0 0' }}>Petualangan berlanjut.</h1></div>
            <div style={{ ...panel, padding: '11px 15px', minWidth: 205 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, fontSize: 12 }}><strong style={{ color: rank.color }}>Lv. {level} · {rank.title}</strong><span style={{ color: '#c3cec5' }}>{xpProgress}/{XP_PER_LEVEL} XP</span></div><div style={{ height: 5, background: '#33413a', borderRadius: 8, marginTop: 8, overflow: 'hidden' }}><div style={{ width: `${xpProgress / XP_PER_LEVEL * 100}%`, height: '100%', background: '#d3ad69', transition: 'width .3s' }} /></div></div>
          </section>

          <section style={{ ...panel, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <span style={{ fontSize: 32, animation: 'fq-bob 3s ease-in-out infinite' }}>{rank.mascot}</span><div style={{ flex: 1 }}><strong style={{ display: 'block', color: rank.color, fontSize: 12 }}>{rank.title} · 🔥 {streak} streak</strong><span style={{ color: '#c3cec5', fontSize: 13 }}>{mascotMessage}</span></div><button style={{ ...quietButton, padding: '8px 11px' }} title="Pesan motivasi baru" onClick={() => { if (soundOn) sound.click(); setMascotMessage(getMessage()); }}>↻</button>
          </section>

          <nav className="fq-tabs" aria-label="Dashboard" style={{ display: 'flex', gap: 6, padding: 5, borderRadius: 11, background: 'rgba(226,237,232,.055)', width: 'fit-content', maxWidth: '100%', marginBottom: 18 }}>
            {[['timer', '◷ Focus Timer'], ['quests', `☷ Quest Log · ${activeQuests}`], ['skills', '✦ Skill Shop']].map(([key, label]) => <button className="fq-tab" key={key} onClick={() => { if (soundOn) sound.click(); setTab(key); }} style={{ ...button, padding: '9px 14px', background: tab === key ? '#d3ad69' : 'transparent', color: tab === key ? '#15211b' : '#bac7bd' }}>{label}</button>)}
          </nav>

          {tab === 'timer' && <div className="fq-content-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(230px, .8fr)', gap: 16 }}>
            <section style={{ ...panel, padding: 'clamp(20px, 4vw, 34px)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>{[['work', 'Fokus', '25 min'], ['break', 'Rehat', '5 min'], ['long', 'Rehat panjang', '15 min']].map(([mode, title, duration]) => <button key={mode} onClick={() => setMode(mode)} style={{ ...quietButton, padding: '8px 12px', background: timerMode === mode ? 'rgba(211,173,105,.18)' : 'transparent', color: timerMode === mode ? '#e5c77f' : '#aab8ae', borderColor: timerMode === mode ? 'rgba(211,173,105,.4)' : 'rgba(226,237,232,.12)' }}>{title} <small>{duration}</small></button>)}</div>
              <div style={{ fontSize: 'clamp(62px, 13vw, 92px)', lineHeight: 1.2, margin: '24px 0 15px', fontVariantNumeric: 'tabular-nums', fontWeight: 750, letterSpacing: '.025em', color: timerMode === 'work' ? '#eff2e9' : '#9ed6bb' }}>{formatTime(timeLeft)}</div>
              <div style={{ height: 5, borderRadius: 9, background: '#34423b', maxWidth: 440, margin: '0 auto 15px', overflow: 'hidden' }}><div style={{ width: `${timerProgress}%`, height: '100%', background: timerMode === 'work' ? '#d3ad69' : '#75c4a4', transition: 'width 1s linear' }} /></div>
              <p style={{ color: '#aebbb1', fontSize: 13, marginBottom: 20 }}>{timerMode === 'work' ? `Selesaikan sesi untuk mendapatkan ${activeDoubler ? '+100 XP' : '+50 XP'}.` : 'Istirahat sejenak. Progresmu menunggu.'}</p>
              {timerFrozen && timerMode === 'work' && <p style={{ color: '#88a8e8', fontSize: 12, margin: '0 0 12px' }}>❄ Timer Freeze aktif · {Math.ceil((freezeUntil - now) / 60000)} menit tersisa</p>}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 9 }}><button style={{ ...button, minWidth: 160, background: '#d3ad69', opacity: !running && timerMode === 'work' && !sessionStarted && energy < 20 ? .5 : 1 }} onClick={play} disabled={!running && timerMode === 'work' && !sessionStarted && energy < 20}>{running ? 'Ⅱ  Jeda sesi' : '▶  Mulai fokus'}</button><button style={quietButton} aria-label="Reset timer" title="Reset timer" onClick={resetTimer}>↺</button></div>
            </section>
            <aside style={{ ...panel, padding: 20 }}><div style={{ color: '#d3ad69', fontWeight: 800, fontSize: 11, letterSpacing: '.14em' }}>ACTIVE EFFECTS</div><div style={{ display: 'grid', gap: 10, marginTop: 13 }}>
              <div style={{ background: 'rgba(226,237,232,.045)', borderRadius: 9, padding: 12 }}><strong style={{ fontSize: 13 }}>✦ XP Booster 2x</strong><div style={{ color: '#9eada2', fontSize: 12, marginTop: 5 }}>{activeDoubler ? `Aktif · ${Math.ceil((doublerUntil - now) / 60000)} menit tersisa` : 'Belum aktif'}</div></div>
              <div style={{ background: 'rgba(226,237,232,.045)', borderRadius: 9, padding: 12 }}><strong style={{ fontSize: 13 }}>❄ Timer Freeze</strong><div style={{ color: '#9eada2', fontSize: 12, marginTop: 5 }}>{timerFrozen ? `Timer dibekukan · ${Math.ceil((freezeUntil - now) / 60000)} menit tersisa` : 'Belum aktif'}</div></div>
              <div style={{ background: 'rgba(226,237,232,.045)', borderRadius: 9, padding: 12 }}><strong style={{ fontSize: 13 }}>⬡ Streak Shield</strong><div style={{ color: '#9eada2', fontSize: 12, marginTop: 5 }}>{shieldArmed ? 'Siap melindungi streak' : 'Tidak dipasang'}</div></div>
              <div style={{ color: '#aab8ae', fontSize: 12, lineHeight: 1.7, padding: '5px 2px' }}>Quest aktif: <strong style={{ color: '#e8eeea' }}>{activeQuests}</strong><br />Skill tersimpan: <strong style={{ color: '#e8eeea' }}>{Object.values(inventory).reduce((sum, count) => sum + count, 0)}</strong></div>
              <button style={{ ...quietButton, width: '100%' }} onClick={() => setTab('skills')}>Buka inventaris skill ↗</button>
            </div></aside>
          </div>}

          {tab === 'quests' && <section style={{ ...panel, padding: 'clamp(17px, 4vw, 26px)' }}>
            <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}><div><div style={{ color: '#d3ad69', fontSize: 11, letterSpacing: '.14em', fontWeight: 800 }}>YOUR ADVENTURE</div><h2 style={{ fontSize: 21, margin: '5px 0 0' }}>Quest Log</h2></div><div style={{ color: '#aab8ae', fontSize: 12 }}>{activeQuests} quest tersisa</div></div>
            <form onSubmit={addTask} style={{ display: 'grid', gap: 10, marginBottom: 17 }}><div style={{ display: 'flex', gap: 8 }}><input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Tulis quest berikutnya..." aria-label="Nama quest" style={{ flex: 1, minWidth: 0, border: '1px solid rgba(226,237,232,.14)', borderRadius: 9, background: '#101a16', padding: '11px 13px', color: '#edf1eb' }} /><button type="submit" style={{ ...button, background: '#d3ad69' }}>Tambah +</button></div><div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}><label style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 13, color: '#bdc8bd' }}><input type="checkbox" checked={isBoss} onChange={(event) => setIsBoss(event.target.checked)} /> Boss Quest · XP 2×</label>{isBoss && <select value={enemyIndex} onChange={(event) => setEnemyIndex(Number(event.target.value))} style={{ background: '#18241e', color: '#e7ece5', border: '1px solid rgba(226,237,232,.15)', borderRadius: 8, padding: '7px 9px' }}>{ENEMIES.map((enemy, index) => <option key={enemy.name} value={index}>{enemy.icon} {enemy.name} · {enemy.xp} XP</option>)}</select>}</div></form>
            <div style={{ display: 'grid', gap: 8 }}>{tasks.length === 0 && <p style={{ color: '#aab8ae', textAlign: 'center', padding: 22 }}>Belum ada quest. Buat misi pertamamu.</p>}{tasks.map((task) => <div className="fq-task-row" key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px', background: '#131e19', border: `1px solid ${task.boss && !task.done ? 'rgba(211,173,105,.45)' : 'rgba(226,237,232,.08)'}`, borderRadius: 10, opacity: task.done ? .56 : 1 }}>
              <button aria-label={task.done ? 'Quest selesai' : 'Selesaikan quest'} onClick={() => completeTask(task)} style={{ flex: '0 0 23px', height: 23, border: `1px solid ${task.done ? '#77c49e' : '#86988a'}`, background: task.done ? '#77c49e' : 'transparent', color: '#112019', borderRadius: 6, cursor: task.done ? 'default' : 'pointer' }}>{task.done ? '✓' : ''}</button><div style={{ flex: 1, minWidth: 0 }}><div style={{ color: '#e6ece4', fontSize: 14, textDecoration: task.done ? 'line-through' : 'none', overflowWrap: 'anywhere' }}>{task.text}</div>{task.boss && <small style={{ color: '#d4b46d' }}>{ENEMIES[task.enemy || 0]?.icon} {ENEMIES[task.enemy || 0]?.name}</small>}</div><span style={{ color: task.boss ? '#e2bd70' : '#9ed0b6', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>+{task.reward * (task.boss ? 2 : 1)} XP</span><button onClick={() => setTasks((previous) => previous.filter((item) => item.id !== task.id))} aria-label="Hapus quest" title="Hapus quest" style={{ border: 0, background: 'transparent', color: '#87958a', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>)}</div>
          </section>}

          {tab === 'skills' && <div className="fq-content-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(230px, .8fr)', gap: 16 }}>
            <section style={{ ...panel, padding: 'clamp(17px, 4vw, 26px)' }}><div style={{ color: '#d3ad69', fontSize: 11, letterSpacing: '.14em', fontWeight: 800 }}>FIELD ENHANCEMENTS</div><h2 style={{ fontSize: 21, margin: '5px 0 4px' }}>Skill Shop</h2><p style={{ color: '#aab8ae', fontSize: 13, margin: '0 0 17px' }}>XP tersedia: <strong style={{ color: '#e3c47e' }}>{xp} XP</strong></p><div style={{ display: 'grid', gap: 10 }}>{SKILLS.map((skill) => <article key={skill.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, background: '#131e19', border: '1px solid rgba(226,237,232,.09)', borderRadius: 11 }}><span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 10, background: `${skill.color}1e`, color: skill.color, fontSize: 24 }}>{skill.icon}</span><div style={{ flex: 1, minWidth: 0 }}><strong>{skill.name}</strong><p style={{ margin: '4px 0 0', color: '#9fada2', fontSize: 12, lineHeight: 1.55 }}>{skill.description}</p></div><button disabled={xp < skill.cost} onClick={() => buySkill(skill)} style={{ ...button, padding: '9px 11px', background: xp >= skill.cost ? '#d3ad69' : '#39443d', color: xp >= skill.cost ? '#16211b' : '#9ba79d', cursor: xp >= skill.cost ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', fontSize: 12 }}>Beli · {skill.cost}</button></article>)}</div></section>
            <aside style={{ ...panel, padding: 20 }}>
              <div style={{ color: '#d3ad69', fontSize: 11, letterSpacing: '.14em', fontWeight: 800 }}>YOUR INVENTORY</div>
              <h2 style={{ fontSize: 19, margin: '5px 0 15px' }}>Inventaris Skill</h2>
              <div style={{ display: 'grid', gap: 9 }}>
                {SKILLS.map((skill) => <div key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 0', borderBottom: '1px solid rgba(226,237,232,.08)' }}>
                  <span style={{ color: skill.color, fontSize: 19 }}>{skill.icon}</span>
                  <div style={{ flex: 1 }}><strong style={{ fontSize: 13 }}>{skill.name}</strong><div style={{ color: '#93a297', fontSize: 11 }}>Jumlah: {inventory[skill.id] || 0}{skill.id === 'shield' && shieldArmed ? ' · Terpasang' : ''}</div></div>
                  <button disabled={!inventory[skill.id] || (skill.id === 'shield' && shieldArmed)} onClick={() => handleUseSkill(skill.id)} style={{ ...quietButton, padding: '7px 9px', fontSize: 11, opacity: inventory[skill.id] && !(skill.id === 'shield' && shieldArmed) ? 1 : .45, cursor: inventory[skill.id] && !(skill.id === 'shield' && shieldArmed) ? 'pointer' : 'not-allowed' }}>Gunakan Skill</button>
                </div>)}
              </div>
              <div style={{ marginTop: 15, padding: 11, borderRadius: 9, background: 'rgba(226,237,232,.045)', color: '#aab8ae', fontSize: 12, lineHeight: 1.6 }}>
                {activeDoubler ? `XP Booster aktif, ${Math.ceil((doublerUntil - now) / 60000)} menit tersisa.` : 'XP Booster menggandakan XP selama 15 menit.'}<br />
                {timerFrozen ? `Timer Freeze aktif, ${Math.ceil((freezeUntil - now) / 60000)} menit tersisa.` : 'Timer Freeze menghentikan hitungan selama 5 menit.'}<br />
                Streak Shield {shieldArmed ? 'siap mencegah streak berkurang saat sesi direset.' : 'dapat dipasang untuk menjaga streak.'}
              </div>
            </aside>
          </div>}
        </main>
      )}

      <footer style={{ ...container, padding: '18px 0 24px', borderTop: '1px solid rgba(218,231,220,.09)', color: '#819087', fontSize: 11, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><span>FOCUSQUEST · Progress tersimpan otomatis di perangkat ini.</span><span>Level {level} · {xp} total XP</span></footer>

      {levelToast && <div role="status" style={{ position: 'fixed', zIndex: 9, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'fq-pop .25s ease both', background: '#202e26', border: '1px solid #d3ad69', borderRadius: 14, boxShadow: '0 20px 90px #0009', padding: '24px 30px', textAlign: 'center' }}><div style={{ fontSize: 42 }}>✦</div><strong style={{ display: 'block', color: '#e4c27b', fontSize: 22, marginTop: 5 }}>LEVEL UP</strong><span style={{ color: '#d2ddd4' }}>Level {level} · {rank.title}</span></div>}
      {bossMessage && <div role="dialog" aria-label="Boss dikalahkan" style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'grid', placeContent: 'center', textAlign: 'center', background: 'rgba(9,14,12,.9)' }}><div style={{ fontSize: 80, animation: 'fq-ko 1.1s ease forwards' }}>{bossMessage.enemy.icon}</div><strong style={{ fontSize: 27, color: '#ed8c76', marginTop: 18 }}>BOSS K.O.!</strong><span style={{ color: '#e3c47e', marginTop: 8 }}>{bossMessage.enemy.name} dikalahkan · +{bossMessage.xp} XP</span></div>}
    </div>
  );
}