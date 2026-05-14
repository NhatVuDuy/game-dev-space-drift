# SPACE DRIFT v2 — Tài liệu Game Engine

> Phiên bản: v2.1  
> Stack: Vanilla HTML5 + Canvas 2D + Web Audio API  
> File duy nhất: `space-drift-v2.html`  
> Mục tiêu: Web game mobile-first, tích hợp quảng cáo, mở rộng sang AR (Phase 2)

---

## 1. Tổng quan kiến trúc

```
┌─────────────────────────────────────────────┐
│                  HTML FILE                   │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │   CSS    │  │   DOM    │  │    JS     │  │
│  │ Screens  │  │ Overlays │  │  Engine   │  │
│  │ Controls │  │   HUD    │  │  Physics  │  │
│  │  Themes  │  │  Canvas  │  │  Audio    │  │
│  └──────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────┘
```

Toàn bộ game chạy trong **một file HTML duy nhất**, không có dependency ngoài trừ Google Fonts. Không dùng framework, không build step.

### Hai canvas song song

| Canvas | ID | Dùng cho |
|--------|----|----------|
| Game canvas | `#cv` | Render game (fixed, z-index 1) |
| Home canvas | `#home-cv` | Animation nền trang chủ (bên trong `#sh`) |

---

## 2. Hệ thống màn hình (Screen System)

### Danh sách màn hình

| ID | Tên | Kích hoạt bởi |
|----|-----|---------------|
| `#sh` | Home | Mặc định, `goHome()` |
| `#show` | How to Play | Nút "HOW TO PLAY" |
| `#so` | Game Over | `endGame()` |
| `#sad` | Interstitial Ad | Mỗi 3 game over |

### Overlays (không phải `.scr`, luôn nằm trên cùng)

| ID | Tên | Kích hoạt |
|----|-----|-----------|
| `#sa-ov` | Stage Clear Animation | Qua Stage Gate |
| `#sc-ov` | Stage Choice (Fly/Land) | Sau stage anim |
| `#rf-ov` | Refuel Screen | Chọn Land |

### Logic hiển thị

```javascript
// Ẩn/hiện tất cả màn hình
function showScr(id) {
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
  if (id) document.getElementById(id)?.classList.add('on');
  // Game UI (#ui) chỉ hiện khi đang chơi
  document.getElementById('ui').classList.toggle('show',
    !id || (id !== 'sh' && id !== 'show' && id !== 'so' && id !== 'sad')
  );
}
```

**Quy tắc quan trọng:** `#ui` (HUD + controls) mặc định `display:none`. Chỉ thêm class `.show` khi game đang chạy, tránh hiện lên trang Home.

---

## 3. Hệ thống Theme

### 4 theme có sẵn

| Key | Tên | Emoji | Phong cách |
|-----|-----|-------|-----------|
| `scifi` | SCI-FI | 🚀 | Neon cyan, tối tăm |
| `cartoon` | CARTOON | 🛸 | Màu sắc vui nhộn |
| `anime` | ANIME | ✨ | Pastel hồng tím |
| `neon` | NEON | 👾 | Xanh lá retro |

### Cấu trúc một theme object

```javascript
{
  nm: 'SCI-FI',          // Tên hiển thị
  e: '🚀',               // Emoji logo
  dot: '⚡',             // Emoji nút chọn theme
  sky0: '#020215',       // Màu trời trên
  sky1: '#06033a',       // Màu trời dưới
  sc: ['#ccddff',...],   // Màu sao (mảng, pick ngẫu nhiên khi build)
  sb: ['#1a6fa8',...],   // Ship body gradient [top, mid, bottom]
  sa: '#00cfff',         // Ship accent / side thruster color
  sw: '#7ecfff',         // Ship window color
  wc: '#0a3f6a',         // Wing color
  nz: '#1a2a3a',         // Nozzle color
  tc: ['#00cfff','#0050cc'], // Thrust colors [inner, outer]
  fb: 'linear-gradient(...)', // Fuel bar CSS gradient
  pc: '#00cfff',         // Platform/pad color
  wh: function(h){...},  // Wall hue function (nhận 0-1, trả về CSS color)
  ac: ['#334455',...],   // Asteroid colors
  gc: '#00cfff',         // Gem color
  bc: '#ffd700',         // Bonus/gold color
  fc: '#00ff88',         // Fuel canister color
  dc: '#ff3333',         // Danger/explosion color
  ha: '#00cfff',         // HUD accent color
  lg: ['#00cfff',...],   // Logo gradient colors
  bg: ['#00cfff','#0060cc'], // Button gradient
  ti: '⚡'               // Thrust icon
}
```

### Lưu theme

```javascript
localStorage.setItem('sd_theme', key); // persist qua sessions
```

### Helper màu an toàn

```javascript
// QUAN TRỌNG: phải định nghĩa TRƯỚC tất cả hàm khác
// Vì theme dùng cả hex (#fff) lẫn rgba() — không thể concat trực tiếp
function aC(col, alpha) {
  // Convert bất kỳ CSS color sang rgba(r,g,b,alpha)
  // Xử lý: #hex, #hhex, rgba(...), rgb(...)
}
```

---

## 4. Physics Engine

### Hệ tọa độ

```
World Y (wy):   0 = mặt đất, tăng dần lên trên (altitude)
Screen Y (sy):  0 = đỉnh màn hình, tăng dần xuống dưới

Chuyển đổi: sy = H - (wy - cam)
            cam = world Y của đáy màn hình
```

### Hằng số vật lý (CFG)

| Hằng số | Giá trị | Ý nghĩa |
|---------|---------|---------|
| `G` | 0.065 | Gia tốc trọng lực (px/tick²) |
| `THR` | 0.19 | Lực đẩy thrust mỗi tick |
| `TILT` | 2.8 | Tốc độ ngang tối đa (px/tick) |
| `FMAX` | 100 | Fuel tối đa |
| `FBURN` | 0.15 | Fuel tiêu thụ mỗi tick thrust |
| `FADD` | 38 | Fuel nhận khi lấy canister |
| `LV` | 1.7 | Tốc độ đáp tối đa (px/tick) |
| `GSPC` | 600 | Khoảng cách giữa các gate (world units) |
| `SR` | 17 | Ship radius (px) |

### Vật lý mỗi tick

```
1. Gravity:     vy -= G          (nếu gravOn)
2. Thrust:      vy += THR        (nếu bấm thrust + còn fuel)
3. Horizontal:  vx += (target - vx) * 0.09   (lerp smooth)
4. Move:        wy += vy, x += vx
5. Wall bounce: x clamp [SR, W-SR], vx *= -0.5
6. Lean angle:  angle lerp toward vx * 0.04
```

### Cơ chế khởi động

```
Tick 1-29:   firstThrust = true, gravOn = false (grace period 0.5s)
Tick 30+:    gravOn = true → gravity bắt đầu kéo xuống
```

Mục đích: Cho người chơi thấy tàu rõ trên bãi phóng trước khi bị kéo xuống.

### Camera

```javascript
// Camera theo tàu, smooth lerp
targetCam = ship.wy - H * 0.44   // tàu ở 44% từ dưới lên
cam += (targetCam - cam) * 0.09  // lerp coefficient
```

---

## 5. Hệ thống World Generation

### Gate layout (cố định, không random)

```
Mỗi stage gồm 3 gates, cách nhau 600 world units:

Stage 1:  Gate 1 (600m) → Gate 2 (1200m) → STAGE GATE (1800m)
Stage 2:  Gate 1 (2400m) → Gate 2 (3000m) → STAGE GATE (3600m)
...

Gate index % 3:
  0, 1 → Normal gate
  2    → Stage gate (kèm stage pad spawn 90u bên dưới)
```

### Object types

| Type | Mô tả | Sinh ra khi |
|------|-------|-------------|
| `ground` | Mặt đất tuyệt đối | Khởi tạo game |
| `launchpad` | Bãi phóng ban đầu | Khởi tạo game |
| `ast` | Thiên thạch | Mỗi chunk, nhiều hơn theo stage |
| `wall` | Tường có khe hở | Stage ≥ 2 |
| `fuel` | Bình nhiên liệu | Xác suất 52% mỗi chunk |
| `gem` | Đá quý (normal + bonus) | 0-2 mỗi chunk |
| `gate` | Cổng (normal/stage) | Theo gate index |
| `stagepad` | Bãi đáp sau stage gate | Kèm mỗi stage gate |

### Infinite generation

```javascript
// Sinh world khi tàu đến cách điểm cuối 700 units
if (ship.wy > lastGen - 700) genWorld(lastGen + 2000);
```

### Difficulty scaling theo stage

```javascript
// Asteroid nguy hiểm từ stage 3
danger = stgN >= 3 && Math.random() < 0.18 + stgN * 0.04

// Số asteroid mỗi chunk
na = round(random * (0.4 + stgN * 0.5))

// Wall gap thu hẹp theo stage
gapWidth = max(75, 108 - stg*5) + random*42

// Tường xuất hiện từ stage 2
if (stgN >= 2 && random < 0.28 + stgN * 0.02) addWall()
```

---

## 6. Collision Detection

Tất cả collision dùng **circle vs circle** hoặc **circle vs AABB**:

```javascript
// Ship vs Asteroid (circle-circle)
dist = hypot(ship.x - ast.x, ship.screenY - ast.screenY)
if (dist < ast.r + SR - 5) → crash or shield

// Ship vs Wall (AABB)
if (shipY < wallY + wallH + SR && shipY > wallY - SR)
  if (ship.x not in gap) → crash or shield

// Ship vs Fuel/Gem (circle-circle, generous radius)
if (dist < obj.r + SR + 4) → collect

// Ship vs Landing pad (AABB)
onX = ship.x within pad.x ± pad.w/2
onY = shipScreenY within pad range
if (onX && onY && vy <= 0)
  if (|vy| < LV && |vx| < 1.5) → safe land
  else → crash
```

### Shield mechanic

```javascript
// 1 shield hấp thụ 1 va chạm, destroy object, không crash
if (shields > 0) { shields--; obj.alive=0; boom(); }
else { doCrash(); }
```

---

## 7. Particle System

### Loại particle

```javascript
// Explosion particles
{ x, y, vx, vy, life:1, r, col }
// Text popup
{ type:'txt', x, y, vy:-1.3, life:1, text, col }
// Exhaust particles (separate array)
{ x, y, vx, vy, life:1, r, col }
```

### Update mỗi tick

```javascript
// Normal particles: gravity += 0.06, fade out
life -= 0.021
// Text particles: float up, fade faster
life -= 0.015
// Exhaust: fade fastest
life -= 0.054
```

---

## 8. Input System

### Mobile

| Input | Hành động |
|-------|-----------|
| Tap & hold `#thr` | Thrust lên |
| Tap `#btn-left` | Lái trái |
| Tap `#btn-right` | Lái phải |
| Gyroscope (gamma) | Lái trái/phải (±28° = ±1.0) |
| Tap canvas | Thrust lên |

### Desktop

| Input | Hành động |
|-------|-----------|
| Mouse X position | Lái ngang (mouseX 0..1 → tx -1..+1) |
| Click canvas | Thrust |
| Arrow keys / WASD | Điều khiển |
| Space | Thrust |

### Gyroscope (iOS)

```javascript
// iOS yêu cầu user gesture để request permission
DeviceOrientationEvent.requestPermission()
  .then(r => { if (r==='granted') listen(); })
// Android: tự động, không cần permission
```

---

## 9. Audio System (Web Audio API)

```javascript
// AudioContext khởi tạo lazy (sau user gesture đầu tiên)
function initAudio() { AC = new AudioContext(); }

// Các sound effect
sfx('gem')   // Gem collect: 880Hz → 1320Hz, 0.2s
sfx('fuel')  // Fuel pickup: 440Hz → 660Hz, 0.2s
sfx('boom')  // Crash: sawtooth 110Hz → 28Hz, 0.5s
sfx('gate')  // Normal gate: chord 523-659-784, arpeggio
sfx('stage') // Stage gate: chord 523-659-784-1047, arpeggio
sfx('land')  // Landing: 220Hz sine, 0.3s
```

---

## 10. Business Logic — Stage Flow

```
GAME START
    │
    ▼
[Bãi phóng] — Tàu ngồi yên, chờ người chơi bấm thrust
    │  (Hold THRUST → grace 0.5s → gravity ON)
    ▼
[Bay lên] ──────────────────────────────────────────┐
    │                                               │
    ├── Va thiên thạch → CRASH → Game Over          │
    ├── Hết fuel → rơi → CRASH → Game Over          │
    ├── Va tường → CRASH → Game Over                │
    ├── Lấy fuel canister → +38 fuel                │
    ├── Lấy gem → +60 điểm                          │
    ├── Lấy bonus gem → +500 điểm                   │
    │                                               │
    ▼                                               │
[GATE 1] → +popup, sfx → tiếp tục bay              │
    │                                               │
    ▼                                               │
[GATE 2] → +popup, sfx → tiếp tục bay              │
    │                                               │
    ▼                                               │
[STAGE GATE] → explosion, sfx, stage anim (1.6s)   │
    │                                               │
    ▼                                               │
[CHOICE OVERLAY]                                    │
    ├── "KEEP FLYING" → +200×stage điểm ───────────┘
    └── "LAND & REFUEL" → tàu hướng đến stage pad
            │
            ▼
        [Đáp xuống stage pad]
            │  (phải đáp nhẹ: |vy| < 1.7, |vx| < 1.5)
            ▼
        [REFUEL OVERLAY]
            │  fuel tăng từ X → 100% (60ms/unit)
            ▼
        [Bấm LAUNCH] → +500×stage điểm → bay tiếp
```

---

## 11. Hệ thống điểm

| Sự kiện | Điểm |
|---------|------|
| Altitude | `maxAlt × 1.5` (liên tục) |
| Gem thường | +60 |
| Bonus gem ⭐ | +500 |
| Landing pad (mid-game) | +600×stage + fuel×6 |
| Keep Flying (stage gate) | +200×stage |
| Refuel Launch | +500×stage |
| Score công thức | `max(altScore, altScore + gems×60)` |

---

## 12. Persistence (localStorage)

```javascript
// Key: 'sd2'
{
  best: number,    // Best score toàn thời gian
  games: number,   // Tổng số ván đã chơi
  stBest: number   // Stage cao nhất đạt được
}

// Key: 'sd_theme'
'scifi' | 'cartoon' | 'anime' | 'neon'
```

---

## 13. Ad Integration Slots

### Hiện tại (placeholder)

| Vị trí | Element | Loại | Khi nào hiện |
|--------|---------|------|-------------|
| Bottom game | `#adb` | Banner 320×50 | Luôn luôn khi chơi |
| Giữa game over | `#sad` | Interstitial 300×250 | Mỗi 3 game over |
| Revive button | `rbtn` | Rewarded Video | Người chơi chủ động |

### Tích hợp AdMob (thực tế)

```javascript
// Vị trí thay thế trong code:

// 1. Banner: thay div#adb bằng AdMob banner view
// 2. Interstitial: trong showInterstitial(), gọi admob.showInterstitial()
// 3. Rewarded: trong watchRevive(), gọi admob.showRewarded(onRewarded)
//    → callback onRewarded: set ship.alive=true, fuel=100, shields=3

// Frequency cap: gamesN % 3 === 0 → show interstitial
```

---

## 14. Render Pipeline

Mỗi frame (60fps target):

```
loop()
  │
  ├── update()           ← Physics + collision + HUD DOM update
  │
  └── draw()
        ├── clearRect()
        ├── drawSky()    ← Solid fill + gradient overlay
        ├── drawStars()  ← 110 parallax stars với twinkling
        ├── [objects]    ← ground, launchpad, stagepad, gate, ast, wall, fuel, gem
        │   (mỗi obj: ctx.save → try{drawObj} catch → ctx.restore)
        ├── [exhaust]    ← Radial gradient particles
        ├── drawShip()   ← Shield + side thrusters + exhaust + body
        ├── [parts]      ← Explosion + text popup particles
        └── vignette     ← Radial gradient overlay
```

### Anti-white-screen pattern

```javascript
// drawSky luôn fill solid trước, gradient sau
// → canvas không bao giờ trắng dù gradient fail
function drawSky(c) {
  c.fillStyle = T.sky0;     // solid fill first
  c.fillRect(0,0,W,H);
  try {
    const g = c.createLinearGradient(...); // gradient overlay
    c.fillStyle = g; c.fillRect(0,0,W,H);
  } catch(e) {}              // silent fail → solid color fallback
}
```

### Overlay draw loop

Khi game tạm dừng (stage anim, choice, refuel), canvas vẫn phải render:

```javascript
function startOverlayDraw() {
  function od() { draw(); overlayRaf = requestAnimationFrame(od); }
  od();
}
function stopOverlayDraw() { cancelAnimationFrame(overlayRaf); }
```

---

## 15. Cấu trúc State Object (G)

```javascript
G = {
  // Ship
  ship: {
    x, wy,              // Vị trí (world coords)
    vx, vy,             // Vận tốc
    angle,              // Góc nghiêng visual (radians)
    fuel,               // 0..100
    alive,              // bool
    gems,               // Số gem đã thu
    shields,            // 0..n (từ rewarded ad)
    ta,                 // Thrust animation intensity 0..1
    sideL, sideR,       // Side thruster animation 0..1
  },

  // World
  cam,                  // Camera world Y (bottom of screen)
  objs,                 // Array of world objects
  parts,                // Particle array
  exh,                  // Exhaust particle array

  // Scoring
  score,
  maxAlt,

  // Stage system
  stgN,                 // Stage hiện tại (1-based)
  gi,                   // Gate index toàn cục
  nextGateAlt,          // World Y của gate tiếp theo
  normGates,            // Normal gates passed in current stage

  // World gen
  lastGen,              // World Y cuối cùng đã gen
  tick,                 // Frame counter

  // Game state flags
  over,                 // Game over
  landed,               // Đáp thành công
  stgTrans,             // Đang hiện stage clear anim
  awaitChoice,          // Đang chờ fly/land choice
  refueling,            // Đang refuel
  landOnPad,            // Player đã chọn land, hướng đến pad

  // Launch mechanics
  firstThrust,          // Đã bấm thrust lần đầu chưa
  gravOn,               // Gravity có đang hoạt động không
  graceTick,            // Tick khi bấm thrust đầu tiên
  padWY,                // World Y của launch pad
}
```

---

## 16. Roadmap kỹ thuật

### Phase 1 — Web Game ✅ (hiện tại)

- Single HTML file, không dependency
- 4 themes, physics, infinite world gen
- Stage/gate system, refuel mechanic
- Web Audio sfx, Ad slots, localStorage stats

### Phase 2 — Mobile App

**Approach:** Wrap bằng **Capacitor.js** (không cần rewrite)

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Space Drift" "com.spacedrift.game"
npx cap add android
npx cap add ios
# Copy HTML → public/index.html
npx cap sync
```

Tích hợp thêm:
- `@capacitor-community/admob` → thay ad placeholders
- `@capacitor/haptics` → vibration khi crash
- `@capacitor/device` → detect platform, show/hide gyro button

### Phase 3 — AR Mode

**Tech:** WebXR Device API hoặc **AR.js**

```javascript
// WebXR approach
navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: ['hit-test']
}).then(session => {
  // Render ship overlay lên camera feed
  // World objects anchor vào không gian thật
});
```

Thay đổi engine cần:
- Render loop nhận `XRFrame` thay vì `requestAnimationFrame`
- World objects map vào AR anchors
- Background = camera feed thay vì canvas sky

### Phase 4 — Face Composite (Avatar)

**Tech:** MediaPipe Face Detection + Canvas composite

```javascript
// Chụp selfie → detect face → crop → paste vào ship window
const faceDetector = new FaceDetector();
const faces = await faceDetector.detect(videoFrame);
// Crop face region → scale → draw vào ctx tại ship window position
```

---

## 17. Known Issues & Gotchas

| Vấn đề | Nguyên nhân | Fix đã áp dụng |
|--------|-------------|----------------|
| Màn hình trắng | Canvas gradient với màu invalid khi `col + 'aa'` concat với rgba() | Dùng `aC()` helper cho tất cả alpha operations |
| Star flicker | `T.sc[Math.random()]` gọi mỗi frame | Mỗi star có `.col` fixed khi `buildStars()` |
| White screen sau stage | `loop()` dừng nhưng không có gì draw | `startOverlayDraw()` giữ canvas alive |
| Gyro bị block trong iframe | Browser security policy | Chỉ hoạt động trên HTTPS domain thật |
| iOS gyro cần permission | `DeviceOrientationEvent.requestPermission()` | Nút "Enable Tilt" trigger user gesture |

---

## 18. File Structure (trong 1 HTML file)

```
space-drift-v2.html
├── <style>
│   ├── Base reset
│   ├── #ui (game HUD, hidden by default)
│   ├── Screen styles (.scr, #sh, #so, #sad, #show)
│   ├── Overlay styles (#sc-ov, #rf-ov, #sa-ov)
│   └── Component styles (bars, controls, buttons)
│
├── <body>
│   ├── #cv (game canvas)
│   ├── #ui (HUD, bars, controls, ad banner)
│   ├── #toast
│   ├── #sa-ov (stage anim overlay)
│   ├── #sc-ov (stage choice overlay)
│   ├── #rf-ov (refuel overlay)
│   ├── #sh (home screen + #home-cv)
│   ├── #show (how to play)
│   ├── #so (game over)
│   └── #sad (interstitial ad)
│
└── <script>
    ├── aC()              ← MUST BE FIRST: color helper
    ├── TH{}              ← Theme definitions
    ├── Canvas setup
    ├── buildStars()
    ├── CFG, SR           ← Physics constants
    ├── State vars        ← G, gyroX, btnX, ...
    ├── w2s()             ← World to screen coord
    ├── Audio (sfx)
    ├── Input handlers
    ├── Screen management
    ├── Stats (localStorage)
    ├── Theme (applyTheme, buildThemeSel)
    ├── drawSky, drawStars
    ├── World gen (mkAst, mkFuel, ... genWorld)
    ├── startGame()
    ├── loop()
    ├── update()          ← Physics + collision
    ├── Stage flow (choiceFly, choiceLand, startRefuel, rfLaunch)
    ├── Particles (doCrash, spawnExh, boom, popTxt)
    ├── draw()            ← Render pipeline
    ├── drawObj()         ← Per-object renderer
    ├── drawShip()        ← Ship renderer
    ├── rr()              ← roundRect helper
    ├── doLanding()
    ├── endGame()
    ├── Ad functions
    ├── homeLoop()        ← Home screen animation
    └── INIT              ← buildThemeSel, applyTheme, loadStats, homeLoop
```
