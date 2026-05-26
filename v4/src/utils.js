// Pure utility functions — no side effects, no global state

/**
 * Convert any CSS color to rgba(r,g,b,a).
 * Handles: #rgb, #rrggbb, rgb(), rgba(), fallback for null/unknown.
 */
export function aC(col, a) {
  if (!col) return 'rgba(128,128,128,' + a + ')';
  col = col.trim();
  if (col.startsWith('#')) {
    let h = col.slice(1);
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    const r = parseInt(h.slice(0,2),16)||0;
    const g = parseInt(h.slice(2,4),16)||0;
    const b = parseInt(h.slice(4,6),16)||0;
    return 'rgba('+r+','+g+','+b+','+a+')';
  }
  if (col.startsWith('rgba')) return col.replace(/,\s*[\d.]+\)$/, ','+a+')');
  if (col.startsWith('rgb(')) return col.replace('rgb(','rgba(').replace(')',','+a+')');
  return col;
}

/**
 * Deterministic pseudo-random hash. Input: integer → output: float in [0, 1).
 * Used for seeded parallax backgrounds and constellation patterns.
 */
export function phash(n) {
  n = (((n>>>0)*1664525)+1013904223)>>>0;
  n = (n ^ (n>>>16)) >>> 0; // >>>0 ensures unsigned — original missed this, risked negative globalAlpha
  return n/4294967296;
}

/**
 * Draw a rounded rectangle path onto canvas context c.
 * Caller is responsible for stroke/fill after calling this.
 */
export function rr(c, x, y, w, h, r) {
  if (w<=0 || h<=0) return;
  r = Math.min(r, Math.abs(w)/2, Math.abs(h)/2);
  c.beginPath();
  c.moveTo(x+r, y); c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  c.lineTo(x+r, y+h); c.quadraticCurveTo(x, y+h, x, y+h-r);
  c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath();
}
