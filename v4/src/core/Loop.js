let _raf = 0;
let _overlayRaf = 0;

export function startLoop(tick) {
  cancelLoop();
  function frame() {
    tick();
    _raf = requestAnimationFrame(frame);
  }
  _raf = requestAnimationFrame(frame);
}

export function cancelLoop() {
  if (_raf) { cancelAnimationFrame(_raf); _raf = 0; }
}

export function startOverlayLoop(tick) {
  cancelOverlayLoop();
  function frame() {
    tick();
    _overlayRaf = requestAnimationFrame(frame);
  }
  _overlayRaf = requestAnimationFrame(frame);
}

export function cancelOverlayLoop() {
  if (_overlayRaf) { cancelAnimationFrame(_overlayRaf); _overlayRaf = 0; }
}
