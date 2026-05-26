// Game constants & theme definitions — pure data, no side effects

export const CFG = { G:.065, THR:.19, TILT:2.8, FMAX:100, FBURN:.15, FADD:38, LV:1.7, GSPC:600 };
export const SR = 17; // ship collision radius

export const TH = {
  scifi: {
    nm:'SCI-FI', e:'🚀', dot:'⚡', ship:'saucer',
    sky0:'#020215', sky1:'#06033a',
    sc:['#ccddff','#aaccff','#eeeeff','#ffffff'],
    sb:['#1a6fa8','#0d4f82','#2a90d0'], sa:'#00cfff', sw:'#7ecfff', wc:'#0a3f6a', nz:'#1a2a3a',
    tc:['#00cfff','#0050cc'],
    fb:'linear-gradient(to top,#00cfff,#0080ff,#7b2fff)',
    pc:'#00cfff', wh:function(h){return 'hsl('+(200+h*20)+',55%,26%)'},
    ac:['#334455','#445566','#223344'],
    gc:'#00cfff', bc:'#ffd700', fc:'#00ff88', dc:'#ff3333',
    ha:'#00cfff', lg:['#00cfff','#0080ff','#7b2fff'], bg:['#00cfff','#0060cc'], ti:'⚡'
  },
  cartoon: {
    nm:'CARTOON', e:'🛸', dot:'🌈', ship:'rocket',
    sky0:'#0b0c2a', sky1:'#1a0b40',
    sc:['#ffffff','#ffd7b5','#b5d7ff','#d4b5ff'],
    sb:['#74b9ff','#0984e3','#3d9be9'], sa:'#ffd700', sw:'#dfe6e9', wc:'#e17055', nz:'#636e72',
    tc:['#ff9f43','#ffd700'],
    fb:'linear-gradient(to top,#ff6b35,#ffd700,#39ff14)',
    pc:'#2ecc71', wh:function(h){return 'hsl('+(h*60)+',50%,34%)'},
    ac:['#8B7355','#A0826D','#c8a050'],
    gc:'#00cfff', bc:'#ffd700', fc:'#39ff14', dc:'#e74c3c',
    ha:'#ffd700', lg:['#ffe566','#ff7a2f','#ff4fa3'], bg:['#ffe566','#ff6b35'], ti:'🔥'
  },
  anime: {
    nm:'ANIME', e:'✨', dot:'🌸', ship:'fighter',
    sky0:'#0d0820', sky1:'#1a0d35',
    sc:['#ffffff','#ffb3d9','#b3d9ff','#ffe0b3'],
    sb:['#e056a0','#c2185b','#f06292'], sa:'#ff9ff3', sw:'#ffd6f0', wc:'#9c27b0', nz:'#6a1b9a',
    tc:['#ff9ff3','#e91e97'],
    fb:'linear-gradient(to top,#e91e97,#ff9ff3,#c2e0ff)',
    pc:'#ff9ff3', wh:function(h){return 'hsl('+(280+h*20)+',46%,30%)'},
    ac:['#6a3d8f','#7b52a6','#8b5cf6'],
    gc:'#ff9ff3', bc:'#ffe0b3', fc:'#c2e0ff', dc:'#ff5252',
    ha:'#ff9ff3', lg:['#ff9ff3','#e91e97','#c2e0ff'], bg:['#ff9ff3','#e91e97'], ti:'✨'
  },
  neon: {
    nm:'NEON', e:'👾', dot:'🟢', ship:'arrow',
    sky0:'#000005', sky1:'#000010',
    sc:['#00ff41','#00ffff','#ffff00','#ff00ff'],
    sb:['#00ff41','#00cc33','#00ff80'], sa:'#00ff41', sw:'#00ff41', wc:'#007722', nz:'#003311',
    tc:['#ffff00','#ff8800'],
    fb:'linear-gradient(to top,#ff0000,#ffff00,#00ff00)',
    pc:'#00ff41', wh:function(h){return 'hsl('+(120+h*40)+',72%,20%)'},
    ac:['#1a1a1a','#222222','#2a2a2a'],
    gc:'#00ffff', bc:'#ffff00', fc:'#00ff41', dc:'#ff0000',
    ha:'#00ff41', lg:['#00ff41','#00ffff','#ffff00'], bg:['#00ff41','#007722'], ti:'▲'
  }
};
