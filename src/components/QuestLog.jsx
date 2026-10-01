import React, { useState } from 'react';
import { soundManager } from '../utils/audio';

const DIFFICULTY_CONFIG = {
  easy: { label: 'Santai', color: '#34d399', xp: 20, coins: 10, damage: 20, icon: '🟢' },
  medium: { label: 'Sedang', color: '#fbbf24', xp: 35, coins: 20, damage: 35, icon: '🟡' },
  hard: { label: 'Ambis (Boss)', color: '#f43f5e', xp: 60, coins: 35, damage: 55, icon: '🔴' }
};

export default function QuestLog({
  tasks,
  setTasks,
  onAddXp,
  onAddCoins,
  onTriggerDamage
}) {
  const [taskText, setTaskText] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('belajar');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    soundManager.playClick();
    const config = DIFFICULTY_CONFIG[difficulty];
    const newTask = {
      id: Date.now(),
      text: taskText.trim(),
      completed: false,
      difficulty,
      category,
      xpReward: config.xp,
      coinReward: config.coins,
      damageReward: config.damage,
      createdAt: new Date().toISOString()
    };

    setTasks([newTask, ...tasks]);
    setTaskText('');
  };

  const handleToggleTask = (task) => {
    const isNowCompleted = !task.completed;

    if (isNowCompleted) {
      // Completed quest!
      soundManager.playQuestDone();
      onAddXp(task.xpReward);
      onAddCoins(task.coinReward);

      // Trigger instant damage to Boss Battle!
      if (onTriggerDamage) {
        onTriggerDamage({
          damage: task.damageReward,
          isCritical: task.difficulty === 'hard'
        });
      }
    } else {
      soundManager.playClick();
    }

    setTasks(
      tasks.map((t) => (t.id === task.id ? { ...t, completed: isNowCompleted } : t))
    );
  };

  const handleDeleteTask = (id) => {
    soundManager.playClick();
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
            📖 Quest & Target Harian
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Selesaikan misi untuk mendapatkan XP, Koin, dan meluncurkan serangan instan ke Boss!
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '10px' }}>
          {['all', 'active', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => {
                soundManager.playClick();
                setFilter(f);
              }}
              style={{
                background: filter === f ? '#6366f1' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '7px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {f === 'all' ? `Semua (${tasks.length})` : f === 'active' ? `Aktif (${activeCount})` : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Tambah quest belajar atau tugas baru... (contoh: Rangkum Bab 3 Sejarah)"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0 20px', whiteSpace: 'nowrap' }}>
            ➕ Tambah Quest
          </button>
        </div>

        {/* Difficulty & Category Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Tingkat Beban:</span>
            {Object.entries(DIFFICULTY_CONFIG).map(([key, val]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDifficulty(key)}
                style={{
                  background: difficulty === key ? `${val.color}25` : 'rgba(15, 23, 42, 0.6)',
                  border: difficulty === key ? `1px solid ${val.color}` : '1px solid var(--border-subtle)',
                  color: difficulty === key ? val.color : 'var(--text-secondary)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{val.icon}</span>
                <span>{val.label}</span>
                <span style={{ opacity: 0.8 }}>({val.damage} DMG)</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Kategori:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="belajar">📚 Belajar / Tugas</option>
              <option value="kerja">💼 Pekerjaan</option>
              <option value="pribadi">🎯 Pribadi</option>
              <option value="sehat">🏃‍♂️ Kebugaran</option>
            </select>
          </div>
        </div>
      </form>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📜</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Tidak ada quest di daftar ini.</div>
            <div style={{ fontSize: '12px' }}>Tambahkan quest belajarmu untuk mulai mendulang XP!</div>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const diffConfig = DIFFICULTY_CONFIG[task.difficulty || 'medium'];
            return (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: task.completed ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.85)',
                  border: task.completed ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  opacity: task.completed ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  gap: '12px'
                }}
              >
                {/* Left check & title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => handleToggleTask(task)}
                    title={task.completed ? 'Batal tandai selesai' : 'Tandai selesai & serang Boss!'}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '8px',
                      border: task.completed ? '1px solid #10b981' : '1px solid #6366f1',
                      background: task.completed ? '#10b981' : 'rgba(99, 102, 241, 0.1)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '13px',
                      flexShrink: 0
                    }}
                  >
                    {task.completed ? '✓' : ''}
                  </button>

                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'var(--text-muted)' : '#f8fafc',
                      fontSize: '14px',
                      fontWeight: '600',
                      wordBreak: 'break-word'
                    }}>
                      {task.text}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', color: diffConfig.color, fontWeight: '700' }}>
                        {diffConfig.icon} {diffConfig.label}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        +{task.damageReward} DMG ke Boss
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Rewards & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#818cf8',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '3px 8px',
                    borderRadius: '8px'
                  }}>
                    +{task.xpReward} XP
                  </span>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#facc15',
                    background: 'rgba(250, 204, 21, 0.15)',
                    border: '1px solid rgba(250, 204, 21, 0.3)',
                    padding: '3px 8px',
                    borderRadius: '8px'
                  }}>
                    +{task.coinReward} 🪙
                  </span>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    title="Hapus quest"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px 6px',
                      borderRadius: '6px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
