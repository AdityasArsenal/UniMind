import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  sendChatMessage, getChatHistory, getMe,
  clearChatHistory, deleteChatMessage, enhanceContent, uploadFile,
} from '../lib/api';

const COMPLETION_PHRASES = ['profile is ready', 'agent profile is ready', 'the web now knows you'];

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

const ACCEPT_TYPES = ".pdf,.docx,.txt,image/png,image/jpeg,image/webp,image/gif";

// ── Small UI atoms ─────────────────────────────────────────────────────────────

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

function FileChip({ name, type, onRemove }) {
  const icon = type === 'image' ? '🖼' : type === 'pdf' ? '📄' : type === 'docx' ? '📝' : '📎';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
      style={{
        background: 'rgba(0,209,255,0.08)',
        border: '1px solid rgba(0,209,255,0.25)',
        color: 'rgba(255,255,255,0.75)',
      }}
    >
      <span>{icon}</span>
      <span className="max-w-[120px] truncate">{name}</span>
      <button
        onClick={onRemove}
        className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}
      >
        ×
      </button>
    </motion.div>
  );
}

// ── Enhance panel ──────────────────────────────────────────────────────────────

function EnhancePanel({ original, enhanced, loading, onConfirm, onCancel, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10,8,30,0.95)',
        border: '1px solid rgba(123,97,255,0.35)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(123,97,255,0.15)' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: '#7B61FF', fontSize: 16 }}>✦</span>
          <span className="text-xs tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            AI EXPANDED YOUR MESSAGE
          </span>
        </div>
        <button
          onClick={onCancel}
          className="text-xs px-2 py-1 rounded-lg transition-all"
          style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
        >
          Cancel
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Original */}
        <div>
          <div className="text-[10px] tracking-[0.2em] mb-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            YOUR BRIEF INPUT
          </div>
          <p className="text-xs leading-relaxed px-3 py-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)' }}>
            {original}
          </p>
        </div>

        {/* Enhanced */}
        <div>
          <div className="text-[10px] tracking-[0.2em] mb-1.5 flex items-center gap-2" style={{ color: '#7B61FF' }}>
            <span>AI EXPANDED VERSION</span>
            {loading && <TypingDots />}
          </div>
          {loading ? (
            <div className="h-16 rounded-lg animate-pulse" style={{ background: 'rgba(123,97,255,0.06)' }} />
          ) : (
            <textarea
              value={enhanced}
              onChange={e => onChange(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none leading-relaxed"
              style={{
                background: 'rgba(123,97,255,0.06)',
                border: '1px solid rgba(123,97,255,0.25)',
                color: 'rgba(255,255,255,0.88)',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(123,97,255,0.55)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(123,97,255,0.25)'; }}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(enhanced)}
            disabled={loading || !enhanced}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium tracking-wider transition-all"
            style={{
              background: loading ? 'rgba(123,97,255,0.15)' : 'linear-gradient(135deg, #7B61FF, #00D1FF)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Send Enhanced ↑
          </button>
          <button
            onClick={() => onConfirm(original)}
            className="px-5 py-2.5 rounded-xl text-sm transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.55)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
          >
            Send Original
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Message bubbles ────────────────────────────────────────────────────────────

function AiBubble({ content, id, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3 max-w-[82%] group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ background: 'linear-gradient(135deg, #7B61FF, #00D1FF)' }}
      >
        AI
      </div>
      <div className="relative">
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
        {id && (
          <AnimatePresence>
            {hovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onDelete(id)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: 'rgba(255,60,60,0.7)', color: '#fff', border: '1px solid rgba(255,60,60,0.4)' }}
                title="Delete message"
              >
                ×
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

function UserBubble({ content, id, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-end group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative">
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
        {id && (
          <AnimatePresence>
            {hovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onDelete(id)}
                className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: 'rgba(255,60,60,0.7)', color: '#fff', border: '1px solid rgba(255,60,60,0.4)' }}
                title="Delete message"
              >
                ×
              </motion.button>
            )}
          </AnimatePresence>
        )}
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

// ── Profile panel ──────────────────────────────────────────────────────────────

function ProfilePanel({ profile, loading: profileLoading, onClear }) {
  const [confirmClear, setConfirmClear] = useState(false);
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
      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>XP</span>
          <span className="text-[11px] font-medium" style={{ color: levelColor }}>{xp}</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #00D1FF, #7B61FF, #FF5FB6)' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>0</span>
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>600 XP</span>
        </div>
      </div>

      {/* Bio */}
      <div className="rounded-xl p-4 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-xs tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>BIO</div>
        <p className="text-xs leading-relaxed" style={{ color: profile.bio ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>
          {profile.bio || 'Building from your answers...'}
        </p>
      </div>

      {/* Skills */}
      <div className="rounded-xl p-4 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
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
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>KNOWLEDGE</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{profile.chunks_saved} / 12 insights</span>
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

      {/* Clear history */}
      <div className="mt-auto">
        <AnimatePresence mode="wait">
          {confirmClear ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.2)' }}
            >
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Clear entire chat history?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onClear(); setConfirmClear(false); }}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(255,60,60,0.25)', color: '#ff6b6b', border: '1px solid rgba(255,60,60,0.3)' }}
                >
                  Clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-1.5 rounded-lg text-xs"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmClear(true)}
              className="w-full py-2 rounded-xl text-xs transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,80,80,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              Clear chat history
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

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

  // File upload state
  const [pendingFile, setPendingFile] = useState(null); // { name, type, extractedText }
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Enhance state
  const [showEnhance, setShowEnhance] = useState(false);
  const [enhancedText, setEnhancedText] = useState('');
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [enhanceOriginal, setEnhanceOriginal] = useState('');

  const prevChunksRef = useRef(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const initCalledRef = useRef(false);

  // Load history on mount
  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;
    async function init() {
      setLoading(true);
      try {
        const history = await getChatHistory();
        if (history.length > 0) {
          setMessages(history.map(m => ({ id: m.id, role: m.role, content: m.content })));
        } else {
          const res = await sendChatMessage('__init__');
          setMessages([{ id: res.message.id, role: 'assistant', content: res.message.content }]);
        }
        const me = await getMe();
        setProfile({ bio: me.agent_bio || '', skills: me.agent_skills || [], chunks_saved: 0 });
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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, showEnhance]);

  // XP / milestone detection
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

  // ── Send message ─────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setShowEnhance(false);
    setMessages(prev => [...prev, { id: null, role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);
    try {
      const res = await sendChatMessage(trimmed);
      const reply = res.message.content;
      setMessages(prev => {
        const updated = [...prev];
        // Patch the user message id (last user message)
        const lastUserIdx = [...updated].reverse().findIndex(m => m.role === 'user');
        if (lastUserIdx !== -1) updated[updated.length - 1 - lastUserIdx].id = res.message.id ?? null;
        return [...updated, { id: res.message.id, role: 'assistant', content: reply }];
      });
      if (res.profile_update) {
        setProfileLoading(true);
        setProfile({ bio: res.profile_update.bio || '', skills: res.profile_update.skills || [], chunks_saved: res.profile_update.chunks_saved || 0 });
        setProfileLoading(false);
      }
      if (COMPLETION_PHRASES.some(p => reply.toLowerCase().includes(p))) setIsComplete(true);
    } catch {
      setMessages(prev => [...prev, { id: null, role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // ── Delete a single message ──────────────────────────────────────────────────
  async function handleDeleteMessage(id) {
    if (!id) return;
    try {
      await deleteChatMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.warn('Delete failed:', e);
    }
  }

  // ── Clear all history ────────────────────────────────────────────────────────
  async function handleClearHistory() {
    try {
      await clearChatHistory();
      setMessages([]);
      setProfile({ bio: '', skills: [], chunks_saved: 0 });
      // Re-init opening message
      setLoading(true);
      const res = await sendChatMessage('__init__');
      setMessages([{ id: res.message.id, role: 'assistant', content: res.message.content }]);
    } catch (e) {
      console.warn('Clear failed:', e);
    } finally {
      setLoading(false);
    }
  }

  // ── File upload ──────────────────────────────────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setFileUploading(true);
    try {
      const res = await uploadFile(file);
      setPendingFile({ name: res.file_name, type: res.file_type, extractedText: res.extracted_text });
      // Pre-populate input so user can add a note
      setInput(prev => prev || `[Uploaded: ${res.file_name}]`);
    } catch (err) {
      setMessages(prev => [...prev, { id: null, role: 'assistant', content: `Could not read file: ${err.message}` }]);
    } finally {
      setFileUploading(false);
    }
  }

  // When a file is pending and user sends, prepend extracted text to the message
  async function handleSendWithFile(text) {
    let fullContent = text.trim();
    if (pendingFile) {
      fullContent = `[File: ${pendingFile.name}]\n${pendingFile.extractedText}\n\n${fullContent}`;
      setPendingFile(null);
    }
    await sendMessage(fullContent);
  }

  // ── Enhance ──────────────────────────────────────────────────────────────────
  async function handleEnhance() {
    const trimmed = input.trim();
    if (!trimmed || loading || enhanceLoading) return;
    setEnhanceOriginal(trimmed);
    setEnhancedText('');
    setShowEnhance(true);
    setEnhanceLoading(true);
    try {
      const res = await enhanceContent(trimmed);
      setEnhancedText(res.enhanced);
    } catch {
      setEnhancedText(trimmed);
    } finally {
      setEnhanceLoading(false);
    }
  }

  function handleEnhanceConfirm(text) {
    setShowEnhance(false);
    setInput('');
    sendMessage(text);
  }

  function handleEnhanceCancel() {
    setShowEnhance(false);
    setEnhancedText('');
  }

  const aiMsgCount = messages.filter(m => m.role === 'assistant').length;
  const suggestionStage = Math.min(Math.floor(aiMsgCount / 2), SUGGESTION_SETS.length - 1);
  const currentSuggestions = SUGGESTION_SETS[suggestionStage];
  const showSuggestions = !isComplete && initialized && !loading && !showEnhance;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#02030A', color: 'white' }}>

      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs tracking-[0.35em]" style={{ color: 'rgba(255,255,255,0.35)' }}>UNIMIND</span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
          <span className="text-xs tracking-[0.25em]" style={{ background: 'linear-gradient(135deg, #00D1FF, #7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KNOWLEDGE ENGINE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-[0.2em]"
            style={{ background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.2)', color: 'rgba(255,255,255,0.5)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
            MISSION: BUILD YOUR AGENT
          </div>
          <button onClick={onSkip} className="text-xs tracking-wider transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.3)'; }}>
            Skip for now →
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left panel */}
        <div className="w-72 flex-shrink-0 overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <ProfilePanel profile={profile} loading={profileLoading} onClear={handleClearHistory} />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-4" style={{ scrollBehavior: 'smooth' }}>
            {!initialized && <div className="flex justify-center py-8"><TypingDots /></div>}

            {messages.map((msg, i) =>
              msg.role === 'assistant'
                ? <AiBubble key={msg.id || i} id={msg.id} content={msg.content} onDelete={handleDeleteMessage} />
                : <UserBubble key={msg.id || i} id={msg.id} content={msg.content} onDelete={handleDeleteMessage} />
            )}

            {loading && initialized && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #7B61FF, #00D1FF)' }}>AI</div>
                <div className="rounded-2xl rounded-tl-sm" style={{ background: 'rgba(123,97,255,0.10)', border: '1px solid rgba(123,97,255,0.18)' }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <AnimatePresence>
              {activeMilestone && <MilestoneToast key={activeMilestone.label} milestone={activeMilestone} />}
            </AnimatePresence>

            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6 text-center"
                  style={{ background: 'linear-gradient(135deg, rgba(0,209,255,0.08), rgba(123,97,255,0.12))', border: '1px solid rgba(0,209,255,0.2)' }}
                >
                  <div className="text-3xl mb-2">✨</div>
                  <div className="text-sm font-medium mb-1" style={{ color: '#00D1FF' }}>Agent profile complete</div>
                  <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>UniMind now knows who you are.</p>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {profile.chunks_saved * XP_PER_CHUNK} XP · {profile.chunks_saved} insights captured
                  </p>
                  <button onClick={onComplete} className="px-6 py-2.5 rounded-xl text-sm font-medium tracking-wider transition-all"
                    style={{ background: 'linear-gradient(135deg, #00D1FF, #7B61FF)', color: '#fff' }}>
                    Enter UniMind →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 px-8 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

            {/* XP toast */}
            <div className="flex justify-end mb-2 h-8">
              <XpToast xp={profile.chunks_saved * XP_PER_CHUNK} visible={showXpToast} key={xpToastKey} />
            </div>

            {/* Enhance panel */}
            <AnimatePresence>
              {showEnhance && (
                <div className="mb-3">
                  <EnhancePanel
                    original={enhanceOriginal}
                    enhanced={enhancedText}
                    loading={enhanceLoading}
                    onConfirm={handleEnhanceConfirm}
                    onCancel={handleEnhanceCancel}
                    onChange={setEnhancedText}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Pending file chip */}
            <AnimatePresence>
              {pendingFile && (
                <div className="mb-2 flex items-center gap-2">
                  <FileChip
                    name={pendingFile.name}
                    type={pendingFile.type}
                    onRemove={() => { setPendingFile(null); setInput(''); }}
                  />
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    · {pendingFile.extractedText.length} chars extracted
                  </span>
                </div>
              )}
            </AnimatePresence>

            {/* Suggestion chips */}
            <AnimatePresence mode="wait">
              {showSuggestions && (
                <SuggestionChips
                  key={suggestionStage}
                  suggestions={currentSuggestions}
                  onSelect={text => sendMessage(text)}
                  disabled={loading}
                />
              )}
            </AnimatePresence>

            {/* Text input row */}
            <div className="flex items-end gap-2">

              {/* File upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_TYPES}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || fileUploading}
                title="Upload PDF, DOCX, image, or text file"
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: fileUploading ? 'rgba(0,209,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: fileUploading ? '#00D1FF' : 'rgba(255,255,255,0.4)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!loading && !fileUploading) { e.currentTarget.style.borderColor = 'rgba(0,209,255,0.35)'; e.currentTarget.style.color = '#00D1FF'; }}}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = fileUploading ? '#00D1FF' : 'rgba(255,255,255,0.4)'; }}
              >
                {fileUploading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 rounded-full border-t-2 border-cyan-400" style={{ borderColor: '#00D1FF transparent transparent' }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                )}
              </button>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); pendingFile ? handleSendWithFile(input) : sendMessage(input); }}}
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

              {/* Enhance button (magic wand) */}
              <button
                onClick={handleEnhance}
                disabled={loading || !input.trim() || showEnhance}
                title="Let AI expand your message before sending"
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: !input.trim() || showEnhance ? 'rgba(123,97,255,0.06)' : 'rgba(123,97,255,0.12)',
                  border: `1px solid ${!input.trim() || showEnhance ? 'rgba(123,97,255,0.1)' : 'rgba(123,97,255,0.35)'}`,
                  color: !input.trim() || showEnhance ? 'rgba(123,97,255,0.3)' : '#7B61FF',
                  cursor: loading || !input.trim() || showEnhance ? 'not-allowed' : 'pointer',
                  fontSize: 17,
                }}
                onMouseEnter={e => { if (input.trim() && !showEnhance && !loading) { e.currentTarget.style.background = 'rgba(123,97,255,0.22)'; }}}
                onMouseLeave={e => { e.currentTarget.style.background = !input.trim() || showEnhance ? 'rgba(123,97,255,0.06)' : 'rgba(123,97,255,0.12)'; }}
              >
                ✦
              </button>

              {/* Send button */}
              <button
                onClick={() => pendingFile ? handleSendWithFile(input) : sendMessage(input)}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
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
              Enter to send · Shift+Enter for new line · ✦ to expand · 📎 to upload file
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
