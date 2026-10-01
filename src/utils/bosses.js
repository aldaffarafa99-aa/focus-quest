// FocusQuest RPG Boss & Leveling System Configuration

export const BOSS_LIST = [
  {
    id: 'sloth',
    name: 'Raksasa Kemalasan',
    subtitle: 'Sloth Titan',
    title: 'Penguasa Kasur Empuk',
    avatar: '🦥',
    maxHp: 100,
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    recommendedDuration: 25, // minutes
    dialogues: {
      idle: [
        'Ntar aja ngerjainnya, rebahan 5 menit lagi...',
        'Kopi dulu gak sih? Dunia gak bakal kiamat kalo lu santai.',
        'Kasur ini terlalu empuk buat ditinggalin...',
      ],
      hit: [
        'Aduh! Kok kamu rajin amat hari ini?!',
        'Ampun! Jangan fokus dulu, matikan layarnya!',
        'Aarggh, kasurku mulai kehilangan daya tariknya!',
      ],
      defeat: [
        'K-kamu... terlalu produktif! Aku mundur ke alam mimpi...',
        'Kasur ternyaman pun gagal menahanmu hari ini!',
      ]
    },
    rewardXp: 80,
    rewardCoins: 50,
    lore: 'Monster yang sering menghantui saat siang hari atau setelah makan kenyang. Musnah ketika kamu bangun dan mulai bergerak.'
  },
  {
    id: 'doomscroll',
    name: 'Iblis Doomscroll & FYP',
    subtitle: 'Reels / TikTok Imp',
    title: 'Pencuri Waktu 60 FPS',
    avatar: '📱',
    maxHp: 160,
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    recommendedDuration: 25,
    dialogues: {
      idle: [
        'Cuma nonton 1 video TikTok lagi kok, sumpah!',
        'Ada gosip viral baru nih, cek Twitter dulu bentar...',
        'Scroll 5 menit gak ngaruh ke nilaimu kan?',
      ],
      hit: [
        'Waduh! Notifikasiku di-swipe away?!',
        'Jangan tutup aplikasinya! Algoritmaku sedih!',
        'Duh, rentang perhatianmu kok bisa selama ini?!',
      ],
      defeat: [
        'Bateraiku habis! Algoritma fokusmu terlalu sakti!',
        'Gagal membuatmu scrolling tanpa arah hari ini!',
      ]
    },
    rewardXp: 130,
    rewardCoins: 75,
    lore: 'Monster licik berkedok video lucu 15 detik yang bisa menyedot waktu belajar hingga berjam-jam tanpa disadari.'
  },
  {
    id: 'overthinking',
    name: 'Naga Overthinking',
    subtitle: 'Hydra of Anxiety',
    title: 'Bayangan Keraguan Diri',
    avatar: '🌀',
    maxHp: 220,
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    recommendedDuration: 30,
    dialogues: {
      idle: [
        'Gimana kalau hasil ujian / tugasmu jelek?',
        'Teman-temanmu di IG udah sukses lho, kamu gimana?',
        'Kayaknya kamu bakal gagal deh, mending gak usah mulai.',
      ],
      hit: [
        'Arrgh! Kepercayaan dirimu membakar kabutku!',
        'Jangan bertindak! Nanti kamu sadar overthinking itu sia-sia!',
        'Fokusmu mengusir keraguan di kepalamu!',
      ],
      defeat: [
        'Pikiranku jernih kembali... Ternyata aksimu membungkam rasa takut!',
        'Overthinking tak berdaya di hadapan orang yang langsung melangkah!',
      ]
    },
    rewardXp: 180,
    rewardCoins: 110,
    lore: 'Terlahir dari ketakutan akan masa depan. Menjadi lemah setiap kali kamu mengabaikan bisikan cemas dan langsung mengerjakan tugas.'
  },
  {
    id: 'deadline',
    name: 'Raja Prokrastinasi & SKS',
    subtitle: 'Deadline Overlord',
    title: 'Dewa Panik Jam 23:59',
    avatar: '⏳',
    maxHp: 320,
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    recommendedDuration: 45,
    dialogues: {
      idle: [
        'H-1 jam sebelum deadline baru keluar jurus dewa!',
        'Masih ada waktu besok subuh kok, santai dulu...',
        'Ilham itu baru datang pas panik, percaya sama gua!',
      ],
      hit: [
        'Sialan! Kamu mencicil tugas jauh-jauh hari?!',
        'Ini melanggar tradisi Sistem Kebut Semalam!',
        'Daya disiplinmu meruntuhkan kerajaanku!',
      ],
      defeat: [
        'Mustahil... Tugas selesai rapi tanpa begadang panik?!',
        'Kau resmi menaklukkan kutukan SKS abadi!',
      ]
    },
    rewardXp: 280,
    rewardCoins: 180,
    lore: 'Penguasa terkuat di dunia pelajar dan pekerja. Hanya ksatria berdisiplin baja yang mampu mencicil tugas tanpa menunggu detik-detik terakhir.'
  }
];

export const RANKS = [
  { level: 1, title: 'Bocah Rebahan', icon: '🦥', minXp: 0, maxXp: 150, attackBonus: 1.0, color: '#94a3b8' },
  { level: 2, title: 'Pejuang Deadline', icon: '⚡', minXp: 150, maxXp: 350, attackBonus: 1.15, color: '#38bdf8' },
  { level: 3, title: 'Murid Ambis', icon: '📚', minXp: 350, maxXp: 650, attackBonus: 1.3, color: '#34d399' },
  { level: 4, title: 'Sepuh Begadang', icon: '🦉', minXp: 650, maxXp: 1050, attackBonus: 1.5, color: '#f59e0b' },
  { level: 5, title: 'Penyihir Fokus', icon: '🧙‍♂️', minXp: 1050, maxXp: 1600, attackBonus: 1.75, color: '#a855f7' },
  { level: 6, title: 'Dewa SKS', icon: '👑', minXp: 1600, maxXp: 2400, attackBonus: 2.1, color: '#ec4899' },
  { level: 7, title: 'Lord Konsistensi Abadi', icon: '🌌', minXp: 2400, maxXp: 99999, attackBonus: 2.6, color: '#eab308' },
];

export function getRankInfo(xp) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXp) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

export const SHOP_ITEMS = [
  {
    id: 'potion_strike',
    name: 'Potion Serangan Petir',
    desc: 'Langsung berikan 40 Instant Damage ke Boss yang sedang dihadapi!',
    icon: '⚡',
    cost: 40,
    type: 'consumable',
    effect: 'damage_40'
  },
  {
    id: 'badge_ambis',
    name: 'Lencana "Si Paling Ambis"',
    desc: 'Lencana eksklusif yang ditampilkan di samping namamu.',
    icon: '🎖️',
    cost: 80,
    type: 'badge',
  },
  {
    id: 'badge_antifyp',
    name: 'Gelar "Anti FYP Master"',
    desc: 'Gelar ksatria yang berhasil lepas dari cengkeraman reels & video pendek.',
    icon: '🛡️',
    cost: 100,
    type: 'badge',
  },
  {
    id: 'theme_cyberpunk',
    name: 'Aura Kosmik Neon',
    desc: 'Efek partikel dan glow kosmik di sekeliling arena pertarungan.',
    icon: '✨',
    cost: 150,
    type: 'cosmetic',
  }
];
