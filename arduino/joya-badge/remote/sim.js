// Simulation of the twelve JoyaBikes effects on the badge layout.
// Same code as the Joya Badge Lights artifact; FastLED math ported to JS.
'use strict';
/* ---------- FastLED ports (8/16 bit helpers, HSV, palettes, noise) ---------- */
const u8=v=>v&255;
const scale8=(i,s)=>((i*(1+s))>>8)&255;            // FASTLED_SCALE8_FIXED
const scale8v=(i,s)=>(((i*s)>>8)+((i&&s)?1:0))&255;  // scale8_video
const qadd8=(a,b)=>Math.min(255,a+b);
const qsub8=(a,b)=>Math.max(0,a-b);
const dim8raw=x=>scale8(x,x);
const sin8=x=>u8(Math.round(128+127*Math.sin((x&255)/256*Math.PI*2)));
const cos8=x=>sin8(x+64);
const triwave8=x=>{x&=255;if(x&128)x=255-x;return (x<<1)&255};
const ease8=i=>{const ii=scale8(i,i),iii=scale8(ii,i);const r=3*ii-2*iii;return r>255?255:(r<0?0:r)};
const cubicwave8=x=>ease8(triwave8(x));
const sin16=x=>Math.round(32767*Math.sin((x&65535)/65536*Math.PI*2));
function beat16(ms,bpm){return Math.floor(ms*(bpm<<8)*280/65536)&65535}
function beatsin16(ms,bpm,lo,hi,phase=0){const b=sin16(beat16(ms,bpm)+phase)+32768;return lo+Math.floor(b*(hi-lo)/65536)}
function beatsin8(ms,bpm,lo=0,hi=255,phase=0){const b=sin8((beat16(ms,bpm)>>8)+phase);return lo+Math.floor(b*(hi-lo)/256)}
// smooth real-valued oscillator for 2D positions: same period as beatsin16, no quantising
function beatf(ms,bpm,phase=0){return Math.sin(ms*bpm/60000*Math.PI*2+phase)*0.5+0.5}

function hsv2rgb(hue,sat,val){ // hsv2rgb_rainbow, Y1 boost, as FastLED
  hue&=255;const offset8=(hue&31)<<3;const third=scale8(offset8,85);let r,g,b;
  if(!(hue&128)){
    if(!(hue&64)){ if(!(hue&32)){r=255-third;g=third;b=0}else{r=171;g=85+third;b=0} }
    else{ if(!(hue&32)){const tt=scale8(offset8,170);r=171-tt;g=170+third;b=0}else{r=0;g=255-third;b=third} }
  }else{
    if(!(hue&64)){ if(!(hue&32)){const tt=scale8(offset8,170);r=0;g=171-tt;b=85+tt}else{r=third;g=0;b=255-third} }
    else{ if(!(hue&32)){r=85+third;g=0;b=171-third}else{r=170+third;g=0;b=85-third} }
  }
  if(sat!==255){ if(sat===0){r=g=b=255}else{let d=255-sat;d=scale8v(d,d);const ss=255-d;
    if(r)r=scale8(r,ss)+1;if(g)g=scale8(g,ss)+1;if(b)b=scale8(b,ss)+1;r=u8(r+d);g=u8(g+d);b=u8(b+d)} }
  if(val!==255){ val=scale8v(val,val); if(val===0){r=g=b=0}else{if(r)r=scale8(r,val)+1;if(g)g=scale8(g,val)+1;if(b)b=scale8(b,val)+1} }
  return [u8(r),u8(g),u8(b)];
}

// gradient palette (index,r,g,b,...) -> 16 entries, as CRGBPalette16::operator=
function gradientTo16(def){
  const n=def.length/4;const ent=Array.from({length:16},()=>[0,0,0]);
  const fill=(s,c1,e,c2)=>{ if(e<s){[s,e]=[e,s];[c1,c2]=[c2,c1]} const div=(e-s)||1;
    const d=[0,1,2].map(k=>((c2[k]-c1[k])<<7)/div*2);let v=c1.map(x=>x<<8);
    for(let i=s;i<=e;i++){ent[i]=v.map(x=>Math.max(0,Math.min(255,x>>8)));v=v.map((x,k)=>x+d[k])} };
  let last=-1,is=0,start=[def[1],def[2],def[3]],p=0;
  while(is<255){ p++; const ie=def[p*4];const end=[def[p*4+1],def[p*4+2],def[p*4+3]];
    let a=is>>4,b=ie>>4;
    if(n<16){ if(a<=last&&last<15){a=last+1;if(b<a)b=a} last=b }
    fill(a,start,b,end); is=ie; start=end; }
  return ent;
}
function hexTo16(list){return list.map(h=>[(h>>16)&255,(h>>8)&255,h&255])}
function colorFromPalette(pal,index,bright=255){
  index&=255;const hi=index>>4,lo=index&15;let [r,g,b]=pal[hi];
  if(lo){const [r2,g2,b2]=pal[(hi+1)&15];const f2=lo<<4,f1=255-f2;r=scale8(r,f1)+scale8(r2,f2);g=scale8(g,f1)+scale8(g2,f2);b=scale8(b,f1)+scale8(b2,f2)}
  if(bright!==255){ if(bright){bright=Math.min(255,bright+1);if(r)r=scale8(r,bright);if(g)g=scale8(g,bright);if(b)b=scale8(b,bright)}else{r=g=b=0} }
  return [u8(r),u8(g),u8(b)];
}
function blendTowardPalette(cur,tgt,maxChanges=12){ let ch=0;
  for(let i=0;i<16&&ch<maxChanges;i++)for(let k=0;k<3;k++){const a=cur[i][k],b=tgt[i][k];if(a===b)continue;
    if(a<b){cur[i][k]=a+1;ch++}else{cur[i][k]=Math.max(b,a-2);ch++} if(ch>=maxChanges)break}
}
// Perlin noise (improved), scaled like inoise8 / inoise16
const PERM=(()=>{const p=[];let s=1337;for(let i=0;i<256;i++)p[i]=i;for(let i=255;i>0;i--){s=(s*1103515245+12345)&0x7fffffff;const j=s%(i+1);[p[i],p[j]]=[p[j],p[i]]}return p.concat(p)})();
const fade=t=>t*t*t*(t*(t*6-15)+10), lerp=(a,b,t)=>a+t*(b-a);
function grad(h,x,y,z){const u=h<8?x:y,v=h<4?y:(h===12||h===14?x:z);return ((h&1)?-u:u)+((h&2)?-v:v)}
function perlin(x,y,z){const X=Math.floor(x)&255,Y=Math.floor(y)&255,Z=Math.floor(z)&255;x-=Math.floor(x);y-=Math.floor(y);z-=Math.floor(z);
  const u=fade(x),v=fade(y),w=fade(z);const A=PERM[X]+Y,AA=PERM[A]+Z,AB=PERM[A+1]+Z,B=PERM[X+1]+Y,BA=PERM[B]+Z,BB=PERM[B+1]+Z;
  return lerp(lerp(lerp(grad(PERM[AA]&15,x,y,z),grad(PERM[BA]&15,x-1,y,z),u),lerp(grad(PERM[AB]&15,x,y-1,z),grad(PERM[BB]&15,x-1,y-1,z),u),v),
    lerp(lerp(grad(PERM[AA+1]&15,x,y,z-1),grad(PERM[BA+1]&15,x-1,y,z-1),u),lerp(grad(PERM[AB+1]&15,x,y-1,z-1),grad(PERM[BB+1]&15,x-1,y-1,z-1),u),v),w)}
const inoise8=(x,y=0)=>u8(Math.round(128+perlin(x/256,y/256,0)*150));            // 16.8 fixed inputs
const inoise16=(x,y,z)=>Math.max(0,Math.min(65535,Math.round(32768+perlin(x/65536,y/65536,z/65536)*38000)));
const rnd8=()=>Math.floor(Math.random()*256);
const rnd=n=>Math.floor(Math.random()*n);
/* ---------- palettes, in the firmware's order ---------- */
const G={
 ib_jul01:[0,194,1,1,94,1,29,18,132,57,131,28,255,113,1,1],
 es_vintage_57:[0,2,1,1,53,18,1,0,104,69,29,1,153,167,135,10,255,46,56,4],
 es_vintage_01:[0,4,1,1,51,16,0,1,76,97,104,3,101,255,131,19,127,67,9,4,153,16,0,1,229,4,1,1,255,4,1,1],
 es_rivendell_15:[0,1,14,5,101,16,36,14,165,56,68,30,242,150,156,99,255,150,156,99],
 rgi_15:[0,4,1,31,31,55,1,16,63,197,3,7,95,59,2,17,127,6,2,34,159,39,6,33,191,112,13,32,223,56,9,35,255,22,6,38],
 retro2_16:[0,188,135,1,255,46,7,1],
 Analogous_1:[0,3,0,255,63,23,0,255,127,67,0,255,191,142,0,45,255,255,0,0],
 es_pinksplash_08:[0,126,11,255,127,197,1,22,175,210,157,172,221,157,3,112,255,157,3,112],
 es_pinksplash_07:[0,229,1,1,61,242,4,63,101,255,12,255,127,249,81,252,153,255,11,235,193,244,5,68,255,232,1,5],
 Coral_reef:[0,40,199,197,50,10,152,155,96,1,111,120,96,43,127,162,139,10,73,111,255,1,34,71],
 es_ocean_breeze_068:[0,100,156,153,51,1,99,137,101,1,68,84,104,35,142,168,178,0,63,117,255,1,10,10],
 es_ocean_breeze_036:[0,1,6,7,89,1,99,111,153,144,209,255,255,0,73,82],
 departure:[0,8,3,0,42,23,7,0,63,75,38,6,84,169,99,38,106,213,169,119,116,255,255,255,138,135,255,138,148,22,255,24,170,0,255,0,191,0,136,0,212,0,55,0,255,0,55,0],
 es_landscape_33:[0,1,5,0,19,32,23,1,38,161,55,1,63,229,144,1,66,39,142,74,255,1,4,1],
 rainbowsherbet:[0,255,33,4,43,255,68,25,86,255,7,25,127,255,82,103,170,255,255,242,209,42,255,22,255,87,255,65],
 gr65_hult:[0,247,176,247,48,255,136,255,89,220,29,226,160,7,82,178,216,1,124,109,255,1,124,109],
 gr64_hult:[0,1,124,109,66,1,93,79,104,52,65,1,130,115,127,1,150,52,65,1,201,1,86,72,239,0,55,45,255,0,55,45],
 GMT_drywet:[0,47,30,2,42,213,147,24,84,103,219,52,127,3,219,207,170,1,48,214,212,1,1,111,255,1,7,33],
 ib15:[0,113,91,147,72,157,88,78,89,208,85,33,107,255,29,11,141,137,31,39,255,59,33,89],
 Fuschia_7:[0,43,3,153,63,100,4,103,127,188,5,66,191,161,11,115,255,135,20,182],
 es_emerald_dragon_08:[0,97,255,1,101,47,133,1,178,13,43,1,255,2,10,1],
 lava:[0,0,0,0,46,18,0,0,96,113,0,0,108,142,3,1,119,175,17,1,146,213,44,2,174,255,82,4,188,255,115,4,202,255,156,4,218,255,203,4,234,255,255,4,244,255,255,71,255,255,255,255],
 fire:[0,1,1,0,76,32,5,0,146,192,24,0,197,220,105,5,240,252,255,31,250,252,255,111,255,255,255,255],
 Colorfull:[0,10,85,5,25,29,109,18,60,59,138,42,93,83,99,52,106,110,66,64,109,123,49,65,113,139,35,66,116,192,117,98,124,255,255,137,168,100,180,155,255,22,121,174],
 Magenta_Evening:[0,71,27,39,31,130,11,51,63,213,2,64,70,232,1,66,76,252,1,69,108,123,2,51,255,46,9,35],
 Pink_Purple:[0,19,2,39,25,26,4,45,51,33,6,52,76,68,62,125,102,118,187,240,109,163,215,247,114,217,244,255,122,159,149,221,149,113,78,188,183,128,57,155,255,146,40,123],
 Sunset_Real:[0,120,0,0,22,179,22,0,51,255,104,0,85,167,22,18,135,100,0,103,198,16,0,130,255,0,0,160],
 es_autumn_19:[0,26,1,1,51,67,4,1,84,118,14,1,104,137,152,52,112,113,65,1,122,133,149,59,124,137,152,52,135,113,65,1,142,139,154,46,163,113,13,1,204,55,3,1,249,17,1,1,255,17,1,1],
 BlacK_Blue_Magenta_White:[0,0,0,0,42,0,0,45,84,0,0,255,127,42,0,255,170,255,0,255,212,255,55,255,255,255,255,255],
 BlacK_Magenta_Red:[0,0,0,0,63,42,0,45,127,255,0,255,191,255,0,45,255,255,0,0],
 BlacK_Red_Magenta_Yellow:[0,0,0,0,42,42,0,0,84,255,0,0,127,255,0,45,170,255,0,255,212,255,55,45,255,255,255,0],
 Blue_Cyan_Yellow:[0,0,0,255,63,0,55,255,127,0,255,255,191,42,255,45,255,255,255,0],
};
const P16={
 Party:[0x5500AB,0x84007C,0xB5004B,0xE5001B,0xE81700,0xB84700,0xAB7700,0xABAB00,0xAB5500,0xDD2200,0xF2000E,0xC2003E,0x8F0071,0x5F00A1,0x2F00D0,0x0007F9],
 Ocean:[0x191970,0x00008B,0x191970,0x000080,0x00008B,0x0000CD,0x2E8B57,0x008080,0x5F9EA0,0x0000FF,0x008B8B,0x6495ED,0x7FFFD4,0x2E8B57,0x00FFFF,0x87CEFA],
 RainbowStripe:[0xFF0000,0,0xAB5500,0,0xABAB00,0,0x00FF00,0,0x00AB55,0,0x0000FF,0,0x5500AB,0,0xAB0055,0],
 Rainbow:[0xFF0000,0xD52A00,0xAB5500,0xAB7F00,0xABAB00,0x56D500,0x00FF00,0x00D52A,0x00AB55,0x0056AA,0x0000FF,0x2A00D5,0x5500AB,0x7F0081,0xAB0055,0xD5002B],
 Lava:[0x000000,0x800000,0x000000,0x800000,0x8B0000,0x800000,0x8B0000,0x8B0000,0x8B0000,0x8B0000,0xFF0000,0xFFA500,0xFFFFFF,0xFFA500,0xFF0000,0x8B0000],
 Forest:[0x006400,0x006400,0x556B2F,0x006400,0x008000,0x228B22,0x6B8E23,0x008000,0x2E8B57,0x66CDAA,0x32CD32,0x9ACD32,0x90EE90,0x7CFC00,0x66CDAA,0x228B22],
 Heat:[0x000000,0x330000,0x660000,0x990000,0xCC0000,0xFF0000,0xFF3300,0xFF6600,0xFF9900,0xFFCC00,0xFFFF00,0xFFFF33,0xFFFF66,0xFFFF99,0xFFFFCC,0xFFFFFF],
};
const PAL_ORDER=['gr65_hult','es_rivendell_15','es_ocean_breeze_068','Colorfull','Blue_Cyan_Yellow','Coral_reef','Party','Ocean','retro2_16','BlacK_Red_Magenta_Yellow','es_emerald_dragon_08','RainbowStripe','es_vintage_57','departure','Analogous_1','es_vintage_01','lava','Rainbow','fire','es_ocean_breeze_036','ib_jul01','GMT_drywet','BlacK_Magenta_Red','Magenta_Evening','rgi_15','rainbowsherbet','Lava','Sunset_Real','ib15','es_landscape_33','Forest','Heat','es_autumn_19','es_pinksplash_08','Pink_Purple','Fuschia_7','es_pinksplash_07','BlacK_Blue_Magenta_White','gr64_hult'];
const PALETTES=PAL_ORDER.map(k=>({name:k.replace(/_/g,' '),entries:G[k]?gradientTo16(G[k]):hexTo16(P16[k])}));

/* ---------- geometry from Faceted_Badge.kicad_pcb (mm) ---------- */
const OUTLINE=[[37.5,0],[75,37.5],[54.5,59.3],[20.5,59.3],[0,37.5]];
const LEDMM=[[37.5,8],[28.5,17],[46.5,17],[19.5,26],[37.5,26],[55.5,26],[10.5,37.5],[28.5,37.5],[46.5,37.5],[64.5,37.5],[19.5,48],[37.5,48],[55.5,48]];
const REF=LEDMM.map((_,i)=>'D'+(i+1));
const N=13;
const CX=37.5,CY=28;
const NX=LEDMM.map(p=>(p[0]-CX)/27),NY=LEDMM.map(p=>(p[1]-CY)/20);   // -1..1 over the LED box
const X8=NX.map(v=>Math.round((v+1)*127.5)),Y8=NY.map(v=>Math.round((v+1)*127.5));
const RIM=[0,2,5,9,12,11,10,6,3,1];                                   // clockwise from the top
const ROW=[0,1,1,2,2,2,3,3,3,3,4,4,4];
const NEIGH=LEDMM.map((p,i)=>LEDMM.map((q,j)=>j).filter(j=>j!==i&&Math.hypot(p[0]-LEDMM[j][0],p[1]-LEDMM[j][1])<15.5));
const FACET_EDGES=[];NEIGH.forEach((ns,i)=>ns.forEach(j=>{if(j>i)FACET_EDGES.push([i,j])}));
function rimPoint(t){t=((t%10)+10)%10;const i=Math.floor(t),f=t-i;const a=LEDMM[RIM[i]],b=LEDMM[RIM[(i+1)%10]];return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]}
// unit square -> a point inside the gem, 5 mm in from the edge
function inBoard(sx,sy){const y=7+42*sy;const half=(y<=37.5?y:37.5-(y-37.5)*(17/21.8))-6;return [37.5+(sx*2-1)*Math.max(2,half),y]}
function nearest(x,y){let b=0,bd=1e9;for(let i=0;i<N;i++){const d=(x-LEDMM[i][0])**2+(y-LEDMM[i][1])**2;if(d<bd){bd=d;b=i}}return b}

/* ---------- pixel ops ---------- */
const black=()=>[0,0,0];
function fadeAll(L,amt){const k=255-amt;for(const c of L){c[0]=scale8(c[0],k);c[1]=scale8(c[1],k);c[2]=scale8(c[2],k)}}
function addTo(c,d){c[0]=qadd8(c[0],d[0]);c[1]=qadd8(c[1],d[1]);c[2]=qadd8(c[2],d[2])}
function orTo(c,d){c[0]|=d[0];c[1]|=d[1];c[2]|=d[2]}
function maxTo(c,d){c[0]=Math.max(c[0],d[0]);c[1]=Math.max(c[1],d[1]);c[2]=Math.max(c[2],d[2])}
function nblend(c,d,amt){for(let k=0;k<3;k++)c[k]=u8(c[k]+(((d[k]-c[k])*amt)>>8))}
function scaleC(c,f){return [u8(Math.round(c[0]*f)),u8(Math.round(c[1]*f)),u8(Math.round(c[2]*f))]}
function blur1d(L,amt){const keep=255-amt,seep=amt>>1;let carry=[0,0,0];
  for(let i=0;i<N;i++){const cur=L[i].slice();const part=cur.map(v=>scale8(v,seep));for(let k=0;k<3;k++)cur[k]=scale8(cur[k],keep);
    addTo(cur,carry);if(i)addTo(L[i-1],part);L[i]=cur;carry=part}}
function blur2d(L,amt){const keep=255-amt;const out=L.map(c=>c.map(v=>scale8(v,keep)));
  for(let i=0;i<N;i++){const ns=NEIGH[i];const share=amt/ns.length;for(const j of ns){for(let k=0;k<3;k++)out[j][k]=qadd8(out[j][k],Math.round(L[i][k]*share/255))}}
  for(let i=0;i<N;i++)L[i]=out[i]}
// a point of light in mm; each LED takes what lands within ~sigma of it
function splat(L,x,y,c,sigma=7,mode='add'){const s2=2*sigma*sigma;
  for(let i=0;i<N;i++){const d=(x-LEDMM[i][0])**2+(y-LEDMM[i][1])**2;const w=Math.exp(-d/s2);if(w<0.03)continue;const d2=scaleC(c,w);
    if(mode==='add')addTo(L[i],d2);else maxTo(L[i],d2)}}

/* ---------- the twelve effects: strip (as flashed) and badge (2D) ---------- */
const EFFECTS=[
{key:'sinechase',name:'Chase',note:'Eight hue dots that slid back and forth along the chain now run around the rim (D1, D3, D6, D10, D13, D12, D11, D7, D4, D2), each at its own tempo. The inner three stay dark so the ring reads as a ring.',
 make(){return{
  strip(S){fadeAll(S.L,40);let h=0;for(let i=0;i<8;i++){const idx=(Math.floor(i*N/8)+beatsin16(S.ms,1+i,0,2*N))%N;orTo(S.L[idx],hsv2rgb(h,200,255));h=u8(h+32)}},
  badge(S){fadeAll(S.L,40);let h=0;for(let i=0;i<8;i++){const t=i*10/8+beatf(S.ms,1+i)*20;const [x,y]=rimPoint(t);splat(S.L,x,y,hsv2rgb(h,200,255),6,'max');h=u8(h+32)}}}}},
{key:'rippless',name:'Ripples',note:'A ripple used to be two dots walking left and right along the chain. Now it starts at a random LED and grows as a ring across the lattice, like a drop hitting water.',
 make(){const R=Array.from({length:10},()=>({exist:false}));const R2=Array.from({length:5},()=>({exist:false}));return{
  strip(S){for(let i=0;i<10;i+=2){if(rnd8()>224&&!R[i].exist){const r={pos:1+rnd(11),vel:1,life:0,maxLife:10,exist:true,bri:255,color:S.ms&255,fade:192};R[i]=r;R[i+1]={...r,vel:-1}}}
    for(const r of R){if(!r.exist)continue;S.L[r.pos]=colorFromPalette(S.pal,r.color,r.bri);r.pos+=r.vel;r.life++;if(r.pos>N-1){r.vel*=-1;r.pos=N-1}if(r.pos<0){r.vel*=-1;r.pos=0}r.bri=scale8(r.bri,r.fade);if(r.life>r.maxLife)r.exist=false}
    fadeAll(S.L,160)},
  badge(S){for(const r of R2){if(rnd8()>232&&!r.exist){const [x,y]=LEDMM[rnd(N)];Object.assign(r,{x,y,life:0,exist:true,bri:255,color:S.ms&255})}}
    for(const r of R2){if(!r.exist)continue;const rad=r.life*3.2;const c=colorFromPalette(S.pal,r.color,r.bri);
      for(let i=0;i<N;i++){const d=Math.hypot(r.x-LEDMM[i][0],r.y-LEDMM[i][1]);const w=Math.max(0,1-Math.abs(d-rad)/5);if(w>0)maxTo(S.L[i],scaleC(c,w))}
      r.life++;r.bri=scale8(r.bri,200);if(r.life>12)r.exist=false}
    fadeAll(S.L,120)}}}},
{key:'plasma',name:'Plasma',note:'Both waves ran along the chain index. Now one runs across the gem and the other down it, on an axis that turns slowly, so colour bands drift across the facets instead of flickering row by row.',
 make(){return{
  strip(S){const p1=beatsin8(S.ms,6,0,128)-64,p2=beatsin8(S.ms,7,0,128)-64,cut=beatsin8(S.ms,8,0,96);
    for(let k=0;k<N;k++){const ci=(cubicwave8(k*23+p1)>>1)+(cos8(k*15+p2)>>1);S.L[k]=colorFromPalette(S.pal,ci,ci>cut?ci-cut:0)}},
  badge(S){const p1=beatsin8(S.ms,6,0,128)-64,p2=beatsin8(S.ms,7,0,128)-64,cut=beatsin8(S.ms,8,0,96);const th=S.ms/40000*Math.PI*2,c=Math.cos(th),s=Math.sin(th);
    for(let k=0;k<N;k++){const p=(NX[k]*c+NY[k]*s+1)*127.5,q=(-NX[k]*s+NY[k]*c+1)*127.5;const ci=(cubicwave8(Math.round(p*1.2)+p1)>>1)+(cos8(Math.round(q*0.8)+p2)>>1);S.L[k]=colorFromPalette(S.pal,ci,ci>cut?ci-cut:0)}}}}},
{key:'noise16_1',name:'Noise',note:'Perlin noise was sampled along a 13 point line, which is almost one flat colour. Now it is sampled at each LED\'s x and y with a tighter zoom, so patches of colour cross the badge.',
 make(){return{
  strip(S){const sx=beatsin8(S.ms,5),sy=Math.floor(S.ms/100);for(let i=0;i<N;i++){const n=inoise16(((i+sx)*1000)&65535,((i+sy)*1000)&65535,S.ms*20)>>8;S.L[i]=colorFromPalette(S.pal,sin8(n*3),n)}},
  badge(S){const sx=beatsin8(S.ms,5),sy=S.ms/100;for(let i=0;i<N;i++){const u=(LEDMM[i][0]-10.5)/9,v=(LEDMM[i][1]-8)/9;const n=inoise16(u*6000+sx*1000,v*6000+sy*1000,S.ms*20)>>8;S.L[i]=colorFromPalette(S.pal,sin8(n*3),n)}}}}},
{key:'sinelon',name:'Sinelon',note:'The dot bounced along the chain. Now its two beats drive x and y, so it traces a Lissajous curve over the whole badge, with the same trail.',
 make(){let hue=0;return{
  strip(S){fadeAll(S.L,32);const a=beatsin16(S.ms,23,0,N-1),b=beatsin16(S.ms,28,0,N-1);addTo(S.L[(a+b)>>1],colorFromPalette(S.pal,u8(hue++),255))},
  badge(S){fadeAll(S.L,32);const [x,y]=inBoard(beatf(S.ms,23),beatf(S.ms,28));splat(S.L,x,y,colorFromPalette(S.pal,u8(hue++),255),6)}}}},
{key:'serendipitous',name:'Serendipity',note:'The chaotic X value picked an LED index. X and Y now pick a point on the badge, so the mosaic follows the attractor\'s path.',
 make(){let X=0x12,Y=0x15,lastReset=0;const step=S=>{if(S.ms-lastReset>=5000){X=0x12;Y=0x15;lastReset=S.ms}const Xn=(X-Math.floor(Y/3))&65535,Yn=(Y+Math.trunc(X/1.5))&65535;X=Xn;Y=Yn;return colorFromPalette(S.pal,(sin8(X)+cos8(Y))>>1,255)};return{
  strip(S){const c=step(S);nblend(S.L[Math.floor(X*(N-1)/65535)],c,224);fadeAll(S.L,6)},
  badge(S){const c=step(S);const [x,y]=inBoard(X/65535,Y/65535);nblend(S.L[nearest(x,y)],c,224);fadeAll(S.L,6)}}}},
{key:'sawtooth',name:'Sweep',note:'A single dot stepped through the chain every 6 s. Now a soft line sweeps across the badge and turns 60° each beat, so it crosses a different pair of facets every time.',
 make(){return{
  strip(S){fadeAll(S.L,3);const perLed=Math.floor(6000/N);const cur=Math.floor((S.ms%6000)/perLed)%N;S.L[cur]=colorFromPalette(S.pal,0,255)},
  badge(S){fadeAll(S.L,3);const beat=Math.floor(S.ms/6000),ph=(S.ms%6000)/6000;const th=beat*Math.PI/3,c=Math.cos(th),s=Math.sin(th);const pos=-1.2+2.4*ph;const col=colorFromPalette(S.pal,0,255);
    for(let i=0;i<N;i++){const p=NX[i]*c+NY[i]*s;const w=Math.max(0,1-Math.abs(p-pos)/0.28);if(w>0)maxTo(S.L[i],scaleC(col,w))}}}}},
{key:'one_sine_pal',name:'Bars',note:'Hard on/off bars along the chain. Now the bars travel across the badge on a slowly turning axis and are graded, so they glide from LED to LED instead of jumping.',
 make(){let phase=0,bg=0;return{
  strip(S){phase+=8;let ci=(S.ms>>4)&255;for(let k=0;k<N-1;k++){const b=cubicwave8(k*32+phase)>192?192:0;S.L[k]=hsv2rgb(bg,255,10);addTo(S.L[k],colorFromPalette(S.pal,ci,b));ci=u8(ci+3)}bg=u8(bg+1)},
  badge(S){phase+=8;const base=(S.ms>>4)&255;const th=S.ms/30000*Math.PI*2,c=Math.cos(th),s=Math.sin(th);
    for(let k=0;k<N;k++){const p=(NX[k]*c+NY[k]*s)*3;const w=cubicwave8(Math.round(p*32)+phase);const b=w>150?Math.min(255,Math.round((w-150)*2.4)):0;S.L[k]=hsv2rgb(bg,255,10);addTo(S.L[k],colorFromPalette(S.pal,u8(base+Math.round(p*3)),b))}bg=u8(bg+1)}}}},
{key:'inoise8_fire',name:'Fire',note:'On a 13 LED strip the palette index never got past 48, so this one only ever showed the first fifth of each palette and stayed dark on the fire ones. Now heat sits in the bottom row and rises with noise, so the gem burns from its base.',
 make(){return{
  strip(S){for(let i=0;i<N;i++){const n=inoise8(i*20,Math.floor(S.ms*N/255));S.L[i]=colorFromPalette(S.pal,Math.min(255,(i*n)>>6),255)}},
  badge(S){for(let i=0;i<N;i++){const yb=(48-LEDMM[i][1])/40;const n=inoise8(LEDMM[i][0]*5,LEDMM[i][1]*6+S.ms/7);const idx=Math.min(255,Math.round((0.12+1.35*(1-yb))*n));S.L[i]=colorFromPalette(S.pal,idx,255)}}}}},
{key:'blur',name:'Blur',note:'The 1D blur spread light to neighbours in the chain, which on the badge means unrelated LEDs. It now spreads along the lattice to real neighbours, and the three wandering points move in 2D.',
 make(){return{
  strip(S){const amt=dim8raw(beatsin8(S.ms,3,64,192));blur1d(S.L,amt);const i=beatsin16(S.ms,9,0,N-1),j=beatsin16(S.ms,7,0,N-1),k=beatsin16(S.ms,5,0,N-1);const m=S.ms&65535;
    S.L[(i+j)>>1]=hsv2rgb(Math.floor(m/29),100,255);S.L[(j+k)>>1]=hsv2rgb(Math.floor(m/41),100,255);S.L[(k+i)>>1]=hsv2rgb(Math.floor(m/73),100,255);S.L[Math.floor((i+j+k)/3)]=hsv2rgb(Math.floor(m/53),200,255)},
  badge(S){const amt=dim8raw(beatsin8(S.ms,3,64,192));blur2d(S.L,amt);const a=beatf(S.ms,9),b=beatf(S.ms,7),c=beatf(S.ms,5);const m=S.ms&65535;
    const P=[inBoard(a,b),inBoard(b,c),inBoard(c,a)];const Q=[(P[0][0]+P[1][0]+P[2][0])/3,(P[0][1]+P[1][1]+P[2][1])/3];
    S.L[nearest(...P[0])]=hsv2rgb(Math.floor(m/29),100,255);S.L[nearest(...P[1])]=hsv2rgb(Math.floor(m/41),100,255);S.L[nearest(...P[2])]=hsv2rgb(Math.floor(m/73),100,255);S.L[nearest(...Q)]=hsv2rgb(Math.floor(m/53),200,255)}}}},
{key:'juggle_pal',name:'Juggle',note:'The dots oscillated along the chain. Each dot now orbits the badge at its own tempo; the 1, 4 and 8 dot phases of the 30 s cycle are unchanged.',
 make(){let nd=1,beat=3,diff=16,fd=2,hue=0,last=99;const tick=S=>{const sec=Math.floor(S.ms/1000)%30;if(sec!==last){last=sec;if(sec===0){nd=1;beat=3;diff=16;fd=2;hue=0}else if(sec===10){nd=4;beat=2;diff=16;fd=8;hue=128}else if(sec===20){nd=8;beat=1;diff=0;fd=8;hue=rnd8()}}fadeAll(S.L,fd);return hue};return{
  strip(S){let h=tick(S);for(let i=0;i<nd;i++){addTo(S.L[beatsin16(S.ms,beat+i,0,N-1)],colorFromPalette(S.pal,h,255));h=u8(h+diff)}},
  badge(S){let h=tick(S);for(let i=0;i<nd;i++){const [x,y]=inBoard(beatf(S.ms,beat+i),beatf(S.ms,beat+i,Math.PI/2+i*0.7));splat(S.L,x,y,colorFromPalette(S.pal,h,255),6);h=u8(h+diff)}}}}},
{key:'confetti_pal',name:'Confetti',note:'Random LEDs anywhere. Position does not matter, so this one is unchanged.',same:true,
 make(){let hue=50;const f=S=>{fadeAll(S.L,8);S.L[rnd(N)]=colorFromPalette(S.pal,u8(hue+(rnd(256)>>2)),255);hue=u8(hue+1)};return{strip:f,badge:f}}},
];
class Sim{constructor(key,variant){this.L=Array.from({length:N},black);this.set(key,variant)}
  set(key,variant){this.key=key;this.variant=variant;this.fx=EFFECTS.find(e=>e.key===key).make();for(const c of this.L){c[0]=c[1]=c[2]=0}}
  step(ms,pal){this.fx[this.variant]({L:this.L,ms,pal})}}
const disp=(v,bri)=>Math.pow(Math.min(1,v/255*bri/32),1/2.2);
function drawBadge(cv,L,o){const ctx=cv.getContext('2d');const W=cv.width,H=cv.height;const s=Math.min(W/80,H/64);const ox=(W-75*s)/2,oy=(H-59.3*s)/2;
  const P=p=>[ox+p[0]*s,oy+p[1]*s];ctx.clearRect(0,0,W,H);
  ctx.beginPath();OUTLINE.forEach((p,i)=>{const [x,y]=P(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fillStyle='#15161c';ctx.fill();
  if(!o.simple){ctx.lineWidth=Math.max(1,s*0.25);ctx.strokeStyle='rgba(255,255,255,0.07)';ctx.beginPath();for(const [a,b] of FACET_EDGES){const [x1,y1]=P(LEDMM[a]),[x2,y2]=P(LEDMM[b]);ctx.moveTo(x1,y1);ctx.lineTo(x2,y2)}ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.11)';ctx.beginPath();for(let i=0;i<10;i++){const [x1,y1]=P(LEDMM[RIM[i]]),[x2,y2]=P(LEDMM[RIM[(i+1)%10]]);ctx.moveTo(x1,y1);ctx.lineTo(x2,y2)}ctx.stroke()}
  ctx.lineWidth=Math.max(1,s*0.35);ctx.strokeStyle='#363947';ctx.beginPath();OUTLINE.forEach((p,i)=>{const [x,y]=P(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.stroke();
  const cols=L.map(c=>{const r=disp(c[0],o.bri),g=disp(c[1],o.bri),b=disp(c[2],o.bri);return [Math.round(r*255),Math.round(g*255),Math.round(b*255),Math.max(r,g,b)]});
  for(let i=0;i<N;i++){const [x,y]=P(LEDMM[i]);const h=2.5*s;ctx.fillStyle='#24262e';ctx.beginPath();ctx.roundRect(x-h,y-h,2*h,2*h,s*0.6);ctx.fill()}
  if(o.bloom&&!o.simple){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<N;i++){const c=cols[i];if(c[3]<0.02)continue;const [x,y]=P(LEDMM[i]);const R=15*s;
    const g=ctx.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,`rgba(${c[0]},${c[1]},${c[2]},${0.55*c[3]})`);g.addColorStop(0.35,`rgba(${c[0]},${c[1]},${c[2]},${0.18*c[3]})`);g.addColorStop(1,`rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.fill()}ctx.restore()}
  for(let i=0;i<N;i++){const c=cols[i];const [x,y]=P(LEDMM[i]);const r=(o.simple?2.6:2.2)*s;ctx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    if(c[3]>0.6&&!o.simple){ctx.fillStyle=`rgba(255,255,255,${(c[3]-0.6)*0.9})`;ctx.beginPath();ctx.arc(x,y,r*0.45,0,Math.PI*2);ctx.fill()}}
  if(o.map){ctx.save();ctx.font=`${Math.max(10,s*2.4)}px "DM Mono",monospace`;ctx.textAlign='center';ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.lineWidth=Math.max(1,s*0.3);
    for(let i=0;i<N-1;i++){const [x1,y1]=P(LEDMM[i]),[x2,y2]=P(LEDMM[i+1]);const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;const a=[x1+ux*4*s,y1+uy*4*s],b=[x2-ux*4*s,y2-uy*4*s];
      ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.beginPath();ctx.moveTo(b[0],b[1]);ctx.lineTo(b[0]-ux*2.2*s-uy*1.3*s,b[1]-uy*2.2*s+ux*1.3*s);ctx.lineTo(b[0]-ux*2.2*s+uy*1.3*s,b[1]-uy*2.2*s-ux*1.3*s);ctx.closePath();ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fill()}
    ctx.fillStyle='#e6e7ee';for(let i=0;i<N;i++){const [x,y]=P(LEDMM[i]);ctx.fillText(`${REF[i]} · ${i}`,x,y-4.2*s)}ctx.restore()}}

