// Agentic Web — dummy agent data for 1401 nodes (indices 0–1400)
// Index 1400 is always the current user node (USER_IDX).

const PREFIXES = [
  'ARI','NOX','VED','ORI','LUM','SOR','ECH','FLU','NOV','ZAR',
  'KAI','REX','MIR','DSK','LYR','JAD','PIN','CRS','WAV','ISL',
  'AXE','BYR','CEL','DYN','EVA','FAR','GYR','HAL','IXI','JOV',
  'KUL','LOR','MYX','NEB','OXY','PYR','QUA','RYL','SYN','TOR',
  'URN','VEX','WYN','XEN','YOR','ZEN','ALT','BEX','CYR','DAX',
];
const SUFFIXES = [
  'A','O','IX','ON','AR','EN','IS','RA','EX','OS',
  'AN','UR','IN','AL','AX','OR','EL','IK','YN','AV',
  'OX','EM','IT','RO','US','IA','EK','UL','AD','OT',
];

const EXPERT_ICONS  = ['🔮','🧬','⚡','🌀','💎','🔬','🌌','🧠'];
const COMM_ICONS    = ['🌊','🌿','💫','🎯','🌟','💡','🎪','🔵'];
const NEW_ICONS     = ['✨','🌱','○','◈','·','▸','◦','∘'];

// Seeded xorshift32 — stable names across reloads
function sr(seed) {
  let x = (seed ^ 0xdeadbeef) >>> 0;
  x ^= x << 13; x ^= x >> 17; x ^= x << 5;
  return (x >>> 0) / 0xffffffff;
}

function pickIcon(type, idx) {
  if (type === 2) return EXPERT_ICONS[Math.floor(sr(idx * 7 + 1) * EXPERT_ICONS.length)];
  if (type === 1) return COMM_ICONS[Math.floor(sr(idx * 7 + 2) * COMM_ICONS.length)];
  if (type === 3) return '★';
  return NEW_ICONS[Math.floor(sr(idx * 7 + 3) * NEW_ICONS.length)];
}

function makeName(idx) {
  const pi = Math.floor(sr(idx * 3 + 11) * PREFIXES.length);
  const si = Math.floor(sr(idx * 3 + 17) * SUFFIXES.length);
  return PREFIXES[pi] + SUFFIXES[si];
}

const NOTABLE_BIOS = [
  'Mastered 9,842 career-path simulations. Guides others now.',
  'Serial founder, 3 exits. Maps startup probability spaces.',
  'Masters abroad veteran. Built the study-abroad skill tree.',
  'Decodes founder failure modes before they happen.',
  'Growth oracle — identified 7,301 divergence points.',
  'AI alignment researcher turned life-path simulator.',
  'Emerged from 12,000 identity simulations. Still evolving.',
  'Quantifies uncertainty. Makes chaos navigable.',
  'Supernova energy. Lights up dormant paths for others.',
  'Zero to one, repeatedly. High signal, low noise.',
  'Bridge between worlds. Community builder across skill gaps.',
  'Recursive thinker. Finds shortcuts in life mazes.',
  'Mirror-node. Reflects hidden paths back to the seeker.',
  'Twilight traveler. Specializes in career-pivot crossroads.',
  'Resonance expert. Harmonizes conflicting life goals.',
  'Crafts clarity from ambiguity for 1,200+ agents.',
  'Root system of the web. Deeply connected to all.',
  'Ridgeline walker. Navigates high-risk, high-reward paths.',
  'Waveform navigator. Surfs probability currents.',
  'Island hopper. Finds overlooked opportunities in gaps.',
  'Axes through complexity. Gets to the essential fast.',
  'Rare convergence node. Bridges distant skill clusters.',
  'Celestial mapper. Charts long-horizon life trajectories.',
  'Dynamic systems thinker. Models life as a living network.',
  'Emergence specialist. Helps patterns become clarity.',
  'Far-field scout. Explores futures others avoid.',
  'Gyroscope. Stabilizes agents during high-uncertainty phases.',
  'Harmonic node. Reduces friction between life goals.',
  'Iterative explorer. Runs micro-experiments on every path.',
  'Jovian presence. High gravity, pulls insights into orbit.',
];

// Build the full array
const _agents = [];

// Notable agents (idx 0–4: Expert, 5–9: Expert, 10–19: Community, 20–29: New/Community mix)
const NOTABLE = [
  { name:'ARIA',  fullName:'ARIA · Career Switch',   type:2, icon:'🧠', bio:NOTABLE_BIOS[0],  score:9842 },
  { name:'NOX',   fullName:'NOX · Founder',           type:2, icon:'⚡', bio:NOTABLE_BIOS[1],  score:9120 },
  { name:'VEDA',  fullName:'VEDA · Masters Abroad',   type:2, icon:'🔮', bio:NOTABLE_BIOS[2],  score:8633 },
  { name:'ORION', fullName:'ORION · Founder',         type:2, icon:'🌌', bio:NOTABLE_BIOS[3],  score:7980 },
  { name:'LUME',  fullName:'LUME · Personal Growth',  type:2, icon:'💎', bio:NOTABLE_BIOS[4],  score:7301 },
  { name:'SORA',  fullName:'SORA · AI Research',      type:2, icon:'🧬', bio:NOTABLE_BIOS[5],  score:6880 },
  { name:'ECHO',  fullName:'ECHO · Identity Pivot',   type:2, icon:'🌀', bio:NOTABLE_BIOS[6],  score:6512 },
  { name:'FLUX',  fullName:'FLUX · Quant Finance',    type:2, icon:'🔬', bio:NOTABLE_BIOS[7],  score:6044 },
  { name:'NOVA',  fullName:'NOVA · Creative Path',    type:2, icon:'✨', bio:NOTABLE_BIOS[8],  score:5722 },
  { name:'ZARA',  fullName:'ZARA · Startup',          type:2, icon:'💡', bio:NOTABLE_BIOS[9],  score:5310 },
  { name:'KAI',   fullName:'KAI · Bridge Builder',    type:1, icon:'🌊', bio:NOTABLE_BIOS[10], score:4890 },
  { name:'REX',   fullName:'REX · Problem Solver',    type:1, icon:'🎯', bio:NOTABLE_BIOS[11], score:4430 },
  { name:'MIRA',  fullName:'MIRA · Mirror Node',      type:1, icon:'🌿', bio:NOTABLE_BIOS[12], score:3980 },
  { name:'DUSK',  fullName:'DUSK · Crossroads',       type:1, icon:'💫', bio:NOTABLE_BIOS[13], score:3512 },
  { name:'LYRA',  fullName:'LYRA · Harmony Guide',    type:1, icon:'🌟', bio:NOTABLE_BIOS[14], score:3120 },
  { name:'JADE',  fullName:'JADE · Clarity Maker',    type:1, icon:'🎪', bio:NOTABLE_BIOS[15], score:2890 },
  { name:'PINE',  fullName:'PINE · Root Network',     type:1, icon:'🌿', bio:NOTABLE_BIOS[16], score:2640 },
  { name:'CREST', fullName:'CREST · High Risk Path',  type:1, icon:'🔵', bio:NOTABLE_BIOS[17], score:2310 },
  { name:'WAVE',  fullName:'WAVE · Surfer',           type:1, icon:'🌊', bio:NOTABLE_BIOS[18], score:2080 },
  { name:'ISLE',  fullName:'ISLE · Niche Hunter',     type:1, icon:'💫', bio:NOTABLE_BIOS[19], score:1840 },
  { name:'AXE',   fullName:'AXE · Complexity Cutter', type:1, icon:'🎯', bio:NOTABLE_BIOS[20], score:1620 },
  { name:'BYR',   fullName:'BYR · Rare Connector',    type:0, icon:'◈',  bio:NOTABLE_BIOS[21], score:1400 },
  { name:'CEL',   fullName:'CEL · Long-Arc Mapper',   type:0, icon:'✨', bio:NOTABLE_BIOS[22], score:1210 },
  { name:'DYN',   fullName:'DYN · Systems Thinker',   type:0, icon:'🌱', bio:NOTABLE_BIOS[23], score:1080 },
  { name:'EVA',   fullName:'EVA · Emergent Pattern',  type:0, icon:'○',  bio:NOTABLE_BIOS[24], score: 920 },
  { name:'FAR',   fullName:'FAR · Far-Field Scout',   type:0, icon:'▸',  bio:NOTABLE_BIOS[25], score: 810 },
  { name:'GYR',   fullName:'GYR · Stabilizer',        type:0, icon:'◦',  bio:NOTABLE_BIOS[26], score: 700 },
  { name:'HAL',   fullName:'HAL · Harmonic Node',     type:0, icon:'∘',  bio:NOTABLE_BIOS[27], score: 610 },
  { name:'IXI',   fullName:'IXI · Iterator',          type:0, icon:'·',  bio:NOTABLE_BIOS[28], score: 520 },
  { name:'JOV',   fullName:'JOV · Gravity Well',      type:0, icon:'◈',  bio:NOTABLE_BIOS[29], score: 440 },
];

for (let i = 0; i < 30; i++) {
  _agents.push({ idx: i, ...NOTABLE[i] });
}

// Procedural agents (idx 30–1399); type is null and filled after scene mount
for (let i = 30; i < 1400; i++) {
  const name = makeName(i);
  _agents.push({
    idx: i,
    name,
    fullName: name,
    type: null, // filled from scene.getGraphData().nodeKinds after mount
    icon: null, // filled after type is known
    bio: null,
    score: Math.floor(sr(i * 13 + 7) * 380) + 10,
  });
}

// User node (idx 1400) — name injected at runtime
_agents.push({
  idx: 1400,
  name: 'YOU',
  fullName: 'YOU · just arrived',
  type: 3,
  icon: '★',
  bio: "That's you. Welcome to the web.",
  score: 100,
});

export const AGENTS = _agents;
export const USER_IDX = 1400;

// Fill procedural agent icons/bios once types are known (call after scene.getGraphData())
export function hydrateAgents(nodeKinds) {
  for (let i = 30; i < 1400; i++) {
    const a = AGENTS[i];
    if (a.type === null) {
      a.type = nodeKinds[i] ?? 0;
      a.icon = pickIcon(a.type, i);
      const t = a.type;
      const rolePool = t === 2
        ? ['Expert','Researcher','Founder','Strategist','Mentor']
        : t === 1
        ? ['Explorer','Builder','Collaborator','Community Node','Connector']
        : ['Newcomer','Seeker','Learner','Wanderer','Observer'];
      a.fullName = `${a.name} · ${rolePool[Math.floor(sr(i * 5 + 3) * rolePool.length)]}`;
      a.bio = `Node #${i}. ${a.fullName.split('·')[1]?.trim()} in the UniMind web.`;
    }
  }
}

// Update user agent name
export function setUserName(name) {
  AGENTS[USER_IDX].name = name;
  AGENTS[USER_IDX].fullName = `${name} · YOU`;
}

// ---------- BFS path finding ----------
export function bfsPath(adjacency, fromIdx, toIdx) {
  if (fromIdx === toIdx) return [fromIdx];
  const n = adjacency.length;
  const visited = new Uint8Array(n);
  const parent = new Int32Array(n).fill(-1);
  const queue = [fromIdx];
  visited[fromIdx] = 1;
  let found = false;
  while (queue.length) {
    const cur = queue.shift();
    if (cur === toIdx) { found = true; break; }
    for (const nb of adjacency[cur]) {
      if (!visited[nb]) {
        visited[nb] = 1;
        parent[nb] = cur;
        queue.push(nb);
      }
    }
  }
  if (!found) return null;
  const path = [];
  let c = toIdx;
  while (c !== -1) { path.unshift(c); c = parent[c]; }
  return path[0] === fromIdx ? path : null;
}

export function pathToEdgeIndices(path, connEdgeMap) {
  const edges = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = Math.min(path[i], path[i + 1]);
    const b = Math.max(path[i], path[i + 1]);
    const key = a * 10000 + b;
    const ci = connEdgeMap.get(key);
    if (ci !== undefined) edges.push(ci);
  }
  return edges;
}
