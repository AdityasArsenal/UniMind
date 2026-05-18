import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, getChatHistory, getMe } from '../lib/api';

const COMPLETION_PHRASES = ['profile is ready', 'agent profile is ready', 'the web now knows you'];

// Quick-reply chips per conversation stage (based on AI message count)
const SUGGESTION_SETS = [
  [
    { label: "Building a startup 🚀" },
    { label: "Student figuring life out 🎓" },
    { label: "Switching careers ⚡" },
    { label: "Obsessed with AI / tech 🤖" },
  ],
  [
    { label: "Launch my own product 🏗" },
    { label: "Masters or PhD abroad ✈️" },
    { label: "Financial independence 💎" },
    { label: "Make a real impact 🌍" },
  ],
  [
    { label: "Shipped code / built apps 💻" },
    { label: "Led teams at work 👥" },
    { label: "Research or writing 📚" },
    { label: "Just getting started 🌱" },
  ],
  [
    { label: "Afraid of failing publicly 😰" },
    { label: "Worried about the wrong path 🔱" },
    { label: "Need clarity on next step 🧭" },
    { label: "Financial pressure first 🛡" },
  ],
];

const XP_PER_CHUNK = 50;
const MILESTONES = [
  { chunks: 3, xp: 150, label: "First tier unlocked", icon: "⚡" },
  { chunks: 7, xp: 350, label: "Expert profile forming", icon: "🔮" },
  { chunks: 12, xp: 600, label: "Full agent profile!", icon: "✨" },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.18 }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: '#7B61FF' }}
        />
      ))}
    </div>
  );
}

function AiBubble({ content }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3 max-w-[82%]"
    >
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ background: 'linear-gradient(135deg, #7B61FF, #00D1FF)' }}
      >
        AI
      </div>
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
        style={{
          background: 'rgba(123,97,255,0.10)',
          border: '1px solid rgba(123,97,255,0.18)',
          color: 'rgba(255,255,255,0.88)',
        }}
      >
        {content}
      </div>
    </motion.div>
  );
}

function UserBubble({ content }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-end"
    >
      <div
        className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[75%]"
        style={{
          background: 'linear-gradient(135deg, rgba(0,209,255,0.14), rgba(123,97,255,0.14))',
          border: '1px solid rgba(0,209,255,0.22)',
          color: 'rgba(255,255,255,0.92)',
        }}
      >
        {content}
      </div>
    </motion.div>
  );
}

function XpToast({ xp, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={xp}
          initial={{ opacity: 0, y: 8, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: 'linear-gradient(135deg, rgba(0,209,255,0.15), rgba(123,97,255,0.2))',
            border: '1px solid rgba(0,209,255,0.3)',
            color: '#00D1FF',
          }}
        >
          <span>🧠</span>
          <span>+{XP_PER_CHUNK} XP · Insight captured</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MilestoneToast({ milestone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 px-5 py-3 rounded-2xl text-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(123,97,255,0.18), rgba(255,95,182,0.15))',
        border: '1px solid rgba(123,97,255,0.35)',
        color: 'rgba(255,255,255,0.9)',
      }}
    >
      <span className="text-xl">{milestone.icon}</span>
      <div>
        <div className="font-medium" style={{ color: '#7B61FF' }}>{milestone.label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {milestone.xp} XP reached · Profile unlocking
        </div>
      </div>
    </motion.div>
  );
}

function SuggestionChips({ suggestions, onSelect, disabled }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.35 }}
      className="flex flex-wrap gap-2 mb-3"
    >
      <span className="w-full text-[10px] tracking-[0.22em] uppercase mb-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>
        Quick answers →
      </span>
      {suggestions.map((s, i) => (
        <motion.button
          key={s.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          onClick={() => !disabled && onSelect(s.label)}
          disabled={disabled}
          whileHover={disabled ? {} : { y: -2, scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.97 }}
          className="px-3 py-1.5 rounded-full text-xs transition-all"
          style={{
            background: 'rgba(123,97,255,0.08)',
            border: '1px solid rgba(123,97,255,0.25)',
            color: 'rgba(255,255,255,0.7)',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => {
            if (!disabled) {
              e.currentTarget.style.background = 'rgba(123,97,255,0.18)';
              e.currentTarget.style.borderColor = 'rgba(123,97,255,0.5)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(123,97,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(123,97,255,0.25)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          }}
        >
          {s.label}
        </motion.button>
      ))}
    </motion.div>
  );
}

function ProfilePanel({ profile, loading: profileLoading }) {
  const progressPct = Math.min((profile.chunks_saved / 12) * 100, 100);
  const xp = profile.chunks_saved * XP_PER_CHUNK;
  const level = profile.chunks_saved >= 12 ? 'AGENT COMPLETE' :
    profile.chunks_saved >= 7 ? 'LEVEL 3 · EXPERT' :
    profile.chunks_saved >= 3 ? 'LEVEL 2 · EMERGING' :
    profile.chunks_saved >= 1 ? 'LEVEL 1 · NOVICE' : 'LEVEL 0 · UNKNOWN';
  const levelColor = profile.chunks_saved >= 12 ? '#FF5FB6' :
    profile.chunks_saved >= 7 ? '#7B61FF' :
    profile.chunks_saved >= 3 ? '#00D1FF' : 'rgba(255,255,255,0.3)';

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <div>
        <div className="text-xs tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>YOUR AGENT</div>
        <div
          className="text-lg font-light tracking-wider"
          style={{ background: 'linear-gradient(135deg, #00D1FF, #7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          PROFILE
        </div>
        <div className="mt-1.5 text-[10px] tracking-[0.22em] font-medium" style={{ color: levelColor }}>
          {level}
        </div>
      </div>

      {/* XP bar */}
      <div
        className="rounded-xl p-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>XP</span>
          <span className="text-[11px] font-medium" style={{ color: levelColor }}>{xp}</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, #00D1FF, #7B61FF, #FF5FB6)` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>0</span>
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>600 XP</span>
        </div>
      </div>

      {/* Bio */}
      <div
        className="rounded-xl p-4 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-xs tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>BIO</div>
        <p className="text-xs leading-relaxed" style={{ color: profile.bio ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>
          {profile.bio || 'Building from your answers...'}
        </p>
      </div>

      {/* Skills */}
      <div
        className="rounded-xl p-4 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-xs tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>SKILLS DETECTED</div>
        {profile.skills.length === 0 ? (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Keep sharing to unlock...</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((s, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(0,209,255,0.1)', border: '1px solid rgba(0,209,255,0.2)', color: '#00D1FF' }}
              >
                {s.length > 24 ? s.slice(0, 22) + '…' : s}
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {/* Knowledge progress */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>KNOWLEDGE</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {profile.chunks_saved} / 12 insights
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7B61FF, #00D1FF)' }}
          />
        </div>
        <p className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {profileLoading ? 'Analyzing...' : progressPct >= 100 ? 'Profile complete!' : `${Math.round(progressPct)}% complete`}
        </p>
      </div>
    </div>
  );
}

export default function ChatbotPage({ userName, onComplete, onSkip }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [profile, setProfile] = useState({ bio: '', skills: [], chunks_saved: 0 });
  const [initialized, setInitialized] = useState(false);
  const [showXpToast, setShowXpToast] = useState(false);
  const [xpToastKey, setXpToastKey] = useState(0);
  const [activeMilestone, setActiveMilestone] = useState(null);
  const prevChunksRef = useRef(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const initCalledRef = useRef(false); // prevent double-init in React strict mode

  // Load chat history / opening message on mount — guarded against double-init
  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    async function init() {
      setLoading(true);
      try {
        const history = await getChatHistory();
        if (history.length > 0) {
          setMessages(history.map(m => ({ role: m.role, content: m.content })));
        } else {
          const res = await sendChatMessage('__init__');
          setMessages([{ role: 'assistant', content: res.message.content }]);
        }
        const me = await getMe();
        setProfile({
          bio: me.agent_bio || '',
          skills: me.agent_skills || [],
          chunks_saved: 0,
        });
      } catch (e) {
        console.warn('Chatbot init error:', e);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    }
    init();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // XP toast + milestone detection
  useEffect(() => {
    const cur = profile.chunks_saved;
    const prev = prevChunksRef.current;
    if (cur > prev) {
      setXpToastKey(k => k + 1);
      setShowXpToast(true);
      setTimeout(() => setShowXpToast(false), 2200);

      const milestone = MILESTONES.find(m => m.chunks === cur);
      if (milestone) {
        setActiveMilestone(milestone);
        setTimeout(() => setActiveMilestone(null), 3500);
      }
    }
    prevChunksRef.current = cur;
  }, [profile.chunks_saved]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(trimmed);
      const reply = res.message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      if (res.profile_update) {
        setProfileLoading(true);
        setProfile({
          bio: res.profile_update.bio || '',
          skills: res.profile_update.skills || [],
          chunks_saved: res.profile_update.chunks_saved || 0,
        });
        setProfileLoading(false);
      }

      if (COMPLETION_PHRASES.some(p => reply.toLowerCase().includes(p))) {
        setIsComplete(true);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSend() { sendMessage(input); }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleChipClick(label) { sendMessage(label); }

  const aiMsgCount = messages.filter(m => m.role === 'assistant').length;
  const suggestionStage = Math.min(Math.floor(aiMsgCount / 2), SUGGESTION_SETS.length - 1);
  const currentSuggestions = SUGGESTION_SETS[suggestionStage];
  const showSuggestions = !isComplete && initialized && !loading;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#02030A', color: 'white' }}>

      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs tracking-[0.35em]" style={{ color: 'rgba(255,255,255,0.35)' }}>UNIMIND</span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
          <span
            className="text-xs tracking-[0.25em]"
            style={{ background: 'linear-gradient(135deg, #00D1FF, #7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            KNOWLEDGE ENGINE
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Mission badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-[0.2em]"
            style={{ background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.2)', color: 'rgba(255,255,255,0.5)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
            MISSION: BUILD YOUR AGENT
          </div>
          <button
            onClick={onSkip}
            className="text-xs tracking-wider transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.3)'; }}
          >
            Skip for now →
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-72 flex-shrink-0 overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <ProfilePanel profile={profile} loading={profileLoading} />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-4" style={{ scrollBehavior: 'smooth' }}>

            {!initialized && (
              <div className="flex justify-center py-8"><TypingDots /></div>
            )}

            {messages.map((msg, i) =>
              msg.role === 'assistant'
                ? <AiBubble key={i} content={msg.content} />
                : <UserBubble key={i} content={msg.content} />
            )}

            {loading && initialized && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #7B61FF, #00D1FF)' }}>AI</div>
                <div className="rounded-2xl rounded-tl-sm"
                  style={{ background: 'rgba(123,97,255,0.10)', border: '1px solid rgba(123,97,255,0.18)' }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Milestone toast (inline in messages area) */}
            <AnimatePresence>
              {activeMilestone && (
                <MilestoneToast key={activeMilestone.label} milestone={activeMilestone} />
              )}
            </AnimatePresence>

            {/* Completion banner */}
            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6 text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,209,255,0.08), rgba(123,97,255,0.12))',
                    border: '1px solid rgba(0,209,255,0.2)',
                  }}
                >
                  <div className="text-3xl mb-2">✨</div>
                  <div className="text-sm font-medium mb-1" style={{ color: '#00D1FF' }}>Agent profile complete</div>
                  <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    UniMind now knows who you are.
                  </p>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {profile.chunks_saved * XP_PER_CHUNK} XP · {profile.chunks_saved} insights captured
                  </p>
                  <button
                    onClick={onComplete}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium tracking-wider transition-all"
                    style={{ background: 'linear-gradient(135deg, #00D1FF, #7B61FF)', color: '#fff' }}
                  >
                    Enter UniMind →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 px-8 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

            {/* XP toast (above input) */}
            <div className="flex justify-end mb-2 h-8">
              <XpToast xp={profile.chunks_saved * XP_PER_CHUNK} visible={showXpToast} key={xpToastKey} />
            </div>

            {/* Suggestion chips */}
            <AnimatePresence mode="wait">
              {showSuggestions && (
                <SuggestionChips
                  key={suggestionStage}
                  suggestions={currentSuggestions}
                  onSelect={handleChipClick}
                  disabled={loading}
                />
              )}
            </AnimatePresence>

            {/* Text input row */}
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell the AI about yourself..."
                rows={2}
                disabled={loading}
                className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: '1.5',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(123,97,255,0.4)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: loading || !input.trim() ? 'rgba(123,97,255,0.15)' : 'linear-gradient(135deg, #7B61FF, #00D1FF)',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-xs text-center" style={{ color: 'rgba(255,255,255,0.18)' }}>
              Enter to send · Shift+Enter for new line · or pick a quick answer above
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
