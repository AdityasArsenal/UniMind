import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingPage from './pages/OnboardingPage';
import AgenticWebPage from './pages/AgenticWebPage';
import CommunityPage from './pages/CommunityPage';

function TransitionBridge({ phase }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'idle' ? 0 : 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999, background: '#02030A', pointerEvents: 'none' }}
    >
      {/* Central collapsing orb */}
      <motion.div
        animate={
          phase === 'shrink-in'
            ? { scale: 1, opacity: 1 }
            : phase === 'shrink-out'
            ? { scale: 0.0, opacity: 0 }
            : { scale: 0, opacity: 0 }
        }
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: 200, height: 200, borderRadius: '50%', position: 'relative' }}
      >
        {/* Outer glow */}
        <div
          style={{
            position: 'absolute',
            inset: -40,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(123,97,255,0.35) 0%, rgba(0,209,255,0.15) 50%, transparent 75%)',
            filter: 'blur(20px)',
          }}
        />
        {/* Core orb */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'conic-gradient(from 200deg, #00D1FF, #7B61FF, #FF5FB6, #7B61FF, #00D1FF)',
            filter: 'blur(2px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 12,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(180,160,255,0.7) 50%, transparent 80%)',
          }}
        />
        {/* Hot white center */}
        <div
          style={{
            position: 'absolute',
            inset: '35%',
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 0 40px 20px rgba(255,255,255,0.6)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function App() {
  // page: 'onboarding' | 'transitioning' | 'agentic' | 'community'
  const [page, setPage] = useState('onboarding');
  // bridgePhase: 'idle' | 'shrink-in' | 'shrink-out' | 'hold'
  const [bridgePhase, setBridgePhase] = useState('idle');
  const [isExiting, setIsExiting] = useState(false);
  const [userName, setUserName] = useState('SUDEEP');

  function handleEnter() {
    setIsExiting(true);         // start fading Page 1
    setBridgePhase('shrink-in');// orb grows in
    setPage('transitioning');

    // T=400ms: orb shrinks to point
    setTimeout(() => setBridgePhase('shrink-out'), 400);
    // T=800ms: hold black
    setTimeout(() => setBridgePhase('hold'), 800);
    // T=1000ms: switch to Page 2, bridge overlay stays briefly
    setTimeout(() => {
      setPage('agentic');
      setBridgePhase('idle');   // bridge fades out over 250ms
      setIsExiting(false);
    }, 1000);
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#02030A' }}>
      <AnimatePresence>
        {(page === 'onboarding' || page === 'transitioning') && (
          <motion.div
            key="page1"
            initial={{ opacity: 1 }}
            animate={{ opacity: isExiting ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeIn' }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <OnboardingPage onEnter={handleEnter} />
          </motion.div>
        )}

        {page === 'agentic' && (
          <motion.div
            key="page2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <AgenticWebPage
              userName={userName}
              onNavigateCommunity={() => setPage('community')}
            />
          </motion.div>
        )}

        {page === 'community' && (
          <motion.div
            key="community"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <CommunityPage
              userName={userName}
              onBack={() => setPage('agentic')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <TransitionBridge phase={bridgePhase} />
    </div>
  );
}
