import { useState, useEffect, useCallback, useRef } from 'react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const THEMES = {
  dark: { id:'dark', name:'Dark Classic', cost:0, icon:'🌑', bg:'#0f172a', card:'#1e293b', border:'#334155', accent:'#6366f1', accentSoft:'#312e81', text:'#f8fafc', sub:'#94a3b8', muted:'#475569', xpBar:'#6366f1', headerBg:'rgba(15,23,42,0.95)' },
  cyberpunk: { id:'cyberpunk', name:'Cyberpunk Neon', cost:80, icon:'⚡', bg:'#0a0a1a', card:'#12122a', border:'#ff00ff44', accent:'#ff00ff', accentSoft:'#2a0033', text:'#f0e6ff', sub:'#cc88ff', muted:'#884499', xpBar:'#00ffff', headerBg:'rgba(10,10,26,0.97)' },
  forest: { id:'forest', name:'Forest Green', cost:60, icon:'🌿', bg:'#0a1a0f', card:'#122018', border:'#1a4025', accent:'#22c55e', accentSoft:'#14532d', text:'#ecfdf5', sub:'#86efac', muted:'#4ade80', xpBar:'#22c55e', headerBg:'rgba(10,26,15,0.97)' },
  pastel: { id:'pastel', name:'Pastel Dream', cost:70, icon:'🌸', bg:'#1a1020', card:'#25153a', border:'#7c3aed44', accent:'#f472b6', accentSoft:'#831843', text:'#fdf4ff', sub:'#e879f9', muted:'#a855f7', xpBar:'#f472b6', headerBg:'rgba(26,16,32,0.97)' },
  ocean: { id:'ocean', name:'Deep Ocean', cost:90, icon:'🌊', bg:'#020c18', card:'#071e34', border:'#0e4272', accent:'#38bdf8', accentSoft:'#0c2a4a', text:'#e0f2fe', sub:'#7dd3fc', muted:'#0ea5e9', xpBar:'#38bdf8', headerBg:'rgba(2,12,24,0.97)' },
};

const RANKS = [
  { min:1,  max:3,  title:'Novice Scholar',      icon:'🐣', color:'#94a3b8' },
  { min:4,  max:7,  title:'Apprentice Mage',      icon:'🦊', color:'#f59e0b' },
  { min:8,  max:11, title:'Adept Strategist',     icon:'🦅', color:'#6366f1' },
  { min:12, max:99, title:'Grandmaster Archmage', icon:'🐉', color:'#ec4899' },
];

const MASCOT_MSGS = {
  1: ['Semangat! Setiap langkah kecil itu berarti! 🌱','Hari ini belajar, besok bersinar! ✨','Jangan menyerah, kamu pasti bisa! 💪'],
  2: ['Kamu mulai terlihat keren nih! 🔥','XP terus mengalir, keep grinding! ⚡','Dedikasi kamu luar biasa! 🚀'],
  3: ['Woah! Kamu sudah semakin tangguh! 🦅','Level demi level, kamu merajai! 👑','Fokus adalah senjatamu yang terkuat! ⚔️'],
  4: ['Sang Archmage telah bangkit! 🐉','Tiada batas yang mampu menghentikanmu! 🌌','Legenda sejati tidak pernah berhenti belajar! 🏆'],
};

const BOSS_ENEMIES = [
  { name:'Raksasa Kemalasan', icon:'🦥', xpBonus:80 },
  { name:'Iblis Doomscroll',  icon:'📱', xpBonus:100 },
  { name:'Naga Overthinking', icon:'🌀', xpBonus:130 },
  { name:'Raja Prokrastinasi',icon:'⏳', xpBonus:180 },
];

const XP_PER_LEVEL = 200;

const INITIAL_TASKS = [
  { id:1, text:'Rangkum Catatan Kuliah Bab 3',          done:false, isBoss:false, xpReward:30 },
  { id:2, text:'Kerjakan 5 Soal Latihan Matematika',    done:false, isBoss:true,  xpReward:80,  bossIndex:0 },
  { id:3, text:'Hafalkan 10 Kosa Kata Bahasa Inggris',  done:true,  isBoss:false, xpReward:25 },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const load = (k, fb) => { try { const v = localStorage.getItem('fq_'+k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem('fq_'+k, JSON.stringify(v)); } catch {} };
const getRank = (lv) => RANKS.find(r => lv >= r.min && lv <= r.max) || RANKS[0];
const pickMsg  = (lv) => { const t = lv<=3?1:lv<=7?2:lv<=11?3:4; const a = MASCOT_MSGS[t]; return a[Math.floor(Math.random()*a.length)]; };

// ─── WEB AUDIO SFX ───────────────────────────────────────────────────────────

let _ctx = null;
const getCtx = () => { if (!_ctx) { try { _ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch {} } if (_ctx?.state==='suspended') _ctx.resume(); return _ctx; };
const tone = (freq, type='sine', dur=0.12, vol=0.15, delay=0) => { const c=getCtx(); if(!c) return; try { const o=c.createOscillator(),g=c.createGain(),n=c.currentTime+delay; o.type=type; o.frequency.setValueAtTime(freq,n); g.gain.setValueAtTime(vol,n); g.gain.exponentialRampToValueAtTime(0.001,n+dur); o.connect(g); g.connect(c.destination); o.start(n); o.stop(n+dur+0.01); } catch {} };
const sfx = {
  xp:      () => { tone(440,'sine',0.08,0.1); tone(660,'sine',0.1,0.1,0.08); },
  levelUp: () => [523,659,784,1047].forEach((f,i)=>tone(f,'sine',0.25,0.18,i*0.1)),
  bossWin: () => [523,659,784,1047,1319].forEach((f,i)=>tone(f,'triangle',0.3,0.2,i*0.12)),
  click:   () => tone(600,'sine',0.04,0.07),
  done:    () => { tone(880,'sine',0.1,0.12); tone(1100,'sine',0.15,0.12,0.1); },
  buy:     () => [660,880,1100].forEach((f,i)=>tone(f,'sine',0.12,0.15,i*0.08)),
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function App() {
  const [xp,      setXp]      = useState(() => load('xp', 0));
  const [level,   setLevel]   = useState(() => load('level', 1));
  const [tasks,   setTasks]   = useState(() => load('tasks', INITIAL_TASKS));
  const [themeId, setThemeId] = useState(() => load('theme', 'dark'));
  const [owned,   setOwned]   = useState(() => load('owned', ['dark']));
  const [sfxOn,   setSfxOn]   = useState(() => load('sfxOn', true));
  const [streak,  setStreak]  = useState(() => load('streak', 3));

  const [tab,     setTab]     = useState('timer');
  const [newTask, setNewTask] = useState('');
  const [isBoss,  setIsBoss]  = useState(false);
  const [bossIdx, setBossIdx] = useState(0);

  const [timerMode, setTimerMode] = useState('work');
  const [timeLeft,  setTimeLeft]  = useState(25 * 60);
  const [running,   setRunning]   = useState(false);
  const timerTotalRef = useRef(25 * 60);

  const [bossAnim,  setBossAnim]  = useState(null);
  const [showLvlUp, setShowLvlUp] = useState(false);
  const [mascotMsg, setMascotMsg] = useState(() => pickMsg(load('level', 1)));
  const [floats,    setFloats]    = useState([]);

  const T    = THEMES[themeId] || THEMES.dark;
  const rank = getRank(level);

  // Persist
  useEffect(() => save('xp',    xp),     [xp]);
  useEffect(() => save('level', level),  [level]);
  useEffect(() => save('tasks', tasks),  [tasks]);
  useEffect(() => save('theme', themeId),[themeId]);
  useEffect(() => save('owned', owned),  [owned]);
  useEffect(() => save('sfxOn', sfxOn),  [sfxOn]);
  useEffect(() => save('streak',streak), [streak]);

  // Body background
  useEffect(() => {
    document.body.style.backgroundColor = T.bg;
    document.body.style.margin = '0';
    document.body.style.fontFamily = "'Segoe UI', system-ui, sans-serif";
  }, [T.bg]);

  // Timer tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id); setRunning(false);
          if (timerMode === 'work') { giveXP(50); setTimerMode('break'); setTimeLeft(5*60); timerTotalRef.current=5*60; }
          else { setTimerMode('work'); setTimeLeft(25*60); timerTotalRef.current=25*60; }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, timerMode]);

  const spawnFloat = (amount) => {
    const id = Date.now();
    setFloats(f => [...f, { id, amount }]);
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1400);
  };

  const giveXP = useCallback((amount) => {
    if (sfxOn) sfx.xp();
    spawnFloat(amount);
    setXp(prev => {
      const next = prev + amount;
      const newLv = Math.floor(next / XP_PER_LEVEL) + 1;
      setLevel(cur => {
        if (newLv > cur) {
          if (sfxOn) setTimeout(() => sfx.levelUp(), 200);
          setShowLvlUp(true);
          setMascotMsg(pickMsg(newLv));
          setTimeout(() => setShowLvlUp(false), 3000);
        }
        return newLv;
      });
      return next;
    });
  }, [sfxOn]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    if (sfxOn) sfx.click();
    const task = { id:Date.now(), text:newTask.trim(), done:false, isBoss, bossIndex:isBoss?bossIdx:undefined, xpReward:isBoss?BOSS_ENEMIES[bossIdx].xpBonus:30 };
    setTasks(prev => [task, ...prev]);
    setNewTask('');
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id || t.done) return t;
      if (t.isBoss) {
        const enemy = BOSS_ENEMIES[t.bossIndex ?? 0];
        setBossAnim({ enemy, xpGained:t.xpReward });
        if (sfxOn) sfx.bossWin();
        giveXP(t.xpReward);
        setTimeout(() => setBossAnim(null), 3200);
      } else {
        giveXP(t.xpReward);
        if (sfxOn) sfx.done();
      }
      return { ...t, done:true };
    }));
  };

  const deleteTask = (id) => { if (sfxOn) sfx.click(); setTasks(prev => prev.filter(t => t.id !== id)); };

  const buyTheme = (thId) => {
    const theme = THEMES[thId];
    if (!theme || owned.includes(thId)) return;
    if (xp < theme.cost) { alert(`XP tidak cukup! Butuh ${theme.cost} XP.`); return; }
    if (sfxOn) sfx.buy();
    setXp(p => p - theme.cost);
    setOwned(p => [...p, thId]);
    setThemeId(thId);
  };
  const applyTheme = (thId) => { if (sfxOn) sfx.click(); setThemeId(thId); };

  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const timerPct = Math.round((1 - timeLeft / timerTotalRef.current) * 100);
  const xpInLv   = xp % XP_PER_LEVEL;
  const xpPct    = Math.round((xpInLv / XP_PER_LEVEL) * 100);
  const activeCt = tasks.filter(t => !t.done).length;

  // ── Shared styles ──────────────────────────────────────────────────────────
  const card    = { background:T.card, border:`1px solid ${T.border}`, borderRadius:'20px', padding:'24px' };
  const btnPri  = { padding:'12px 28px', borderRadius:'12px', border:'none', background:`linear-gradient(135deg,${T.accent},${T.muted})`, color:'#fff', fontWeight:800, fontSize:'15px', cursor:'pointer', boxShadow:`0 4px 16px ${T.accent}44` };
  const btnSec  = { padding:'12px 16px', borderRadius:'12px', border:`1px solid ${T.border}`, background:T.card, color:T.sub, cursor:'pointer', fontSize:'14px' };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:T.bg, color:T.text, fontFamily:"'Segoe UI',system-ui,sans-serif", paddingBottom:'48px', position:'relative', overflow:'hidden' }}>

      {/* ── CSS Keyframes ── */}
      <style>{`
        @keyframes fqFloat{0%{opacity:0;transform:translateX(-50%) translateY(0) scale(.7)}20%{opacity:1;transform:translateX(-50%) translateY(-20px) scale(1.1)}80%{opacity:1;transform:translateX(-50%) translateY(-50px) scale(1)}100%{opacity:0;transform:translateX(-50%) translateY(-70px) scale(.8)}}
        @keyframes fqPop{0%{transform:translate(-50%,-50%) scale(.5);opacity:0}70%{transform:translate(-50%,-50%) scale(1.05)}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
        @keyframes fqShake{0%,100%{transform:translateX(0) scale(1)}25%{transform:translateX(-10px) rotate(-5deg) scale(.95)}75%{transform:translateX(10px) rotate(5deg) scale(.95)}}
        @keyframes fqFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fqBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        *{box-sizing:border-box}
        input::placeholder{color:#475569}
      `}</style>

      {/* ── Floating XP ── */}
      {floats.map(f => (
        <div key={f.id} style={{ position:'fixed', top:'18%', left:'50%', color:T.accent, fontWeight:900, fontSize:'22px', pointerEvents:'none', animation:'fqFloat 1.4s ease-out forwards', zIndex:999, textShadow:`0 0 12px ${T.accent}`, whiteSpace:'nowrap' }}>
          +{f.amount} XP ✨
        </div>
      ))}

      {/* ── Level Up Toast ── */}
      {showLvlUp && (
        <div style={{ position:'fixed', top:'50%', left:'50%', background:T.card, border:`2px solid ${T.accent}`, borderRadius:'20px', padding:'28px 40px', zIndex:500, textAlign:'center', boxShadow:`0 0 40px ${T.accent}66`, animation:'fqPop 0.4s ease-out' }}>
          <div style={{ fontSize:'48px' }}>🎉</div>
          <div style={{ fontSize:'22px', fontWeight:900, color:T.accent, margin:'8px 0 4px' }}>LEVEL UP!</div>
          <div style={{ fontSize:'15px', color:T.sub }}>Kamu sekarang Level <strong style={{ color:T.text }}>{level}</strong></div>
          <div style={{ fontSize:'13px', color:rank.color, fontWeight:700, marginTop:'4px' }}>{rank.icon} {rank.title}</div>
        </div>
      )}

      {/* ── Boss KO Animation ── */}
      {bossAnim && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', animation:'fqFadeIn 0.3s ease' }}>
          <div style={{ fontSize:'90px', animation:'fqShake 0.5s ease' }}>{bossAnim.enemy.icon}</div>
          <div style={{ fontSize:'28px', fontWeight:900, color:'#ef4444', marginTop:'16px', letterSpacing:'0.04em' }}>BOSS K.O.! 💥</div>
          <div style={{ fontSize:'18px', color:'#fbbf24', marginTop:'8px', fontWeight:700 }}>{bossAnim.enemy.name} telah dikalahkan!</div>
          <div style={{ fontSize:'30px', color:T.accent, fontWeight:900, marginTop:'16px' }}>+{bossAnim.xpGained} XP 🏆</div>
          <div style={{ fontSize:'13px', color:T.sub, marginTop:'10px' }}>Layar ini akan menutup otomatis...</div>
        </div>
      )}

      {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header style={{ backgroundColor:T.headerBg, borderBottom:`1px solid ${T.border}`, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px', position:'sticky', top:0, zIndex:10, backdropFilter:'blur(12px)' }}>
        {/* Logo + Rank */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'40px', height:'40px', background:`linear-gradient(135deg,${T.accent},${T.muted})`, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>⚔️</div>
          <div>
            <h1 style={{ margin:0, fontSize:'18px', fontWeight:800, color:T.accent }}>FocusQuest</h1>
            <p style={{ margin:0, fontSize:'11px', color:rank.color, fontWeight:700, letterSpacing:'0.04em' }}>{rank.icon} {rank.title} • Level {level}</p>
          </div>
        </div>

        {/* Player Status */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', background:T.card, border:`1px solid ${T.border}`, borderRadius:'14px', padding:'8px 14px' }}>
          <span style={{ fontSize:'13px', color:'#fbbf24', fontWeight:700 }}>🔥 {streak} Hari</span>
          <div style={{ width:'1px', height:'24px', backgroundColor:T.border }} />
          <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:'10px', fontSize:'12px' }}>
              <span style={{ color:T.accent, fontWeight:800 }}>Lv.{level}</span>
              <span style={{ color:T.sub }}>{xpInLv}/{XP_PER_LEVEL} XP</span>
            </div>
            <div style={{ width:'130px', height:'7px', background:T.border, borderRadius:'99px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${xpPct}%`, background:`linear-gradient(90deg,${T.accent},${T.xpBar})`, borderRadius:'99px', transition:'width 0.5s ease' }} />
            </div>
          </div>
          <div style={{ width:'1px', height:'24px', backgroundColor:T.border }} />
          <button style={{ background:'none', border:`1px solid ${T.border}`, borderRadius:'8px', padding:'5px 10px', color:T.sub, cursor:'pointer', fontSize:'14px' }} onClick={() => setSfxOn(p => !p)}>
            {sfxOn ? '🔔' : '🔕'}
          </button>
        </div>
      </header>

      {/* ═══ MASCOT BAR ════════════════════════════════════════════════════════ */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:'12px', padding:'10px 16px', margin:'16px 20px 0', display:'flex', alignItems:'center', gap:'12px', maxWidth:'640px', marginLeft:'auto', marginRight:'auto', marginTop:'16px' }}>
        <div style={{ fontSize:'32px', lineHeight:1, userSelect:'none', animation:'fqBob 3s ease-in-out infinite' }}>{rank.icon}</div>
        <div style={{ color:T.sub, fontSize:'13px', fontStyle:'italic', flex:1 }}>"{mascotMsg}"</div>
        <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px', color:T.muted }} onClick={() => { sfx.click(); setMascotMsg(pickMsg(level)); }} title="Pesan baru">🔄</button>
      </div>

      {/* ═══ TABS ══════════════════════════════════════════════════════════════ */}
      <div style={{ display:'flex', gap:'6px', background:T.card, border:`1px solid ${T.border}`, borderRadius:'12px', padding:'5px', margin:'16px auto', maxWidth:'640px', marginLeft:'auto', marginRight:'auto', marginTop:'12px', marginBottom:'12px' }}>
        {[['timer','⏱️ Focus Timer'],['tasks',`📋 Quests (${activeCt})`],['shop','🛒 XP Shop']].map(([key, label]) => (
          <button key={key} style={{ flex:1, padding:'9px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'13px', transition:'all 0.2s', background:tab===key?T.accent:'transparent', color:tab===key?'#fff':T.sub, boxShadow:tab===key?`0 2px 12px ${T.accent}55`:'none' }}
            onClick={() => { sfx.click(); setTab(key); }}>
            {label}
          </button>
        ))}
      </div>

      {/* ═══ MAIN CONTENT ══════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:'640px', margin:'0 auto', padding:'0 20px' }}>

        {/* ─── TIMER TAB ─── */}
        {tab === 'timer' && (
          <div style={{ ...card, textAlign:'center' }}>
            {/* Mode pills */}
            <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
              {[['work','⚔️ Fokus (25M)',T.accent,25*60],['break','☕ Istirahat (5M)','#22c55e',5*60],['long','🌙 Panjang (15M)','#f59e0b',15*60]].map(([m,lbl,clr,sec]) => (
                <button key={m} style={{ padding:'6px 16px', borderRadius:'99px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'12px', background:timerMode===m?clr:T.border, color:timerMode===m?'#fff':T.sub }}
                  onClick={() => { sfx.click(); setTimerMode(m); setTimeLeft(sec); timerTotalRef.current=sec; setRunning(false); }}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* Clock */}
            <div style={{ fontSize:'72px', fontWeight:800, fontFamily:'monospace', color:timerMode==='work'?T.text:'#34d399', letterSpacing:'2px', margin:'12px 0' }}>
              {fmtTime(timeLeft)}
            </div>

            {/* Progress */}
            <div style={{ width:'100%', height:'5px', background:T.border, borderRadius:'99px', overflow:'hidden', marginBottom:'20px' }}>
              <div style={{ height:'100%', width:`${timerPct}%`, background:timerMode==='work'?T.accent:'#34d399', transition:'width 1s linear', borderRadius:'99px' }} />
            </div>

            <div style={{ fontSize:'13px', color:T.sub, marginBottom:'18px' }}>
              {timerMode === 'work' ? '🎯 Selesaikan sesi ini untuk mendapatkan +50 XP!' : '🌿 Istirahat sejenak, kamu sudah hebat!'}
            </div>

            <div style={{ display:'flex', justifyContent:'center', gap:'10px' }}>
              <button style={btnPri} onClick={() => { sfx.click(); setRunning(r => !r); }}>
                {running ? '⏸️ Jeda' : '▶️ Mulai Fokus'}
              </button>
              <button style={btnSec} onClick={() => { sfx.click(); setRunning(false); setTimeLeft(timerTotalRef.current); }}>🔄</button>
            </div>
          </div>
        )}

        {/* ─── QUESTS TAB ─── */}
        {tab === 'tasks' && (
          <div style={card}>
            <h2 style={{ fontSize:'16px', fontWeight:800, color:T.accent, margin:'0 0 14px 0' }}>📖 Quest Log & Target Harian</h2>

            <form onSubmit={handleAddTask} style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
              <div style={{ display:'flex', gap:'8px' }}>
                <input
                  style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, borderRadius:'10px', padding:'10px 14px', color:T.text, fontSize:'14px', outline:'none', fontFamily:'inherit' }}
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder="Tulis quest baru... (tugas, target belajar, dll)"
                />
                <button type="submit" style={{ padding:'10px 18px', borderRadius:'10px', border:'none', background:T.accent, color:'#fff', fontWeight:800, cursor:'pointer' }}>➕</button>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:T.sub, cursor:'pointer' }}>
                  <input type="checkbox" checked={isBoss} onChange={e => setIsBoss(e.target.checked)} />
                  ⚔️ Boss Quest (Bonus XP Besar!)
                </label>
                {isBoss && (
                  <select style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:'8px', padding:'5px 8px', color:T.text, fontSize:'12px', outline:'none' }}
                    value={bossIdx} onChange={e => setBossIdx(Number(e.target.value))}>
                    {BOSS_ENEMIES.map((b, i) => <option key={i} value={i}>{b.icon} {b.name} (+{b.xpBonus} XP)</option>)}
                  </select>
                )}
              </div>
            </form>

            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {tasks.length === 0 && <div style={{ textAlign:'center', color:T.muted, padding:'24px', fontSize:'14px' }}>Belum ada quest. Tambahkan tugas pertamamu! 🗺️</div>}
              {tasks.map(task => (
                <div key={task.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:T.bg, border:`1px solid ${task.isBoss && !task.done ? T.accent+'88' : T.border}`, borderRadius:'12px', padding:'11px 14px', opacity:task.done?0.55:1, gap:'10px', boxShadow:task.isBoss && !task.done ? `0 0 10px ${T.accent}33` : 'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0 }}>
                    <button style={{ width:'22px', height:'22px', flexShrink:0, borderRadius:'6px', border:`2px solid ${task.done?'#22c55e':T.accent}`, background:task.done?'#22c55e':'transparent', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px' }}
                      onClick={() => toggleTask(task.id)}>
                      {task.done && '✓'}
                    </button>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'14px', fontWeight:500, color:task.done?T.muted:T.text, textDecoration:task.done?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {task.text}
                      </div>
                      {task.isBoss && !task.done && (
                        <div style={{ fontSize:'11px', color:'#fbbf24', marginTop:'2px' }}>
                          Boss: {BOSS_ENEMIES[task.bossIndex??0]?.icon} {BOSS_ENEMIES[task.bossIndex??0]?.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                    {task.isBoss && <span style={{ fontSize:'10px', fontWeight:800, color:'#fbbf24', background:'#451a03', padding:'2px 8px', borderRadius:'99px', border:'1px solid #f59e0b55' }}>BOSS ⚔️</span>}
                    <span style={{ fontSize:'11px', fontWeight:800, color:T.accent, background:T.accentSoft, padding:'2px 8px', borderRadius:'99px' }}>+{task.xpReward} XP</span>
                    <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', color:T.muted }} onClick={() => deleteTask(task.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── SHOP TAB ─── */}
        {tab === 'shop' && (
          <div style={card}>
            <h2 style={{ fontSize:'16px', fontWeight:800, color:T.accent, margin:'0 0 4px 0' }}>🛒 Toko Tema & XP Shop</h2>
            <p style={{ fontSize:'13px', color:T.sub, marginBottom:'16px' }}>
              Gunakan XP untuk membeli tema eksklusif! Total XP kamu: <strong style={{ color:T.accent }}>{xp} XP</strong>
            </p>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))', gap:'12px', marginBottom:'24px' }}>
              {Object.values(THEMES).map(theme => {
                const isOwned  = owned.includes(theme.id);
                const isActive = themeId === theme.id;
                return (
                  <div key={theme.id}
                    style={{ border:`2px solid ${isActive?T.accent:T.border}`, borderRadius:'14px', padding:'16px 14px', cursor:'pointer', background:isActive?T.accentSoft:T.bg, textAlign:'center', transition:'all 0.2s', boxShadow:isActive?`0 0 18px ${T.accent}44`:'none' }}
                    onClick={() => isOwned ? applyTheme(theme.id) : buyTheme(theme.id)}>
                    <div style={{ fontSize:'28px', marginBottom:'6px' }}>{theme.icon}</div>
                    <div style={{ fontSize:'13px', fontWeight:800, color:T.text, marginBottom:'4px' }}>{theme.name}</div>
                    <div style={{ fontSize:'12px', fontWeight:700, color:isActive?T.accent:isOwned?'#22c55e':T.sub }}>
                      {isActive ? '✅ Aktif' : isOwned ? '✓ Klik untuk Pakai' : `🔒 ${theme.cost} XP`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rank Info Table */}
            <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:'14px', padding:'16px' }}>
              <div style={{ fontWeight:800, color:T.accent, marginBottom:'12px', fontSize:'14px' }}>🏆 Sistem Rank RPG</div>
              {RANKS.map(r => (
                <div key={r.title} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                  <span style={{ fontSize:'22px' }}>{r.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:r.color }}>{r.title}</div>
                    <div style={{ fontSize:'11px', color:T.muted }}>Level {r.min}{r.max < 99 ? `–${r.max}` : '+'}</div>
                  </div>
                  {rank.title === r.title && (
                    <span style={{ fontSize:'11px', background:T.accentSoft, color:T.accent, padding:'2px 10px', borderRadius:'99px', fontWeight:700 }}>← Kamu</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

  const [coins, setCoins] = useState(() => loadStorage('coins', 65));
  const [streak, setStreak] = useState(() => loadStorage('streak', 3));
  const [tasks, setTasks] = useState(() => loadStorage('tasks', INITIAL_TASKS));
  const [defeatedStats, setDefeatedStats] = useState(() => loadStorage('defeated', { sloth: 1 }));
  const [inventory, setInventory] = useState(() => loadStorage('inventory', []));
  const [soundMuted, setSoundMuted] = useState(() => loadStorage('muted', false));

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState('dungeon'); // 'dungeon' | 'quests' | 'bestiary'
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);

  // Combat Bridge
  const [instantDamageTrigger, setInstantDamageTrigger] = useState(null);

  // Track previous level for level up popup
  const currentRank = getRankInfo(xp);
  const prevLevelRef = useRef(currentRank.level);

  // Save changes to localStorage
  useEffect(() => { saveStorage('xp', xp); }, [xp]);
  useEffect(() => { saveStorage('coins', coins); }, [coins]);
  useEffect(() => { saveStorage('streak', streak); }, [streak]);
  useEffect(() => { saveStorage('tasks', tasks); }, [tasks]);
  useEffect(() => { saveStorage('defeated', defeatedStats); }, [defeatedStats]);
  useEffect(() => { saveStorage('inventory', inventory); }, [inventory]);
  useEffect(() => { saveStorage('muted', soundMuted); }, [soundMuted]);

  // Check for level up
  useEffect(() => {
    const newRank = getRankInfo(xp);
    if (newRank.level > prevLevelRef.current) {
      setLevelUpData(newRank);
    }
    prevLevelRef.current = newRank.level;
  }, [xp]);

  const handleAddXp = (amount) => {
    setXp((prev) => prev + amount);
  };

  const handleAddCoins = (amount) => {
    setCoins((prev) => prev + amount);
  };

  const handleSpendCoins = (amount) => {
    setCoins((prev) => Math.max(0, prev - amount));
  };

  const handleBossDefeated = (bossId) => {
    setDefeatedStats((prev) => ({
      ...prev,
      [bossId]: (prev[bossId] || 0) + 1
    }));
  };

  const handleBuyItem = (item) => {
    if (item.type === 'consumable') {
      // Trigger damage immediately to current boss!
      setInstantDamageTrigger({ damage: 45, isCritical: true });
      setActiveTab('dungeon');
    } else {
      setInventory((prev) => [...prev, item]);
    }
  };

  const handleTriggerDamageFromQuest = (damageData) => {
    setInstantDamageTrigger(damageData);
  };

  const handleResetData = () => {
    if (window.confirm('Apakah kamu yakin ingin mereset seluruh progres dan kembali ke level 1?')) {
      localStorage.clear();
      setXp(0);
      setCoins(50);
      setStreak(1);
      setTasks(INITIAL_TASKS);
      setDefeatedStats({});
      setInventory([]);
      window.location.reload();
    }
  };

  const activeTaskCount = tasks.filter((t) => !t.completed).length;
  const totalBossKills = Object.values(defeatedStats).reduce((a, b) => a + b, 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Sticky Top Navigation & Status */}
      <Navbar
        xp={xp}
        coins={coins}
        streak={streak}
        soundMuted={soundMuted}
        setSoundMuted={setSoundMuted}
        onOpenShop={() => setIsShopOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main App Container */}
      <main style={{ maxWidth: '880px', width: '100%', margin: '28px auto', padding: '0 20px', flex: 1 }}>
        
        {/* Navigation Tabs Bar */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '24px',
          gap: '8px'
        }}>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('dungeon');
            }}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'dungeon' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeTab === 'dungeon' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'dungeon' ? '0 4px 15px rgba(99, 102, 241, 0.35)' : 'none'
            }}
          >
            <span>⚔️ Boss Dungeon</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('quests');
            }}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'quests' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeTab === 'quests' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'quests' ? '0 4px 15px rgba(99, 102, 241, 0.35)' : 'none'
            }}
          >
            <span>📋 Quest Log</span>
            {activeTaskCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                borderRadius: '10px',
                padding: '2px 7px',
                fontSize: '11px',
                fontWeight: '800'
              }}>
                {activeTaskCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('bestiary');
            }}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'bestiary' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeTab === 'bestiary' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'bestiary' ? '0 4px 15px rgba(99, 102, 241, 0.35)' : 'none'
            }}
          >
            <span>🏆 Bestiary</span>
            <span style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '2px 7px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {totalBossKills}
            </span>
          </button>
        </div>

        {/* Tab 1: Boss Battle Dungeon */}
        {activeTab === 'dungeon' && (
          <BossBattle
            xp={xp}
            onAddXp={handleAddXp}
            onAddCoins={handleAddCoins}
            onBossDefeated={handleBossDefeated}
            instantDamageTrigger={instantDamageTrigger}
            onClearDamageTrigger={() => setInstantDamageTrigger(null)}
          />
        )}

        {/* Tab 2: Quest Log / To-Do List */}
        {activeTab === 'quests' && (
          <QuestLog
            tasks={tasks}
            setTasks={setTasks}
            onAddXp={handleAddXp}
            onAddCoins={handleAddCoins}
            onTriggerDamage={handleTriggerDamageFromQuest}
          />
        )}

        {/* Tab 3: Bestiary / Codex */}
        {activeTab === 'bestiary' && (
          <Bestiary defeatedStats={defeatedStats} />
        )}

      </main>

      {/* Footer */}
      <footer style={{
        marginTop: '40px',
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px 20px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '13px'
      }}>
        <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            FocusQuest RPG ⚔️ • Dibuat khusus untuk pejuang fokus, tugas sekolah, kuliah & kerjaan!
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={handleResetData}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
            >
              Reset Data Progres
            </button>
          </div>
        </div>
      </footer>

      {/* Shop Modal */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        coins={coins}
        onSpendCoins={handleSpendCoins}
        inventory={inventory}
        onBuyItem={handleBuyItem}
      />

      {/* Level Up Celebration Modal */}
      {levelUpData && (
        <LevelUpModal
          rank={levelUpData}
          onClose={() => setLevelUpData(null)}
        />
      )}

    </div>
  );
}