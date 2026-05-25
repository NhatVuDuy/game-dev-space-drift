# Space Drift — Game Design & UI Reference

> Living document. Update whenever mechanics, UI, or visual decisions change.
> Current build: **32** (bottom-left corner label in-game)

---

## 1. Concept

A vertical-scroll arcade game played on mobile (tilt steering) or desktop (mouse).
The ship drifts upward through an infinite procedurally-generated space environment.
The player collects gems, passes through stage gates, refuels at landing pads, and avoids obstacles.
The game ends on collision with any solid obstacle.

---

## 2. Core Mechanics

### 2.1 Physics

| Parameter | Value | Notes |
|-----------|-------|-------|
| Gravity | `G = 0.065` | Pulls ship down every frame |
| Thrust | `THR = 0.19` | Applied upward while thrust button/click held |
| Tilt sensitivity | `TILT = 2.8` | Multiplier on gyro/mouse X input |
| Max fuel | `FMAX = 100` | Fuel is 0–100 |
| Fuel burn rate | `FBURN = 0.15` | Per frame while thrusting |
| Fuel refill rate | `FADD = 38` | Per second while on refuel pad |
| Launch velocity | `LV = 1.7` | Upward vy on LAUNCH from pad |

The ship has `vx` (horizontal) and `vy` (vertical) velocity. Gravity reduces `vy` every frame. Thrust adds to `vy`. Horizontal steering directly sets `vx` via tilt/mouse/buttons.

### 2.2 Camera

World Y (`wy`) is the canonical position. Screen Y = `H - (wy - cam)`.
Camera (`G.cam`) lerps toward the ship's world Y minus a target offset, giving smooth follow with slight lag. Camera never goes below 0 (ground level).

### 2.3 Collision

Ship is a circle of radius `SR = 17 px`.
Obstacles use bounding-box + per-type shape checks.
- Asteroids: circle vs circle
- Wall gates: player must pass through the gap (rectangular opening)
- Black holes: proximity trigger (not hard collision — triggers warp)

---

## 3. Controls

### Tilt (iOS / Android mobile)
- **iOS**: `DeviceOrientationEvent.requestPermission()` must be called inside a user gesture. As of v32 this happens inline on the LAUNCH button tap — no separate overlay needed.
- **Android**: Permission-free. Auto-detected silently on first `deviceorientation` event. Remembered in `localStorage['sd_tilt']`.
- Mode: **Roll** (`e.gamma`, left/right tilt) by default. Yaw mode available but falls back to roll if alpha is null.
- Invert toggle persisted in `localStorage['sd_gyro_invert']`.
- Calibration: sets `gyroOffset` to the current raw reading (zero point). Persisted in `localStorage['sd_gyro_offset_roll']`.

### Mouse (desktop)
- `mouseX` = normalized 0–1 across canvas width. Mapped to `[-1, 1]` steering.
- Click anywhere to thrust.

### On-screen buttons (mobile fallback / no tilt)
- Left / Right arrow buttons set `btnX` to ±1.
- Thrust button (centre) toggles `thrusting`.
- Buttons hidden when tilt is active.

---

## 4. World Structure

### 4.1 Altitude & World Y
`wy = 0` is the ground (launch pad). Altitude increases as the ship flies up.
`G.maxAlt` tracks the highest `wy` reached in the current run.

### 4.2 Stage Gates
- Placed every `GSPC = 600` world Y units.
- Each gate is a horizontal wall with a random gap opening.
- Passing through the gap advances the stage counter (`G.stgN`).
- Stage crossing fires: sound (`sfx('stage')`), flash text (`stgflash` particle at `H*0.22`), and a `stgTrans` animation.
- Stage number displayed in the HUD badge (`#sbadge`).

### 4.3 Procedural Generation
Objects are generated ahead of the camera (`G.lastGen` tracks the highest generated world Y).
Each generation pass spawns:
- Asteroids in clusters (altitude bands)
- Wall gates at `nextGateAlt` intervals
- Gems scattered between gates
- Refuel pads every few stages
- Planets / decorative objects at specific altitude thresholds

---

## 5. Obstacles

### 5.1 Asteroids
| Property | Normal | Danger |
|----------|--------|--------|
| Radius | 13–32 px | 9–18 px |
| Speed (vx) | slow (0.18–0.66) | fast (0.85–2.05) |
| vy | 0 | slight vertical drift |
| Color | theme `T.ac[]` palette | `T.dc` (danger color) |
| Visual | rocky meteorite, warm gray | same + pulsing glow halo |

**Visual design (v32):**
- 15-vertex polygon with angle+amplitude jitter seeded on `(wy*3 + r*97)` — stable unique shape per asteroid, does not wobble during rotation
- Directional radial gradient: `rgba(200,188,168)` highlight → theme color → near-black shadow
- 16 surface speckle dots (dark pits + light mineral flecks)
- 3–4 craters per asteroid: dark pit fill, lighter offset floor, lit rim arc on top-left
- Specular flare dot at top-left
- Danger: 4px pulsing halo in `T.dc` with 24px blur

### 5.2 Wall Gates
- Full-width horizontal barrier with a rectangular gap.
- Gap position and width are randomized per gate.
- Rendered as neon lightning bolt segments with glow.
- Hue varies by gate index: `185 + o.hue * 40` degrees.

### 5.3 Black Holes
- Stationary, drawn as a dark singularity with an accretion disk ring.
- Proximity warning pulses when ship gets close.
- On warp trigger: `bhWarping = true`, ship teleports to a safe position forward.
- Warp phase animation: scale distortion + flash.

---

## 6. Collectibles

### 6.1 Gems
- Scattered in the world at various altitudes.
- Collected on overlap with ship radius.
- Each gem: +1 to `G.ship.gems`, plays `sfx('gem')`.
- Gem count shown in HUD.

### 6.2 Shields
- Rare pickup, shown with distinct visual.
- `G.ship.shields` counter; first collision is absorbed instead of death.

---

## 7. Refueling System

### 7.1 Refuel Pad
- A horizontal platform spawned every few stages.
- Ship must **land** on the pad: approach from above, low vertical speed.
- Landing detected when ship `wy` ≈ `padWY + SR + 2` and `vy ≤ 0`.

### 7.2 Refueling Sequence
1. `G.refueling = true`, `G.landed = true`
2. Fuel increments by `FADD` per second until `FMAX`
3. Mist/steam particle effects on the pad (heavy on landing, tapers off)
4. No DOM updates during refueling loop — pure math only (prevents iOS freeze)
5. LAUNCH button (`#rfbtn`) visible; tapping fires `rfLaunch()`
6. `rfLaunch()`: kick ship upward with `LV` velocity, `refueling = false`, resume play

---

## 8. Scoring

- **Altitude score**: proportional to `G.maxAlt` (highest world Y reached)
- **Gem bonus**: each gem collected adds a flat bonus
- Score displayed in the top HUD (`#hud`)
- High score persisted in `localStorage['sd_hi']`
- Scores and stats loaded/saved via `loadStats()` / `saveStats()`

---

## 9. Theme System

Themes are defined in the `TH` object. Each theme has:

| Key | Description |
|-----|-------------|
| `bg[]` | Two-stop gradient for LAUNCH button background |
| `ac[]` | Array of asteroid fill colors |
| `dc` | Danger color (for danger asteroids, warnings) |
| `bc` | Bright/accent color (stage flash text, highlights) |
| `sc[]` | Star colors for the starfield |

Available themes: `scifi`, `cartoon`, `neon` (and others).
Active theme stored in `localStorage['sd_theme']`.
Applied via `applyTheme()` which sets `T = TH[key]` and refreshes all themed elements.

---

## 10. HUD Layout

```
┌─────────────────────────────────────────────────┐
│  [FUEL ▮▮▮▮▮▮]  [SCORE]  [STAGE]  [GEMS ◆]    │  ← top strip
│                                                 │
│  │fuel│                              │thrust│   │  ← vertical bars, sides
│  bar                                   bar      │
│                                                 │
│                   SHIP                          │
│                                                 │
│  [◄]           [THRUST]              [►]        │  ← bottom controls (mobile)
│                                                 │
│ 32                             MOVE MOUSE …     │  ← version (fixed, bottom-left)
└─────────────────────────────────────────────────┘
```

- `#bar-fuel`: left edge, vertical tank bar
- `#bar-thrust`: right edge, vertical tank bar  
- `#hud`: top bar — score left, stage badge center-top, gems right
- `#btn-left`, `#btn-right`: steer arrows (hidden when tilt active)
- `#thr`: thrust button circle (hidden when tilt active)
- `#mhint`: "MOVE MOUSE TO STEER" hint (desktop only)
- `#ver`: build number, bottom-left, low-opacity Orbitron 9px

---

## 11. Home Screen

- Animated canvas (`#home-cv`) with scrolling starfield + orbiting planets.
- `homeLoop()` runs at 60fps, updates `homeTick`.
- Planets orbit at different radii and speeds around a center point.
- "SPACE DRIFT" title in Orbitron bold.
- LAUNCH button (`#btnp`) — center of screen.
  - Disabled/grayed on Android if tilt not yet set up
  - Always enabled on iOS (permission asked on tap) and desktop
- "ENABLE TILT" button (`#cal-home-btn`): shown after tilt is active; opens calibration overlay
- Theme selector chips for switching visual theme
- "HOW TO PLAY" link opens `#sh` screen

---

## 12. Screens / Overlays

| ID | Trigger | Content |
|----|---------|---------|
| `#sh` (How to play) | Button on home | Controls, tips |
| `#rf-ov` (Refuel overlay) | Landing on pad | Fuel bar animation + LAUNCH button |
| `#sc-ov` (Stage clear) | Gate crossed | Stage number, continue prompt |
| `#so` (Game over) | Ship destroyed | Score, high score, RETRY button |
| `#tilt-ov` (Tilt overlay) | Manual ENABLE TILT tap | Permission explanation + ALLOW button |
| `#cal-ov` (Calibration) | CAL button | Live tilt bar, zero/invert controls |

---

## 13. Particle System

All particles live in `G.parts[]`. Each tick: `p.life -= p.dl` (or default 0.021). Dead particles filtered out.

| Type | Description | Key params |
|------|-------------|------------|
| `txt` | Floating score text (gem pickup, etc.) | `x, y, vy, text, col` |
| `stgflash` | "STAGE X" full-screen text on gate cross | `x=W/2, y=H*0.22, life=1, dl=.009` ≈ 1.8s |
| default | Physics sparks / explosion debris | `vx, vy, vy+=0.06` (gravity) |

`stgflash` renders with scale-in animation and fade-out. Font: bold 42px Orbitron.

---

## 14. Audio

Synthesized via Web Audio API (`AC = AudioContext`). No audio files — all generated with oscillators.

| Event | Sound |
|-------|-------|
| Gem pickup | Rising two-tone chirp |
| Refuel | Short rising beep |
| Collision / death | Sawtooth boom decay |
| Gate pass | Three-note ascending chord |
| Stage advance | Four-note ascending fanfare |
| Landing | Low thud |
| Black hole warp | Sawtooth descending sweep |
| Launch | Cinematic multi-oscillator burst |

---

## 15. Technical Notes

### File structure
Single self-contained HTML file: `space-drift-v3.0.html`
- ~2300 lines, ~120KB
- No external dependencies except Google Fonts (Orbitron, Exo 2)
- Deployed via GitHub Pages (auto-deploy on push to `main`)

### Key globals
| Variable | Type | Purpose |
|----------|------|---------|
| `G` | object | All mutable game state for the current run |
| `T` | object | Current theme (ref into `TH`) |
| `W, H` | number | Canvas width/height (updated on resize) |
| `isMob` | bool | True if width < 820px OR touch device |
| `gyroSteer` | bool | True when tilt input is bound |
| `tiltReady` | bool | True after first gyro event fires |

### Helper functions
- `w2s(wy)` — world Y → screen Y
- `phash(n)` — seeded deterministic PRNG, returns 0–1. Used for all procedural generation to keep results frame-stable.

### Deployment
- Branch `main` → GitHub Actions → GitHub Pages (automatic)
- Feature branch `claude/...` does NOT trigger deploy (workflow only listens to `main`/`master`)
- Concurrency group `pages` with `cancel-in-progress: true` — only one deploy runs at a time

---

## 16. Version History

| Build | Changes |
|-------|---------|
| 30 | Initial v3.0 release |
| 31 | Removed rf-msg DOM overlay (fixed iOS freeze), fixed CI/CD workflow, moved stage text to `H*0.22`, asteroid gradient+crater redesign, tilt permission inline on LAUNCH (iOS), version label added |
| 32 | Meteorite asteroid redesign: angle-jittered polygon, rocky dark gradient, 16 surface specks, lit crater rims; version label simplified to 2-digit build number |

**Version convention**: increment build number by 1 on each push. Edit `<div id="ver">XX</div>` in the HTML before pushing.

---

## 17. Known Constraints & Decisions

- **iOS tilt permission cannot be persisted** across page reloads — this is a browser security policy (not a bug). The inline-on-LAUNCH approach minimises friction to one tap per session.
- **No DOM updates in game loop** — any `getElementById`/`textContent`/`classList` calls inside the 60fps loop cause frame drops and freezes on iOS. All game state updates are pure JS object mutations; HUD is canvas-drawn.
- **Single-file architecture** — deliberate choice for zero-deploy-complexity. All CSS, HTML, JS in one file means no build step, no bundler, instant GitHub Pages deploy.
- **phash for procedural content** — using a deterministic seeded hash instead of `Math.random()` in render-time code ensures asteroid shapes, crater positions, etc. are stable across frames (no flickering/morphing).
