import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createUniMindScene } from '../lib/scene.js';

// ---------- Question schema ----------
const STEPS = [
  {
    id: "focus",
    eyebrow: "01 — Identity",
    label: "What are you currently focused on?",
    options: ["Student", "Career Switch", "Founder", "Exploring Life"],
    placeholder: "Or write your own…",
  },
  {
    id: "goal",
    eyebrow: "02 — Direction",
    label: "What major goal are you moving toward?",
    options: ["Masters Abroad", "New Job", "Start a Company", "Personal Growth"],
    placeholder: "Or describe it in your words…",
  },
  {
    id: "fear",
    eyebrow: "03 — The Honest Part",
    label: "What worries you the most?",
    options: ["Failure", "Financial Risk", "Loneliness", "Choosing Wrong Path"],
    placeholder: "Or tell it like it is…",
  },
];

// ---------- 3D scene host ----------
function SceneHost({ stage, onReady }) {
  const ref = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const inst = createUniMindScene(ref.current);
    sceneRef.current = inst;
    onReady && onReady(inst);
    return () => inst.destroy();
  }, []);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.transitionTo(stage);
  }, [stage]);

  return <div ref={ref} className="absolute inset-0" />;
}

// ---------- Animated pill ----------
function Pill({ label, selected, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={
        "group relative px-5 py-3 rounded-full text-[15px] font-medium tracking-tight transition-colors " +
        (selected
          ? "text-white"
          : "text-white/70 hover:text-white")
      }
      style={{
        background: selected
          ? "linear-gradient(135deg, rgba(0,209,255,0.18), rgba(123,97,255,0.22))"
          : "rgba(255,255,255,0.035)",
        border: selected
          ? "1px solid rgba(123,97,255,0.55)"
          : "1px solid rgba(255,255,255,0.10)",
        boxShadow: selected
          ? "0 8px 30px rgba(123,97,255,0.25), inset 0 0 0 1px rgba(255,255,255,0.05)"
          : "inset 0 0 0 1px rgba(255,255,255,0.02)",
        backdropFilter: "blur(10px)",
      }}
    >
      {selected && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow:
              "0 0 0 1px rgba(123,97,255,0.4), 0 0 24px rgba(0,209,255,0.25)",
          }}
        />
      )}
      <span className="relative">{label}</span>
    </motion.button>
  );
}

// ---------- Progress ----------
function Progress({ value }) {
  return (
    <div className="relative h-[3px] w-full rounded-full overflow-hidden"
         style={{ background: "rgba(255,255,255,0.06)" }}>
      <motion.div
        initial={false}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background:
            "linear-gradient(90deg,#00D1FF 0%,#7B61FF 55%,#FF5FB6 100%)",
          boxShadow:
            "0 0 16px rgba(0,209,255,0.45), 0 0 24px rgba(255,95,182,0.25)",
        }}
      />
    </div>
  );
}

// ---------- Ripple button ----------
function NextButton({ disabled, label, onClick }) {
  const [ripples, setRipples] = useState([]);
  function handleClick(e) {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 700);
    onClick && onClick();
  }
  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={
        "relative overflow-hidden w-full rounded-full py-4 text-[15px] font-semibold tracking-tight " +
        (disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer")
      }
      style={{
        background:
          "linear-gradient(90deg,#00D1FF 0%, #7B61FF 50%, #FF5FB6 100%)",
        color: "#0a0d14",
        boxShadow: disabled
          ? "none"
          : "0 10px 40px rgba(0,209,255,0.25), 0 10px 40px rgba(255,95,182,0.18)",
      }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: r.x, top: r.y,
            width: 8, height: 8,
            marginLeft: -4, marginTop: -4,
            background: "rgba(255,255,255,0.55)",
            animation: "rippleburst 0.7s ease-out forwards",
          }}
        />
      ))}
    </motion.button>
  );
}

// ---------- Glass card with the active question ----------
function QuestionCard({ stepIndex, answers, setAnswers }) {
  const step = STEPS[stepIndex];
  const value = answers[step.id] || { choice: null, custom: "" };

  function setChoice(c) {
    setAnswers({ ...answers, [step.id]: { choice: c, custom: "" } });
  }
  function setCustom(c) {
    setAnswers({ ...answers, [step.id]: { choice: null, custom: c } });
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card p-7"
      >
        <div className="text-[11px] tracking-[0.25em] uppercase text-white/40 font-medium">
          {step.eyebrow}
        </div>
        <h2 className="mt-3 text-[26px] leading-[1.15] tracking-tight text-white/95 font-medium">
          {step.label}
        </h2>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {step.options.map((opt) => (
            <Pill
              key={opt}
              label={opt}
              selected={value.choice === opt}
              onClick={() => setChoice(opt)}
            />
          ))}
        </div>

        <div className="mt-5">
          <div className="relative">
            <input
              type="text"
              value={value.custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={step.placeholder}
              className="w-full bg-transparent text-[15px] text-white/90 placeholder:text-white/30 py-3 pl-0 pr-3 border-b border-white/10 focus:border-white/40 focus:outline-none transition-colors"
              style={{ caretColor: "#7B61FF" }}
            />
            <span
              className="absolute left-0 right-0 bottom-0 h-[2px] origin-left pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg,#00D1FF,#7B61FF,#FF5FB6)",
                opacity: value.custom ? 0.6 : 0,
                transform: `scaleX(${value.custom ? 1 : 0})`,
                transition: "opacity 0.4s, transform 0.5s ease",
              }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------- Final payoff ----------
function FinalPayoff({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="final-payoff"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="absolute inset-x-0 bottom-[10%] flex flex-col items-center pointer-events-none select-none"
        >
          <motion.div
            initial={{ letterSpacing: "0.35em", opacity: 0 }}
            animate={{ letterSpacing: "0.12em", opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.4 }}
            className="text-[11px] uppercase text-white/45"
          >
            UniMind  ·  Agent Initialized
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.7 }}
            className="mt-3 text-[28px] tracking-tight font-light text-white"
            style={{
              textShadow:
                "0 0 28px rgba(123,97,255,0.45), 0 0 50px rgba(0,209,255,0.25)",
            }}
          >
            Your AI agent is alive.
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 1.4, delay: 1.4 }}
            className="mt-2 text-[13px] text-white/55"
          >
            A reflection of your focus, your direction, and your honesty.
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Floating dust DOM overlay ----------
function DustOverlay() {
  const dots = useMemo(() => {
    const out = [];
    for (let i = 0; i < 26; i++) {
      out.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2,
        dur: 14 + Math.random() * 18,
        delay: -Math.random() * 18,
        opacity: 0.15 + Math.random() * 0.3,
      });
    }
    return out;
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: "white",
            opacity: d.opacity,
            filter: "blur(0.3px)",
            animation: `drift ${d.dur}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ---------- Top brand bar ----------
function TopBar() {
  return (
    <div className="absolute top-0 inset-x-0 z-20 px-10 pt-7 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="w-6 h-6 rounded-md"
            style={{
              background:
                "conic-gradient(from 200deg, #00D1FF, #7B61FF, #FF5FB6, #00D1FF)",
              filter: "blur(0.2px)",
            }}
          />
          <div
            className="absolute inset-0 rounded-md"
            style={{ boxShadow: "0 0 24px rgba(123,97,255,0.55)" }}
          />
        </div>
        <div className="text-white text-[14px] tracking-[0.18em] font-medium">
          UNIMIND
        </div>
        <div className="text-white/30 text-[12px] tracking-[0.18em]">
          / THE AGENTIC WEB
        </div>
      </div>
      <div className="flex items-center gap-6 text-[12px] text-white/45 tracking-wide">
        <span>v 0.1 · onboarding</span>
        <span className="hidden md:inline">esc to exit</span>
      </div>
    </div>
  );
}

// ---------- Stage label (top-right of right pane) ----------
function StageLabel({ stage }) {
  const map = {
    dust: { kicker: "STATE 00", title: "Empty space", sub: "awaiting input" },
    molecule: { kicker: "STATE 01", title: "Particles → Molecule", sub: "identity captured" },
    dna: { kicker: "STATE 02", title: "Molecule → DNA", sub: "direction encoded" },
    brain: { kicker: "STATE 03", title: "DNA → Agent", sub: "synthesis complete" },
  };
  const s = map[stage];
  return (
    <div className="absolute top-7 right-10 z-10 text-right pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-[10px] tracking-[0.32em] text-white/35">
            {s.kicker}
          </div>
          <div className="mt-1 text-[14px] tracking-tight text-white/85 font-medium">
            {s.title}
          </div>
          <div className="text-[11px] tracking-wide text-white/40 mt-0.5">
            {s.sub}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ---------- Main App ----------
export default function OnboardingPage({ onEnter }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [stage, setStage] = useState("dust");

  const current = STEPS[stepIndex];
  const value = answers[current.id];
  const canAdvance = value && (value.choice || (value.custom && value.custom.trim().length > 1));

  function advance() {
    if (!canAdvance) return;
    const nextStageMap = ["molecule", "dna", "brain"];
    const nextStage = nextStageMap[stepIndex];
    setStage(nextStage);
    if (stepIndex < STEPS.length - 1) {
      setTimeout(() => setStepIndex(stepIndex + 1), 220);
    } else {
      setTimeout(() => setDone(true), 700);
    }
  }

  const progressDiscrete = done ? 100 : Math.round(((stepIndex + 1) / STEPS.length) * 100);

  function reset() {
    setStepIndex(0);
    setAnswers({});
    setDone(false);
    setStage("dust");
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070A] text-white">
      <div className="page-bg absolute inset-0" />
      <DustOverlay />
      <TopBar />

      {/* Grid */}
      <div className="relative z-10 grid h-full" style={{ gridTemplateColumns: "45fr 55fr" }}>
        {/* LEFT: form */}
        <div className="relative flex items-center" style={{ paddingLeft: 80, paddingRight: 40 }}>
          <div className="w-full max-w-[520px]">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="text-[11px] uppercase tracking-[0.32em] text-white/40">
                Creating your personal AI
              </div>
              <h1 className="mt-3 text-[44px] leading-[1.05] tracking-[-0.02em] font-light text-white/95">
                Let's build <span className="agent-grad">your agent</span>.
              </h1>
              <p className="mt-3 text-[15px] text-white/55 max-w-[420px]">
                This takes less than 2 minutes. Three honest questions —
                while you answer, your agent comes alive on the right.
              </p>
            </motion.div>

            <div className="mt-9">
              <div className="flex items-center gap-4 mb-5">
                <Progress value={progressDiscrete} />
                <div className="text-[11px] text-white/45 tabular-nums tracking-wider">
                  {done ? "03/03" : `${String(stepIndex + 1).padStart(2, "0")}/03`}
                </div>
              </div>

              {!done ? (
                <QuestionCard
                  stepIndex={stepIndex}
                  answers={answers}
                  setAnswers={setAnswers}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9 }}
                  className="glass-card p-7"
                >
                  <div className="text-[11px] uppercase tracking-[0.25em] text-white/40">
                    Synthesis complete
                  </div>
                  <h2 className="mt-3 text-[24px] tracking-tight text-white/95 font-medium">
                    Meet your agent.
                  </h2>
                  <div className="mt-5 space-y-3">
                    {STEPS.map((s) => {
                      const a = answers[s.id] || {};
                      const text = a.choice || a.custom || "—";
                      return (
                        <div key={s.id} className="flex items-start gap-4">
                          <div className="text-[10px] mt-1 tracking-[0.25em] text-white/35 w-14 shrink-0">
                            {s.eyebrow.split(" ")[0]}
                          </div>
                          <div className="flex-1">
                            <div className="text-[12px] text-white/45">{s.label}</div>
                            <div className="text-[15px] text-white/90 mt-0.5">{text}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <div className="mt-6">
                {!done ? (
                  <NextButton
                    disabled={!canAdvance}
                    label={stepIndex === STEPS.length - 1 ? "Bring it to life" : "Continue"}
                    onClick={advance}
                  />
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={reset}
                      className="flex-1 rounded-full py-4 text-[14px] tracking-tight text-white/70 hover:text-white transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.10)",
                      }}
                    >
                      Start over
                    </button>
                    <button
                      onClick={onEnter}
                      className="flex-1 rounded-full py-4 text-[14px] font-semibold tracking-tight"
                      style={{
                        background:
                          "linear-gradient(90deg,#00D1FF 0%, #7B61FF 50%, #FF5FB6 100%)",
                        color: "#0a0d14",
                        boxShadow:
                          "0 10px 40px rgba(123,97,255,0.25)",
                      }}
                    >
                      Enter UniMind →
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-2 text-[11px] text-white/35">
                <span className="inline-block w-1 h-1 rounded-full bg-white/40" />
                <span>Answers stay on device until you confirm.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center divider */}
        <div className="absolute top-0 bottom-0 z-10 pointer-events-none"
             style={{ left: "45%" }}>
          <div
            className="w-px h-full"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
              opacity: 0.6,
            }}
          />
        </div>

        {/* RIGHT: scene */}
        <div className="relative">
          <SceneHost stage={stage} />
          <StageLabel stage={stage} />

          {/* Vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 55%, transparent 40%, rgba(5,7,10,0.55) 90%)",
            }}
          />

          <FinalPayoff visible={done} />

          {/* Bottom helper line */}
          <div className="absolute bottom-8 left-10 right-10 flex justify-between items-center text-[10px] tracking-[0.28em] text-white/30">
            <span>PARTICLES · MOLECULE · DNA · BRAIN</span>
            <span>RENDER · LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
