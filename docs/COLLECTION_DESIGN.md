# Collection System — Design Document

> Status: **Design / Pre-implementation**
> Last updated: build 43

---

## 1. Concept

Người chơi thu thập **items theo chủ đề** (theme) trong mỗi run. Items rớt ngẫu nhiên dựa trên hiệu suất chơi. Mục tiêu dài hạn: hoàn thành bộ sưu tập (collection) của chủ đề yêu thích.

Cơ chế tâm lý học nền tảng:
- **Zeigarnik effect** — não người ghét bộ sưu tập còn thiếu → "chơi thêm 1 run"
- **Variable ratio reinforcement** — drop ngẫu nhiên gây nghiện hơn reward cố định
- **Personalization** — người chọn theme yêu thích sẽ đầu tư cảm xúc vào collection

---

## 2. Theme Structure

### 2.1 Nguyên tắc chọn theme

| Loại | Ví dụ | IP risk | Khuyến nghị |
|------|-------|---------|-------------|
| IP-safe | Khủng long, Động vật, Hoa, Vũ trụ, Ẩm thực, Kiến trúc thế giới | Không | **Làm trước** |
| Licensed | Pokemon, Doraemon, Marvel | Cao | Sau khi có traction, đàm phán |
| Người thật | Nữ diễn viên nổi tiếng | Rất cao | Tránh trừ khi có thỏa thuận rõ ràng |

### 2.2 Danh sách theme đề xuất (phase 1)

```
space       — 20 items: hành tinh, thiên thể, tàu vũ trụ, phi hành gia
animals     — 20 items: động vật hoang dã
dinosaurs   — 20 items: các loài khủng long
flowers     — 20 items: hoa từ nhiều quốc gia
deep_sea    — 20 items: sinh vật biển sâu
```

Mỗi theme ra mắt với **20 items** trước, expand lên 50 sau khi validate.

### 2.3 Cấu trúc một item

```javascript
{
  id: 'space_001',
  themeId: 'space',
  name: 'Saturn',
  rarity: 'common',     // common | rare | epic | legendary
  dropWeight: 1.0,      // multiplier lên base drop rate
  art: 'space/001.svg', // path trong assets/collection/
  description: 'Lord of the rings'
}
```

### 2.4 Rarity distribution (per theme, 20 items)

| Rarity | Số lượng | Drop weight | Effective drop % |
|--------|----------|-------------|-----------------|
| Common | 10 | 1.0 | ~2.5% |
| Rare | 6 | 0.5 | ~1.25% |
| Epic | 3 | 0.25 | ~0.6% |
| Legendary | 1 | 0.1 | ~0.25% |

> Base roll: 2% chance mỗi roll ra BẤT KỲ item nào → rarity quyết định xác suất trong pool.

---

## 3. Drop System

### 3.1 Roll mechanics

Mỗi run kết thúc (chết hoặc về đích), game tính số **rolls** kiếm được:

```
rolls = 1 (base, mọi người)
      + 1 nếu stage_reached >= 3
      + 1 nếu gems_collected >= 15 trong run đó
      + 1 nếu max_altitude >= 2000m
      + 2 nếu không dùng continue trong run (no-continue bonus)

→ Casual:  ~1–2 rolls/run
→ Skilled: ~4–5 rolls/run
```

Mỗi roll: **2% chance** ra item (random từ pool của active theme).
Rolls không dùng hết được **tích lũy** sang run tiếp (pendingRolls).

### 3.2 Pity system

Tránh frustration khi chơi lâu mà không ra item mới:

```
pityCounter tăng +1 mỗi roll không ra item mới.
Khi pityCounter >= 40: roll tiếp theo GUARANTEED ra item chưa có.
pityCounter reset về 0 sau mỗi lần ra item mới.
```

### 3.3 Duplicate handling

Khi roll ra item đã có:
- Item được đánh dấu "duplicate"
- Tích lũy **5 duplicates** → đổi được 1 item tự chọn (trong pool chưa có)
- Duplicate count hiển thị trong collection screen

### 3.4 Drop notification

Sau mỗi run, nếu có pending rolls → hiện **Drop Screen** trước màn hình game over:
- Animation "mở hộp" đơn giản (flip card hoặc glow reveal)
- Hiện item nhận được với tên + rarity
- Nếu không ra item: "Không có gì lần này... (X/40 pity)"
- Button: "XEM BỘ SƯU TẬP" | "CHƠI TIẾP"

---

## 4. localStorage Schema

```javascript
// Key: 'sd_collection'
{
  version: 1,
  activeTheme: 'space',
  pendingRolls: 2,
  themes: {
    space: {
      owned: ['space_001', 'space_005', 'space_012'],
      duplicates: { 'space_001': 2 },
      pityCnt: 18,
      exchangeTokens: 0
    },
    animals: {
      owned: [],
      duplicates: {},
      pityCnt: 0,
      exchangeTokens: 0
    }
  }
}

// Key: 'sd_run_stats' (temporary, per-run)
{
  stageReached: 4,
  gemsCollected: 23,
  maxAltitude: 2840,
  usedContinue: false
}
```

---

## 5. Collection Screen UI

### 5.1 Album view

```
┌─────────────────────────────────────────┐
│  🌌 SPACE COLLECTION    12 / 20  60%   │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                         │
│  [🪐] [⭐] [🚀] [👨‍🚀] [💫]  ←── owned  │
│  [░░] [░░] [░░] [░░] [░░]  ←── locked  │
│  [░░] [░░] [░░] [░░] [░░]              │
│  [░░] [░░] [░░] [░░] [░░]              │
│                                         │
│  🔄 ĐỔIVÀ (3 duplicates → 0 tokens)    │
│  [ĐỔI THEME]              [CHƠI TIẾP]  │
└─────────────────────────────────────────┘
```

- Item có: hiện art + màu rarity glow
- Item chưa có: silhouette tối với dấu "?"
- Tap vào item có → xem tên, description, rarity
- Progress bar + phần trăm hoàn thành

### 5.2 Theme selector

Cho phép đổi active theme bất kỳ lúc nào từ home screen.
Collection của theme cũ KHÔNG mất — lưu riêng trong localStorage.

---

## 6. Roadmap

### Phase 1 — Validate concept (MVP)
- [ ] 1 theme "Space" với 20 items (emoji/SVG placeholder art)
- [ ] Drop system + pity system
- [ ] Drop notification screen (simple)
- [ ] localStorage schema
- [ ] Collection album view (basic)

### Phase 2 — Expand
- [ ] 4 thêm themes (animals, dinosaurs, flowers, deep_sea)
- [ ] Proper illustrated art (thuê illustrator)
- [ ] Duplicate exchange system
- [ ] Drop animation (flip card effect)

### Phase 3 — Social & Growth
- [ ] Share collection card (Canvas → image export)
- [ ] Daily challenge tích hợp với drop bonus
- [ ] Possible licensed themes nếu có traction

---

## 7. Metrics cần theo dõi sau launch

- **D1/D7/D30 retention** (mục tiêu: D7 > 20%)
- **Avg rolls per session**
- **Collection completion rate** (% user đạt 50%)
- **Theme preference distribution**
- **Pity trigger rate** (nếu > 40% sessions → drop rate quá thấp)
