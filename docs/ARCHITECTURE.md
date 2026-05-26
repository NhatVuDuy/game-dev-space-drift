# Architecture — Refactor & New Project Structure

> Status: **Design / Pre-implementation**
> Current build: 43 (single HTML, 2,448 lines)

---

## 1. Vấn đề với kiến trúc hiện tại

| Vấn đề | Impact |
|--------|--------|
| 2,448 dòng trong 1 file | Khó tìm, khó đọc, merge conflict nặng |
| CSS + HTML + JS lẫn lộn | Không thể tree-shake, khó test riêng lẻ |
| Không có module separation | Physics, render, UI, audio đều ở global scope |
| Không có build step | Không dùng được TypeScript, bundling, minification |
| Global state (`G`, `T`, `W`, `H`...) | Khó debug, dễ side effect bất ngờ |
| Thêm feature mới → file càng dài | Collection system thêm ~500+ dòng nữa = không quản lý được |
| Không có test | Thay đổi vật lý hay collision → không biết có break gì không |

---

## 2. Kiến trúc mới đề xuất

### 2.1 Build tool: Vite

**Lý do chọn Vite:**
- Setup 1 lệnh, zero-config cho vanilla JS
- Dev server hot-reload → iterate nhanh
- Build output: bundle tĩnh deploy lên GitHub Pages y hệt hiện tại
- Plugin `vite-plugin-singlefile` nếu muốn giữ single HTML output
- Không cần học React/Vue — thuần JS

### 2.2 Cấu trúc thư mục

```
space-drift/
│
├── index.html                  # Shell HTML (chỉ ~30 dòng)
├── package.json
├── vite.config.js
│
├── src/
│   ├── main.js                 # Entry point — khởi động game
│   │
│   ├── config/
│   │   └── constants.js        # CFG, SR, GSPC và các hằng số
│   │
│   ├── core/
│   │   ├── GameState.js        # Object G — single source of truth
│   │   ├── Loop.js             # requestAnimationFrame, raf, overlayRaf
│   │   ├── Physics.js          # gravity, thrust, velocity update
│   │   └── Camera.js           # cam lerp, w2s()
│   │
│   ├── world/
│   │   ├── WorldGen.js         # genWorld(), lastGen, nextGateAlt
│   │   ├── phash.js            # seeded PRNG
│   │   └── objects/
│   │       ├── Asteroid.js     # mkAst()
│   │       ├── Gate.js         # mkGate(), mkWall()
│   │       ├── StagePad.js     # mkStagePad()
│   │       ├── BlackHole.js    # mkBlackHole()
│   │       ├── Gem.js          # mkGem()
│   │       ├── Fuel.js         # mkFuel()
│   │       └── Medkit.js       # mkMedkit()
│   │
│   ├── collision/
│   │   └── Collision.js        # tất cả collision detection (hiện ~300 dòng trong loop())
│   │
│   ├── render/
│   │   ├── Renderer.js         # draw() orchestrator
│   │   ├── SkyRenderer.js      # drawSky(), drawStars()
│   │   ├── ParallaxRenderer.js # drawParallax(), _drawPlanet(), _drawSolarPlanet()
│   │   ├── ObjectRenderer.js   # drawObj() — asteroid, gate, gem, medkit, pad...
│   │   ├── ShipRenderer.js     # drawShip(), _drawRocket(), _drawSaucer()...
│   │   ├── HUDRenderer.js      # armor gauge, score, stage badge
│   │   └── ParticleRenderer.js # sparks, text popups, stgflash
│   │
│   ├── effects/
│   │   ├── Particles.js        # G.parts[], G.exh[] — update & spawn
│   │   ├── Explosion.js        # doCrash() animation
│   │   └── Cinematic.js        # cinematicBurst(), spawnPadMist()
│   │
│   ├── input/
│   │   ├── InputManager.js     # unified: mouseX, btnX, gyroX, K{}
│   │   ├── TiltInput.js        # DeviceOrientationEvent, iOS permission
│   │   ├── MouseInput.js       # mousemove, click
│   │   ├── TouchInput.js       # thrusting, btnX touch buttons
│   │   └── KeyboardInput.js    # K{} state
│   │
│   ├── audio/
│   │   └── Audio.js            # AudioContext, sfx(), cinematicLaunchAudio()
│   │
│   ├── themes/
│   │   ├── ThemeManager.js     # AK, applyTheme(), T reference
│   │   └── themes.js           # TH{} — scifi, cartoon, anime, neon
│   │
│   ├── ui/
│   │   ├── ScreenManager.js    # showScr(), screen stack
│   │   ├── HomeScreen.js       # homeLoop(), buildThemeSel(), homeOn
│   │   ├── HUD.js              # #hud DOM updates
│   │   ├── RefuelOverlay.js    # rf-ov, startRefuel(), rfLaunch()
│   │   ├── ContinuePrompt.js   # doContinue(), noRevive(), cont-ov
│   │   ├── GameOverScreen.js   # endGame(), #so
│   │   ├── CalibrationUI.js    # showCalOverlay(), doCalibrate()
│   │   └── Toast.js            # toast()
│   │
│   ├── storage/
│   │   └── Storage.js          # wrapper localStorage — loadStats(), saveStats()
│   │
│   └── collection/             # NEW — Phase 1
│       ├── CollectionManager.js # owned[], pity, pendingRolls
│       ├── DropSystem.js        # roll(), calculateRolls(), pity logic
│       ├── CollectionScreen.js  # album UI, theme selector
│       ├── DropScreen.js        # post-run drop reveal animation
│       └── data/
│           ├── space.js         # 20 items định nghĩa
│           ├── animals.js
│           └── index.js         # export tất cả themes
│
├── assets/
│   ├── collection/
│   │   └── space/
│   │       ├── 001.svg          # Saturn
│   │       └── ...
│   └── fonts/                   # self-host Orbitron, Exo2 (optional)
│
└── docs/
    ├── GAME_DESIGN.md           # mechanics reference (existing)
    ├── COLLECTION_DESIGN.md     # collection system (this sprint)
    └── ARCHITECTURE.md          # this file
```

---

## 3. Key design decisions

### 3.1 State management

Không dùng framework. `GameState.js` export một singleton `G` — các module import và mutate trực tiếp. Giống pattern hiện tại nhưng có interface rõ ràng:

```javascript
// core/GameState.js
export const G = {
  ship: { x: 0, wy: 0, vy: 0, vx: 0, fuel: 100, armor: 100, alive: false, ... },
  cam: 0, tick: 0, objs: [], parts: [], exh: [],
  // ... all current G fields
};

export function resetGame(W, H) {
  // re-initialize G for new run (replaces current G = { ... } block)
}
```

### 3.2 Render pipeline

`Renderer.js` là orchestrator, gọi các sub-renderer theo thứ tự:

```javascript
// render/Renderer.js
export function drawFrame() {
  ctx.clearRect(0, 0, W, H);
  SkyRenderer.draw(ctx);
  ParallaxRenderer.draw(ctx, G.cam);
  ObjectRenderer.drawAll(ctx, G.objs, G.cam);
  ParticleRenderer.draw(ctx, G.parts, G.exh);
  ShipRenderer.draw(ctx, G.ship, G);
  HUDRenderer.draw(ctx, G);
  // overlays (vignette, bhFlash, armor gauge)
}
```

### 3.3 Collision separation

Hiện tại collision detection nằm trong `loop()` cùng với physics update — khó test và khó đọc. Tách ra:

```javascript
// collision/Collision.js
export function checkCollisions(G) {
  for (const o of G.objs) {
    checkAsteroid(G, o);
    checkGate(G, o);
    checkStagePad(G, o);
    checkPickup(G, o);  // gem, fuel, medkit
    checkBlackHole(G, o);
  }
}
```

### 3.4 Không dùng TypeScript (giai đoạn đầu)

Vanilla JS với JSDoc comments đủ để có IDE type hints mà không cần build step phức tạp. Có thể migrate TypeScript sau khi cấu trúc ổn định.

---

## 4. Migration strategy

### Nguyên tắc: Không rewrite — Refactor dần

Rewrite từ đầu = risk cao, mất nhiều tuần, có thể break mechanics tinh tế. Thay vào đó:

```
Phase 0 (setup)     — Vite project, copy toàn bộ code hiện tại vào 1 file src/legacy.js
Phase 1 (extract)   — Tách từng module nhỏ, test từng phần
Phase 2 (collection)— Build collection system trên kiến trúc mới
Phase 3 (cleanup)   — Xóa legacy code, polish
```

### Phase 0 — Setup Vite (1–2 giờ)

```bash
npm create vite@latest space-drift -- --template vanilla
cd space-drift
npm install
```

```
# vite.config.js
import { defineConfig } from 'vite'
export default defineConfig({
  base: '/game-dev-space-drift/',  # GitHub Pages subpath
  build: { outDir: 'dist' }
})
```

Copy toàn bộ JS từ `space-drift-v3.0.html` → `src/legacy.js` → import vào `main.js`.
Game chạy y hệt, nhưng có build pipeline.

### Phase 1 — Tách module (thứ tự an toàn)

Tách theo thứ tự **ít dependency nhất trước**:

```
1. config/constants.js      — CFG, SR (không depend vào gì)
2. core/phash.js            — pure function
3. audio/Audio.js           — chỉ dùng Web Audio API
4. storage/Storage.js       — chỉ dùng localStorage
5. themes/themes.js         — pure data
6. input/InputManager.js    — event listeners, no game state
7. world/objects/*.js       — factory functions (mkAst, mkGem...)
8. world/WorldGen.js        — dùng factory + phash
9. core/Physics.js          — pure math
10. collision/Collision.js  — dùng Physics + GameState
11. effects/Particles.js    — spawn helpers
12. render/*.js             — các renderer
13. ui/*.js                 — screen managers
14. core/Loop.js            — game loop (last, ties everything together)
```

**Quy tắc:** Sau mỗi bước, chạy game, kiểm tra không có regression.

### Phase 2 — Collection system

Sau khi có kiến trúc module, thêm collection:

```
1. storage/Storage.js       — thêm loadCollection(), saveCollection()
2. collection/data/space.js — định nghĩa 20 items
3. collection/DropSystem.js — roll(), pity logic
4. collection/CollectionManager.js — state management
5. Tích hợp với endGame()  — tính rolls sau mỗi run
6. collection/DropScreen.js — UI reveal animation
7. collection/CollectionScreen.js — album view
8. HomeScreen.js           — thêm button "BỘ SƯU TẬP"
```

### Phase 3 — Cleanup

- Xóa `src/legacy.js`
- Thêm JSDoc cho các interface quan trọng
- Self-host fonts (bỏ Google Fonts dependency)
- Vitest unit tests cho Physics.js, DropSystem.js, WorldGen.js

---

## 5. GitHub Pages deployment

Không thay đổi workflow:

```yaml
# .github/workflows/deploy-pages.yml (hiện tại)
# Chỉ cần thêm build step:

- name: Install deps
  run: npm ci

- name: Build
  run: npm run build

- name: Deploy
  uses: actions/upload-pages-artifact@v3
  with:
    path: ./dist          # thay vì root (.)
```

Vite build output trong `dist/` → deploy lên GitHub Pages. URL không đổi.

---

## 6. Đánh giá effort

| Phase | Effort ước tính | Risk |
|-------|----------------|------|
| 0 — Vite setup | 2–4 giờ | Thấp |
| 1 — Tách module | 2–3 ngày | Trung bình (cẩn thận globals) |
| 2 — Collection MVP | 3–5 ngày | Thấp (module mới, không đụng game cũ) |
| 3 — Cleanup | 1 ngày | Thấp |
| **Tổng** | **~1.5–2 tuần** | |

**Quan trọng:** Phase 0+1 (setup + tách module) không thêm feature mới. Người dùng không thấy thay đổi. Đây là đầu tư nền tảng.

---

## 7. Quyết định cần thống nhất trước khi bắt đầu

- [ ] **GitHub Pages path**: hiện tại là root `/` hay subpath `/game-dev-space-drift/`?
- [ ] **Single HTML output**: muốn giữ output là 1 file HTML duy nhất không? (dùng `vite-plugin-singlefile`)
- [ ] **Font strategy**: tiếp tục Google Fonts CDN hay self-host?
- [ ] **Phase 1 timeline**: bắt đầu ngay hay sau khi hoàn thiện thêm features ở build hiện tại?
- [ ] **Collection art**: emoji/Unicode placeholder trước, hay chờ có illustrator mới làm?
