export function showDropScreen(drops, onContinue) {
  if (!drops || !drops.length) {
    onContinue?.();
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'drop-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.92);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
  `;

  const newDrops = drops.filter(d => d.type === 'new');
  const tokenDrops = drops.filter(d => d.type === 'token');

  let bodyHtml = '';
  if (newDrops.length) {
    bodyHtml += newDrops.map(d => `
      <div class="drop-item ${d.item.rarity}">
        <div class="drop-art">${d.item.art}</div>
        <div class="drop-name">${d.item.name}</div>
        <div class="drop-rarity">${d.item.rarity.toUpperCase()}</div>
      </div>
    `).join('');
  } else {
    const state = drops[0]?.state;
    const pityCnt = state?.pityCnt ?? 0;
    bodyHtml = `<div class="drop-empty">
      <div style="font-size:32px">💨</div>
      <div style="color:rgba(255,255,255,.6);font-family:'Exo 2',sans-serif;font-size:12px;margin-top:8px">Nothing this time...</div>
      ${pityCnt > 0 ? `<div style="color:rgba(255,255,255,.3);font-size:10px;margin-top:4px">${pityCnt} / 40 pity</div>` : ''}
    </div>`;
  }
  if (tokenDrops.length) {
    bodyHtml += `<div style="color:#ffd700;font-family:'Orbitron',monospace;font-size:12px">+${tokenDrops.length} 🔄 exchange token${tokenDrops.length > 1 ? 's' : ''}</div>`;
  }

  overlay.innerHTML = `
    <div style="font-family:'Orbitron',monospace;font-size:14px;letter-spacing:3px;color:rgba(255,255,255,.5)">DROP RESULT</div>
    ${bodyHtml}
    <div style="display:flex;gap:12px;margin-top:8px">
      <button class="scb land" onclick="document.getElementById('drop-overlay').remove();window._dropContinue?.()">PLAY AGAIN</button>
    </div>
  `;

  window._dropContinue = onContinue;
  document.body.appendChild(overlay);

  injectDropStyles();
}

function injectDropStyles() {
  if (document.getElementById('drop-styles')) return;
  const s = document.createElement('style');
  s.id = 'drop-styles';
  s.textContent = `
    .drop-item { text-align:center; padding:16px; background:rgba(255,255,255,.05); border-radius:16px; border:1px solid rgba(255,255,255,.1); min-width:120px; }
    .drop-item.common .drop-rarity { color:#aaa; }
    .drop-item.rare .drop-rarity { color:#4488ff; }
    .drop-item.epic .drop-rarity { color:#aa44ff; }
    .drop-item.legendary .drop-rarity { color:#ffd700; }
    .drop-art { font-size:48px; margin-bottom:8px; }
    .drop-name { font-family:'Orbitron',monospace; font-size:12px; color:#fff; margin-bottom:4px; }
    .drop-rarity { font-size:9px; letter-spacing:2px; }
  `;
  document.head.appendChild(s);
}
