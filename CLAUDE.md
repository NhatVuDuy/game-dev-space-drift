# Space Drift — Dev Roadmap & Rules

## Lộ trình nâng cấp an toàn: v3.0 → WebGL/Three.js

### Nguyên tắc bất di bất dịch
- **Không bao giờ rewrite toàn bộ cùng lúc.** Mỗi PR chỉ thay đổi 1 layer.
- **engine.js là file thiêng liêng.** Chỉ sửa khi gameplay thay đổi, không refactor vì lý do kiến trúc.
- **Mỗi phase phải playable & buildable** trước khi chuyển sang phase tiếp theo.
- **Sau mỗi commit: merge vào main ngay, push ngay.**

---

## Phase 1 — Foundation (CURRENT) ✅
**Mục tiêu**: Vite wrap v3.0 nguyên xi, tách config ra.

```
v4/src/
  config.js    ← CFG, TH (themes), SR  — pure data, no side effects
  engine.js    ← v3.0 JS verbatim, import config, export window.*
  style.css    ← v3.0 CSS
  main.js      ← import style + engine
```

**Quy tắc Phase 1**:
- `engine.js` = v3.0 exact copy (chỉ cho phép: tilt fix, build number)
- `config.js` = pure data only, zero game logic
- CSS có thể chỉnh tự do

---

## Phase 2 — Feature Additions (khi Phase 1 stable)
**Mục tiêu**: Thêm tính năng mới vào engine mà không refactor.

Ví dụ: new ship type, new obstacle, new powerup, leaderboard
- Thêm vào `engine.js` theo pattern cũ của v3.0
- Hoặc thêm file riêng (`leaderboard.js`) rồi gọi từ engine

---

## Phase 3 — Subsystem Extraction (khi engine.js > 3000 dòng)
**Mục tiêu**: Tách từng subsystem có seam rõ ràng.

**Thứ tự tách (từ ít rủi ro đến cao)**:
1. `utils.js`   → aC(), rr(), phash() — pure functions, no state
2. `audio.js`   → initAudio(), sfx(), cinematicLaunchAudio()
3. `render.js`  → drawObj(), drawShip(), drawParallax(), drawSky()
4. `world.js`   → genWorld(), mkAst(), mkGate(), mkWall()...
5. `physics.js` → update() — cuối cùng, khó nhất, nhiều global state nhất

**Quy tắc Phase 3**: Tách 1 subsystem → build + test → merge → rồi mới tách tiếp.

---

## Phase 4 — Render Layer Upgrade (WebGL / Three.js)
**Mục tiêu**: Thay `render.js` bằng WebGL renderer, giữ nguyên game logic.

Vì Phase 3 đã tách `render.js` độc lập, chỉ cần:
- Viết `render-webgl.js` song song với `render.js`
- A/B test (feature flag trong config.js)
- Khi WebGL stable: xoá render.js cũ

**Những thứ sẽ được nâng cấp**:
- Particle effects (GPU-based)
- Post-processing: bloom, chromatic aberration, motion blur
- Shader-based backgrounds (nebulae, stars)
- Ship models 3D (Three.js mesh thay Canvas 2D paths)

**Game logic (physics, world gen, audio) KHÔNG thay đổi.**

---

## Commit Rules
- Sau mỗi commit: merge vào `main`, push ngay
- Build number: `vYYYYMMDD.gitHash` hiển thị góc trái dưới
- Branch naming: `claude/phaseN-description`

## File Structure (v4)
```
v4/
├── index.html          HTML shell — chỉ chứa DOM, không chứa logic
├── vite.config.js      Inject __BUILD__ từ git hash + date
└── src/
    ├── main.js         Entry: import style + engine
    ├── style.css       Visual layer — có thể redesign tự do
    ├── config.js       Pure data: CFG, TH, SR
    └── engine.js       Game engine (v3.0 base, grows over time)
```
