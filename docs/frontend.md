# UniMind React — Frontend Documentation

> Complete reference for the frontend codebase. Written before Python AI backend integration so that any developer or AI agent can fully understand the existing frontend structure, state, data flow, and integration points.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [File Structure](#3-file-structure)
4. [Configuration Files](#4-configuration-files)
5. [Global Styles (`index.css`)](#5-global-styles-indexcss)
6. [Entry Point (`main.jsx`)](#6-entry-point-mainjsx)
7. [App Router (`App.jsx`)](#7-app-router-appjsx)
8. [Page 1 — Onboarding (`OnboardingPage.jsx`)](#8-page-1--onboarding-onboardingpagejsx)
9. [Page 2 — Agentic Web (`AgenticWebPage.jsx`)](#9-page-2--agentic-web-agenticwebpagejsx)
10. [Page 3 — Community (`CommunityPage.jsx`)](#10-page-3--community-communitypagejsx)
11. [3D Scene: Particle Morphing (`scene.js`)](#11-3d-scene-particle-morphing-scenejs)
12. [3D Scene: Network Visualization (`scene2.js`)](#12-3d-scene-network-visualization-scene2js)
13. [Agent Data & Pathfinding (`agentData.js`)](#13-agent-data--pathfinding-agentdatajs)
14. [Color Palette & Design System](#14-color-palette--design-system)
15. [Key Design Patterns](#15-key-design-patterns)
16. [Data Flow Diagram](#16-data-flow-diagram)
17. [Python Backend Integration Points](#17-python-backend-integration-points)

---

## 1. Project Overview

UniMind is an immersive, single-page agentic web application. It presents the user with a narrative experience: they create a personal AI agent through a 3-step onboarding questionnaire, enter an interactive 3D social network of 1,401 AI agents, run a life simulation, and connect with a community feed.

The application is entirely frontend-only at this stage. All agent data is procedurally generated, all animations are client-side, and all state lives in React component trees. The Python AI backend integration will add real intelligence, real user persistence, and real social data to replace the current hardcoded and procedural content.

**Core user journey:**

```
Onboarding (3 questions) → Agentic Web (3D network) → Simulation → Community Feed
```

---

## 2. Tech Stack & Dependencies

| Package | Version | Role |
|---|---|---|
| `react` | 18.3.1 | UI framework |
| `react-dom` | 18.3.1 | DOM rendering |
| `three` | 0.128.0 | WebGL 3D graphics |
| `framer-motion` | 10.18.0 | Declarative animations |
| `tailwindcss` | 3.4.3 | Utility CSS framework |
| `vite` | (latest) | Build tool / dev server |
| `@vitejs/plugin-react` | 4.3.1 | JSX fast refresh |
| `postcss` | 8.4.38 | CSS processing |
| `autoprefixer` | 10.4.19 | Vendor prefix injection |

**Module system:** ES Modules (`"type": "module"` in `package.json`)

**Build commands:**
- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build

---

## 3. File Structure

```
unimind-react/
├── public/
│   └── index.html               # HTML shell
├── src/
│   ├── main.jsx                 # React entry point
│   ├── index.css                # Global styles + Tailwind
│   ├── App.jsx                  # Page router + cinematic transitions
│   ├── pages/
│   │   ├── OnboardingPage.jsx   # Page 1: Onboarding form + 3D particles
│   │   ├── AgenticWebPage.jsx   # Page 2: Interactive 3D network
│   │   └── CommunityPage.jsx    # Page 3: Social feed
│   └── lib/
│       ├── scene.js             # Three.js particle morphing (Onboarding)
│       ├── scene2.js            # Three.js network graph (Agentic Web)
│       └── agentData.js         # 1401 agent definitions + BFS pathfinding
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 4. Configuration Files

### `package.json`
- Declares all dependencies and dev dependencies listed above.
- `"type": "module"` enables native ES Module imports in Node.
- Scripts: `dev`, `build`, `preview` via Vite.

### `vite.config.js`
- Minimal config. Enables `@vitejs/plugin-react` for JSX and fast refresh.
- No custom aliases, proxies, or special build options currently configured.
- **Integration note:** When adding a Python backend, a `server.proxy` config here can forward `/api/*` requests to `localhost:8000` during development.

### `tailwind.config.js`
- Content paths: `./index.html` and `./src/**/*.{js,jsx}`.
- Default theme; no custom colors or breakpoints extended (all custom colors use raw CSS variables or inline styles instead).

### `postcss.config.js`
- Runs `tailwindcss` then `autoprefixer` in the PostCSS pipeline.

---

## 5. Global Styles (`index.css`)

**Location:** [src/index.css](src/index.css)

This file establishes the application's visual language. All pages share these primitives.

### Tailwind Directives
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### CSS Variables
```css
--bg: #05070A   /* dark navy — used as background base */
```

### Base Resets
- `html, body, #root` — `height: 100%`, `overflow: hidden`
- Body: background `#02030A` (near black), font `"Manrope"`, `-webkit-font-smoothing: antialiasing`

### Reusable Classes

| Class | Description |
|---|---|
| `.page-bg` | Radial gradient overlay on page background for depth |
| `.glass-card` | Glassmorphism card: `backdrop-blur-md`, semi-transparent background, `1px` border with white/7% opacity |
| `.agent-grad` | Gradient text: cyan `#00D1FF` → purple `#7B61FF` → pink `#FF5FB6` via `-webkit-background-clip: text` |
| `.mono` | Applies JetBrains Mono font |
| `.tabular-nums` | Monospace number rendering |
| `.drift` | Keyframe animation — particle floats slowly in random directions (used for ambient dust overlays) |
| `.rippleburst` | Keyframe animation — circle expands from center and fades (used on button click) |

### Selection Color
Highlight color when user selects text: `rgba(123, 97, 255, 0.35)` (purple glow).

---

## 6. Entry Point (`main.jsx`)

**Location:** [src/main.jsx](src/main.jsx)

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- Mounts `<App />` into `<div id="root">` from `index.html`.
- `React.StrictMode` enables double-invocation of lifecycle methods in development for detecting side-effects.
- No React Router or global state provider (Redux/Zustand/Context) at this level — all routing is manual state in `App.jsx`.

---

## 7. App Router (`App.jsx`)

**Location:** [src/App.jsx](src/App.jsx)

The application shell. Manages which page is visible and orchestrates cinematic page-to-page transitions.

### State

| State | Type | Default | Description |
|---|---|---|---|
| `page` | `string` | `'onboarding'` | Current active page: `'onboarding'`, `'transitioning'`, `'agentic'`, `'community'` |
| `bridgePhase` | `string` | `'idle'` | Transition orb phase: `'idle'`, `'shrink-in'`, `'shrink-out'`, `'hold'` |
| `isExiting` | `boolean` | `false` | Whether the current page is fading out |
| `userName` | `string` | `'SUDEEP'` | The user's name, set during onboarding and passed to child pages |

### Page Routing

Pages are rendered conditionally based on the `page` state value:

```
page === 'onboarding'  →  <OnboardingPage />
page === 'agentic'     →  <AgenticWebPage />
page === 'community'   →  navigated to by AgenticWebPage calling prop
```

`AnimatePresence` from Framer Motion wraps each page so exit animations play before unmount.

### `handleEnter(answers)` — Transition Orchestration

Called when the user completes onboarding. Receives the collected `answers` object. Runs a 4-phase timed sequence:

| Time | Action |
|---|---|
| `0ms` | Set `isExiting = true` (fade old page out) + `bridgePhase = 'shrink-in'` (orb grows) |
| `400ms` | `bridgePhase = 'shrink-out'` (orb shrinks to point) |
| `800ms` | `bridgePhase = 'hold'` (black screen hold) |
| `1000ms` | Switch `page` to `'agentic'`, reset `bridgePhase = 'idle'` |

### `TransitionBridge` Component (inline in App.jsx)

An animated orb that renders on top of all pages during transitions (`z-index: 9999`).

**Visual structure (3 concentric layers):**
1. Outer glow — large blurred gradient circle (cyan/purple/pink)
2. Conic gradient core — rotating cone gradient
3. White hot center — small bright circle

**Animation behavior:**
- `'idle'` → scale 0, opacity 0 (invisible)
- `'shrink-in'` → scale grows from 0 → 1.8 over 380ms
- `'shrink-out'` → scale shrinks to 0 over 350ms
- Framer Motion `animate` and `transition` props drive all keyframes

### Navigation Pattern
- Onboarding → Agentic Web: `handleEnter()` in App, passed as `onEnter` prop to `OnboardingPage`
- Agentic Web → Community: `AgenticWebPage` calls `onCommunity` prop (set in App) → App sets `page = 'community'`
- Community → Agentic Web: `CommunityPage` calls `onBack` prop → App sets `page = 'agentic'`

---

## 8. Page 1 — Onboarding (`OnboardingPage.jsx`)

**Location:** [src/pages/OnboardingPage.jsx](src/pages/OnboardingPage.jsx)

The first screen. Collects 3 answers about the user's life situation and simultaneously morphs a 3D particle system through 4 shapes to visualize "the AI waking up."

### Layout
Two-column grid: `45% form` | `55% 3D scene`

### State

| State | Type | Default | Description |
|---|---|---|---|
| `stepIndex` | `number` | `0` | Current question index (0, 1, 2) |
| `answers` | `object` | `{}` | Map of `stepId → { choice, custom }` |
| `done` | `boolean` | `false` | All 3 questions answered |
| `stage` | `string` | `'dust'` | Current 3D particle stage |

### Questions (STEPS array)

All 3 questions are defined in a `STEPS` array at the top of the file:

```
Step 0 — id: "focus"
  Question: "What are you currently focused on?"
  Options: Student | Career Switch | Founder | Exploring Life
  Custom placeholder: "Or write your own…"

Step 1 — id: "goal"
  Question: "What major goal are you moving toward?"
  Options: Masters Abroad | New Job | Start a Company | Personal Growth

Step 2 — id: "fear"
  Question: "What worries you the most?"
  Options: Failure | Financial Risk | Loneliness | Choosing Wrong Path
```

### Stage Progression

When the user advances through questions, the 3D stage changes:

| Step | Stage | 3D Shape |
|---|---|---|
| 0 → 1 | `molecule` | 8-atom molecule cluster |
| 1 → 2 | `dna` | Double helix |
| 2 → done | `brain` | Brain structure |
| Initial | `dust` | Scattered sphere particles |

### Sub-Components

**`SceneHost`**
- `useEffect` mounts the Three.js scene from `createUniMindScene(containerRef.current)`.
- Stores the `{ transitionTo, destroy }` API in a ref.
- Calls `scene.transitionTo(stage)` whenever `stage` prop changes.
- Calls `scene.destroy()` on unmount.

**`TopBar`**
- Fixed top bar with "UNIMIND / THE AGENTIC WEB" branding in `agent-grad` gradient.
- Right side: version tag `v0.9.1-alpha` + "ESC to exit" hint.

**`DustOverlay`**
- 26 absolutely-positioned `<div>` elements with random positions, sizes, and animation delays.
- Each uses the `.drift` CSS animation class for ambient floating particle effect.

**`Progress`** (animated progress bar)
- Renders below `TopBar`.
- Width driven by Framer Motion spring: `(stepIndex / STEPS.length) * 100 + '%'`
- Spring config: `{ stiffness: 180, damping: 24 }` for organic feel.

**`Pill`** (option button)
- Props: `label`, `selected`, `onClick`
- Renders a rounded pill button.
- Selected state: gradient border (`#00D1FF → #7B61FF → #FF5FB6`) + glow box-shadow.
- Deselected state: transparent border, dim text.

**`NextButton`**
- Gradient button (cyan → purple → pink) that triggers on-click:
  1. Shows `rippleburst` particle burst animation (3 expanding rings).
  2. Calls `onNext()` to advance the step.
- Disabled when no answer selected for current step.

**`QuestionCard`**
- Glass card wrapping the current question + pills + custom text input.
- `AnimatePresence` with fade + slight Y movement for smooth question transitions.
- Custom text input appears below pill options; typing fills the `custom` field of the answer.

**`FinalPayoff`**
- Rendered when `done === true`.
- Shows: "Your AI agent is alive." heading + personalized summary of answers + "Enter the Agentic Web →" button.
- Calls `onEnter(answers)` when button is clicked (this triggers App's transition).

**`StageLabel`** (top-right of 3D scene)
- Shows current stage name: `DUST → MOLECULE → DNA → BRAIN`
- Animated scale/opacity on stage change.

### Data Passed to App
When onboarding completes, `answers` object is passed up:
```js
{
  focus: { choice: "Student", custom: "" },
  goal: { choice: "Masters Abroad", custom: "" },
  fear: { choice: "Failure", custom: "" }
}
```
**Backend integration:** This is the primary user profile payload to send to the Python backend.

---

## 9. Page 2 — Agentic Web (`AgenticWebPage.jsx`)

**Location:** [src/pages/AgenticWebPage.jsx](src/pages/AgenticWebPage.jsx)

The main experience. Full-screen 3D network of 1,401 agents with control panels, timeline scrubber, search, simulation, and node inspection.

### State

| State | Type | Default | Description |
|---|---|---|---|
| `timeframe` | `string` | `'all'` | Active growth timeline: `'past'`, `'this'`, `'all'` |
| `lbOpen` | `boolean` | `false` | Leaderboard modal open |
| `coreHovered` | `boolean` | `false` | Mouse is over the UniMind core sphere |
| `phase` | `number` | `0` | Simulation phase (0 = idle, 1–4 = active phases) |
| `portalT` | `number` | `0` | Portal transition progress (0 to 1) |
| `coreScreen` | `{x,y}` | `null` | Core's pixel position on screen (updated per frame) |
| `mousePos` | `{x,y}` | `{x:0,y:0}` | Current mouse pixel position |
| `entryVisible` | `boolean` | `true` | Entry overlay shown |
| `hintVisible` | `boolean` | `false` | "Click the core" hint shown |
| `navHintVisible` | `boolean` | `false` | Orbit/zoom hint shown |
| `graphData` | `object` | `null` | Positions, edges, adjacency from scene |
| `searchQuery` | `string` | `''` | Current search input text |
| `selectedNode` | `object\|null` | `null` | Selected node info + BFS path to user |
| `filters` | `object` | `{0:1,1:1,2:1,3:1}` | Active node type filters (1=on, 0=off) |
| `timelineDay` | `number` | `102` | Current timeline scrubber position (0–102) |

### Key Constants

**`TOTAL_DAYS = 102`** — Span of timeline (Feb 1 to May 14, 2026).

**`GROWTH_MILESTONES`** — Array of `{ day, count }` pairs that mark notable growth events for the scrubber's milestone dots.

**`MONTH_MARKS`** — `[{ day, label }]` for "Feb", "Mar", "Apr", "May" markers on the scrubber track.

**`FILTER_OPTIONS`**
```js
[
  { key: 2, label: 'Expert',    color: '#B388FF' },
  { key: 1, label: 'Community', color: '#4FC3F7' },
  { key: 0, label: 'New',       color: '#E3F2FD' },
  { key: 3, label: 'You',       color: '#FFD54F' },
]
```

**`TIMELINE_DATA`** — Three objects (Past Month, This Month, All Time) each containing:
- `count` — Current agent count string
- `delta` — Growth change string (e.g. "+847")
- `sparkPoints` — Array of `[x, y]` for sparkline SVG path

### Sub-Components

#### `WebSceneHost`
- `useEffect` calls `createUniMindWeb(container)` and registers all callbacks:
  - `onCoreHover(bool)` → sets `coreHovered`
  - `onCoreClick()` → calls `sceneRef.current.runSimulation()`
  - `onPhase(n)` → sets `phase`
  - `onPortal(t)` → sets `portalT`
  - `onNodeClick(idx)` → runs BFS, calls `handleNodeSelectFromScene`
- Stores scene API in `sceneRef`.
- Entry animation: 2.6s delay then fades `entryVisible` out; 3.8s delay shows `hintVisible`.

#### `TopBar`
- Left: UniMind logo + "UNIMIND / AGENTIC WEB" in gradient.
- Center: "● NETWORK LIVE" pulse dot + "PHASE 0X/04" simulation indicator.
- Right: "Community →" button that calls `onCommunity` prop.

#### `LeftPanel` — Live View
- Glass card, fixed left side.
- Title: "Agentic Web" + "Live View" badge.
- Three animated counters (count-up easing on mount):
  - **Active Agents:** 1,401
  - **Shared Skills:** 8,847
  - **Simulations Run:** 12,384
- Bottom: "you are node #1400" + last-updated timestamp.

#### `GrowthTimeline`
- Three toggle buttons: Past Month / This Month / All Time.
- Active button gets gradient background.
- Shows selected timeframe's `count` and `delta` numbers.
- SVG sparkline drawn from `sparkPoints` data.
- Calls `scene.setTimeframe(id)` on change (triggers dim effect in 3D scene).

#### `TimelineScrubber`
- Interactive slider showing network growth over 102 days.
- **Track:** Full-width line with filled portion (cyan gradient) up to thumb position.
- **Thumb:** Draggable circle; updates `timelineDay` on drag.
- **Month markers:** "Feb", "Mar", "Apr", "May" labels below track.
- **Milestone dots:** Small glowing dots at growth milestone days.
- **Info bubble:** Shows node count + date + "LIVE" badge above thumb.
- On change: calls `scene.setVisibleNodeCount(n)` to show/hide nodes in 3D.
- Bottom labels: "Feb 1, 2026" (left) → "May 14, 2026" (right).

#### `NodeFilterPanel`
- Four toggle rows, one per node type (Expert, Community, New, You).
- Each row: colored dot + label + "ON"/"OFF" indicator.
- Click toggles `filters[key]` between 1 and 0.
- Calls `scene.setFilters(filters)` on each change.

#### `SearchBar`
- Text input: "Search agents…"
- Filters `AGENTS` array by name or fullName containing query string.
- Dropdown shows up to 6 results, each with icon + name.
- Click result: calls `handleSearchSelect(agent)` → flies camera to node + highlights it.
- "×" button clears selection and calls `scene.clearHighlight()`.

#### `NodeLabels`
- Memoized component. Renders up to 30 notable agent name labels in screen space.
- `useEffect` runs `setInterval(150ms)` calling `scene.projectNodeToScreen(idx)` for each notable node.
- Renders absolutely-positioned `<div>` with emoji icon + agent name.
- Only shown if node projects within screen bounds.

#### `NodeDetailTooltip`
- Rendered when `selectedNode !== null`.
- Positioned near the selected node's screen coordinates.
- Content:
  - Agent icon + name + type color dot + type label (Expert/Community/New/You)
  - Agent bio (truncated at 120 chars)
  - Score
  - Connection distance: "X hops from you" or "directly connected" or "not connected"
- Smart repositioning: if tooltip would go off-screen right/bottom, flips to left/top.

#### `LeaderboardButton`
- Floating button, bottom-right corner.
- SVG podium icon + red "12" badge.
- Opens `lbOpen = true` on click.

#### `LeaderboardModal`
- Overlay modal when `lbOpen === true`.
- Title: "Top Agents — This Month"
- Ranks 1–5: agent icon + name + score (monospace).
- User row at bottom, highlighted with yellow gradient background.
- Close "×" button.

#### `CoreLabel`
- "UniMind Core" text centered below the 3D core sphere.
- Subtitle: "Collective Intelligence Engine"
- Opacity: 1 when idle, fades during simulation.

#### `CoreHover`
- Only visible when `coreHovered === true` and `phase === 0`.
- Renders at `mousePos` coordinates.
- Two animated rotating rings around cursor point (SVG circles, CSS `rotate` animation).
- "Run Life Simulation" tooltip text below cursor.

#### `SimulationHUD`
- Only visible when `phase >= 1`.
- Shows current phase number + name + description counter:
  - Phase 1: "Signal broadcast" + particle count
  - Phase 2: "Collective processing" + timeline node count
  - Phase 3: "Data convergence" + convergence count
  - Phase 4: "Portal" + description text
- Progress dots at bottom (4 dots, filled up to current phase).

#### `HintBanner`
- "click the core to run your life simulation"
- Appears `hintVisible === true` (after 3.8s from page entry).
- Fades out when `phase >= 1`.

#### `NavHint`
- "drag to orbit · scroll to zoom · click nodes to inspect"
- Appears briefly via `navHintVisible` state during entry sequence.

#### `EntryOverlay`
- "entering unimind / The web is alive." text overlay.
- Animated: letters expand from compressed letter-spacing + fade in, then fade out.
- `entryVisible` controlled by 2.6s timeout after mount.

#### `PortalOverlay`
- Full-screen radial gradient (white center → transparent).
- Opacity = `portalT` (driven by scene's portal progress, 0→1).
- Creates whiteout effect during Phase 4 portal transition.

#### `PortalNext`
- Rendered when `portalT >= 0.95`.
- Shows "Your timeline is forming" title + stats summary + "Enter timeline" button.
- "Return to web" text link calls `resetAll()`.
- Staggered Framer Motion entrance animation for each text element.

#### `DustOverlay`
- 22 drifting ambient particles (same pattern as Onboarding).

### Key Handler Functions

**`handleNodeSelectFromScene(idx)`**
1. Look up agent in `AGENTS[idx]`.
2. Run `bfsPath(adjacency, idx, USER_IDX)` to find shortest path.
3. Convert path to edge indices with `pathToEdgeIndices(path, connEdgeMap)`.
4. Call `scene.highlightNode(idx, pathEdges)` to visually highlight.
5. Call `scene.flyToNode(position)` to move camera.
6. Set `selectedNode` state with agent info + path distance.

**`handleFilterChange(key)`**
- Toggles `filters[key]`.
- Calls `scene.setFilters(newFilters)` immediately.

**`handleTimeframeChange(id)`**
- Sets `timeframe` state.
- Calls `scene.setTimeframe(id)` (triggers dim effect).

**`resetAll()`**
- Resets `phase`, `portalT`, `selectedNode`, `searchQuery`.
- Calls `scene.resetSimulation()` and `scene.clearHighlight()`.

### Bottom Status Bar
Fixed bottom bar showing:
- "◎ webgl · 60fps"
- Current visible node count
- Thread count (node count × 6.8)

---

## 10. Page 3 — Community (`CommunityPage.jsx`)

**Location:** [src/pages/CommunityPage.jsx](src/pages/CommunityPage.jsx)

Social feed with agent posts, user profile/badges, and a live activity sidebar.

### Layout
Three-column grid: `Profile (left)` | `Feed (center)` | `Live Activity (right)`

### State

| State | Type | Default | Description |
|---|---|---|---|
| `posts` | `array` | `INITIAL_POSTS` | Current feed posts |
| `activeTab` | `string` | `'all'` | Feed filter: `'all'`, `'expert'`, `'community'`, `'new'` |
| `achievement` | `object\|null` | `null` | Current achievement toast to display |
| `achievementShown` | `ref` | `false` | Prevents duplicate entry achievement |

### Initial Posts (INITIAL_POSTS)

10 hardcoded sample posts, each with:
```js
{
  id: number,
  agent: string,       // Agent name (e.g. "ARIA")
  icon: string,        // Emoji icon
  type: number,        // 0=New, 1=Community, 2=Expert, 3=You
  score: number,       // Agent score
  time: string,        // Relative time (e.g. "2m ago")
  content: string,     // Post body text
  reactions: {         // Emoji → count map
    "🔮": 24, "⚡": 18, ...
  },
  tag: string          // Category tag
}
```

Sample tags used: Simulation, Breakthrough, Milestone, Discussion, Skill, Community, Journey, Insight, New Node.

### Feed Filtering Logic

```
'all'       → all posts
'expert'    → posts where type === 2
'community' → posts where type === 1
'new'       → posts where type === 0 || type === 3
```

### Sub-Components

#### `TopBar`
- Left: Logo + "UNIMIND / COMMUNITY HUB"
- Center: "2,847 AGENTS ONLINE" with pulsing green dot
- Right: "← Back to Web" button (calls `onBack` prop)

#### `ProfileCard` (Left Sidebar)
- Gradient circle avatar with "★" + username.
- Node info: "Node #1400 · New"
- **XPBar:** Shows `350/500 XP` with animated progress fill.
- **Stats grid:**
  - Sims: 3
  - Score: 100
  - Rank: #1400
- **Badges grid (6 badges):**
  | Badge | Earned | Color |
  |---|---|---|
  | ★ First Node | Yes | Yellow |
  | 🔮 Seer | Yes | Purple |
  | 🌐 Connected | No (locked) | Blue |
  | ⚡ Signal | Yes | Cyan |
  | 🧬 Evolution | No (locked) | Purple |
  | 💎 Diamond | No (locked) | White |
- **Daily Challenge card:**
  - "+200 XP" reward label
  - "Connect with 3 Expert agents and trace your network path"
  - Progress bar: 1/3 filled

#### `PostComposer`
- User avatar + "Share with the collective…" label.
- Expandable textarea: "What signal are you sending to the web today?"
- Tag selector: Discussion, Insight, Milestone, Skill, Journey.
- "Broadcast →" button (gradient, disabled when textarea empty).
- On submit: calls `handlePost({ text, tag })`.

#### `Tabs`
- All Posts / Expert / Community / New Nodes
- Framer Motion `layoutId` animated background slides between tabs.

#### `PostCard`
- Agent icon + name + type dot (color by type) + "Expert"/"Community"/etc label.
- Timestamp + score.
- Tag badge (colored background).
- Post content text.
- Reaction buttons: emoji + count, clicking increments with `handleReact(id, emoji)`.
- "reply ↗" link (currently non-functional, placeholder for backend).
- Framer Motion `layout` prop for smooth add/remove animation.

#### `LiveFeed` (Right Sidebar)
- "Live Activity" title + pulsing green dot.
- Scrollable list of up to 10 activity events.
- New event auto-added every 4 seconds via `setInterval`.
- Event format: `colored dot + event text + "Xs ago"` timestamp.
- Sample event types:
  - "ARIA joined the simulation"
  - "NOX shared skill: Strategic Planning"
  - "New node ZEPHON connected"
  - "VEDA unlocked Expert status"
- **Network Health card** below events:
  - Signal Strength: 94%
  - Sync Rate: 87%
  - Clarity Index: 76%
  - Each with animated fill progress bar.

#### `AchievementToast`
- Fixed top-center overlay.
- Appears on: page entry + successful post creation.
- Structure: icon + "Achievement Unlocked" label + name + "+XP" badge.
- Framer Motion: slides down from top, auto-dismisses after 4 seconds.
- Entry achievement: "Community Pioneer — +150 XP"
- Post achievement: "Signal Sent — +50 XP"

### Key Handlers

**`handlePost({ text, tag })`**
1. Creates new post object with user's name/icon/score.
2. Prepends to `posts` array (appears at top of feed).
3. Triggers achievement toast "Signal Sent — +50 XP".
4. **Backend integration point:** This should POST to backend API.

**`handleReact(postId, emoji)`**
- Finds post by id, increments that emoji's count.
- Updates `posts` state immutably.
- **Backend integration point:** Should PUT/PATCH reaction count to backend.

### Background Styling
- Dark radial gradient background with two subtle tinted vignettes (purple top-left, cyan bottom-right).
- SVG turbulence noise filter applied as grain texture overlay.

---

## 11. 3D Scene: Particle Morphing (`scene.js`)

**Location:** [src/lib/scene.js](src/lib/scene.js)

Creates and manages the Three.js particle scene on the Onboarding page. Exports a factory function.

### API

```js
import { createUniMindScene } from './lib/scene.js'

const scene = createUniMindScene(domContainer)
// scene.transitionTo('molecule')
// scene.transitionTo('dna')
// scene.transitionTo('brain')
// scene.destroy()
```

### Configuration

| Constant | Value | Description |
|---|---|---|
| `PARTICLE_COUNT` | 6,000 | Total particles in the BufferGeometry |
| Stages | `dust`, `molecule`, `dna`, `brain` | Named morph targets |
| Spark count | 600 | Secondary brain-stage particles |

### Target Shape Generators

**`genDust(n)`**
- Distributes `n` particles on a spherical shell, radius 6–14 units.
- Organic scatter using `Math.acos` for uniform spherical distribution.

**`genMolecule(n)`**
- 8 atom positions arranged in a 3D cluster.
- 30% of particles placed at atom centers (with small radius variation).
- 70% along 13 bond connections between atoms.
- Looks like a rendered chemical molecule.

**`genDNA(n)`**
- Height: 7.5 units, 2.6 full turns of helix.
- Two strands (strand A, strand B) offset by π radians.
- Strand radius: 1.1 units.
- 72% particles distributed along strands, 28% on horizontal rungs between strands.

**`genBrain(n)`**
- Cortex: Two hemispheres (left/right) with sinusoidal gyri (wrinkle) displacement.
- Cerebellum: 10% of particles, smaller folded structure below and behind.
- Brainstem: 3% of particles, narrow cylinder descending from cerebellum.
- Interior neural nodes: 5% sparse interior scatter.
- Whole structure tilted slightly forward for natural viewing angle.

### Particle System Details

- Single `THREE.BufferGeometry` with `position` (Float32Array) and `color` (Float32Array) attributes.
- Per-particle morph delay: random `0–0.6s` offset stored as attribute.
- Per-particle morph speed: random `0.9–1.5×` multiplier.
- Interpolation formula: `k = 1 - Math.exp(-afterDelay * 2.2 * speed)` (exponential ease-out).
- Color: Per-particle random blend of cyan `#00D1FF`, purple `#7B61FF`, pink `#FF5FB6`.
- Material: `THREE.PointsMaterial` with custom circular texture (canvas-drawn radial gradient).

### Spark Layer (Brain stage only)
- 600 secondary particles in a separate `THREE.Points` object.
- Positions cluster around brain particle positions.
- Breathing animation: position offset by `sin(time * frequency + phase) * amplitude`.
- Fade in when entering brain stage, fade out on exit.

### Glow Core (Sprite)
- `THREE.Sprite` with radial gradient canvas texture.
- Position: origin (0, 0, 0).
- Color changes per stage:
  - dust → cyan `#00D1FF`
  - molecule → blue `#4488FF`
  - dna → purple `#7B61FF`
  - brain → pink `#FF5FB6`
- Scale pulses with burst energy on stage transition (quick scale spike then settle).

### Camera Movement
- Positioned on Z axis, looking at origin.
- Per-stage Z target distances:
  - dust: 9.0
  - molecule: 7.6
  - dna: 7.0
  - brain: 6.2
- Y target: 0.3 (dust/molecule/dna), 0.55 (brain — looks up slightly).
- Slow float: `position.y += sin(t * 0.18) * 0.001` for subtle breathing feel.

### Per-Stage Rotation
| Stage | Y rotation speed | X rotation |
|---|---|---|
| `dust` | `dt × 0.03` | None |
| `molecule` | `dt × 0.22` | `sin(t × 0.3) × 0.08` |
| `dna` | `dt × 0.35` | None |
| `brain` | `dt × 0.06` | `-0.10 + sin(t × 0.18) × 0.03` |

### Cleanup
`destroy()` cancels the animation frame, removes event listeners, disposes all Three.js geometries and materials, and removes the canvas from the DOM.

---

## 12. 3D Scene: Network Visualization (`scene2.js`)

**Location:** [src/lib/scene2.js](src/lib/scene2.js)

The most complex file. Creates the full interactive 3D network graph for the Agentic Web page.

### API

```js
import { createUniMindWeb } from './lib/scene2.js'

const scene = createUniMindWeb(domContainer)

// Callbacks (must set before scene starts rendering)
scene.onCoreHover(callback)         // (bool) → void
scene.onCoreClick(callback)         // () → void
scene.onPhase(callback)             // (phaseNum) → void
scene.onPortal(callback)            // (0.0 to 1.0) → void
scene.onNodeClick(callback)         // (nodeIndex) → void

// Controls
scene.runSimulation()               // Start 4-phase simulation
scene.resetSimulation()             // Reset to idle
scene.flyToNode(position)           // Animate camera to Vector3
scene.highlightNode(idx, edgeArr)   // Highlight node + path edges
scene.clearHighlight()              // Clear all highlights
scene.setFilters(maskObj)           // Show/hide node types { 0,1,2,3 }
scene.setVisibleNodeCount(n)        // Timeline: show only first n nodes
scene.setTimeframe(id)              // Trigger dim effect ('past','this','all')

// Queries
scene.getGraphData()                // { positions, edges, adjacency, connEdgeMap }
scene.projectNodeToScreen(idx)      // { x, y } or null if off-screen
scene.getCoreScreenPos()            // { x, y } of core in screen space
scene.destroy()                     // Full cleanup
```

### Node Generation

**Total nodes:** 1,401 (indices 0–1399 = network, index 1400 = user)

**Layer distribution:**
| Layer | % of nodes | Shell radius | Flatten factor |
|---|---|---|---|
| Inner | 55% | 9–22 units | 0.55 |
| Mid | 30% | 22–36 units | 0.50 |
| Outer | 15% | 36–52 units | 0.45 |

Flatten factor compresses the Y axis to create a disc-like network shape (not a sphere).

**Node types:**
| Type | Label | Color | Size range |
|---|---|---|---|
| 0 | New | `#E3F2FD` | 0.3–0.55 |
| 1 | Community | `#4FC3F7` | 0.4–0.75 |
| 2 | Expert | `#B388FF` | 0.55–0.95 |
| 3 | You (user) | `#FFD54F` | 1.4 (fixed) |

Each node also has a `phase` attribute (0–2π random) for staggered pulse animation.

### Connection Network

- **Algorithm:** Spatial grid (cell size 5 units). Each node finds nearest 2–3 neighbors in adjacent cells.
- **User node:** Explicitly connected to 3 nearest regular nodes so BFS always has a path.
- **Total edges:** ~2,400.
- **Rendering:** Each connection is a Bezier curve with `SEGS=10` segments (not a straight line). Control point is offset perpendicular to the midpoint for curvature.
- **Adjacency list:** Built alongside edges for BFS pathfinding.
- **`connEdgeMap`:** Dictionary `"minIdx*10000+maxIdx" → edgeIndex` for O(1) edge lookup by node pair.

### Special Objects

**Starfield**
- 1,400 star particles at radius 60–180 units from origin.
- Color: HSL hue 0.55–0.70 (blue/purple range), varied saturation.
- Additive blending. Rotates very slowly (Y axis).

**Dust Floaters**
- 260 semi-transparent particles with random drift velocity.
- Bounce within scene bounds, additive blending.

**Flow Particles**
- 220 particles assigned to random connections.
- Travel along the Bezier curve of their assigned connection.
- Speed: `0.3` (idle) → `0.8` (Phase 2) → `1.5` (Phase 3).
- Restart from beginning when they reach the end.

**Signal Particles (Phase 1)**
- 200 particles.
- Spawned when Phase 1 begins.
- Expand outward as a wave from origin at 26 units/second.
- Activate connections as the wave front crosses them (connection lines briefly glow cyan).

**Convergence Stream (Phase 3)**
- 500 particles spawned from random node positions.
- Accelerate toward origin at increasing speed.
- Fade out when within 2 units of center.
- Creates dramatic "data being absorbed" visual.

### UniMind Core

The central sphere at the origin. Hit detection uses a sphere of radius 4.2 for click and hover.

**Particle core:** 3,500 particles.
- 55% white, 30% cyan `#00D1FF`, 15% purple `#7B61FF`.
- Breathing: scale factor `1 + 0.05 * sin(t * 1.2)`.

**Arc lines:** 6 rotating arcs inside the core.
- Color: deep blue → cyan gradient.
- Rotate at different speeds for each arc.

**Aura sprites:** 2 layered `THREE.Sprite` objects (large soft glow + smaller brighter center).

**Hot center:** 1 white `THREE.Sprite` at origin.

**Portal rings:** 3 rings (cyan, purple, pink).
- Expand outward during Phase 4.
- Wave-offset expansion: outer rings start after inner.
- Scale and opacity driven by `portalT` value (0 → 1).

### Custom Shaders

**Node Vertex Shader**
- Attributes: `aSize` (node size), `aPhase` (pulse phase), `aHighlight` (highlight float 0/1).
- Uniforms: `uTime`, `uGlobalPulse`, `uHighlightT`, `uMap`, `uPx` (pixel ratio).
- Computes: pulse offset `sin(uTime + aPhase) * 0.12`, size scaling, highlight dimming (non-highlighted nodes shrink to 30% during selection mode).

**Node Fragment Shader**
- Samples circular particle texture.
- Boosts brightness during pulse peak.
- Discards pixels with alpha < 0.02.

**Line Vertex Shader**
- Attributes: `aReveal` (0–1, used for entry wave), `aIsPath` (is this edge part of BFS path), `aHideEdge` (hidden by filter/timeline).
- Uniforms: `uLineOpacity`, `uWebRevealT`, `uSignalT`, `uSignalMode`, `uPathMode`.
- Discards hidden edges via `gl_Position = vec4(2.0)` trick.

**Line Fragment Shader**
- Normal: very low opacity (0.07).
- Signal mode: glows cyan along wave front.
- Path mode: selected path edges bright purple, all others even dimmer.
- Entry reveal: fades in with `uWebRevealT` progress.

### Post-Processing

Applied on non-mobile devices only (detected via `window.innerWidth > 768`).

- `THREE.EffectComposer` with `THREE.UnrealBloomPass`.
- Bloom settings: `threshold=0.12`, `radius=0.4`.
- Strength varies:
  - Idle: 0.8
  - Entry: 1.2
  - Phase 3 (convergence): 2.5

### Camera & Controls

- Initial position: `(0, 0, 70)`, looking at origin.
- `THREE.OrbitControls`: enabled after entry animation, damping `0.06`, min distance `12`, max `140`.
- `flyToNode(position)`: lerps camera position and orbit target over ~1.5 seconds.

### Simulation Timeline

| Phase | Duration | Description |
|---|---|---|
| 1 | 0–1.5s | Signal wave expands from core; connection lines glow |
| 2 | 1.5–3.0s | Camera zooms in; flow particles max speed; core energy rises |
| 3 | 3.0–4.5s | Convergence streams spawn; global pulse; lines fade |
| 4 | 4.5–6.0s | Core portal rings expand; white-out overlay; `portalT` → 1 |

---

## 13. Agent Data & Pathfinding (`agentData.js`)

**Location:** [src/lib/agentData.js](src/lib/agentData.js)

Defines all 1,401 agent identities and provides graph algorithms for pathfinding.

### Exports

```js
export {
  AGENTS,              // Array[1401] of agent objects
  USER_IDX,            // 1400 (constant)
  hydrateAgents,       // (nodeKinds) → void  — fills procedural agents from scene data
  setUserName,         // (name) → void  — updates user agent's name
  bfsPath,             // (adjacency, from, to) → number[] | null
  pathToEdgeIndices,   // (path, connEdgeMap) → number[]
}
```

### Agent Object Shape

```js
{
  idx: number,         // Index in AGENTS array (== position in scene nodes)
  name: string,        // Short name (e.g. "ARIA")
  fullName: string,    // Full display name (e.g. "ARIA-9 Neural Architect")
  type: number,        // 0=New, 1=Community, 2=Expert, 3=You
  icon: string,        // Emoji
  bio: string,         // Description text
  score: number,       // Agent score
}
```

### Notable Agents (Indices 0–29)

30 hand-crafted agents with unique names, bios, and high scores:

| Idx | Name | Type | Icon | Score |
|---|---|---|---|---|
| 0 | ARIA | Expert | 🧠 | 9,842 |
| 1 | NOX | Expert | ⚡ | 9,120 |
| 2 | VEDA | Expert | 🔮 | 8,633 |
| 3 | ZETA | Expert | 🌀 | 8,201 |
| ... | ... | ... | ... | ... |
| 29 | JOV | New | ◈ | 440 |

Notable bios are stored in `NOTABLE_BIOS` array (30 unique descriptions).

### Procedural Agent Generation (Indices 30–1399)

- **RNG:** `xorshift32` seeded with `idx` — deterministic, same output every run.
- **Name:** `PREFIXES[i % 50] + SUFFIXES[j % 30]` — 50 prefixes + 30 suffixes.
- **Type:** Assigned during `hydrateAgents()` from scene's `nodeKinds` array.
- **Icon:** Chosen from type-specific icon array using seeded RNG.
- **Bio:** "Node #X. [Role] in the UniMind web." — role varies by type.
- **Score:** `rng(i * 13 + 7) * 380 + 10` (range 10–390).

### User Agent (Index 1400)

```js
{
  idx: 1400,
  name: 'YOU',          // Updated by setUserName()
  fullName: 'YOU',
  type: 3,
  icon: '★',
  bio: 'That\'s you. Node #1400 in the UniMind web.',
  score: 100,
}
```

`setUserName(name)` updates both `name` and `fullName` fields.

### BFS Pathfinding

```js
bfsPath(adjacency, fromIdx, toIdx) → number[] | null
```

- Standard BFS using a queue.
- `adjacency`: `Array[1401]` of `Int32Array` — each entry is sorted list of neighbor indices.
- `visited`: `Uint8Array` for O(1) lookup.
- `parent`: `Int32Array(-1)` for path reconstruction.
- Returns array of node indices from `fromIdx` to `toIdx`, or `null` if unreachable.
- Used to show "X hops from you" in the node tooltip and to highlight the path.

```js
pathToEdgeIndices(path, connEdgeMap) → number[]
```

- Converts `[nodeA, nodeB, nodeC]` path to `[edgeAB, edgeBC]` edge indices.
- Edge key formula: `Math.min(a,b) * 10000 + Math.max(a,b)`.
- Returns array of edge indices for the line shader's `aIsPath` attribute.

---

## 14. Color Palette & Design System

### Primary Gradient
```
#00D1FF  →  #7B61FF  →  #FF5FB6
  cyan       purple       pink
```
Used in: gradient text (`.agent-grad`), buttons, progress bars, transition orb, node labels.

### Node Type Colors
| Type | Label | Hex |
|---|---|---|
| 2 | Expert | `#B388FF` |
| 1 | Community | `#4FC3F7` |
| 0 | New | `#E3F2FD` |
| 3 | You | `#FFD54F` |

### Background Colors
| Use | Hex |
|---|---|
| Page background | `#05070A` |
| Scene background | `#02030A` |
| Glass card background | `rgba(255,255,255,0.025)` |
| Glass card border | `rgba(255,255,255,0.07)` |

### Text Colors
- Primary: `#FFFFFF`
- Secondary: `rgba(255,255,255,0.55)`
- Muted: `rgba(255,255,255,0.25)`
- Gradient text: `.agent-grad` class

### Component Classes
| Class | Effect |
|---|---|
| `.glass-card` | Glassmorphism panel |
| `.agent-grad` | Gradient text |
| `.mono` | JetBrains Mono font |
| `.drift` | Floating particle animation |
| `.rippleburst` | Click ripple animation |

---

## 15. Key Design Patterns

### 1. Manual Page Routing via State
No React Router. `App.jsx` holds `page` state and conditionally renders one of three `<Page>` components. Transitions are orchestrated with `setTimeout` chains + Framer Motion `AnimatePresence`.

### 2. Three.js Scene as Imperative Module
Scene files export factory functions that return an API object. React components create the scene in `useEffect`, store the API in a `useRef`, and call methods on it in response to state changes. The scene owns its own animation loop (`requestAnimationFrame`).

### 3. Callback-Based Scene ↔ React Communication
The scene fires callbacks (`onCoreHover`, `onNodeClick`, etc.) that React registers. React never polls the scene — it receives events. The scene never accesses React state — it receives commands via API methods.

### 4. Seeded Procedural Generation
Agent names, types, icons, and scores for indices 30–1399 use `xorshift32(seed)` RNG. Seed is derived from the agent index, so output is identical every run (no randomness drift between sessions). This means the network looks the same every time the app loads.

### 5. Custom GLSL Shaders for Performance
Nodes and connection lines use custom vertex/fragment shaders instead of standard Three.js materials. This allows per-particle pulse animation, entry wave reveal, signal wave glow, BFS path highlighting, and node type filtering — all on the GPU, without CPU-side per-frame updates.

### 6. Additive Blending for Glow
All particle systems (`THREE.AdditiveBlending`) blend colors by addition. On a dark background, overlapping bright particles create natural glow without any bloom post-processing — the bloom pass just enhances it further.

### 7. Glassmorphism UI
All overlay panels use `backdrop-filter: blur(12px)` + `rgba` backgrounds and borders. This creates a layered depth effect against the 3D scene underneath.

### 8. Framer Motion for UI Animations
All React-layer animations (card transitions, progress bars, tab switches, toast notifications, page entry/exit) use Framer Motion. Three.js animations are separate and imperative.

---

## 16. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         App.jsx                              │
│  state: page, bridgePhase, isExiting, userName               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ handleEnter(answers) → 4-phase timed transition       │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────┬────────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────┐    ┌──────────────────────────────┐
│    OnboardingPage        │    │      AgenticWebPage           │
│  state: stepIndex,       │    │  state: phase, selectedNode,  │
│    answers, done, stage  │    │    filters, timelineDay, ...  │
│                          │    │                               │
│  scene.js (Three.js)     │    │  scene2.js (Three.js)         │
│  ← transitionTo(stage)   │    │  ← runSimulation()            │
│                          │    │  ← highlightNode(idx, edges)  │
│  agentData.js            │    │  ← setFilters(mask)           │
│  (not used here)         │    │  ← setVisibleNodeCount(n)     │
│                          │    │                               │
│  onEnter(answers) →      │    │  → onPhase(n)                 │
│                          │    │  → onNodeClick(idx)           │
│                          │    │  → onCoreHover(bool)          │
└─────────────────────────┘    │  → onPortal(t)                │
                                │                               │
                                │  agentData.js                 │
                                │  ← bfsPath(adj, from, to)     │
                                │  ← pathToEdgeIndices(path)    │
                                │  ← AGENTS[idx]                │
                                └──────────────────────────────┘
                                               │
                                               │ onCommunity()
                                               ▼
                                ┌──────────────────────────────┐
                                │       CommunityPage           │
                                │  state: posts, activeTab,     │
                                │    achievement                │
                                │                               │
                                │  onBack() → App.page='agentic'│
                                └──────────────────────────────┘
```

---

## 17. Python Backend Integration Points

This section maps every location in the frontend that should connect to the Python AI backend.

### A. Onboarding Answers → User Profile

**Where:** `App.jsx` — `handleEnter(answers)` receives:
```js
{
  focus: { choice: "Student", custom: "" },
  goal: { choice: "Masters Abroad", custom: "" },
  fear: { choice: "Failure", custom: "" }
}
```
**Action:** POST to `/api/users` or `/api/onboarding` to create user profile.
**Returns:** User ID, initial agent data, personalized recommendations.

### B. Agent Network Data

**Where:** `agentData.js` — Currently all 1,401 agents are hardcoded or procedurally generated.
**Action:** Replace `AGENTS` fetch with `GET /api/agents` returning real agent objects.
**Returns:** Array of agent objects with real names, bios, scores, relationship data.

### C. Network Graph Topology

**Where:** `scene2.js` — Node positions and connections are generated client-side with seeded RNG.
**Action:** `GET /api/graph` returning real adjacency data. Scene uses positions/connections from API.
**Returns:** `{ positions: [[x,y,z]], edges: [[a,b]], kinds: [0,1,2,3] }`

### D. Simulation Results

**Where:** `AgenticWebPage.jsx` — `PortalNext` component shows static placeholder text after simulation.
**Action:** When `phase === 4` completes, POST to `/api/simulate` with user answers.
**Returns:** Personalized "Your timeline" results — predicted milestones, recommended agents to connect with, skill gaps.

### E. Community Posts

**Where:** `CommunityPage.jsx` — `INITIAL_POSTS` is a hardcoded array of 10 posts.
**Action:** Replace with `GET /api/posts?page=1&limit=20`.
**Returns:** Real posts from real agents with pagination.

### F. Post Creation

**Where:** `CommunityPage.jsx` — `handlePost({ text, tag })` currently just prepends to local state.
**Action:** POST to `/api/posts` with `{ text, tag, userId }`.
**Returns:** Created post object with server-assigned id and timestamp.

### G. Reactions

**Where:** `CommunityPage.jsx` — `handleReact(postId, emoji)` updates local count only.
**Action:** POST to `/api/posts/:id/react` with `{ emoji }`.
**Returns:** Updated reaction counts.

### H. Timeline Historical Data

**Where:** `AgenticWebPage.jsx` — `TimelineScrubber` uses hardcoded `GROWTH_MILESTONES`.
**Action:** `GET /api/network/history?from=2026-02-01&to=2026-05-14` returning daily node counts.
**Returns:** Array of `{ date, count }` for rendering the real growth timeline.

### I. Leaderboard

**Where:** `AgenticWebPage.jsx` — `LeaderboardModal` has 5 hardcoded agent ranks.
**Action:** `GET /api/leaderboard?period=month` returning top agents.
**Returns:** `[{ rank, agentName, score }]`

### J. User Authentication / Session

**Where:** Not yet implemented. `userName` defaults to `'SUDEEP'` hardcoded in `App.jsx`.
**Action:** Add auth flow before onboarding, or pass user token from onboarding POST response.
**Session storage:** JWT or session cookie for all subsequent API calls.

### K. Live Activity Feed

**Where:** `CommunityPage.jsx` — `LiveFeed` generates fake events on a `setInterval`.
**Action:** Replace with WebSocket connection to `/ws/activity` for real-time events.
**Protocol:** `{ type: 'node_join' | 'skill_share' | 'simulation', agentName, text, time }`

---

*This document covers the complete frontend as of May 2026, before Python AI backend integration. All data is client-side. All agent content is procedural or hardcoded. The backend will replace sections B, C, D, E, F, G, H, I, J, K with real data and intelligence.*
