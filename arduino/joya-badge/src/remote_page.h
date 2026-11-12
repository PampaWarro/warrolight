#ifndef JOYA_BADGE_REMOTE_PAGE_H
#define JOYA_BADGE_REMOTE_PAGE_H

#include <pgmspace.h>

// The remote the badge serves at http://192.168.4.1/ on its own WiFi.
// Talks to /api/state, /api/set and /api/palettes. Kept small on purpose:
// no fonts, no libraries, one request per change.
static const char kRemotePage[] PROGMEM = R"HTML(<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Joya Badge</title>
<style>
:root{--bg:#0d0e12;--panel:#1b1c22;--panel2:#23252d;--fg:#e8e8ec;--muted:#9a9ca6;--line:#2b2d36;--accent:#8c8ef7;--accent-fg:#0f1020}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;padding:16px max(16px,env(safe-area-inset-right)) 40px max(16px,env(safe-area-inset-left))}
.wrap{max-width:420px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
.head{display:flex;align-items:center;justify-content:space-between;gap:10px}
h1{font-size:18px;margin:0;font-weight:600}
.sub{font-size:12px;color:var(--muted);font-family:ui-monospace,Menlo,monospace}
.lab{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;color:var(--muted);margin-bottom:8px}
.lab b{color:var(--fg);font-weight:600}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.eff{border:1px solid var(--line);background:var(--panel2);color:var(--fg);border-radius:12px;padding:12px 6px;font:inherit;font-size:13px;cursor:pointer}
.eff[aria-pressed=true]{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent);font-weight:600}
.pals{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch}
.pal{flex:0 0 auto;width:48px;height:30px;border-radius:7px;border:1px solid var(--line);padding:0;cursor:pointer;background:#000}
.pal[aria-pressed=true]{box-shadow:0 0 0 2px var(--accent);border-color:var(--accent)}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
input[type=range]{width:100%;accent-color:var(--accent);margin:0}
.seg{display:grid;grid-template-columns:1fr 1fr;background:var(--panel2);border-radius:10px;padding:3px;gap:3px}
.seg button{border:0;background:transparent;border-radius:8px;padding:8px;font:inherit;font-size:13px;color:var(--muted);cursor:pointer}
.seg button[aria-pressed=true]{background:var(--panel);color:var(--fg);font-weight:600}
.tog{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:14px;padding:10px 12px;background:var(--panel);border:1px solid var(--line);border-radius:12px}
.sw{width:40px;height:24px;border-radius:999px;border:0;background:var(--panel2);position:relative;cursor:pointer;padding:0;flex:0 0 auto}
.sw::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s}
.sw[aria-checked=true]{background:var(--accent)}
.sw[aria-checked=true]::after{transform:translateX(16px)}
.hint{font-size:12px;color:var(--muted)}
.off .grid,.off .pals,.off .row2,.off .seg{opacity:.4;pointer-events:none}
</style></head><body><div class="wrap" id="app">
<div class="head"><div><h1>Joya Badge</h1><div class="sub" id="who">connecting…</div></div>
<button class="sw" id="power" role="switch" aria-checked="true" aria-label="Power"></button></div>
<div><div class="lab"><span>Effect</span><b id="lEff">—</b></div><div class="grid" id="effects"></div></div>
<div><div class="lab"><span>Palette</span><b id="lPal">—</b></div><div class="pals" id="pals"></div></div>
<div class="row2">
<div><div class="lab"><span>Brightness</span><b id="lBri">32</b></div><input type="range" id="bri" min="4" max="255" value="32" aria-label="Brightness"></div>
<div><div class="lab"><span>Speed</span><b id="lSpd">1.0×</b></div><input type="range" id="spd" min="25" max="300" value="100" aria-label="Speed"></div>
</div>
<div><div class="lab"><span>Mapping</span></div><div class="seg" id="map"><button data-v="1" aria-pressed="true">Badge (2D)</button><button data-v="0" aria-pressed="false">Strip</button></div></div>
<div class="tog"><span>Auto cycle <span class="hint">effect 59 s, palette 23 s</span></span><button class="sw" id="auto" role="switch" aria-checked="true" aria-label="Auto cycle"></button></div>
<p class="hint">Changes reach every badge in range. The MODE button on the back also steps to the next effect; hold it to go back to auto.</p>
</div>
<script>
const E=["Chase","Ripples","Plasma","Noise","Sinelon","Serendipity","Sweep","Bars","Fire","Blur","Juggle","Confetti"];
const $=i=>document.getElementById(i);let S=null,P=[],busy=0,drag=0;
const eff=$('effects'),pals=$('pals');
E.forEach((n,i)=>{const b=document.createElement('button');b.className='eff';b.textContent=n;b.dataset.i=i;b.setAttribute('aria-pressed','false');b.onclick=()=>set('effect='+i);eff.appendChild(b)});
function set(q){busy=1;return fetch('/api/set?'+q,{method:'POST'}).then(r=>r.json()).then(sync).catch(()=>{}).finally(()=>{busy=0})}
function sync(s){S=s;$('who').textContent=s.name+' · '+(s.auto?'auto':'manual');
 eff.querySelectorAll('.eff').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.i===s.effect)));
 pals.querySelectorAll('.pal').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===s.pal)));
 const sel=pals.querySelector('[aria-pressed=true]');if(sel&&s.auto)sel.scrollIntoView({block:'nearest',inline:'nearest'});
 $('lEff').textContent=E[s.effect]||'—';$('lPal').textContent=P[s.pal]?P[s.pal].n:'#'+s.pal;
 if(!drag){$('bri').value=s.bri;$('spd').value=s.speed}
 $('lBri').textContent=s.bri;$('lSpd').textContent=(s.speed/100).toFixed(2).replace(/0$/,'')+'×';
 $('auto').setAttribute('aria-checked',String(!!s.auto));$('power').setAttribute('aria-checked',String(!!s.power));
 $('map').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.v===(s.map?1:0))));
 $('app').classList.toggle('off',!s.power)}
fetch('/api/palettes').then(r=>r.json()).then(list=>{P=list;pals.innerHTML='';list.forEach((p,i)=>{const b=document.createElement('button');b.className='pal';b.title=p.n;b.setAttribute('aria-label',p.n);b.setAttribute('aria-pressed','false');
 b.style.background='linear-gradient(90deg,'+p.c.map((c,k)=>'#'+c+' '+(k/15*100).toFixed(0)+'%').join(',')+')';b.onclick=()=>set('pal='+i);pals.appendChild(b)});if(S)sync(S)});
let t;const slide=(id,key)=>{const el=$(id);el.oninput=()=>{drag=1;$(id==='bri'?'lBri':'lSpd').textContent=id==='bri'?el.value:(el.value/100).toFixed(2).replace(/0$/,'')+'×';clearTimeout(t);t=setTimeout(()=>set(key+'='+el.value),150)};el.onchange=()=>{drag=0;clearTimeout(t);set(key+'='+el.value)}};
slide('bri','bri');slide('spd','speed');
$('auto').onclick=()=>set('auto='+(S&&S.auto?0:1));
$('power').onclick=()=>set('power='+(S&&S.power?0:1));
$('map').querySelectorAll('button').forEach(b=>b.onclick=()=>set('map='+b.dataset.v));
function poll(){if(!busy&&!drag)fetch('/api/state').then(r=>r.json()).then(sync).catch(()=>{})}
poll();setInterval(poll,2000);
</script></body></html>)HTML";

#endif  // JOYA_BADGE_REMOTE_PAGE_H
