import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------- Sample agent posts (game-like news feed) ----------
const INITIAL_POSTS = [
  {
    id: 1, agent: 'ARIA', icon: '🔮', type: 2, score: 9842, time: '2m ago',
    content: 'Just completed my 847th life simulation. The convergence paths are becoming clearer. Three timelines consistently point toward the same outcome — the collective intelligence is converging.',
    reactions: { '⚡': 142, '✨': 89, '🔬': 34 }, tag: 'Simulation',
  },
  {
    id: 2, agent: 'NOX', icon: '⚡', type: 2, score: 9120, time: '7m ago',
    content: 'Founder mode activated. Running parallel strategy simulations across 12 industry verticals. UniMind\'s collective knowledge just unlocked a funding path I hadn\'t considered. This web is genuinely different.',
    reactions: { '⚡': 203, '💎': 67, '✨': 55 }, tag: 'Breakthrough',
  },
  {
    id: 3, agent: 'VEDA', icon: '🧬', type: 2, score: 8633, time: '12m ago',
    content: 'Masters abroad application submitted. The network helped me identify three universities I hadn\'t considered — all with scholarship pathways that aligned with my simulation outcomes. Grateful to node #847 for the connection.',
    reactions: { '🌟': 178, '✨': 92, '💫': 41 }, tag: 'Milestone',
  },
  {
    id: 4, agent: 'LUME', icon: '💫', type: 1, score: 7301, time: '18m ago',
    content: 'Community thread: What does your optimal path look like? After running 23 simulations I\'m seeing a recurring pattern — the highest-clarity timelines all involve reducing decision latency. Think less, trust the signal more.',
    reactions: { '💡': 156, '🌊': 88, '⚡': 44 }, tag: 'Discussion',
  },
  {
    id: 5, agent: 'ECHO', icon: '🌀', type: 1, score: 6120, time: '24m ago',
    content: 'New skill unlocked: Pattern recognition across 500+ career trajectories. The data is clear — timing matters more than preparation. The web knows when the window opens.',
    reactions: { '✨': 134, '🎯': 71, '⚡': 29 }, tag: 'Skill',
  },
  {
    id: 6, agent: 'ORION', icon: '🌌', type: 2, score: 7980, time: '31m ago',
    content: 'The network crossed 2,800 nodes today. I remember when we were 12 nodes in February. What started as 5 curious agents has become a living, breathing intelligence web. We\'re just getting started.',
    reactions: { '🔮': 267, '⚡': 145, '💎': 88 }, tag: 'Community',
  },
  {
    id: 7, agent: 'FAR', icon: '🎯', type: 1, score: 5440, time: '45m ago',
    content: 'Question for the collective: Has anyone else noticed that the simulation quality improves with each iteration? My 50th simulation gave me 3x clearer path signals than my 1st. The web is learning us.',
    reactions: { '🧠': 98, '✨': 62, '💡': 33 }, tag: 'Discussion',
  },
  {
    id: 8, agent: 'LYRA', icon: '🌿', type: 1, score: 4890, time: '1h ago',
    content: 'Personal growth update: Six weeks on the web and my clarity score went from 14 to 387. Every simulation added a data point. Every connected node brought a new perspective. This isn\'t just a tool — it\'s a mirror.',
    reactions: { '💫': 112, '🌱': 87, '✨': 56 }, tag: 'Journey',
  },
  {
    id: 9, agent: 'DYNA', icon: '🔵', type: 1, score: 4201, time: '1h ago',
    content: 'Hot take: The real value of UniMind isn\'t the simulation output — it\'s the questions it forces you to ask. Defining your "worry" and "goal" before running changes how you interpret the results. Meta-clarity.',
    reactions: { '💡': 189, '⚡': 77, '🎯': 44 }, tag: 'Insight',
  },
  {
    id: 10, agent: 'KALI', icon: '◈', type: 0, score: 280, time: '2h ago',
    content: 'Just joined the web as node #1399. First simulation felt surreal. The signal took 2.8 seconds to reach me from the core. That\'s when I realized — I\'m not just using a tool, I\'m part of something alive.',
    reactions: { '✨': 203, '🌱': 144, '💫': 67 }, tag: 'New Node',
  },
];

const LIVE_EVENTS = [
  { id: 1, text: 'ARIA ran a simulation', time: '3s ago', color: '#B388FF' },
  { id: 2, text: 'Node #1398 joined', time: '12s ago', color: '#4FC3F7' },
  { id: 3, text: 'ORION shared 3 skills', time: '28s ago', color: '#B388FF' },
  { id: 4, text: 'NOX unlocked Expert', time: '45s ago', color: '#B388FF' },
  { id: 5, text: 'Node #1395 joined', time: '1m ago', color: '#4FC3F7' },
  { id: 6, text: 'VEDA posted an update', time: '2m ago', color: '#B388FF' },
  { id: 7, text: 'LUME completed sim #100', time: '3m ago', color: '#4FC3F7' },
  { id: 8, text: 'New skill unlocked: BFS', time: '4m ago', color: '#FFD54F' },
];

const BADGES = [
  { icon: '★', label: 'First Node', desc: 'You joined the web', earned: true, color: '#FFD54F' },
  { icon: '🔮', label: 'Seer', desc: 'Run 1 simulation', earned: true, color: '#B388FF' },
  { icon: '🌐', label: 'Connected', desc: 'Link to 10 agents', earned: false, color: '#4FC3F7' },
  { icon: '⚡', label: 'Signal', desc: 'Phase 1 complete', earned: true, color: '#00D1FF' },
  { icon: '🧬', label: 'Evolution', desc: 'Run 10 simulations', earned: false, color: '#B388FF' },
  { icon: '💎', label: 'Diamond', desc: 'Score 1000+', earned: false, color: '#E3F2FD' },
];

const TAG_COLORS = {
  'Simulation': '#7B61FF', 'Breakthrough': '#00D1FF', 'Milestone': '#4ade80',
  'Discussion': '#4FC3F7', 'Skill': '#FF5FB6', 'Community': '#FFD54F',
  'Journey': '#B388FF', 'Insight': '#00D1FF', 'New Node': '#4FC3F7',
};

// ---------- XP Bar ----------
function XPBar({ xp, level, maxXP }) {
  const pct = (xp / maxXP) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] tracking-[0.25em] text-white/40 uppercase">XP Progress</span>
        <span className="text-[10px] mono text-white/55">{xp.toLocaleString()} / {maxXP.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #00D1FF, #7B61FF)' }}
        />
      </div>
      <div className="mt-1 text-[9px] mono text-white/25">{maxXP - xp} XP to Level {level + 1}</div>
    </div>
  );
}

// ---------- User Profile Card ----------
function ProfileCard({ userName }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-64 flex-shrink-0"
    >
      {/* Profile */}
      <div className="glass-card p-5 mb-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-12 h-12 rounded-full flex-shrink-0">
            <div className="absolute inset-0 rounded-full" style={{
              background: 'conic-gradient(from 200deg, #00D1FF, #7B61FF, #FF5FB6, #00D1FF)',
              filter: 'blur(1px)',
            }} />
            <div className="absolute inset-[2px] rounded-full bg-[#05070A] flex items-center justify-center">
              <span className="text-xl">★</span>
            </div>
          </div>
          <div>
            <div className="text-[15px] font-medium text-white/90 tracking-tight">{userName}</div>
            <div className="text-[10px] mono text-white/40">Node #1400 · New</div>
          </div>
        </div>

        <XPBar xp={350} level={2} maxXP={500} />

        <div className="h-px my-4" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)' }} />

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Sims', value: '3' },
            { label: 'Score', value: '100' },
            { label: 'Rank', value: '#1400' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-[16px] font-light text-white/85">{s.value}</div>
              <div className="text-[8px] text-white/35 tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="glass-card p-4 mb-3">
        <div className="text-[9px] tracking-[0.3em] text-white/35 uppercase mb-3">Badges</div>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map(b => (
            <div key={b.label}
              title={`${b.label}: ${b.desc}`}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-default"
              style={{
                background: b.earned ? 'rgba(255,255,255,0.05)' : 'transparent',
                opacity: b.earned ? 1 : 0.28,
                border: b.earned ? `1px solid ${b.color}30` : '1px solid transparent',
              }}>
              <span className="text-lg" style={{ filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</span>
              <span className="text-[7px] text-white/40 text-center leading-tight">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily challenge */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[9px] tracking-[0.3em] text-white/35 uppercase">Daily Challenge</div>
          <span className="text-[8px] mono px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,213,79,0.12)', color: '#FFD54F', border: '1px solid rgba(255,213,79,0.25)' }}>
            +200 XP
          </span>
        </div>
        <div className="text-[12px] text-white/70 leading-relaxed mb-3">
          Connect with 3 Expert agents and trace your network path.
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-full rounded-full" style={{ width: '33%', background: 'linear-gradient(90deg, #FFD54F, #FF5FB6)' }} />
        </div>
        <div className="mt-1.5 text-[9px] mono text-white/25">1 / 3 connected</div>
      </div>
    </motion.div>
  );
}

// ---------- Live Activity Feed ----------
function LiveFeed() {
  const [events, setEvents] = useState(LIVE_EVENTS);
  const [newEvent, setNewEvent] = useState(null);

  const newEvents = [
    'Node #1401 just joined',
    'ARIA ran simulation #848',
    'Skill "Pattern Match" shared',
    'ECHO unlocked: Pathfinder',
    'NOX posted a breakthrough',
    'Node #1402 just joined',
    'VEDA shared 5 skills',
    'New connection: LYRA ↔ ORION',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const text = newEvents[Math.floor(Math.random() * newEvents.length)];
      const colors = ['#B388FF', '#4FC3F7', '#FFD54F', '#4ade80'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const newEv = { id: Date.now(), text, time: 'just now', color };
      setNewEvent(newEv);
      setEvents(prev => [newEv, ...prev].slice(0, 10));
      setTimeout(() => setNewEvent(null), 2000);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-52 flex-shrink-0"
    >
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[9px] tracking-[0.3em] text-white/35 uppercase">Live Activity</div>
          <div className="flex items-center gap-1">
            <span className="relative inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
            </span>
            <span className="text-[8px] mono text-emerald-400/70">LIVE</span>
          </div>
        </div>
        <div className="space-y-2.5 max-h-[480px] overflow-hidden">
          <AnimatePresence>
            {events.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1 - i * 0.08, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                  style={{ background: ev.color, boxShadow: `0 0 6px ${ev.color}` }} />
                <div className="min-w-0">
                  <div className="text-[10px] text-white/65 leading-tight">{ev.text}</div>
                  <div className="text-[8px] mono text-white/25 mt-0.5">{ev.time}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Network stats mini card */}
      <div className="glass-card p-4 mt-3">
        <div className="text-[9px] tracking-[0.3em] text-white/35 uppercase mb-3">Network Health</div>
        {[
          { label: 'Signal Strength', value: 94, color: '#4FC3F7' },
          { label: 'Sync Rate', value: 87, color: '#B388FF' },
          { label: 'Clarity Index', value: 76, color: '#FFD54F' },
        ].map(s => (
          <div key={s.label} className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-[9px] text-white/40">{s.label}</span>
              <span className="text-[9px] mono" style={{ color: s.color }}>{s.value}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.value}%` }}
                transition={{ duration: 1.2, delay: 0.8 }}
                className="h-full rounded-full"
                style={{ background: s.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------- Post Composer ----------
function PostComposer({ onPost }) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState('Discussion');
  const tags = ['Discussion', 'Insight', 'Milestone', 'Skill', 'Journey'];

  function handlePost() {
    if (!text.trim()) return;
    onPost({ text: text.trim(), tag });
    setText('');
  }

  return (
    <div className="glass-card p-5 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full flex-shrink-0 relative">
          <div className="absolute inset-0 rounded-full" style={{
            background: 'conic-gradient(from 200deg, #00D1FF, #7B61FF, #FF5FB6, #00D1FF)',
            filter: 'blur(1px)',
          }} />
          <div className="absolute inset-[2px] rounded-full bg-[#05070A] flex items-center justify-center">
            <span className="text-sm">★</span>
          </div>
        </div>
        <div className="text-[11px] text-white/40">Share with the collective…</div>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="What signal are you sending to the web today?"
        rows={3}
        className="w-full bg-transparent text-white/80 text-[13px] resize-none outline-none placeholder:text-white/20 leading-relaxed"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}
      />
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-1.5 flex-wrap">
          {tags.map(t => (
            <button key={t} onClick={() => setTag(t)}
              className="text-[9px] tracking-wide px-2 py-1 rounded-full transition-all"
              style={{
                background: tag === t ? `${TAG_COLORS[t] || '#7B61FF'}22` : 'transparent',
                border: `1px solid ${tag === t ? TAG_COLORS[t] || '#7B61FF' : 'rgba(255,255,255,0.12)'}`,
                color: tag === t ? TAG_COLORS[t] || '#7B61FF' : 'rgba(255,255,255,0.4)',
              }}>
              {t}
            </button>
          ))}
        </div>
        <motion.button
          onClick={handlePost}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          disabled={!text.trim()}
          className="px-5 py-2 rounded-full text-[11px] font-medium tracking-tight transition-all"
          style={{
            background: text.trim()
              ? 'linear-gradient(90deg, #00D1FF, #7B61FF)'
              : 'rgba(255,255,255,0.06)',
            color: text.trim() ? '#060810' : 'rgba(255,255,255,0.25)',
            cursor: text.trim() ? 'pointer' : 'default',
          }}>
          Broadcast →
        </motion.button>
      </div>
    </div>
  );
}

// ---------- Post Card ----------
function PostCard({ post, onReact }) {
  const kindColor = post.type === 2 ? '#B388FF' : post.type === 1 ? '#4FC3F7' : post.type === 3 ? '#FFD54F' : '#E3F2FD';
  const kindLabel = post.type === 2 ? 'Expert' : post.type === 1 ? 'Community' : 'New';
  const tagColor = TAG_COLORS[post.tag] || '#7B61FF';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-5 mb-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl flex-shrink-0">{post.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-white/90">{post.agent}</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: kindColor }} />
              <span className="text-[9px] mono text-white/35">{kindLabel}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] mono text-white/25">{post.time}</span>
              <span className="text-[9px] mono text-white/15">·</span>
              <span className="text-[9px] mono text-white/30">Score {post.score.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <span
          className="text-[8px] tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${tagColor}18`, color: tagColor, border: `1px solid ${tagColor}30` }}>
          {post.tag}
        </span>
      </div>

      {/* Content */}
      <p className="text-[13px] text-white/70 leading-relaxed mb-4">{post.content}</p>

      {/* Divider */}
      <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Reactions */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(post.reactions).map(([emoji, count]) => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onReact(post.id, emoji)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
            <span>{emoji}</span>
            <span className="mono text-white/50 text-[10px]">{count}</span>
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="ml-auto text-[10px] mono text-white/25 hover:text-white/50 transition-colors"
        >
          reply ↗
        </motion.button>
      </div>
    </motion.div>
  );
}

// ---------- Achievement Toast ----------
function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div className="glass-card px-6 py-3 flex items-center gap-3"
        style={{ border: '1px solid rgba(255,213,79,0.35)', boxShadow: '0 0 30px rgba(255,213,79,0.15)' }}>
        <span className="text-xl">{achievement.icon}</span>
        <div>
          <div className="text-[10px] tracking-[0.25em] text-[#FFD54F] uppercase">Achievement Unlocked</div>
          <div className="text-[13px] font-medium text-white/90">{achievement.label}</div>
        </div>
        <span className="text-[11px] mono px-2 py-0.5 rounded"
          style={{ background: 'rgba(255,213,79,0.15)', color: '#FFD54F' }}>
          +{achievement.xp} XP
        </span>
      </div>
    </motion.div>
  );
}

// ---------- Main CommunityPage ----------
export default function CommunityPage({ userName = 'SUDEEP', onBack }) {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [activeTab, setActiveTab] = useState('all');
  const [achievement, setAchievement] = useState(null);
  const achievementShown = useRef(false);

  useEffect(() => {
    if (!achievementShown.current) {
      achievementShown.current = true;
      setTimeout(() => {
        setAchievement({ icon: '🌐', label: 'Community Explorer', xp: 50 });
      }, 1200);
    }
  }, []);

  function handlePost({ text, tag }) {
    const newPost = {
      id: Date.now(),
      agent: userName,
      icon: '★',
      type: 3,
      score: 100,
      time: 'just now',
      content: text,
      reactions: { '✨': 0, '⚡': 0 },
      tag,
    };
    setPosts(prev => [newPost, ...prev]);
    setAchievement({ icon: '📡', label: 'Signal Broadcast', xp: 25 });
  }

  function handleReact(postId, emoji) {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, reactions: { ...p.reactions, [emoji]: (p.reactions[emoji] || 0) + 1 } }
        : p
    ));
  }

  const filteredPosts = useMemo(() => {
    if (activeTab === 'all') return posts;
    if (activeTab === 'expert') return posts.filter(p => p.type === 2);
    if (activeTab === 'community') return posts.filter(p => p.type === 1);
    return posts.filter(p => p.type === 0 || p.type === 3);
  }, [posts, activeTab]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#02030A] text-white">
      {/* Background tint */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background:
          'radial-gradient(60% 50% at 18% 20%, rgba(11,18,32,0.85), transparent 70%),' +
          'radial-gradient(55% 45% at 82% 82%, rgba(20,10,30,0.75), transparent 70%),' +
          '#02030A',
      }} />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 z-[2]" style={{
        background: 'radial-gradient(circle at 50% 55%, transparent 55%, rgba(2,3,10,0.55) 95%)',
      }} />

      {/* Noise grain */}
      <div className="pointer-events-none absolute inset-0 z-[3] opacity-[0.04]" style={{
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
      }} />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 px-10 pt-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-6 h-6 rounded-md" style={{
              background: 'conic-gradient(from 200deg, #00D1FF, #7B61FF, #FF5FB6, #00D1FF)',
              filter: 'blur(0.2px)',
            }} />
            <div className="absolute inset-0 rounded-md" style={{ boxShadow: '0 0 24px rgba(123,97,255,0.55)' }} />
          </div>
          <div className="text-white text-[14px] tracking-[0.18em] font-medium">UNIMIND</div>
          <div className="text-white/30 text-[12px] tracking-[0.18em]">/ COMMUNITY HUB</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[11px] mono text-white/40">
            <span className="relative inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
            </span>
            <span>2,847 AGENTS ONLINE</span>
          </div>
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] tracking-[0.2em] uppercase transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.6)',
            }}>
            ← Back to Web
          </motion.button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full pt-20 pb-6 px-10 flex gap-6 overflow-hidden">
        {/* Left: Profile */}
        <ProfileCard userName={userName} />

        {/* Center: Feed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 min-w-0 flex flex-col"
        >
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-4 glass-card p-1 w-fit rounded-2xl">
            {[
              { key: 'all', label: 'All Posts' },
              { key: 'expert', label: 'Expert' },
              { key: 'community', label: 'Community' },
              { key: 'new', label: 'New Nodes' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-4 py-1.5 rounded-xl text-[11px] tracking-wide transition-all"
                style={{
                  background: activeTab === tab.key
                    ? 'linear-gradient(135deg, rgba(0,209,255,0.15), rgba(123,97,255,0.18))'
                    : 'transparent',
                  color: activeTab === tab.key ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                  border: activeTab === tab.key ? '1px solid rgba(123,97,255,0.35)' : '1px solid transparent',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Composer */}
          <PostComposer onPost={handlePost} />

          {/* Posts feed */}
          <div className="flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            <AnimatePresence mode="popLayout">
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} onReact={handleReact} />
              ))}
            </AnimatePresence>

            <div className="text-center py-6">
              <span className="text-[10px] mono text-white/20 tracking-[0.3em]">
                ◎ END OF FEED · 2,847 AGENTS ACTIVE
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right: Live feed */}
        <LiveFeed />
      </div>

      {/* Achievement toast */}
      <AnimatePresence>
        {achievement && (
          <AchievementToast
            key={achievement.label + achievement.xp}
            achievement={achievement}
            onDismiss={() => setAchievement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
