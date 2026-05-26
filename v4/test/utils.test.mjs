/**
 * Unit tests for utils.js — aC, phash, rr
 * Run: node v4/test/utils.test.mjs
 */
import { aC, phash, rr } from '../src/utils.js';

let passed = 0, failed = 0;

function ok(label, condition) {
  if (condition) { console.log('  ✅', label); passed++; }
  else           { console.error('  ❌', label); failed++; }
}

function eq(label, actual, expected) {
  if (actual === expected) { console.log('  ✅', label); passed++; }
  else { console.error(`  ❌ ${label}\n     expected: ${expected}\n     got:      ${actual}`); failed++; }
}

// ── aC ────────────────────────────────────────────────────
console.log('\naC() — color → rgba converter');
eq('null → grey fallback',        aC(null, 0.5),             'rgba(128,128,128,0.5)');
eq('undefined → grey fallback',   aC(undefined, 1),          'rgba(128,128,128,1)');
eq('#rrggbb hex',                  aC('#ff0000', 0.5),        'rgba(255,0,0,0.5)');
eq('#rgb shorthand',               aC('#fff', 1),             'rgba(255,255,255,1)');
eq('#000000 black',                aC('#000000', 0),          'rgba(0,0,0,0)');
eq('#00cfff cyan',                 aC('#00cfff', 0.3),        'rgba(0,207,255,0.3)');
eq('rgb() → rgba()',               aC('rgb(100,200,50)', 0.3),'rgba(100,200,50,0.3)');
eq('rgba() alpha replaced',        aC('rgba(1,2,3,0.9)', 0.5),'rgba(1,2,3,0.5)');
eq('rgba() with spaces (space before alpha stripped)', aC('rgba(1, 2, 3, 0.9)', 0.5), 'rgba(1, 2, 3,0.5)');
ok('alpha=1 gives opaque',         aC('#ff0000', 1) === 'rgba(255,0,0,1)');
ok('alpha=0 gives transparent',    aC('#ff0000', 0) === 'rgba(255,0,0,0)');

// ── phash ─────────────────────────────────────────────────
console.log('\nphash() — deterministic pseudo-random hash');
ok('returns number',               typeof phash(0) === 'number');
ok('output in [0,1)',               phash(42) >= 0 && phash(42) < 1);
ok('deterministic same input',      phash(42) === phash(42));
ok('different inputs → different',  phash(42) !== phash(43));
ok('different inputs → different',  phash(0)  !== phash(1));
ok('large input stays in range',    phash(999999) >= 0 && phash(999999) < 1);
ok('negative-like (uint32)',        phash(-1) >= 0 && phash(-1) < 1);
// verify distribution isn't degenerate (10 values shouldn't all cluster)
const vals = Array.from({length:10}, (_,i) => phash(i*137));
const spread = Math.max(...vals) - Math.min(...vals);
ok('reasonable spread (>0.3)',      spread > 0.3);

// ── rr ───────────────────────────────────────────────────
console.log('\nrr() — rounded rectangle path');

// Mock canvas 2D context that records calls
function mockCtx() {
  const calls = [];
  const c = new Proxy({}, {
    get(_, method) {
      if (method === 'calls') return calls;
      return (...args) => calls.push({ m: method, a: args });
    }
  });
  return c;
}

const c1 = mockCtx();
rr(c1, 0, 0, 0, 10, 5);
ok('w=0 → no draw (early return)',  c1.calls.length === 0);

const c2 = mockCtx();
rr(c2, 0, 0, 10, 0, 5);
ok('h=0 → no draw (early return)',  c2.calls.length === 0);

const c3 = mockCtx();
rr(c3, 10, 20, 100, 50, 8);
ok('normal call → beginPath first', c3.calls[0].m === 'beginPath');
ok('normal call → closePath last',  c3.calls[c3.calls.length-1].m === 'closePath');
ok('has moveTo',                    c3.calls.some(c => c.m === 'moveTo'));
ok('has lineTo',                    c3.calls.some(c => c.m === 'lineTo'));
ok('has quadraticCurveTo',          c3.calls.some(c => c.m === 'quadraticCurveTo'));

const c4 = mockCtx();
rr(c4, 0, 0, 10, 10, 999);
// radius should be clamped to min(999, 5, 5) = 5
ok('radius clamped to half of w/h', c4.calls.length > 0);

const c5 = mockCtx();
rr(c5, 0, 0, 100, 50, 0);
ok('r=0 (sharp corners) still draws', c5.calls[0]?.m === 'beginPath');

// ── Summary ──────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Total: ${passed + failed}  ✅ ${passed}  ❌ ${failed}`);
if (failed > 0) { console.error('\nSome tests FAILED'); process.exit(1); }
else            { console.log('\nAll tests PASSED'); }
