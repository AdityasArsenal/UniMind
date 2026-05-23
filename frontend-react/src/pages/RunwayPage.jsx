import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

// ── Static data ───────────────────────────────────────────────────────────────

const MONTH_DATA = [
  { month:'Sep', spent:1380, budget:1300, risk:'high',   note:'Moving costs + deposit' },
  { month:'Oct', spent:1050, budget:1300, risk:'safe',   note:'Settled in' },
  { month:'Nov', spent:1120, budget:1300, risk:'safe',   note:'' },
  { month:'Dec', spent:1490, budget:1300, risk:'high',   note:'Holiday travel' },
  { month:'Jan', spent:980,  budget:1300, risk:'safe',   note:'' },
  { month:'Feb', spent:1060, budget:1300, risk:'safe',   note:'' },
  { month:'Mar', spent:1200, budget:1300, risk:'mid',    note:'Visa renewal fee' },
  { month:'Apr', spent:1070, budget:1300, risk:'safe',   note:'' },
  { month:'May', spent:1338, budget:1300, risk:'mid',    note:'Overspending this month' },
  { month:'Jun', spent:null, budget:1300, risk:'future', note:'Predicted' },
  { month:'Jul', spent:null, budget:1300, risk:'future', note:'Predicted' },
  { month:'Aug', spent:null, budget:1300, risk:'warn',   note:'Low reserves predicted' },
];

const SOURCE_TYPES = [
  { type:'salary',       label:'Salary / Stipend',    icon:'💼', color:'#69F0AE' },
  { type:'freelance',    label:'Freelance',            icon:'🧑‍💻', color:'#00D1FF' },
  { type:'side_project', label:'Side Project / SaaS', icon:'🚀', color:'#7B61FF' },
  { type:'sponsorship',  label:'Sponsorship / OSS',   icon:'💝', color:'#FF5FB6' },
  { type:'content',      label:'Content / Teaching',  icon:'🎓', color:'#FFD54F' },
  { type:'bounty',       label:'Bug Bounty',          icon:'🐛', color:'#4FC3F7' },
  { type:'other',        label:'Other',               icon:'💰', color:'#B388FF' },
];

const INIT_SOURCES = [
  { id:1, type:'salary',       label:'Salary / Stipend',     icon:'💼', color:'#69F0AE', amount:1200, active:true  },
  { id:2, type:'freelance',    label:'Freelance Projects',   icon:'🧑‍💻', color:'#00D1FF', amount:0,    active:false },
  { id:3, type:'side_project', label:'Side Project Revenue', icon:'🚀', color:'#7B61FF', amount:0,    active:false },
];

const INIT_CATEGORIES = [
  { id:'rent',      label:'Rent & Housing',     icon:'🏠', spent:520, budget:520, color:'#7B61FF' },
  { id:'groceries', label:'Groceries',          icon:'🛒', spent:180, budget:200, color:'#00D1FF' },
  { id:'cloud',     label:'Cloud & Infra',      icon:'☁️', spent:45,  budget:60,  color:'#4FC3F7' },
  { id:'devtools',  label:'Dev Tools',          icon:'🛠️', spent:38,  budget:50,  color:'#B388FF' },
  { id:'ai',        label:'SaaS & AI Tools',    icon:'🤖', spent:42,  budget:40,  color:'#FF5FB6' },
  { id:'learning',  label:'Learning',           icon:'📚', spent:29,  budget:40,  color:'#FFD54F' },
  { id:'domains',   label:'Domains & Hosting',  icon:'🌐', spent:15,  budget:20,  color:'#00D1FF' },
  { id:'transport', label:'Transport',          icon:'🚇', spent:89,  budget:100, color:'#4FC3F7' },
  { id:'food',      label:'Eating Out',         icon:'🍜', spent:95,  budget:80,  color:'#FF8A65' },
  { id:'health',    label:'Health',             icon:'💊', spent:28,  budget:60,  color:'#69F0AE' },
  { id:'hardware',  label:'Hardware (amortized)',icon:'💻', spent:42,  budget:30,  color:'#B388FF' },
];

const DEV_DEALS = [
  { store:'GitHub Education',   type:'Dev Tools',    dist:'Online', saving:'Free Pro + Copilot',      icon:'🐙', tag:'FREE'      },
  { store:'JetBrains Student',  type:'IDE License',  dist:'Online', saving:'100% off all tools',      icon:'🛠️', tag:'FREE'      },
  { store:'AWS Free Tier',      type:'Cloud Infra',  dist:'Online', saving:'$300 free credits/yr',    icon:'☁️', tag:'FREE'      },
  { store:'Vercel Hobby',       type:'Hosting',      dist:'Online', saving:'€0/mo for side projects', icon:'▲',  tag:'SAVE'      },
  { store:'Cloudflare Free',    type:'CDN & DNS',    dist:'Online', saving:'Covers 90% of use cases', icon:'🌐', tag:'FREE'      },
  { store:'Notion Education',   type:'Productivity', dist:'Online', saving:'Free Plus plan',          icon:'📋', tag:'FREE'      },
];

const INSIGHTS = [
  { icon:'☁️', text:'Cloud costs 25% over budget. Switch idle instances to spot to save ~€18/mo.',      color:'#4FC3F7' },
  { icon:'🤖', text:'3 overlapping AI subs detected. Consolidate ChatGPT + Copilot to save ~€22/mo.',    color:'#FFD54F' },
  { icon:'💡', text:'8 devs with your stack use Railway over Heroku and save €30/mo on infra.',          color:'#00D1FF' },
  { icon:'✅', text:'Learning budget well managed — €29 of €40. Keep investing in skills.',              color:'#69F0AE' },
  { icon:'🚀', text:'Adding €200/mo freelance income extends your runway by 2.8 months.',               color:'#B388FF' },
];

// ── Utility components ────────────────────────────────────────────────────────

function AnimNum({ value, prefix = '', suffix = '', decimals = 0 }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const [display, setDisplay] = useState(0);
  useEffect(() => { mv.set(value); }, [value]);
  useEffect(() => spring.on('change', v => setDisplay(v)), [spring]);
  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();
  return <span>{prefix}{formatted}{suffix}</span>;
}

function RunwayGauge({ months }) {
  const pct = Math.min(months / 12, 1);
  const r = 80, cx = 100, cy = 100;
  const circumference = Math.PI * r;
  const color = months >= 6 ? '#69F0AE' : months >= 3 ? '#FFD54F' : '#FF5FB6';
  return (
    <svg width="200" height="120" viewBox="0 0 200 120">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF5FB6" />
          <stop offset="50%" stopColor="#7B61FF" />
          <stop offset="100%" stopColor="#69F0AE" />
        </linearGradient>
      </defs>
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${circumference * pct} ${circumference}`}
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
      <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize="32" fontWeight="700" fontFamily="'JetBrains Mono',monospace">
        {months >= 12 ? '12+' : months.toFixed(1)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="Manrope">months runway</text>
    </svg>
  );
}

function MonthChart({ data, activeMonth, onHover }) {
  const maxVal = Math.max(...data.map(d => d.spent || d.budget));
  return (
    <div className="flex items-end gap-1.5 h-28 w-full">
      {data.map((d, i) => {
        const isFuture = d.risk === 'future' || d.risk === 'warn';
        const height = ((isFuture ? d.budget : d.spent) / maxVal) * 80;
        const barColor = d.risk==='high'?'#FF5FB6': d.risk==='warn'?'#FFD54F': d.risk==='mid'?'#FFD54F': d.risk==='future'?'rgba(123,97,255,0.35)':'#00D1FF';
        const isActive = activeMonth === i;
        return (
          <motion.div key={d.month} className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
            onHoverStart={() => onHover(i)} onHoverEnd={() => onHover(null)}>
            <motion.div initial={{ height: 0 }} animate={{ height: `${height}px` }}
              transition={{ delay: i * 0.04, duration: 0.6, ease: [0.22,1,0.36,1] }}
              className="w-full rounded-t-sm relative"
              style={{ background: isActive ? barColor : `${barColor}99`, boxShadow: isActive ? `0 0 12px ${barColor}66` : 'none' }}>
              {isFuture && (
                <div className="absolute inset-0 rounded-t-sm" style={{
                  background: 'repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(255,255,255,0.05) 3px,rgba(255,255,255,0.05) 6px)'
                }} />
              )}
            </motion.div>
            <span className="text-[8px] mono" style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>{d.month}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function CategoryBar({ cat, delay }) {
  const pct = Math.min(cat.spent / cat.budget, 1.5);
  const over = cat.spent > cat.budget;
  return (
    <motion.div initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay, duration:0.4 }}
      className="flex items-center gap-3">
      <span className="text-base w-5 flex-shrink-0">{cat.icon}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-[11px]" style={{ color:'rgba(255,255,255,0.65)' }}>{cat.label}</span>
          <span className="text-[11px] mono" style={{ color: over ? '#FF5FB6' : 'rgba(255,255,255,0.5)' }}>
            €{cat.spent} <span style={{ color:'rgba(255,255,255,0.25)' }}>/ €{cat.budget}</span>
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
          <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(pct*100,100)}%` }}
            transition={{ delay: delay+0.1, duration:0.7, ease:[0.22,1,0.36,1] }}
            className="h-full rounded-full"
            style={{ background: over ? 'linear-gradient(90deg,#FF5FB6,#FF8A65)' : `linear-gradient(90deg,${cat.color}99,${cat.color})`, boxShadow: over?'0 0 8px rgba(255,95,182,0.4)':'none' }} />
        </div>
      </div>
    </motion.div>
  );
}

function BudgetSlider({ label, value, min, max, step, onChange, color, prefix='€' }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-[11px]" style={{ color:'rgba(255,255,255,0.5)' }}>{label}</span>
        <span className="text-[12px] mono font-semibold" style={{ color }}>{prefix}{value.toLocaleString()}/mo</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background:`linear-gradient(90deg,${color} ${((value-min)/(max-min))*100}%,rgba(255,255,255,0.08) 0%)`, outline:'none' }} />
    </div>
  );
}

function TopBar({ onBack, onHome }) {
  return (
    <div className="absolute top-0 inset-x-0 z-30 px-10 pt-7 flex items-center justify-between pointer-events-none">
      <button onClick={onHome} className="flex items-center gap-3 group pointer-events-auto" style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
        <div className="relative">
          <div className="w-6 h-6 rounded-md" style={{ background:'conic-gradient(from 200deg,#00D1FF,#7B61FF,#FF5FB6,#00D1FF)', filter:'blur(0.2px)' }} />
          <div className="absolute inset-0 rounded-md" style={{ boxShadow:'0 0 24px rgba(123,97,255,0.55)' }} />
        </div>
        <div className="text-white text-[14px] tracking-[0.18em] font-medium group-hover:opacity-75 transition-opacity">UNIMIND</div>
        <div className="text-white/30 text-[12px] tracking-[0.18em]">/ RUNWAY SIMULATOR</div>
      </button>
      <div className="flex items-center gap-4 pointer-events-auto">
        <div className="flex items-center gap-2 text-[10px] mono tracking-wider" style={{ color:'rgba(255,213,79,0.7)' }}>
          <span className="relative inline-flex">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background:'#FFD54F' }} />
            <span className="absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping opacity-50" style={{ background:'#FFD54F' }} />
          </span>
          <span>PROTECT · ACTIVE</span>
        </div>
        <motion.button onClick={onBack} whileHover={{ scale:1.06 }} whileTap={{ scale:0.96 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] tracking-[0.22em] uppercase"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.6)' }}>
          ← Back to Web
        </motion.button>
      </div>
    </div>
  );
}

// ── Accounts tab sub-components ───────────────────────────────────────────────

function IncomeSourceCard({ source, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(source.amount);

  const commit = () => { onEdit(source.id, Number(editVal)); setEditing(false); };

  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.96 }}
      className="px-4 py-3 rounded-xl transition-colors"
      style={{
        background: source.active ? `${source.color}08` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${source.active ? `${source.color}28` : 'rgba(255,255,255,0.06)'}`,
      }}>
      <div className="flex items-center gap-3">
        <span className="text-xl flex-shrink-0">{source.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[12px] font-medium" style={{ color: source.active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)' }}>{source.label}</span>
            {source.active && <span className="text-[8px] mono px-1.5 py-0.5 rounded" style={{ background:`${source.color}20`, color:source.color }}>ACTIVE</span>}
          </div>
          {editing ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] mono" style={{ color:'rgba(255,255,255,0.4)' }}>€</span>
              <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                className="w-24 bg-transparent text-[12px] mono outline-none text-white"
                style={{ borderBottom:'1px solid rgba(255,255,255,0.2)' }}
                onKeyDown={e => e.key==='Enter' && commit()}
                autoFocus />
              <button onClick={commit} className="text-[10px] px-2 py-0.5 rounded" style={{ background:`${source.color}25`, color:source.color }}>Save</button>
              <button onClick={() => setEditing(false)} className="text-[10px]" style={{ color:'rgba(255,255,255,0.3)' }}>×</button>
            </div>
          ) : (
            <span className="text-[11px] mono" style={{ color: source.active ? source.color : 'rgba(255,255,255,0.25)' }}>
              {source.amount > 0 ? `€${source.amount.toLocaleString()}/mo` : 'Not set — click Edit'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing && (
            <button onClick={() => { setEditVal(source.amount); setEditing(true); }}
              className="text-[10px] px-2 py-0.5 rounded"
              style={{ color:'rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.05)' }}>
              Edit
            </button>
          )}
          <button onClick={() => onToggle(source.id)}
            className="w-8 h-4 rounded-full relative flex-shrink-0"
            style={{ background: source.active ? source.color : 'rgba(255,255,255,0.12)' }}>
            <motion.div animate={{ x: source.active ? 17 : 2 }}
              className="absolute top-0.5 w-3 h-3 rounded-full bg-white"
              transition={{ type:'spring', stiffness:400, damping:25 }} />
          </button>
          <button onClick={() => onDelete(source.id)}
            className="text-sm opacity-25 hover:opacity-60 transition-opacity"
            style={{ color:'#FF5FB6' }}>×</button>
        </div>
      </div>
    </motion.div>
  );
}

function AddSourcePanel({ onAdd, onClose }) {
  const [form, setForm] = useState({ type:'freelance', label:'', amount:'' });
  const selType = SOURCE_TYPES.find(t => t.type === form.type);

  const handleAdd = () => {
    if (!form.label.trim() || !form.amount) return;
    onAdd({ id: Date.now(), type: form.type, label: form.label, icon: selType.icon, color: selType.color, amount: Number(form.amount), active: true });
    onClose();
  };

  return (
    <motion.div initial={{ opacity:0, y:12, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:6, scale:0.97 }}
      className="rounded-2xl px-5 py-5"
      style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.14)', backdropFilter:'blur(20px)' }}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-[9px] mono tracking-[0.2em]" style={{ color:'rgba(255,255,255,0.4)' }}>ADD INCOME SOURCE</div>
        <button onClick={onClose} className="text-lg opacity-40 hover:opacity-70 text-white">×</button>
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-[10px] mb-2" style={{ color:'rgba(255,255,255,0.4)' }}>Type</div>
          <div className="grid grid-cols-4 gap-1.5">
            {SOURCE_TYPES.map(t => (
              <button key={t.type} onClick={() => setForm(f => ({ ...f, type:t.type }))}
                className="px-2 py-2 rounded-lg text-center transition-colors"
                style={{
                  background: form.type===t.type ? `${t.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${form.type===t.type ? `${t.color}40` : 'rgba(255,255,255,0.07)'}`,
                  color: form.type===t.type ? t.color : 'rgba(255,255,255,0.4)',
                }}>
                <div className="text-base mb-0.5">{t.icon}</div>
                <div className="text-[8px] leading-tight">{t.label.split('/')[0].trim()}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] mb-1.5" style={{ color:'rgba(255,255,255,0.4)' }}>Label</div>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label:e.target.value }))}
            placeholder={selType?.label || 'e.g. Client Project'}
            className="w-full rounded-lg px-3 py-2 text-[12px] text-white outline-none"
            style={{ border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.03)' }} />
        </div>
        <div>
          <div className="text-[10px] mb-1.5" style={{ color:'rgba(255,255,255,0.4)' }}>Monthly Amount (€)</div>
          <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount:e.target.value }))}
            placeholder="e.g. 500"
            className="w-full rounded-lg px-3 py-2 text-[12px] mono text-white outline-none"
            style={{ border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.03)' }} />
        </div>
        <motion.button onClick={handleAdd} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          className="w-full py-2.5 rounded-xl text-[11px] mono tracking-widest"
          style={{
            background: form.label && form.amount ? `linear-gradient(135deg,${selType?.color}25,${selType?.color}12)` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${form.label && form.amount ? `${selType?.color}40` : 'rgba(255,255,255,0.08)'}`,
            color: form.label && form.amount ? selType?.color : 'rgba(255,255,255,0.25)',
          }}>
          + ADD SOURCE
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function RunwayPage({ userName = 'USER', onBack, onHome }) {
  const [sources, setSources] = useState(INIT_SOURCES);
  const [categories] = useState(INIT_CATEGORIES);
  const [savings, setSavings] = useState(3400);
  const [editSavings, setEditSavings] = useState(false);
  const [savingsInput, setSavingsInput] = useState(3400);
  const [showAddSource, setShowAddSource] = useState(false);
  const [activeMonth, setActiveMonth] = useState(null);
  const [activeInsight, setActiveInsight] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Simulator-only overrides
  const [simRent, setSimRent]         = useState(520);
  const [simCloud, setSimCloud]       = useState(45);
  const [simDevTools, setSimDevTools] = useState(38);
  const [simAI, setSimAI]             = useState(42);
  const [simFood, setSimFood]         = useState(89);
  const [simOther, setSimOther]       = useState(280);

  const totalIncome = useMemo(() => sources.filter(s => s.active).reduce((sum, s) => sum + s.amount, 0), [sources]);
  const totalSpend  = useMemo(() => categories.reduce((sum, c) => sum + c.spent, 0), [categories]);
  const surplus     = totalIncome - totalSpend;

  const calcRunway = (income, spend, bank) => {
    const deficit = spend - income;
    if (deficit <= 0) return 12;
    return Math.max(0.1, bank / deficit);
  };

  const runway     = calcRunway(totalIncome, totalSpend, savings);
  const simTotal   = simRent + simCloud + simDevTools + simAI + simFood + simOther;
  const simSurplus = totalIncome - simTotal;
  const simRunway  = calcRunway(totalIncome, simTotal, savings);

  const overspend = categories.filter(c => c.spent > c.budget);

  useEffect(() => {
    const id = setInterval(() => setActiveInsight(i => (i + 1) % INSIGHTS.length), 5000);
    return () => clearInterval(id);
  }, []);

  const addSource    = src  => setSources(s => [...s, src]);
  const toggleSource = id   => setSources(s => s.map(x => x.id===id ? { ...x, active:!x.active } : x));
  const editSource   = (id, amount) => setSources(s => s.map(x => x.id===id ? { ...x, amount } : x));
  const deleteSource = id   => setSources(s => s.filter(x => x.id !== id));

  const TABS = [
    { key:'overview',  label:'Overview'  },
    { key:'accounts',  label:'Accounts'  },
    { key:'forecast',  label:'Forecast'  },
    { key:'spending',  label:'Spending'  },
    { key:'simulator', label:'Simulator' },
    { key:'deals',     label:'Dev Deals' },
  ];

  const clampedRunway = Math.min(runway, 12);
  const runwayColor   = clampedRunway < 3 ? '#FF5FB6' : clampedRunway < 6 ? '#FFD54F' : '#69F0AE';

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background:'#02030A', fontFamily:'Manrope,sans-serif' }}>
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute" style={{ top:'-10%', left:'-5%', width:'50%', height:'50%', background:'radial-gradient(circle,rgba(105,240,174,0.04) 0%,transparent 70%)', filter:'blur(60px)' }} />
        <div className="absolute" style={{ bottom:'-10%', right:'-5%', width:'45%', height:'45%', background:'radial-gradient(circle,rgba(0,209,255,0.04) 0%,transparent 70%)', filter:'blur(60px)' }} />
        <div className="absolute" style={{ top:'40%', left:'40%', width:'30%', height:'30%', background:'radial-gradient(circle,rgba(123,97,255,0.04) 0%,transparent 70%)', filter:'blur(60px)' }} />
      </div>

      <TopBar onBack={onBack} onHome={onHome || onBack} />

      <div className="absolute inset-0 flex flex-col" style={{ paddingTop:80, paddingBottom:16, paddingLeft:28, paddingRight:28 }}>

        {/* ── Hero row ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
          className="flex items-stretch gap-4 mb-4" style={{ flexShrink:0 }}>

          {/* Runway gauge */}
          <div className="flex flex-col items-center justify-center px-6 py-4 rounded-2xl"
            style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)', minWidth:220 }}>
            <div className="text-[9px] mono tracking-[0.2em] mb-2" style={{ color:'rgba(255,255,255,0.55)' }}>FINANCIAL RUNWAY</div>
            <RunwayGauge months={clampedRunway} />
            <div className="text-[10px] text-center mt-1" style={{ color:'rgba(255,255,255,0.35)' }}>
              Savings: €{savings.toLocaleString()} · Burn: €{totalSpend}/mo
            </div>
          </div>

          {/* Quick stats + income pills */}
          <div className="flex-1 rounded-2xl px-6 py-5"
            style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
            <div className="text-[9px] mono tracking-[0.2em] mb-4" style={{ color:'rgba(255,255,255,0.3)' }}>MAY 2026 · THIS MONTH</div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label:'Income',   val:totalIncome,        color:'#69F0AE'   },
                { label:'Spent',    val:totalSpend,         color: totalSpend>totalIncome?'#FF5FB6':'#4FC3F7' },
                { label:'Surplus',  val:Math.abs(surplus),  color: surplus>=0?'#69F0AE':'#FF5FB6', prefix: surplus>=0?'+€':'−€' },
                { label:'Runway',   val:clampedRunway,      color: runwayColor, suffix:'mo', decimals:1 },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-[9px] mono tracking-wider mb-1" style={{ color:'rgba(255,255,255,0.3)' }}>{s.label}</div>
                  <div className="text-[22px] font-bold mono" style={{ color:s.color, lineHeight:1 }}>
                    <AnimNum value={s.val} prefix={s.prefix || (s.suffix ? '' : '€')} suffix={s.suffix || ''} decimals={s.decimals || 0} />
                  </div>
                </div>
              ))}
            </div>
            {/* Active income source pills */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {sources.filter(s => s.active && s.amount > 0).map(s => (
                <span key={s.id} className="text-[9px] mono px-2 py-0.5 rounded-full"
                  style={{ background:`${s.color}15`, color:s.color, border:`1px solid ${s.color}28` }}>
                  {s.icon} {s.label}: €{s.amount.toLocaleString()}
                </span>
              ))}
              <button onClick={() => setActiveTab('accounts')}
                className="text-[9px] mono px-2 py-0.5 rounded-full transition-colors"
                style={{ background:'rgba(105,240,174,0.08)', color:'rgba(105,240,174,0.6)', border:'1px solid rgba(105,240,174,0.18)' }}>
                + Add income
              </button>
            </div>
          </div>

          {/* Agent insights */}
          <div className="rounded-2xl px-5 py-5 flex flex-col justify-between"
            style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)', minWidth:240 }}>
            <div className="text-[9px] mono tracking-[0.2em] mb-3" style={{ color:'rgba(255,255,255,0.3)' }}>AGENT INSIGHTS</div>
            <AnimatePresence mode="wait">
              <motion.div key={activeInsight} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.35 }} className="flex-1">
                <div className="text-xl mb-2">{INSIGHTS[activeInsight].icon}</div>
                <p className="text-[12px] leading-relaxed" style={{ color:INSIGHTS[activeInsight].color }}>{INSIGHTS[activeInsight].text}</p>
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-1.5 mt-4">
              {INSIGHTS.map((_, i) => (
                <div key={i} className="h-0.5 flex-1 rounded-full transition-all duration-300"
                  style={{ background: i===activeInsight ? '#7B61FF' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.15, duration:0.4 }}
          className="flex items-center gap-1 mb-4 p-1 rounded-xl self-start"
          style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="relative px-4 py-1.5 rounded-lg text-[10px] tracking-[0.18em] mono transition-colors"
              style={{ color: activeTab===t.key ? 'white' : 'rgba(255,255,255,0.35)' }}>
              {activeTab === t.key && (
                <motion.div layoutId="runway-tab-pill" className="absolute inset-0 rounded-lg"
                  style={{ background:'linear-gradient(135deg,rgba(105,240,174,0.1),rgba(123,97,255,0.18))', border:'1px solid rgba(105,240,174,0.2)' }}
                  transition={{ type:'spring', stiffness:300, damping:28 }} />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Tab content ── */}
        <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(123,97,255,0.3) transparent' }}>
          <AnimatePresence mode="wait">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
                className="grid grid-cols-3 gap-4">
                <div className="col-span-2 rounded-2xl px-6 py-5"
                  style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-[9px] mono tracking-[0.2em]" style={{ color:'rgba(255,255,255,0.3)' }}>YEAR OVERVIEW · 12 MONTHS</div>
                    <div className="flex gap-3 text-[9px] mono" style={{ color:'rgba(255,255,255,0.3)' }}>
                      {[['#FF5FB6','Over'],['#FFD54F','Watch'],['#00D1FF','On Track'],['rgba(123,97,255,0.4)','Forecast']].map(([c,l]) => (
                        <span key={l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background:c }} />{l}</span>
                      ))}
                    </div>
                  </div>
                  <MonthChart data={MONTH_DATA} activeMonth={activeMonth} onHover={setActiveMonth} />
                  {activeMonth !== null && (
                    <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                      className="mt-3 px-4 py-3 rounded-xl"
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] font-semibold text-white">{MONTH_DATA[activeMonth].month} 2025/26</span>
                        <span className="text-[10px] mono px-2 py-0.5 rounded" style={{
                          background: MONTH_DATA[activeMonth].risk==='high'?'rgba(255,95,182,0.15)':MONTH_DATA[activeMonth].risk==='mid'?'rgba(255,213,79,0.15)':'rgba(0,209,255,0.12)',
                          color: MONTH_DATA[activeMonth].risk==='high'?'#FF5FB6':MONTH_DATA[activeMonth].risk==='mid'?'#FFD54F':'#00D1FF',
                        }}>{MONTH_DATA[activeMonth].risk.toUpperCase()}</span>
                      </div>
                      {MONTH_DATA[activeMonth].note && <p className="text-[11px] mt-1" style={{ color:'rgba(255,255,255,0.45)' }}>{MONTH_DATA[activeMonth].note}</p>}
                      {MONTH_DATA[activeMonth].spent && <p className="text-[11px] mt-1 mono" style={{ color:'rgba(255,255,255,0.35)' }}>Spent €{MONTH_DATA[activeMonth].spent} · Budget €{MONTH_DATA[activeMonth].budget}</p>}
                    </motion.div>
                  )}
                </div>
                <div className="rounded-2xl px-5 py-5"
                  style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
                  <div className="text-[9px] mono tracking-[0.2em] mb-4" style={{ color:'rgba(255,255,255,0.3)' }}>MAY BREAKDOWN</div>
                  <div className="space-y-3">
                    {categories.map((cat, i) => <CategoryBar key={cat.id} cat={cat} delay={i * 0.04} />)}
                  </div>
                  {overspend.length > 0 && (
                    <div className="mt-4 px-3 py-2 rounded-lg" style={{ background:'rgba(255,95,182,0.08)', border:'1px solid rgba(255,95,182,0.18)' }}>
                      <p className="text-[10px]" style={{ color:'#FF5FB6' }}>⚠ Over: {overspend.map(c => c.label).join(', ')}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ACCOUNTS */}
            {activeTab === 'accounts' && (
              <motion.div key="accounts" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
                className="grid grid-cols-2 gap-4">

                {/* Left — income sources */}
                <div className="space-y-3">
                  <div className="rounded-2xl px-6 py-5"
                    style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-[9px] mono tracking-[0.2em]" style={{ color:'rgba(255,255,255,0.3)' }}>INCOME SOURCES</div>
                      <span className="text-[12px] mono font-bold" style={{ color:'#69F0AE' }}>€{totalIncome.toLocaleString()}/mo total</span>
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {sources.map(src => (
                          <IncomeSourceCard key={src.id} source={src}
                            onToggle={toggleSource} onEdit={editSource} onDelete={deleteSource} />
                        ))}
                      </AnimatePresence>
                    </div>
                    <motion.button onClick={() => setShowAddSource(s => !s)}
                      whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                      className="mt-4 w-full py-2.5 rounded-xl text-[10px] mono tracking-widest"
                      style={{ background:'rgba(105,240,174,0.07)', border:'1px solid rgba(105,240,174,0.18)', color:'rgba(105,240,174,0.7)' }}>
                      {showAddSource ? 'CANCEL' : '+ ADD INCOME SOURCE'}
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {showAddSource && <AddSourcePanel onAdd={addSource} onClose={() => setShowAddSource(false)} />}
                  </AnimatePresence>
                </div>

                {/* Right — savings + breakdown */}
                <div className="space-y-4">
                  {/* Savings balance card */}
                  <div className="rounded-2xl px-6 py-5"
                    style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
                    <div className="text-[9px] mono tracking-[0.2em] mb-3" style={{ color:'rgba(255,255,255,0.3)' }}>SAVINGS BALANCE</div>
                    {editSavings ? (
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-[22px] mono" style={{ color:'rgba(255,255,255,0.3)' }}>€</span>
                        <input type="number" value={savingsInput}
                          onChange={e => setSavingsInput(Number(e.target.value))}
                          className="bg-transparent text-[28px] mono font-bold text-white outline-none w-36"
                          style={{ borderBottom:'1px solid rgba(255,255,255,0.2)' }}
                          onKeyDown={e => { if (e.key==='Enter') { setSavings(savingsInput); setEditSavings(false); } }}
                          autoFocus />
                        <button onClick={() => { setSavings(savingsInput); setEditSavings(false); }}
                          className="text-[10px] px-3 py-1 rounded"
                          style={{ background:'rgba(105,240,174,0.15)', color:'#69F0AE' }}>Save</button>
                        <button onClick={() => setEditSavings(false)} className="text-[10px]" style={{ color:'rgba(255,255,255,0.3)' }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setSavingsInput(savings); setEditSavings(true); }}
                        className="flex items-baseline gap-2 group mb-2">
                        <span className="text-[32px] mono font-bold" style={{ color:'#69F0AE' }}>€{savings.toLocaleString()}</span>
                        <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity" style={{ color:'rgba(255,255,255,0.6)' }}>click to edit</span>
                      </button>
                    )}
                    <p className="text-[11px] mb-4" style={{ color:'rgba(255,255,255,0.35)' }}>Your current cash buffer. Update this whenever you receive or spend.</p>
                    <div className="space-y-2">
                      {[
                        { label:'Runway',        val: runway >= 12 ? '12+ mo' : `${runway.toFixed(1)} mo`, color: runwayColor },
                        { label:'Monthly net',   val: `${surplus>=0?'+':'-'}€${Math.abs(surplus)}`, color: surplus>=0?'#69F0AE':'#FF5FB6', note: surplus>=0?'saving':'burning' },
                        { label:'Days until zero', val: surplus < 0 ? `${(Math.min(runway,12)*30).toFixed(0)}d` : '∞', color: surplus>=0?'#69F0AE':'#FF5FB6' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between py-2" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                          <span className="text-[11px]" style={{ color:'rgba(255,255,255,0.45)' }}>{row.label}</span>
                          <div className="flex items-center gap-2">
                            {row.note && <span className="text-[9px] mono px-1.5 py-0.5 rounded" style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.3)' }}>{row.note}</span>}
                            <span className="text-[12px] mono font-semibold" style={{ color:row.color }}>{row.val}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Income breakdown */}
                  <div className="rounded-2xl px-6 py-5"
                    style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
                    <div className="text-[9px] mono tracking-[0.2em] mb-4" style={{ color:'rgba(255,255,255,0.3)' }}>INCOME BREAKDOWN</div>
                    {totalIncome > 0 ? (
                      <div className="space-y-3">
                        {sources.filter(s => s.active && s.amount > 0).map(s => {
                          const pct = (s.amount / totalIncome) * 100;
                          return (
                            <div key={s.id} className="space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-[11px]" style={{ color:'rgba(255,255,255,0.6)' }}>{s.icon} {s.label}</span>
                                <span className="text-[11px] mono" style={{ color:s.color }}>€{s.amount.toLocaleString()} · {pct.toFixed(0)}%</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                                <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }}
                                  transition={{ duration:0.8, ease:[0.22,1,0.36,1] }}
                                  className="h-full rounded-full"
                                  style={{ background:`linear-gradient(90deg,${s.color}88,${s.color})` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[12px]" style={{ color:'rgba(255,255,255,0.3)' }}>Enable income sources above to see breakdown.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* FORECAST */}
            {activeTab === 'forecast' && (
              <motion.div key="forecast" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
                className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-3">
                  {MONTH_DATA.map((m, i) => {
                    const isFuture = m.risk==='future'||m.risk==='warn';
                    const barPct   = isFuture ? 100 : Math.min((m.spent/m.budget)*100,140);
                    const barColor = m.risk==='high'?'#FF5FB6': m.risk==='warn'?'#FFD54F': m.risk==='mid'?'#FFD54F': m.risk==='future'?'#7B61FF':'#00D1FF';
                    return (
                      <motion.div key={m.month} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.035, duration:0.4 }}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl"
                        style={{ background:activeMonth===i?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.02)', border:`1px solid ${activeMonth===i?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.04)'}` }}
                        onHoverStart={() => setActiveMonth(i)} onHoverEnd={() => setActiveMonth(null)}>
                        <span className="w-10 text-[11px] mono text-center flex-shrink-0" style={{ color:'rgba(255,255,255,0.4)' }}>{m.month}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                          <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(barPct,100)}%` }}
                            transition={{ delay:i*0.035+0.1, duration:0.6, ease:[0.22,1,0.36,1] }}
                            className="h-full rounded-full" style={{ background:`${barColor}${isFuture?'55':'cc'}` }} />
                        </div>
                        <span className="w-20 text-right text-[11px] mono flex-shrink-0" style={{ color:isFuture?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.6)' }}>
                          {isFuture?`~€${m.budget}`:`€${m.spent}`}
                        </span>
                        <span className="w-20 text-right text-[10px] mono flex-shrink-0 px-2 py-0.5 rounded" style={{ background:`${barColor}18`, color:barColor }}>
                          {m.risk==='future'?'FORECAST':m.risk.toUpperCase()}
                        </span>
                        {m.note && <span className="text-[10px]" style={{ color:'rgba(255,255,255,0.25)' }}>{m.note}</span>}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl px-5 py-5" style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)' }}>
                    <div className="text-[9px] mono tracking-[0.2em] mb-4" style={{ color:'rgba(255,255,255,0.3)' }}>KEY RISK MONTHS</div>
                    {MONTH_DATA.filter(m => m.risk==='high'||m.risk==='warn').map(m => (
                      <div key={m.month} className="mb-3 px-3 py-2 rounded-lg"
                        style={{ background:m.risk==='high'?'rgba(255,95,182,0.07)':'rgba(255,213,79,0.07)', border:`1px solid ${m.risk==='high'?'rgba(255,95,182,0.18)':'rgba(255,213,79,0.18)'}` }}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[12px] font-semibold" style={{ color:m.risk==='high'?'#FF5FB6':'#FFD54F' }}>{m.month}</span>
                          <span className="text-[9px] mono" style={{ color:'rgba(255,255,255,0.3)' }}>{m.spent?`€${m.spent-m.budget} over`:'Predicted'}</span>
                        </div>
                        {m.note && <p className="text-[10px]" style={{ color:'rgba(255,255,255,0.4)' }}>{m.note}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl px-5 py-5" style={{ background:'rgba(255,213,79,0.04)', border:'1px solid rgba(255,213,79,0.14)' }}>
                    <div className="text-[9px] mono tracking-[0.2em] mb-2" style={{ color:'rgba(255,213,79,0.6)' }}>RUNWAY FORECAST</div>
                    <div className="text-[28px] font-bold mono mb-1" style={{ color:'#FFD54F' }}>{runway>=12?'12+':runway.toFixed(1)}mo</div>
                    <p className="text-[11px]" style={{ color:'rgba(255,255,255,0.4)' }}>
                      At burn of €{totalSpend}/mo, income €{totalIncome}/mo, savings €{savings.toLocaleString()}.
                      {surplus > 0 ? ` Saving €${surplus}/mo.` : ` Deficit €${Math.abs(surplus)}/mo.`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SPENDING */}
            {activeTab === 'spending' && (
              <motion.div key="spending" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
                className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl px-6 py-5"
                  style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
                  <div className="text-[9px] mono tracking-[0.2em] mb-5" style={{ color:'rgba(255,255,255,0.3)' }}>CATEGORY BREAKDOWN · MAY 2026</div>
                  <div className="space-y-3">
                    {categories.map((cat, i) => {
                      const over = cat.spent > cat.budget;
                      const pct  = (cat.spent / cat.budget) * 100;
                      return (
                        <motion.div key={cat.id} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05, duration:0.4 }}
                          className="px-4 py-3 rounded-xl"
                          style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">{cat.icon}</span>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="text-[12px] font-medium text-white">{cat.label}</span>
                                <span className="text-[12px] mono font-bold" style={{ color:over?'#FF5FB6':cat.color }}>€{cat.spent}</span>
                              </div>
                              <div className="flex justify-between mt-0.5">
                                <span className="text-[10px]" style={{ color:'rgba(255,255,255,0.3)' }}>{pct.toFixed(0)}% of €{cat.budget}</span>
                                {over && <span className="text-[10px]" style={{ color:'#FF5FB6' }}>+€{cat.spent-cat.budget} over</span>}
                              </div>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                            <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(pct,100)}%` }}
                              transition={{ delay:i*0.05+0.15, duration:0.7, ease:[0.22,1,0.36,1] }}
                              className="h-full rounded-full"
                              style={{ background:over?'linear-gradient(90deg,#FF5FB6,#FF8A65)':`linear-gradient(90deg,${cat.color}88,${cat.color})` }} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl px-5 py-5"
                    style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
                    <div className="text-[9px] mono tracking-[0.2em] mb-4" style={{ color:'rgba(255,255,255,0.3)' }}>SUMMARY</div>
                    {[
                      { label:'Total Spent',  val:totalSpend,              color:'#4FC3F7' },
                      { label:'Total Budget', val:categories.reduce((s,c)=>s+c.budget,0), color:'rgba(255,255,255,0.4)' },
                      { label:'Total Income', val:totalIncome,             color:'#69F0AE' },
                      { label:'Net',          val:surplus,                 color:surplus>=0?'#69F0AE':'#FF5FB6' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between py-2" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-[12px]" style={{ color:'rgba(255,255,255,0.5)' }}>{row.label}</span>
                        <span className="text-[13px] mono font-semibold" style={{ color:row.color }}>
                          {row.val < 0 ? `−€${Math.abs(row.val)}` : `€${row.val}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  {overspend.length > 0 && (
                    <div className="rounded-2xl px-5 py-5"
                      style={{ background:'rgba(255,95,182,0.04)', border:'1px solid rgba(255,95,182,0.14)' }}>
                      <div className="text-[9px] mono tracking-[0.2em] mb-3" style={{ color:'rgba(255,95,182,0.6)' }}>OVER BUDGET</div>
                      {overspend.map(cat => (
                        <div key={cat.id} className="flex justify-between py-2 items-center">
                          <span className="text-[12px] flex items-center gap-2">
                            <span>{cat.icon}</span><span style={{ color:'rgba(255,255,255,0.65)' }}>{cat.label}</span>
                          </span>
                          <span className="text-[12px] mono font-bold" style={{ color:'#FF5FB6' }}>+€{cat.spent-cat.budget}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="rounded-2xl px-5 py-5"
                    style={{ background:'rgba(75,195,247,0.04)', border:'1px solid rgba(75,195,247,0.14)' }}>
                    <div className="text-[9px] mono tracking-[0.2em] mb-3" style={{ color:'rgba(75,195,247,0.6)' }}>DEV SPEND TIPS</div>
                    {[
                      { tip:'GitHub Student Pack covers JetBrains, Notion, DigitalOcean', saving:'~€45/mo' },
                      { tip:'Pick one AI assistant — ChatGPT OR Copilot, not both',       saving:'~€22/mo' },
                      { tip:'Move personal projects to Cloudflare + Railway free tier',   saving:'~€30/mo' },
                    ].map((t, i) => (
                      <div key={i} className="flex justify-between items-start py-2.5" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-[11px] flex-1 pr-3" style={{ color:'rgba(255,255,255,0.5)' }}>{t.tip}</span>
                        <span className="text-[11px] mono font-bold flex-shrink-0" style={{ color:'#4FC3F7' }}>{t.saving}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SIMULATOR */}
            {activeTab === 'simulator' && (
              <motion.div key="simulator" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
                className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl px-6 py-6"
                  style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
                  <div className="text-[9px] mono tracking-[0.2em] mb-5" style={{ color:'rgba(255,255,255,0.3)' }}>SIMULATE YOUR BUDGET</div>

                  {/* Income row — links to Accounts */}
                  <div className="mb-6 px-4 py-3 rounded-xl"
                    style={{ background:'rgba(105,240,174,0.06)', border:'1px solid rgba(105,240,174,0.16)' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px]" style={{ color:'rgba(255,255,255,0.5)' }}>Total Income (from Accounts)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] mono font-bold" style={{ color:'#69F0AE' }}>€{totalIncome.toLocaleString()}/mo</span>
                        <button onClick={() => setActiveTab('accounts')}
                          className="text-[9px] mono px-2 py-0.5 rounded"
                          style={{ background:'rgba(105,240,174,0.12)', color:'rgba(105,240,174,0.7)' }}>
                          Edit →
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {sources.filter(s => s.active && s.amount > 0).map(s => (
                        <span key={s.id} className="text-[9px] mono px-1.5 py-0.5 rounded"
                          style={{ background:`${s.color}15`, color:s.color }}>{s.icon} €{s.amount}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <BudgetSlider label="Rent & Housing"             value={simRent}     min={200} max={1500} step={25}  onChange={setSimRent}     color="#7B61FF" />
                    <BudgetSlider label="Cloud & Infra (AWS/Vercel…)"value={simCloud}    min={0}   max={300}  step={5}   onChange={setSimCloud}    color="#4FC3F7" />
                    <BudgetSlider label="Dev Tools (JetBrains/GitHub)"value={simDevTools} min={0}   max={150}  step={5}   onChange={setSimDevTools} color="#B388FF" />
                    <BudgetSlider label="SaaS & AI Tools"            value={simAI}       min={0}   max={200}  step={5}   onChange={setSimAI}       color="#FF5FB6" />
                    <BudgetSlider label="Food & Transport"           value={simFood}     min={50}  max={400}  step={10}  onChange={setSimFood}     color="#FF8A65" />
                    <BudgetSlider label="Other (groceries, health…)" value={simOther}    min={50}  max={800}  step={25}  onChange={setSimOther}    color="#FFD54F" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl px-6 py-6 flex flex-col items-center"
                    style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
                    <div className="text-[9px] mono tracking-[0.2em] mb-2" style={{ color:'rgba(255,255,255,0.3)' }}>PROJECTED RUNWAY</div>
                    <RunwayGauge months={Math.min(simRunway, 12)} />
                    <div className="mt-4 w-full space-y-2">
                      {[
                        { label:'Monthly Income',    val:totalIncome,             color:'#69F0AE' },
                        { label:'Monthly Spend',     val:simTotal,                color:'#4FC3F7' },
                        { label:'Surplus / Deficit', val:simSurplus,              color:simSurplus>=0?'#69F0AE':'#FF5FB6' },
                        { label:'Savings Buffer',    val:savings,                 color:'rgba(255,255,255,0.45)' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between py-1.5" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                          <span className="text-[11px]" style={{ color:'rgba(255,255,255,0.45)' }}>{row.label}</span>
                          <span className="text-[12px] mono font-semibold" style={{ color:row.color }}>
                            {row.val < 0 ? `−€${Math.abs(row.val).toLocaleString()}` : `€${row.val.toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Spend breakdown mini bars */}
                  <div className="rounded-2xl px-5 py-4"
                    style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                    <div className="text-[9px] mono tracking-[0.2em] mb-3" style={{ color:'rgba(255,255,255,0.3)' }}>SPEND BREAKDOWN</div>
                    {[
                      { label:'Rent & Housing',  val:simRent,     color:'#7B61FF' },
                      { label:'Cloud & Infra',   val:simCloud,    color:'#4FC3F7' },
                      { label:'Dev Tools',       val:simDevTools, color:'#B388FF' },
                      { label:'SaaS & AI',       val:simAI,       color:'#FF5FB6' },
                      { label:'Food & Transport',val:simFood,     color:'#FF8A65' },
                      { label:'Other',           val:simOther,    color:'#FFD54F' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-3 py-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:row.color }} />
                        <span className="flex-1 text-[11px]" style={{ color:'rgba(255,255,255,0.5)' }}>{row.label}</span>
                        <span className="text-[11px] mono w-10 text-right" style={{ color:row.color }}>€{row.val}</span>
                        <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width:`${Math.min((row.val/simTotal)*100,100)}%`, background:row.color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Verdict */}
                  <div className="rounded-2xl px-5 py-5" style={{
                    background: simRunway<3?'rgba(255,95,182,0.05)':simRunway<5?'rgba(255,213,79,0.05)':'rgba(105,240,174,0.05)',
                    border: `1px solid ${simRunway<3?'rgba(255,95,182,0.18)':simRunway<5?'rgba(255,213,79,0.18)':'rgba(105,240,174,0.18)'}`,
                  }}>
                    <div className="text-[9px] mono tracking-[0.2em] mb-2" style={{ color:'rgba(255,255,255,0.3)' }}>AGENT VERDICT</div>
                    <p className="text-[13px] leading-relaxed" style={{ color:simRunway<3?'#FF5FB6':simRunway<5?'#FFD54F':'#69F0AE' }}>
                      {simRunway >= 12
                        ? `✓ Income exceeds spend by €${simSurplus}/mo. Your savings are growing.`
                        : simRunway < 3
                        ? `⚠ Critical. At €${simTotal}/mo you have ${Math.min(simRunway,12).toFixed(1)} months left. Add a freelance stream or cut SaaS.`
                        : simRunway < 5
                        ? `${Math.min(simRunway,12).toFixed(1)} months runway. Cut €${(simTotal-totalIncome+150).toFixed(0)}/mo more for 6-month safety. Start with cloud costs.`
                        : `✓ Comfortable at ${Math.min(simRunway,12).toFixed(1)} months. Put €${Math.max(0,simSurplus)}/mo surplus into learning or side projects.`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DEV DEALS */}
            {activeTab === 'deals' && (
              <motion.div key="deals" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
                className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[9px] mono tracking-[0.2em] mb-4" style={{ color:'rgba(255,255,255,0.3)' }}>DEVELOPER DEALS & FREE TIERS</div>
                  <div className="space-y-3">
                    {DEV_DEALS.map((deal, i) => (
                      <motion.div key={deal.store} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08, duration:0.4 }}
                        className="flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer group"
                        style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}
                        whileHover={{ borderColor:'rgba(105,240,174,0.25)', background:'rgba(105,240,174,0.04)' }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                          {deal.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[13px] font-semibold text-white">{deal.store}</span>
                            <span className="text-[8px] mono px-1.5 py-0.5 rounded" style={{ background:'rgba(105,240,174,0.14)', color:'#69F0AE' }}>{deal.tag}</span>
                          </div>
                          <div className="text-[11px]" style={{ color:'rgba(255,255,255,0.4)' }}>{deal.type} · {deal.dist}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[13px] font-bold" style={{ color:'#69F0AE' }}>{deal.saving}</div>
                          <div className="text-[10px] mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:'rgba(255,255,255,0.4)' }}>Open →</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl px-5 py-5"
                    style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
                    <div className="text-[9px] mono tracking-[0.2em] mb-3" style={{ color:'rgba(255,255,255,0.3)' }}>POTENTIAL MONTHLY SAVINGS</div>
                    {[
                      { label:'GitHub Student Pack',    save:45, color:'#69F0AE' },
                      { label:'AWS / GCP free tier',    save:30, color:'#4FC3F7' },
                      { label:'Consolidate AI tools',   save:22, color:'#FF5FB6' },
                      { label:'Vercel / Railway free',  save:18, color:'#B388FF' },
                    ].map((row, i) => (
                      <motion.div key={row.label} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.07 }}
                        className="flex justify-between items-center py-2.5" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-[11px]" style={{ color:'rgba(255,255,255,0.5)' }}>{row.label}</span>
                        <span className="text-[13px] mono font-bold" style={{ color:row.color }}>€{row.save}/mo</span>
                      </motion.div>
                    ))}
                    <div className="flex justify-between items-center pt-3 mt-1">
                      <span className="text-[11px] font-semibold text-white">Total potential</span>
                      <span className="text-[16px] mono font-bold" style={{ color:'#69F0AE' }}>€115/mo</span>
                    </div>
                    <div className="mt-3 px-3 py-2 rounded-lg" style={{ background:'rgba(105,240,174,0.07)', border:'1px solid rgba(105,240,174,0.15)' }}>
                      <p className="text-[11px]" style={{ color:'#69F0AE' }}>
                        Saving €115/mo extends runway by +{(115 / Math.max(1, totalSpend - totalIncome)).toFixed(1)} months
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl px-5 py-5"
                    style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(20px)' }}>
                    <div className="text-[9px] mono tracking-[0.2em] mb-3" style={{ color:'rgba(255,255,255,0.3)' }}>SIDE INCOME IDEAS FOR DEVS</div>
                    {[
                      { idea:'Freelance on Upwork / Toptal',  potential:'€500–2,000/mo', diff:'Moderate'  },
                      { idea:'Sell a VS Code extension',      potential:'€50–500/mo',    diff:'Easy start' },
                      { idea:'Open source sponsorships',      potential:'€100–1,000/mo', diff:'Slow burn'  },
                      { idea:'Tech content / YouTube',        potential:'€200–2,000/mo', diff:'Long term'  },
                    ].map((r, i) => (
                      <div key={i} className="py-2.5" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex justify-between items-center">
                          <span className="text-[12px] font-medium text-white">{r.idea}</span>
                          <span className="text-[11px] mono" style={{ color:'#69F0AE' }}>{r.potential}</span>
                        </div>
                        <span className="text-[10px]" style={{ color:'rgba(255,255,255,0.3)' }}>{r.diff}</span>
                      </div>
                    ))}
                    <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                      className="mt-4 w-full py-2 rounded-xl text-[10px] mono tracking-widest"
                      style={{ background:'linear-gradient(135deg,rgba(0,209,255,0.12),rgba(123,97,255,0.18))', border:'1px solid rgba(123,97,255,0.3)', color:'rgba(255,255,255,0.7)' }}>
                      DISCUSS IN COMMUNITY →
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
