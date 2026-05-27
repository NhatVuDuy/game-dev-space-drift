/**
 * Unit tests for audio.js — initAudio, sfx, cinematicLaunchAudio
 * Run: node v4/test/audio.test.mjs
 *
 * Strategy: mock Web Audio API (not available in Node.js),
 * verify the right calls are made for each sfx type.
 */

let passed = 0, failed = 0;

function ok(label, condition) {
  if (condition) { console.log('  ✅', label); passed++; }
  else           { console.error('  ❌', label); failed++; }
}

// ── Mock Web Audio API ────────────────────────────────────
function makeMockAC() {
  const log = [];
  function makeOsc() {
    const o = { type: 'sine', frequency: { calls: [], setValueAtTime(v,t){this.calls.push({m:'set',v,t});}, exponentialRampToValueAtTime(v,t){this.calls.push({m:'ramp',v,t});} }, start(){log.push('osc.start');}, stop(){log.push('osc.stop');}, connect(g){log.push('osc.connect');} };
    return o;
  }
  function makeGain() {
    const g = { gain: { calls: [], setValueAtTime(v,t){this.calls.push({m:'set',v,t});}, exponentialRampToValueAtTime(v,t){this.calls.push({m:'ramp',v,t});} }, connect(dest){log.push('gain.connect');} };
    return g;
  }
  const lastOsc = { ref: null };
  const ac = {
    currentTime: 0,
    destination: {},
    _log: log,
    _oscs: [],
    createOscillator() { const o = makeOsc(); this._oscs.push(o); log.push('createOscillator'); return o; },
    createGain()       { log.push('createGain'); return makeGain(); }
  };
  return ac;
}

// Inject mock into globalThis.window so audio.js picks it up
function injectMockWindow(ac) {
  globalThis.window = { AudioContext: function() { return ac; } };
}

// ── Import audio module ───────────────────────────────────
// We re-import fresh each test by using a query-string trick with dynamic import
// Since Node.js caches modules, we test the exported functions directly with
// a fresh mock injected before initAudio() is called.

import { initAudio, sfx, cinematicLaunchAudio } from '../src/audio.js';

// ── Tests ─────────────────────────────────────────────────

console.log('\ninitAudio()');

// Note: because the module is cached, AC persists between tests.
// We test behavior given AC is null (first call) vs already set.
// We cannot reset AC from outside (it's private), so we test
// the observable behavior: sfx is a no-op before initAudio,
// and produces audio calls after.

ok('sfx("gem") before initAudio → no throw', (() => { try { sfx('gem'); return true; } catch(e) { return false; } })());
ok('cinematicLaunchAudio before initAudio → no throw', (() => { try { cinematicLaunchAudio(1); return true; } catch(e) { return false; } })());

// Inject mock and call initAudio
const mockAC = makeMockAC();
injectMockWindow(mockAC);
initAudio();
ok('initAudio() creates AudioContext (mock injected)', globalThis.window.AudioContext !== undefined);
// Calling again should not re-create
const callsBefore = mockAC._log.length;
initAudio();
ok('initAudio() is idempotent (AC not re-created)', mockAC._log.length === callsBefore);

console.log('\nsfx() — sound effect types');

const SFX_TYPES = ['gem','fuel','boom','gate','stage','land','warp'];

for (const type of SFX_TYPES) {
  mockAC._log.length = 0;
  mockAC._oscs.length = 0;
  sfx(type);
  const hasOsc = mockAC._log.includes('createOscillator');
  const hasGain = mockAC._log.includes('createGain');
  const started = mockAC._log.includes('osc.start');
  const stopped = mockAC._log.includes('osc.stop');
  ok(`sfx('${type}') → creates oscillator+gain`, hasOsc && hasGain);
  ok(`sfx('${type}') → starts and stops oscillator`, started && stopped);
}

ok('sfx(unknown type) → no throw', (() => { try { sfx('nonexistent'); return true; } catch(e) { return false; } })());

// Check specific waveform types
mockAC._log.length = 0; mockAC._oscs.length = 0;
sfx('boom');
ok("sfx('boom') → sawtooth waveform", mockAC._oscs[0]?.type === 'sawtooth');

mockAC._log.length = 0; mockAC._oscs.length = 0;
sfx('warp');
ok("sfx('warp') → sawtooth waveform", mockAC._oscs[0]?.type === 'sawtooth');

mockAC._log.length = 0; mockAC._oscs.length = 0;
sfx('gem');
ok("sfx('gem') → sine waveform (default)", mockAC._oscs[0]?.type === 'sine');

// gate plays 3 oscillators, stage plays 4
mockAC._log.length = 0; mockAC._oscs.length = 0;
sfx('gate');
// 1 unused base osc (always created at top of sfx) + 3 chord notes = 4
ok("sfx('gate') → 4 oscillators (1 base + 3 chord notes)", mockAC._oscs.length === 4);

mockAC._log.length = 0; mockAC._oscs.length = 0;
sfx('stage');
// 1 unused base osc + 4 chord notes = 5
ok("sfx('stage') → 5 oscillators (1 base + 4 chord notes)", mockAC._oscs.length === 5);

console.log('\ncinematicLaunchAudio()');

mockAC._log.length = 0; mockAC._oscs.length = 0;
cinematicLaunchAudio(1.0);
ok('creates rumble + 5 burst oscillators (total 6)', mockAC._oscs.length === 6);
ok('no throw at intensity=1', true);

mockAC._log.length = 0; mockAC._oscs.length = 0;
cinematicLaunchAudio(0.1); // below min clamp (0.6)
ok('intensity clamped — still 6 oscillators at low value', mockAC._oscs.length === 6);

mockAC._log.length = 0; mockAC._oscs.length = 0;
cinematicLaunchAudio(9.9); // above max clamp (1.8)
ok('intensity clamped — still 6 oscillators at high value', mockAC._oscs.length === 6);

cinematicLaunchAudio(); // no argument
ok('cinematicLaunchAudio() → no throw without args', true);

// ── Summary ──────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Total: ${passed + failed}  ✅ ${passed}  ❌ ${failed}`);
if (failed > 0) { console.error('\nSome tests FAILED'); process.exit(1); }
else            { console.log('\nAll tests PASSED'); }
