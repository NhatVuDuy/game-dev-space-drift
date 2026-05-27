# Space Drift — Hướng dẫn Setup Analytics + Bảo vệ Code

> Tài liệu này dành cho agent/developer thực thi.  
> Game URL: `https://spacedrift.zenpax.io.vn/space-drift-v3.0.html`  
> File cần edit: `space-drift-v3.0.html`

---

## PHẦN 1 — GOOGLE ANALYTICS 4

### 1.1 Tạo GA4 Property (human làm tay)

```
1. Vào analytics.google.com → đăng nhập Google account
2. Admin (⚙️) → Create Property
3. Property name: "Space Drift"
4. Reporting timezone: Vietnam (UTC+7)
5. Currency: VND → Next
6. Business size: Small → Next
7. Create → chọn "Web"
8. Website URL: spacedrift.zenpax.io.vn
9. Stream name: "Space Drift Web" → Create stream
10. Copy Measurement ID dạng: G-XXXXXXXXXX
    → Lưu lại, dùng ở bước 1.2
```

### 1.2 Thêm GA4 vào HTML

Mở `space-drift-v3.0.html`. Tìm thẻ `<head>` và thêm đoạn sau vào **ngay sau `<head>`**, thay `G-XXXXXXXXXX` bằng ID thật:

```html
<!-- ═══ GOOGLE ANALYTICS 4 ═══ -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    page_title: 'Space Drift',
    page_location: window.location.href,
    send_page_view: true
  });
  // Global tracking helper — gọi ở bất cứ đâu trong game
  window._track = function(event, params) {
    try { gtag('event', event, params || {}); } catch(e) {}
  };
</script>
<!-- ═══ END GA4 ═══ -->
```

### 1.3 Thêm event tracking vào game engine

Trong file `space-drift-v3.0.html`, tìm từng hàm dưới đây và thêm dòng `_track(...)` vào **dòng đầu tiên** của mỗi hàm:

**Hàm `startGame()`:**

```javascript
function startGame() {
  _track('game_start', {
    theme: AK,
    session_games: gamesN + 1
  });
  // ... phần code cũ giữ nguyên bên dưới
```

**Hàm `endGame(landed)`:**

```javascript
function endGame(landed) {
  _track('game_over', {
    result: landed ? 'landed' : 'crashed',
    score: G.score,
    stage: G.stgN,
    max_alt: G.maxAlt,
    gems: G.ship.gems,
    seconds: Math.round(G.tick / 60),
    theme: AK
  });
  // ... phần code cũ giữ nguyên bên dưới
```

**Hàm `choiceFly()`:**

```javascript
function choiceFly() {
  _track('stage_choice', { choice: 'fly', stage: G.stgN });
  // ... phần code cũ giữ nguyên bên dưới
```

**Hàm `choiceLand()`:**

```javascript
function choiceLand() {
  _track('stage_choice', { choice: 'land', stage: G.stgN });
  // ... phần code cũ giữ nguyên bên dưới
```

**Hàm `rfLaunch()`:**

```javascript
function rfLaunch() {
  _track('refuel_launch', { stage: G.stgN, fuel: G.ship.fuel });
  // ... phần code cũ giữ nguyên bên dưới
```

**Hàm `watchRevive()`:**

```javascript
function watchRevive() {
  _track('rewarded_ad_click', { stage: G.stgN, score: G.score });
  // ... phần code cũ giữ nguyên bên dưới
```

**Trong `update()` — chỗ xử lý gate (tìm `o.t==='gate'` và `o.passed=true`):**

```javascript
// Ngay sau dòng: o.passed = true;
_track('gate_passed', {
  gate_type: o.isStage ? 'stage' : 'normal',
  stage: G.stgN,
  gate_num: o.gNum,
  altitude: G.maxAlt,
  fuel_remaining: Math.round(G.ship.fuel)
});
```

**Hàm `doGyro()`:**

```javascript
function doGyro() {
  _track('gyro_enabled');
  // ... phần code cũ giữ nguyên bên dưới
```

### 1.4 Verify Analytics hoạt động

```
1. Deploy file đã sửa lên server
2. Mở https://spacedrift.zenpax.io.vn/space-drift-v3.0.html
3. Mở tab mới: analytics.google.com
4. Reports → Realtime
5. Chơi 1 ván game
6. Kiểm tra: phải thấy "1 active user" và events xuất hiện
7. Nếu không thấy sau 30 giây → kiểm tra lại Measurement ID
```

---

## PHẦN 2 — BẢO VỆ CODE

### 2.1 Tách JavaScript ra file riêng

**Bước 1:** Mở `space-drift-v3.0.html`, tìm khối:

```html
<script>
  // ... toàn bộ game code ...
</script>
```

**Bước 2:** Cut toàn bộ nội dung bên trong thẻ `<script>` (không bao gồm thẻ script), paste vào file mới tên `game.js` — cùng thư mục với HTML.

**Bước 3:** Thay khối script cũ trong HTML bằng:

```html
<script src="game.js?v=3.0"></script>
```

> Tham số `?v=3.0` là cache-busting — tăng version mỗi khi deploy để browser không dùng cache cũ.

**Bước 4:** Test lại game chạy bình thường trước khi sang bước tiếp.

---

### 2.2 Cài và chạy JavaScript Obfuscator

**Yêu cầu:** Node.js đã cài (kiểm tra: `node -v`)

```bash
# Cài javascript-obfuscator globally
npm install -g javascript-obfuscator

# Chạy obfuscate — tạo ra game.min.js
javascript-obfuscator game.js \
  --output game.min.js \
  --compact true \
  --string-array true \
  --string-array-encoding rc4 \
  --string-array-threshold 0.75 \
  --identifier-names-generator mangled \
  --rename-globals false \
  --dead-code-injection true \
  --dead-code-injection-threshold 0.15 \
  --self-defending true \
  --disable-console-output false

# Kiểm tra output file tồn tại
ls -la game.min.js
```

**Cập nhật HTML để dùng file đã obfuscate:**

```html
<!-- Thay: -->
<script src="game.js?v=3.0"></script>
<!-- Thành: -->
<script src="game.min.js?v=3.0"></script>
```

> **Quy trình deploy sau này:**
>
> 1. Edit `game.js` (file gốc, readable)
> 2. Chạy lại lệnh obfuscator → ghi đè `game.min.js`
> 3. Upload `game.min.js` lên server
> 4. Không upload `game.js` gốc lên server

---

### 2.3 Thêm lớp bảo vệ runtime

Thêm đoạn code dưới đây vào **đầu tiên** trong `game.js`, trước tất cả code khác:

```javascript
// ═══════════════════════════════════════════════
//  SPACE DRIFT — RUNTIME PROTECTION v1.0
//  zenpax.io.vn — All rights reserved
// ═══════════════════════════════════════════════
;(function _protect() {
  'use strict';

  // ── 1. DOMAIN WHITELIST ──────────────────────
  var ALLOWED = [
    'spacedrift.zenpax.io.vn',
    'zenpax.io.vn',
    'localhost',
    '127.0.0.1'
  ];
  var host = window.location.hostname;
  var allowed = ALLOWED.some(function(h) {
    return host === h || host.endsWith('.' + h);
  });
  if (!allowed) {
    // Xóa nội dung và redirect về domain thật
    try { document.documentElement.innerHTML = '<title>Space Drift</title>'; } catch(e) {}
    setTimeout(function() {
      window.location.replace('https://spacedrift.zenpax.io.vn');
    }, 100);
    throw new Error('Unauthorized');
  }

  // ── 2. DISABLE RIGHT-CLICK ───────────────────
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });

  // ── 3. DISABLE KEYBOARD SHORTCUTS ───────────
  document.addEventListener('keydown', function(e) {
    // Ctrl+U (source), Ctrl+S (save), Ctrl+Shift+I/J/C (devtools)
    var blocked = (e.ctrlKey || e.metaKey) &&
      ['u','s','i','j','c'].indexOf(e.key.toLowerCase()) !== -1;
    // F12
    if (e.key === 'F12' || blocked) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // ── 4. INTEGRITY WATERMARK ───────────────────
  // Dùng để chứng minh ownership nếu cần
  Object.defineProperty(window, '_gameInfo', {
    value: Object.freeze({
      title: 'Space Drift',
      version: '3.0',
      owner: 'zenpax.io.vn',
      built: '2025'
    }),
    writable: false,
    configurable: false
  });

  // ── 5. CONSOLE WARNING ───────────────────────
  var _warned = false;
  var _consoleWarn = function() {
    if (!_warned) {
      _warned = true;
      console.log(
        '%c⚠ Space Drift',
        'font-size:24px;color:#ff4444;font-weight:bold'
      );
      console.log(
        '%cThis game is protected. Unauthorized copying is prohibited.\nzenpax.io.vn',
        'font-size:13px;color:#aaa'
      );
    }
  };
  var _origLog = console.log;
  console.log = function() {
    _consoleWarn();
    return _origLog.apply(console, arguments);
  };

})();
// ═══════════════════════════════════════════════
//  END PROTECTION
// ═══════════════════════════════════════════════

// ... phần code game bên dưới giữ nguyên ...
```

---

### 2.4 Setup Firebase Leaderboard (bảo vệ bằng community)

Leaderboard server-side là thứ game clone **không thể sao chép** — đây là moat quan trọng nhất.

#### 2.4.1 Tạo Firebase Project (human làm tay)

```
1. Vào console.firebase.google.com
2. "Add project" → name: "space-drift-game"
3. Disable Google Analytics (đã có GA4 riêng)
4. Create project
5. Build → Firestore Database → Create database
6. Start in test mode → Next → chọn region: asia-southeast1
7. Done
8. Project Settings (⚙️) → General → Your apps → Web (</>)
9. App nickname: "Space Drift Web" → Register app
10. Copy toàn bộ firebaseConfig object → lưu lại
```

**Set Firestore Security Rules** (Project → Firestore → Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{doc} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['name','score','stage','ts'])
                   && request.resource.data.score is int
                   && request.resource.data.score >= 0
                   && request.resource.data.score <= 9999999
                   && request.resource.data.name is string
                   && request.resource.data.name.size() <= 20;
      allow update, delete: if false;
    }
  }
}
```

#### 2.4.2 Thêm Firebase vào HTML

Thêm vào `<head>`, sau phần GA4:

```html
<!-- ═══ FIREBASE ═══ -->
<script type="module">
  import { initializeApp }
    from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
  import { getFirestore, collection, addDoc,
           query, orderBy, limit, getDocs, where }
    from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

  // Thay bằng config thật từ bước 2.4.1
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "space-drift-game.firebaseapp.com",
    projectId: "space-drift-game",
    storageBucket: "space-drift-game.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  // Expose ra global để game.js dùng
  window._db = db;
  window._fbCol = collection;
  window._fbAdd = addDoc;
  window._fbQuery = query;
  window._fbOrder = orderBy;
  window._fbLimit = limit;
  window._fbGet = getDocs;
  window._fbWhere = where;
  window._firebaseReady = true;
</script>
<!-- ═══ END FIREBASE ═══ -->
```

#### 2.4.3 Thêm leaderboard functions vào game.js

Thêm các hàm này vào `game.js`, trước hàm `endGame()`:

```javascript
// ── LEADERBOARD ──────────────────────────────

function getPlayerName() {
  var saved = localStorage.getItem('sd_player_name');
  if (saved) return saved;
  var name = (prompt('🏆 Nhập tên để lưu vào bảng xếp hạng:') || '').trim();
  if (!name) name = 'Anonymous';
  name = name.replace(/[<>\"\']/g,'').substring(0, 20);
  localStorage.setItem('sd_player_name', name);
  return name;
}

async function saveScore(score, stage, gems) {
  if (!window._firebaseReady || score <= 0) return;
  try {
    var name = getPlayerName();
    await window._fbAdd(
      window._fbCol(window._db, 'scores'),
      {
        name: name,
        score: Math.round(score),
        stage: stage,
        gems: gems,
        ts: Date.now(),
        theme: AK,
        version: '3.0'
      }
    );
    _track('score_saved', { score: Math.round(score), stage: stage });
  } catch(e) {
    console.warn('Score save failed:', e.message);
  }
}

async function loadLeaderboard() {
  if (!window._firebaseReady) return [];
  try {
    var q = window._fbQuery(
      window._fbCol(window._db, 'scores'),
      window._fbOrder('score', 'desc'),
      window._fbLimit(10)
    );
    var snap = await window._fbGet(q);
    return snap.docs.map(function(d) { return d.data(); });
  } catch(e) {
    return [];
  }
}

async function renderLeaderboard() {
  var el = document.getElementById('lb-list');
  if (!el) return;
  el.innerHTML = '<div style="color:rgba(255,255,255,.4);font-size:11px;padding:8px 0">Loading...</div>';
  var scores = await loadLeaderboard();
  if (!scores.length) {
    el.innerHTML = '<div style="color:rgba(255,255,255,.4);font-size:11px;padding:8px 0">No scores yet</div>';
    return;
  }
  var medals = ['🥇','🥈','🥉'];
  el.innerHTML = scores.map(function(s, i) {
    return '<div style="display:flex;align-items:center;gap:8px;'
      + 'padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06)">'
      + '<span style="width:22px;text-align:center">' + (medals[i] || (i+1)) + '</span>'
      + '<span style="flex:1;font-family:\'Exo 2\',sans-serif;font-size:13px">' + s.name + '</span>'
      + '<span style="font-family:\'Orbitron\',monospace;font-size:12px;color:#ffd700">'
      + s.score.toLocaleString() + '</span>'
      + '<span style="font-size:10px;color:rgba(255,255,255,.35);margin-left:6px">S' + s.stage + '</span>'
      + '</div>';
  }).join('');
}
```

#### 2.4.4 Gọi saveScore trong endGame()

Tìm hàm `endGame(landed)` trong `game.js`, thêm vào đầu hàm:

```javascript
async function endGame(landed) {
  await saveScore(G.score, G.stgN, G.ship.gems);
  renderLeaderboard();

  // ... phần code cũ giữ nguyên bên dưới ...
```

#### 2.4.5 Thêm Leaderboard UI vào màn Game Over

Trong `space-drift-v3.0.html`, tìm div màn game over (id="so"), thêm section leaderboard sau `.gorow`:

```html
<div style="
  width:100%;max-width:280px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.1);
  border-radius:14px;
  padding:12px 16px;
  margin-bottom:12px;
">
  <div style="
    font-family:'Orbitron',monospace;
    font-size:11px;letter-spacing:3px;
    color:rgba(255,255,255,.45);
    margin-bottom:10px;
    text-align:center;
  ">🏆 TOP 10</div>
  <div id="lb-list"></div>
</div>
```

---

## PHẦN 3 — CHECKLIST DEPLOY

Sau khi hoàn thành tất cả, kiểm tra theo thứ tự:

```
□ 3.1  GA4 Measurement ID đã thay đúng (không còn G-XXXXXXXXXX)
□ 3.2  Firebase config đã thay đúng (không còn YOUR_API_KEY)
□ 3.3  Firestore Security Rules đã set (không phải test mode mãi mãi)
□ 3.4  game.js đã tách ra file riêng
□ 3.5  game.min.js đã được tạo bằng obfuscator
□ 3.6  HTML trỏ đến game.min.js (không phải game.js)
□ 3.7  game.js gốc KHÔNG upload lên server (chỉ giữ local)
□ 3.8  Domain lock có đúng domain: spacedrift.zenpax.io.vn
□ 3.9  Test game chạy bình thường sau tất cả thay đổi
□ 3.10 Test GA4 Realtime thấy event khi chơi
□ 3.11 Test save score → vào Firestore console thấy document
□ 3.12 Test leaderboard hiển thị đúng trong màn game over
□ 3.13 Test right-click bị block
□ 3.14 Test F12 bị block
□ 3.15 Test từ domain khác → redirect về đúng domain
```

---

## PHẦN 4 — QUY TRÌNH DEPLOY LÂU DÀI

Mỗi lần update game, làm theo thứ tự:

```bash
# 1. Edit game.js (file gốc, readable)
#    Thêm tính năng, fix bug, etc.

# 2. Test local trước
#    Mở index.html bằng localhost hoặc Live Server extension

# 3. Obfuscate
javascript-obfuscator game.js \
  --output game.min.js \
  --compact true \
  --string-array true \
  --string-array-encoding rc4 \
  --string-array-threshold 0.75 \
  --self-defending true

# 4. Tăng version trong HTML (cache busting)
#    Thay: game.min.js?v=3.0
#    Thành: game.min.js?v=3.1

# 5. Upload lên server
#    - space-drift-v3.0.html  (đã update version)
#    - game.min.js             (file obfuscated)
#    KHÔNG upload: game.js    (giữ local)

# 6. Verify trên production
#    - Game chạy bình thường
#    - GA4 Realtime thấy event
#    - Leaderboard load được
```

---

## PHẦN 5 — CẤU TRÚC FILE SAU KHI HOÀN THÀNH

```
Server (public):
├── space-drift-v3.0.html    ← HTML + GA4 + Firebase scripts
├── game.min.js              ← JS đã obfuscate (upload cái này)
├── manifest.json            ← PWA manifest (optional)
├── icon-192.png             ← PWA icon (optional)
└── icon-512.png             ← PWA icon (optional)

Local only (KHÔNG upload):
└── game.js                  ← Source JS gốc, readable, có comment
```

---

## GHI CHÚ QUAN TRỌNG CHO AGENT

1. **Thứ tự thực hiện:** Phần 1 (Analytics) → Phần 2.1–2.3 (tách file + obfuscate) → Phần 2.4 (Firebase) → Deploy → Phần 3 (checklist)
2. **Không obfuscate và deploy nếu game chưa test:** Obfuscated code rất khó debug. Luôn test với `game.js` gốc trước.
3. **Firebase API key có thể public:** Firebase API key trong HTML là bình thường, được bảo vệ bởi Security Rules và domain restrictions trong Firebase console (Authentication → Settings → Authorized domains).
4. **Cache busting quan trọng:** Luôn tăng version `?v=X.X` khi deploy để người chơi không bị cache version cũ.
5. **Backup:** Luôn giữ bản backup `game.js` gốc ở local trước khi thay đổi lớn.
