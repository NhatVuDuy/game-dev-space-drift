export let mouseX = 0.5;
export let clicking = false;

export function initMouse(canvas) {
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX / window.innerWidth;
  });
  window.addEventListener('mousedown', () => { clicking = true; });
  window.addEventListener('mouseup',   () => { clicking = false; });
}
