/* ================= OGIEŃ, GASZENIE, WYBUCHY I POGODA ================= */
const FXM=__FXMETA__;
const FXI={};function fxImg(n){return FXI[n]||(FXI[n]=loadImg('a/fx/'+n+'.webp'))}
const FIRES=[],FXO=[],FXA=[],MOL=[],DEB=[],RS=[];
const WX={t:'',k:0,in:1,flash:0,bolt:0,bx:0,next:9,thunder:0,thT:0};
const BLD={s:[56,60,'fire_small',150],m:[120,130,'fire_med',250],b:[240,210,'fire_band',340],st:[176,80,'fire_strip',200],pf:[150,70,'puddle_fire',160],vb:[0,260,'fire_band',420],fb:[50,90,'barrel_fire',150]};
/* ---------- dźwięk (synteza: brak nagrań ognia i wybuchów) ---------- */
function fxSnd(kind,x,vol=1){if(!ac)return;let v=vol;if(x!=null&&player)v*=clamp(1-Math.abs(x-player.x)/1100,0,1);if(v<.03)return;
  const t=ac.currentTime,g=ac.createGain();g.connect(master);
  const nz=(f,q,tp,d,t0=0)=>{const s=ac.createBufferSource();s.buffer=noiseBuf;s.loop=true;const fl=ac.createBiquadFilter();fl.type=tp||'lowpass';fl.frequency.value=f;fl.Q.value=q||1;s.connect(fl);fl.connect(g);s.start(t+t0);s.stop(t+t0+d);return fl};
  const env=(a,pk,dec)=>{g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(pk*v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec)};
  const osc=(tp,f,d)=>{const o=ac.createOscillator();o.type=tp;o.frequency.value=f;o.connect(g);o.start(t);o.stop(t+d);return o};
  switch(kind){
    case'boom':{const fl=nz(1100,.7,'lowpass',2.8);fl.frequency.exponentialRampToValueAtTime(80,t+2);const o=osc('sine',75,2.4);o.frequency.exponentialRampToValueAtTime(26,t+1.6);env(.008,1.2,2.2);break}
    case'bang':{const fl=nz(2200,.6,'lowpass',1);fl.frequency.exponentialRampToValueAtTime(140,t+.6);const o=osc('sine',90,.7);o.frequency.exponentialRampToValueAtTime(35,t+.4);env(.004,1,.7);break}
    case'whoosh':{const fl=nz(500,1.2,'bandpass',1.4);fl.frequency.exponentialRampToValueAtTime(2400,t+.55);env(.07,.5,1);break}
    case'glass':{nz(5200,3,'highpass',.5);env(.001,.55,.4);break}
    case'hiss':{nz(6500,.8,'highpass',1.4);env(.12,.3,1.2);break}
    case'crackle':{nz(3000,2.5,'bandpass',.1);env(.002,.22,.09);break}
    case'splash':{nz(1700,1,'bandpass',.6);env(.01,.5,.5);break}
    case'cough':{nz(700,2,'bandpass',.4);env(.02,.35,.3);break}
    case'thunder':{const fl=nz(260,.8,'lowpass',4.6);fl.frequency.exponentialRampToValueAtTime(70,t+3.6);env(.5,1,3.8);break}
    case'foam':{nz(4200,.9,'highpass',.7);env(.04,.4,.6);break}
  }}
/* ---------- rysowanie klatek arkuszy ---------- */
function fxFr(n,row,t){const r=FXM[n].rows[row],i=Math.floor(Math.max(0,t)*r.fps);return r.loop?i%8:Math.min(7,i)}
function fxDraw(n,row,t,x,gy,o={}){const m=FXM[n],r=m.rows[row],img=fxImg(n);if(!okI(img))return false;
  const i=fxFr(n,row,t),s=o.s||1,W=m.cw*s,H=m.ch*s,c=ctx;c.save();if(o.a!=null)c.globalAlpha=o.a;if(o.add)c.globalCompositeOperation='lighter';
  if(o.flip){c.translate(x,0);c.scale(-1,1);x=0}
  c.drawImage(img,i*m.cw,r.r*m.ch,m.cw,m.ch,x-W/2,gy-m.gy*s-(o.dy||0),W,H);c.restore();return true}
const BC=document.createElement('canvas');BC.width=480;BC.height=384;const BX=BC.getContext('2d');
function fxBand(row,t,x,gy,w,a,s=1){const m=FXM.fire_band,img=fxImg('fire_band');if(!okI(img))return;const r=m.rows[row],i=fxFr('fire_band',row,t);
  BX.globalCompositeOperation='source-over';BX.clearRect(0,0,480,384);BX.drawImage(img,i*m.cw,r.r*m.ch,m.cw,m.ch,0,0,480,384);
  const ww=Math.min(w/s,478),x0=(480-ww)/2,g=BX.createLinearGradient(x0,0,480-x0,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.16,'#000');g.addColorStop(.84,'#000');g.addColorStop(1,'rgba(0,0,0,0)');
  BX.globalCompositeOperation='destination-in';BX.fillStyle=g;BX.fillRect(0,0,480,384);
  ctx.save();ctx.globalAlpha=a;ctx.drawImage(BC,x-240*s,gy-374*s,480*s,384*s);ctx.restore()}
/* ---------- ogień ---------- */
function addFire(x,f,sz,o={}){const d=BLD[sz],fr={x,f,sz,w:o.w||d[0],hp:(o.hp||d[1])*(o.hpM||1),state:'start',t:0,ph:R()*6,life:o.life==null?Infinity:o.life,src:o.src||'',cont:o.cont||null,obj:o.obj||null,out:0,emT:0,cr:0};
  fr.max=fr.hp;const b=bAt(x,f);if(!o.noLight){const lm={x,y:F[f]-60,r:d[3],i:.62,f,flick:1};if(b)lm.b=b;lamps.push(lm);fr.lamp=lm}
  FIRES.push(fr);if(o.snd!==false)fxSnd('whoosh',x,.6);return fr}
const fireAct=fr=>fr.state==='start'||fr.state==='loop';
function dropLamp(fr){if(fr.lamp){const i=lamps.indexOf(fr.lamp);if(i>=0)lamps.splice(i,1);fr.lamp=null}}
function igniteZ(z,s=4){if(z.dead||z.jy<-40)return;if(!(z.burnT>0)){const T=ZT[z.type];if(T&&T.animal&&z.type==='kruk')return}z.burnT=Math.max(z.burnT||0,s)}
function fireOut(fr){dropLamp(fr);FXA.push({k:'puff',x:fr.x,f:fr.f,t:0});fxSnd('hiss',fr.x,.6);
  if(fr.obj&&fr.obj.k==='veh'&&fr.obj.st==='burning'){fr.obj.st='cool';fr.obj.fuse=null;aTip('vehout','Ugasiłeś płonący wóz. Nie wybuchnie.',2600)}
  if(fr.cont){const c=fr.cont;if(!FIRES.some(q=>q!==fr&&q.cont===c&&q.state!=='embers'&&q.state!=='die')){showState('Pożar ugaszony','Droga wolna:');toast('Możesz dostać się do schowka.',2200)}}}
function updFires(dt){const p=player,rain=WX.t==='rain'||WX.t==='storm';
  for(let i=FIRES.length-1;i>=0;i--){const fr=FIRES[i];fr.t+=dt;
    if(fr.state==='start'&&fr.t>.7){fr.state='loop';fr.t=0}
    if(fireAct(fr)){
      if(rain&&!bAt(fr.x,fr.f))fr.hp-=dt*(fr.sz==='b'?10:20)*WX.k;
      if(fr.life!==Infinity){fr.life-=dt;if(fr.life<=0)fr.out=1}
      if(fr.hp<=0)fr.out=1;
      fr.cr-=dt;if(fr.cr<=0){fr.cr=.5+R()*.9;if(Math.abs(fr.x-p.x)<600)fxSnd('crackle',fr.x,.35)}
      if(fr.lamp){fr.lamp.r=BLD[fr.sz][3]*(.9+Math.sin(time*9+fr.ph)*.1)}
      if(!fr.out){
        const half=fr.w*.5;
        if(p&&!p.dead&&p.f===fr.f&&!p.stair&&!p.climb&&!p.fallJ&&Math.abs(p.x-fr.x)<half+12){p.burnT=Math.max(p.burnT||0,2.6);p.inFire=.15}
        for(const z of zombies)if(!z.dead&&z.f===fr.f&&!z.stair&&Math.abs(z.x-fr.x)<half+10)igniteZ(z,4);
        for(const o of FXO)if(o.f===fr.f&&o!==fr.obj&&Math.abs(o.x-fr.x)<o.w*.5+half*.7)fxIgnite(o)}
      else{fr.state='die';fr.t=0;fireOut(fr)}}
    else if(fr.state==='die'&&fr.t>.7){fr.state='embers';fr.t=0}
    else if(fr.state==='embers'){fr.emT+=dt;if(fr.emT>(fr.src==='veh'?30:22)||fr.noEmb){FIRES.splice(i,1)}}}}
/* ---------- gaszenie ---------- */
function fxDouse(x,f,reach,power,face){let n=0;for(const fr of FIRES){if(!fireAct(fr)||fr.f!==f)continue;const d=(fr.x-x)*(face||0);if(face&&d<-fr.w*.5)continue;if(Math.abs(fr.x-x)<reach+fr.w*.5){fr.hp-=power;n++}}
  for(const z of zombies)if(z.burnT>0&&!z.dead&&z.f===f&&Math.abs(z.x-x)<reach&&(!face||(z.x-x)*face>-20))z.burnT=0;return n}
function useDouseItem(fr,id){const p=player;if(!gCount(p.bag,id))return;gTake(p.bag,id,1);
  const pw=id==='water_bucket'?190:(fr.sz==='b'||fr.sz==='vb'?80:150);fr.hp-=pw;
  FXA.push(id==='water_bucket'?{k:'water',x:p.x+p.face*18,f:p.f,face:Math.sign(fr.x-p.x)||p.face,t:0}:{k:'blanket',x:fr.x,f:fr.f,t:0});
  fxSnd(id==='water_bucket'?'splash':'cough',p.x,.8);p.atk=p.atkDur=.5;p.atkHit=true;if(fr.hp>0)toast(id==='fire_blanket'?'Koc nie wystarcza na tak duży ogień.':'Za mało wody, ogień nadal płonie.',1800)}
/* ---------- obiekty: pojazdy, beczki, zarodniki ---------- */
const VEH={car:[540,192,230,46],van:[620,284,270,52],bus:[1120,381,330,58]};
function mkVeh(v,x,f,burning){const d=VEH[v],o={k:'veh',v,x,f,w:d[0],h:d[1],R:d[2],dm:d[3],st:'intact',flip:R()<.5,fuse:null,armed:false,t:0,ph:R()*6};if(burning){o.st='burning';o.fuse=13+R()*11;o.fire=addFire(x,f,'vb',{w:o.w*.55,obj:o,src:'veh',snd:false,hp:230+o.w*.12})}return o}
function fxIgnite(o){if(o.k==='veh'&&o.st==='intact'){o.st='burning';o.fuse=9+R()*7;o.armed=true;o.fire=addFire(o.x,o.f,'vb',{w:o.w*.55,obj:o,src:'veh',hp:230+o.w*.12})}
  else if(o.k==='bar'&&o.v==='ex'&&o.st==='idle'){o.st='hit';o.t=0}
  else if(o.k==='bar'&&o.v==='tox'&&o.st==='idle'){fxLeak(o)}
  else if(o.k==='spo'&&o.st!=='fade'){o.st='fade';o.t=0}}
function fxLeak(o){o.st='leak';o.t=0;FXO.push({k:'pool',x:o.x,f:o.f,w:230,t:0,ph:R()*5,p:null});fxSnd('hiss',o.x,.5);aTip('tox','Beczka cieknie. Toksyczna kałuża zatruwa.',2600)}
function fxBoom(o){const R_=o.R||160,x=o.x,f=o.f;
  if(o.k==='veh'){o.st='boom';o.t=0;o.fuse=null;if(o.fire){o.fire.hp=0;o.fire.noEmb=1}}
  else{o.st='boom';o.t=0}
  fxSnd(o.k==='veh'?'boom':'bang',x,1);shake=Math.max(shake,o.k==='veh'?26:18);emitNoise(x,f,o.k==='veh'?1200:900,'combat');
  explodeAt(x,f,R_,o.dm||38,o);
  for(let i=0;i<(o.k==='veh'?10:5);i++){const it=FXM.debris.items[(R()*12)|0];DEB.push({x:x+(R()-.5)*60,y:F[f]-40-R()*70,vx:(R()-.5)*620,vy:-300-R()*420,r:R()*6,vr:(R()-.5)*14,it,f,t:0})}
  P('fxo',x,f,{o:{k:'scorch',x,f,w:R_*1.7},decal:true})}
function explodeAt(x,f,R_,dm,src){const p=player;
  if(p&&!p.dead&&p.f===f){const d=Math.abs(p.x-x);if(d<R_*1.15&&!p.inv){const k=1-d/(R_*1.15),dir=Math.sign(p.x-x)||1;p.hp-=Math.round(dm*(.25+.75*k));p.hurt=.4;p.inv=.5;flashT=.6;p.burnT=Math.max(p.burnT||0,k>.4?3:0);p.search=null;moveEnt(p,dir*60*k);for(let i=0;i<8;i++)blood(p.x,p.y-90,p.f,dir);if(p.hp<=0)die()}}
  for(const z of zombies){if(z.dead||z.f!==f)continue;const d=Math.abs(z.x-x);if(d>R_*1.2)continue;const dir=Math.sign(z.x-x)||1;igniteZ(z,5);
    if(d<R_*.6)killZombie(z,dir);else hitZ(z,(ZT[z.type].hp||3)*.8,dir,300)}
  for(const o of FXO){if(o===src||o.f!==f||Math.abs(o.x-x)>R_*1.1)continue;
    if(o.k==='veh'&&o.st!=='boom'&&o.st!=='charred'){if(o.st==='intact')fxIgnite(o);o.fuse=Math.min(o.fuse==null?99:o.fuse,.5+R()*.7)}
    else if(o.k==='bar'&&(o.st==='idle'||o.st==='hit'||o.st==='burn')){o.fuse=Math.min(o.fuse==null?99:o.fuse,.35+R()*.5);if(o.st==='idle')o.st='hit',o.t=0}
    else if(o.k==='spo')fxIgnite(o)}
  if(src&&src.k!=='bar'||R()<.6)addFire(x+(R()-.5)*R_*.7,f,src&&src.k==='veh'?'m':'s',{life:7+R()*8,src:'veh'})}
function mkBar(v,x,f){const o={k:'bar',v,x,f,w:56,R:150,dm:38,st:v==='fb'?'fb':'idle',t:R()*3,fuse:null,ph:R()*5};
  if(v==='fb')o.fire=addFire(x,f,'fb',{obj:o,src:'bar',snd:false,w:50});return o}
function updObjs(dt){const p=player;for(const z of zombies)if(z.dead)z.fxD=(z.fxD||0)+dt;
  for(let i=FXO.length-1;i>=0;i--){const o=FXO[i];o.t+=dt;
    if(o.k==='veh'){
      if(o.st==='burning'){if(!o.armed&&p&&p.f===o.f&&Math.abs(p.x-o.x)<900)o.armed=true;
        if(o.armed){o.fuse-=dt;if(o.fuse<4.2&&R()<dt*3)fxSnd('crackle',o.x,.6);if(o.fuse<=0)fxBoom(o)}}
      else if(o.st==='intact'&&o.fuse!=null){o.fuse-=dt;if(o.fuse<=0)fxBoom(o)}
      else if(o.st==='boom'&&o.t>.38&&!o.sw)o.sw=1;
      else if(o.st==='boom'&&o.t>1.6){o.st='charred';addFire(o.x+(R()-.5)*o.w*.4,o.f,'m',{life:14+R()*10,src:'veh',snd:false,hpM:.7}) }}
    else if(o.k==='bar'){
      if(o.st==='hit'&&o.t>.6){o.st='burn';o.t=0;o.fuse=o.fuse==null?2.2:o.fuse;fxSnd('hiss',o.x,.8);aTip('exbar','Czerwona beczka płonie. Odsuń się.',2600)}
      if(o.st==='burn'){o.fuse=(o.fuse==null?2.2:o.fuse)-dt;if(o.fuse<=0)fxBoom(o)}
      if(o.st==='boom'&&o.t>.9){o.st='remains';addFire(o.x,o.f,'s',{life:8,src:'bar',snd:false})}}
    else if(o.k==='spo'){
      if(o.st==='fade'){if(o.t>.9)FXO.splice(i,1);continue}
      const near=p&&!p.dead&&p.f===o.f&&Math.abs(p.x-o.x)<o.w*.36&&!p.stair&&!p.climb;
      if(near){if(o.st==='idle'){o.st='burst';o.t=0;fxSnd('hiss',o.x,.4)}p.sporeT=.3;if(!o.cough||time>o.cough){o.cough=time+1.2;fxSnd('cough',p.x,.7);emitNoise(p.x,p.f,300,'combat');aTip('spor','Zarodniki! Kaszlesz i tracisz zdrowie. Wyjdź z chmury.',2800)}}
      if(o.st==='burst'&&o.t>.7){o.st='idle';o.t=0}}
    else if(o.k==='pool'){const pp=p&&!p.dead&&p.f===o.f&&Math.abs(p.x-o.x)<o.w*.4&&o.t>.6;if(pp){p.toxT=.3}}}
  if(p&&!p.dead){
    if(p.inFire>0)p.inFire-=dt;
    if(p.burnT>0){p.burnT-=dt;p.hp-=dt*(p.inFire>0?9:4.5);if(!p.bsnd||time>p.bsnd){p.bsnd=time+.8;sfx('hurt')}if(R()<dt*5)flashT=Math.max(flashT,.12);if(p.hp<=0)die()}
    if(p.sporeT>0){p.sporeT-=dt;p.hp-=dt*1.7;if(p.hp<=0)die()}
    if(p.toxT>0){p.toxT-=dt;p.hp-=dt*2.3;if(p.hp<=0)die()}}
  for(const z of zombies){if(z.dead||!(z.burnT>0))continue;z.burnT-=dt;const T=ZT[z.type]||{hp:3};z.hp-=dt*T.hp/3.6;if(R()<dt*3)blood(z.x,z.y-90,z.f,z.face);if(z.hp<=0)killZombie(z,-z.face)}
  /* pociski trafiają beczki */
  for(const q of PROJ){if(q.done)continue;for(const o of FXO)if(o.k==='bar'&&o.f===q.f&&Math.abs(o.x-q.x)<26&&(o.st==='idle'||o.st==='fb')){fxIgnite(o);q.done=true;break}}}
/* ---------- koktajl Mołotowa ---------- */
Object.assign(WP,{molotov:{n:'Koktajl Mołotowa',typ:'rzucana',sk:'',dmg:.2,reach:80,atkD:.55,stc:10,noise:200,dur:1,kb:0,melee:false,molo:true,maxH:1}});
ID.molotov={n:'Koktajl Mołotowa',w:1,h:2,c:'Broń',wpn:true,d:'Butelka z benzyną i płonącą szmatą. Rzucasz atakiem, na ziemi zostaje pas ognia. Jednorazowy.'};
ID.water_bucket={n:'Wiadro z wodą',w:2,h:2,c:'Materiały',stack:1,d:'Do gaszenia: stań przy ogniu i użyj [E]. Wylewasz całą wodę.'};
ID.fire_blanket={n:'Koc gaśniczy',w:2,h:2,c:'Materiały',stack:1,d:'Dusi mały i średni ogień. Na duży nie wystarcza. Jednorazowy.'};
for(const k of['molotov','water_bucket','fire_blanket']){ICON_AT[k]={single:'a/w/'+k+'.webp'};loadImg('a/w/'+k+'.webp')}
if(RECIPES.warsztat){const L=RECIPES.warsztat.list;
  L.push({n:'Koktajl Mołotowa',d:'Szmata i kanister benzyny. Daje dwie butelki.',need:{rags:1,fuel_can:1},out:['molotov',2]},{n:'Koc gaśniczy',d:'Zbita szmaciana tkanina do duszenia ognia.',need:{rags:4,tasma:1},out:['fire_blanket',1]})}
for(const k of['welding_cart','tool_cabinet','lockers','oil_drums','box_pile','trash_bin'])if(PLOOT[k])PLOOT[k][2].push(['molotov',.05,1,1],['fire_blanket',.07,1,1],['water_bucket',.06,1,1]);
function throwMolotov(){const p=player;p.hidden=null;p.search=null;p.atk=p.atkDur=.55;p.atkHit=true;
  MOL.push({x:p.x+p.face*28,y:p.y-110,vx:p.face*(360+(p.moving?70:0)),vy:-300,f:p.f,t:0,rot:0});p.weapon=null;fxSnd('whoosh',p.x,.5);emitNoise(p.x,p.f,200,'combat');showState('Bez broni','Rzut:')}
function updMol(dt){for(let i=MOL.length-1;i>=0;i--){const m=MOL[i];m.t+=dt;m.vy+=900*dt;const ox=m.x;m.x+=m.vx*dt;m.y+=m.vy*dt;m.rot+=dt*14;let hit=m.y>=F[m.f]-6;
    for(const bl of blockersOn(m.f))if(!(bl.door&&bl.open)&&(bl.x-m.x)*(bl.x-ox)<=0)hit=true;
    for(const z of zombies)if(!z.dead&&z.f===m.f&&!z.stair&&Math.abs(z.x-m.x)<28&&m.y>F[m.f]-170&&m.y<F[m.f]+10)hit=true;
    if(hit){const gx=m.x;MOL.splice(i,1);fxSnd('glass',gx,.9);fxSnd('whoosh',gx,.8);emitNoise(gx,m.f,420,'distract');
      FXA.push({k:'molo',x:gx,f:m.f,t:0});const fr=addFire(gx,m.f,'st',{life:8+R()*3,src:'mol',snd:false});
      for(const z of zombies)if(!z.dead&&z.f===m.f&&Math.abs(z.x-gx)<fr.w*.6)igniteZ(z,5)}}}
/* ---------- nowy poziom: ogień w pokojach, pojazdy, pogoda ---------- */
function fxSpawnLevel(poi){if(!LV)return;for(const n of['fire_small','fire_med','fire_band','smoke','fire_out_puff','water_splash','blanket_cover','extinguisher_foam','molotov_fly','molotov_impact','fire_strip','burning_overlay','puddle_fire'])fxImg(n);const id=LV.id,forest=id==='las_podnoze'||id==='szlak_gorski'||id==='park';
  /* pożar blokujący dostęp do schowka */
  const cands=containers.filter(c=>bAt(c.x,c.f)&&!c.searched);
  const n=cands.length&&R()<.72?(R()<.3?2:1):0;
  for(let i=0;i<n&&cands.length;i++){const c=cands.splice((R()*cands.length)|0,1)[0];
    c.loot=c.loot.concat([['bandaz',.55,1,2],['woda',.5,1,2],['mre',.35,1,2],['antibiotics',.22,1,1],['molotov',.12,1,1],['gasnica',.1,1,1]]);
    addFire(c.x,c.f,R()<.5?'b':'m',{cont:c,src:'room',w:R()<.5?150:210,snd:false});
    if(R()<.7)addFire(c.x+(R()<.5?-1:1)*(70+R()*40),c.f,'s',{cont:c,src:'room',snd:false})}
  for(const p of props)if(p.t==='lp'&&p.lp==='skeleton')FXO.push({k:'fly',x:p.x,f:p.f,w:60,ph:R()*9});
  /* pogoda */
  const r=R();WX.t='';WX.k=0;WX.flash=0;WX.next=5+R()*6;WX.in=1;
  if(forest){if(r<.32){WX.t='fog';WX.k=r<.1?1:.6}else if(r<.5){WX.t='rain';WX.k=.7+R()*.3}else if(r<.58){WX.t='storm';WX.k=1}}
  else{if(r<.18){WX.t='fog';WX.k=r<.05?1:.5}else if(r<.3){WX.t='rain';WX.k=.6+R()*.4}else if(r<.36){WX.t='storm';WX.k=1}}
  WX.fog=WX.t==='fog'?(WX.k>=1?'fog_dense':WX.k>.5?'fog_mid':'fog_thin'):null;
  if(WX.t){for(const n of(WX.t==='fog'?[WX.fog,'fog_ground']:['rain_far','rain_near','rain_splash','rain_splash_puddle'].concat(WX.t==='storm'?['lightning_flash','wind_leaves']:[])))fxImg(n);
    if(WX.t==='storm')for(let i=1;i<=4;i++)fxImg('bolt'+i);
    const msg={fog:'Gęsta mgła. Zombie widzą mniej, Ty też.',rain:'Deszcz. Kroki są cichsze, ogień gaśnie na zewnątrz.',storm:'Burza. Grzmoty zagłuszają hałas, ale ściągają zombie.'}[WX.t];setTimeout(()=>{if(mode==='play')toast(msg,3400)},1600)}}
function fxPlace(id,x,r){
  if(id==='fx_car'){const q=R(),v=q<.58?'car':q<.9?'van':'bus',d=VEH[v],o=mkVeh(v,x+d[0]/2,0,R()<.45);fxImg('veh_'+v+'_intact');fxImg('veh_'+v+'_charred');FXO.push(o);P('fxo',o.x,0,{o});return d[0]+10}
  if(id==='fx_barrel'){const n=1+((R()*3)|0);let w=0;for(let i=0;i<n;i++){const q=R(),v=q<.45?'ex':q<.75?'tox':'fb',o=mkBar(v,x+w+30,0);FXO.push(o);P('fxo',o.x,0,{o});w+=66}
    for(const nm of['barrel_explosive','barrel_boom','barrel_toxic','barrel_fire','toxic_pool','toxic_cloud','vehicle_explosion_fx'])fxImg(nm);return w}
  if(id==='fx_spores'){const o={k:'spo',x:x+110,f:0,w:230,st:'idle',t:R()*3};FXO.push(o);P('fxo',o.x,0,{o});fxImg('spores_cloud');return 220}
  return 0}
for(const k of['srodmiescie','blokowisko','warsztaty','zaklad_okien','baza_kurierska','centrum_handlowe'])if(TPL[k])TPL[k].street.push('fx_car','fx_barrel');
for(const k of['las_podnoze','szlak_gorski','park'])if(TPL[k])TPL[k].street.push('fx_spores');
for(const k of['osiedle_domkow'])if(TPL[k])TPL[k].street.push('fx_car');
placeLP=(function(_f){return function(id,x,r,zs){if(typeof id==='string'&&id.startsWith('fx_'))return fxPlace(id,x,r);return _f(id,x,r,zs)}})(placeLP);
genLevel=(function(_g){return function(poi){const z=_g(poi);try{fxSpawnLevel(poi)}catch(e){console.error('fxSpawn',e)}return z}})(genLevel);
resetLevel=(function(_f){return function(){_f();FIRES.length=FXO.length=FXA.length=MOL.length=DEB.length=RS.length=0;WX.t='';WX.k=0}})(resetLevel);
/* ---------- rysowanie świata ---------- */
function fxDrawObj(o){const c=ctx,gy=F[o.f]+6;
  if(o.k==='veh'){const nm=(o.st==='charred'||(o.st==='boom'&&o.t>.38))?'veh_'+o.v+'_charred':'veh_'+o.v+'_intact',img=fxImg(nm),m=FXM[nm];if(!okI(img))return;
    const shk=o.st==='burning'&&o.fuse!=null&&o.fuse<4?Math.sin(time*60)*1.4:0;
    c.save();c.translate(o.x+shk,gy+2);if(o.flip)c.scale(-1,1);c.drawImage(img,-m.w/2,-m.h,m.w,m.h);c.restore();return}
  if(o.k==='bar'){const gy2=F[o.f]+6;
    if(o.st==='remains'||(o.st==='boom'&&o.t>.15)){const img=fxImg('barrel_remains');if(okI(img))c.drawImage(img,o.x-img.naturalWidth/2,gy2-img.naturalHeight+3)}
    else if(o.v==='fb'){const fr=o.fire;if(fr&&fr.state==='embers'||(fr&&fr.state==='die'&&fr.t>.5)){const img=fxImg('barrel_remains');if(okI(img))c.drawImage(img,o.x-img.naturalWidth/2,gy2-img.naturalHeight+3)}else fxDraw('barrel_fire',fr&&fr.state==='die'?'die':'loop',fr?fr.t+fr.ph:time,o.x,gy2)}
    else if(o.v==='ex')fxDraw('barrel_explosive',o.st==='hit'?'hit':o.st==='burn'?'burn':'idle',o.st==='idle'?o.t:o.t,o.x,gy2);
    else if(o.v==='tox')fxDraw('barrel_toxic',o.st==='leak'?'leak':'idle',o.t,o.x,gy2);return}
  if(o.k==='pool'){const gr=Math.min(1,o.t/.67);if(o.t<.67)fxDraw('toxic_pool','grow',o.t,o.x,gy,{a:.95});else fxDraw('toxic_pool','loop',o.t-.67,o.x,gy,{a:.95});return}
  if(o.k==='scorch'){const img=fxImg('scorch_decal');if(okI(img)){const W=o.w,H=W*img.naturalHeight/img.naturalWidth;c.save();c.globalAlpha=.8;c.drawImage(img,o.x-W/2,gy-H*.62,W,H);c.restore()}return}}
function fxDrawFire(fr){const c=ctx,gy=F[fr.f]+4,st=fr.state,d=BLD[fr.sz],t=fr.t;
  if(st==='embers'){const a=Math.max(0,1-fr.emT/(fr.src==='veh'?30:22))*.9;if(fr.sz==='vb')return;if(fr.sz==='fb')return;const n=fr.sz==='b'?2:1;
    for(let i=0;i<n;i++)fxDraw('fire_med','embers',fr.t+i,fr.x+(i-.5*(n-1))*fr.w*.4,gy,{a,s:fr.sz==='s'?.6:fr.sz==='b'?1:.9});return}
  const row=st==='start'?'start':st==='die'?'die':'loop',tt=st==='loop'?t+fr.ph:t,a=st==='die'?1:1;
  switch(fr.sz){
    case's':fxDraw('fire_small',row,tt,fr.x,gy,{});break;
    case'm':{fxDraw('fire_med',row,tt,fr.x-fr.w*.2,gy,{s:.85});fxDraw('fire_med',row,tt+.37,fr.x+fr.w*.22,gy,{s:1.05,flip:true});break}
    case'b':{fxBand(row,tt,fr.x,gy,fr.w,1,1);if(st==='loop')fxDraw('smoke','thick',time+fr.ph,fr.x,gy-210,{a:.55});break}
    case'st':fxBand(row,tt,fr.x,gy+3,fr.w*1.25,1,.5);break;
    case'pf':fxBand(row,tt,fr.x,gy+3,fr.w*1.2,1,.38);break;
    case'vb':{const o=fr.obj,hh=o?o.h:150,g0=gy+2-hh*.45,sc=o?(o.v==='bus'?1.15:o.v==='van'?1:.95):1,hot=o&&o.fuse!=null&&o.fuse<4.5?1.15:1,w=(o?o.w:300);
      const sgn=o&&o.flip?-1:1;if(st==='loop')fxDraw('smoke','thick',time+fr.ph,fr.x-sgn*w*.1,g0-hh*.4,{a:.65,s:1.3});
      const nb=o&&o.v==='bus'?3:2;for(let i=0;i<nb;i++){const dx=(i-(nb-1)/2)*w*.3;fxBand(row,tt+i*.3,fr.x+dx,g0,w*.46,Math.min(1,.8*hot),.9*sc*hot)}break}
    case'fb':break}}
function fxDrawWorld(){const c=ctx,vx0=camX-400,vx1=camX+viewW+400;
  /* kałuże/zarodniki/muchy (przed płomieniami) */
  for(const o of FXO){if(o.x<vx0||o.x>vx1)continue;const gy=F[o.f]+6;
    if(o.k==='pool'&&o.t>.6)fxDraw('toxic_cloud','loop',o.t,o.x,gy-4,{a:.5,s:.95});
    else if(o.k==='bar'&&o.v==='tox'&&o.st==='leak')fxDraw('toxic_cloud','loop',o.t,o.x,gy-60,{a:.35,s:.55});
    else if(o.k==='spo'){const row=o.st==='fade'?'fade':o.st==='burst'?'burst':'idle';fxDraw('spores_cloud',row,o.st==='idle'?time+o.t:o.t,o.x,gy+10,{a:.78,s:1.1})}
    else if(o.k==='fly')fxDraw('fly_swarm','loop',time*.9+o.ph,o.x,gy-52,{s:.55,a:.9});
    else if(o.k==='bar'&&o.st==='boom')fxDraw('barrel_boom','boom',o.t,o.x,gy+2,{s:1.15});
    else if(o.k==='veh'&&o.st==='boom'){const sc=o.v==='bus'?2.1:o.v==='van'?1.6:1.4;fxDraw('vehicle_explosion_fx','boom',o.t*.9,o.x,gy+16,{s:sc})}}
  for(const z of zombies)if(z.dead&&z.x>vx0&&z.x<vx1&&z.fxD>4&&((z.ph*7)|0)%3===0)fxDraw('fly_swarm','loop',time*.9+z.ph,z.x,F[z.f]-6,{s:.5,a:.8});
  for(const fr of FIRES){if(fr.x<vx0||fr.x>vx1)continue;fxDrawFire(fr)}
  for(const z of zombies){if(z.dead||!(z.burnT>0)||z.x<vx0||z.x>vx1)continue;const H=(ZT[z.type]||{}).H||175;const k=clamp(H/175,.3,1.4);fxDraw('burning_overlay','loop',time+z.ph,z.x,z.y+(z.jy||0)+3,{s:k,a:.95})}
  const p=player;if(p&&p.burnT>0&&!p.dead)fxDraw('burning_overlay','loop',time,p.x,p.y+3,{a:.95});
  for(const m of MOL){const img=fxImg('molotov_fly');if(!okI(img))continue;c.save();c.translate(m.x,m.y);c.rotate(m.rot);c.drawImage(img,0,0,72,72,-30,-30,60,60);c.restore()}
  for(const a of FXA){const gy=F[a.f]+4;
    if(a.k==='puff')fxDraw('fire_out_puff','puff',a.t,a.x,gy+2,{a:.9});
    else if(a.k==='molo')fxDraw('molotov_impact','splash',a.t,a.x,gy+2,{});
    else if(a.k==='water')fxDraw('water_splash','bucket_throw',a.t,a.x+a.face*60,gy,{flip:a.face<0});
    else if(a.k==='blanket')fxDraw('blanket_cover','cover',a.t,a.x,gy,{});
    else if(a.k==='foam'){const pl=player,row=a.t<.67?'spray_start':a.t<1.4?'spray_loop':'spray_end',tt=a.t<.67?a.t:a.t<1.4?a.t-.67:a.t-1.4;const m=FXM.extinguisher_foam,img=fxImg('extinguisher_foam');if(!okI(img))continue;
      const i=fxFr('extinguisher_foam',row,tt),r=m.rows[row],hx=pl.x+a.face*26,hy=pl.y-88;c.save();c.translate(hx,hy);if(a.face<0)c.scale(-1,1);c.drawImage(img,i*m.cw,r.r*m.ch,m.cw,m.ch,0,-m.ch/2,m.cw,m.ch);c.restore()}}
  for(const d of DEB){const img=fxImg('debris');if(!okI(img))continue;c.save();c.translate(d.x,d.y);c.rotate(d.r);const it=d.it;c.drawImage(img,it.x,it.y,it.w,it.h,-it.w*.25,-it.h*.25,it.w*.5,it.h*.5);c.restore()}
  if(WX.t==='rain'||WX.t==='storm')for(const s of RS){const pud=s.pud;fxDraw(pud?'rain_splash_puddle':'rain_splash',pud?'splash_puddle':'splash',s.t,s.x,s.y,{a:.8})}}
function fxUpdate(dt){if(!player||mode!=='play')return;
  updFires(dt);updObjs(dt);updMol(dt);
  for(let i=FXA.length-1;i>=0;i--){const a=FXA[i];a.t+=dt;if(a.t>(a.k==='foam'?2.1:1.1))FXA.splice(i,1)}
  for(let i=DEB.length-1;i>=0;i--){const d=DEB[i];d.t+=dt;d.vy+=1100*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.r+=d.vr*dt;if(d.y>F[d.f]-6){d.y=F[d.f]-6;d.vy*=-.3;d.vx*=.5;d.vr*=.4}if(d.t>2.4)DEB.splice(i,1)}
  const p=player,inB=!!(bAt(p.x,p.f));WX.in=lerp(WX.in,inB?.18:1,Math.min(1,dt*3));
  if(WX.t==='rain'||WX.t==='storm'){const nn=dt*WX.k*16;for(let q=nn;q>0;q-=1)if(q>=1||R()<q){RS.push({x:camX+R()*viewW,y:F[0]+6+R()*16,t:0,pud:R()<.3})}
    for(let i=RS.length-1;i>=0;i--){RS[i].t+=dt;if(RS[i].t>.7)RS.splice(i,1)}}
  if(WX.t==='storm'){WX.next-=dt;if(WX.thunder>0)WX.thunder-=dt;
    if(WX.next<=0){WX.next=6+R()*11;WX.flash=.7;WX.bolt=1+((R()*4)|0);WX.bx=p.x+(R()-.5)*1300;const dist=Math.abs(WX.bx-p.x),dl=.25+dist/900*1.6;
      setTimeout(()=>{if(mode==='play'){fxSnd('thunder',null,.9);WX.thunder=4;emitNoise(WX.bx,0,520,'distract')}},dl*1000)}
    if(WX.flash>0)WX.flash-=dt}}
/* ---------- pogoda: warstwy ekranowe ---------- */
function wxTile(name,row,t,y,scl,par,a,tw0){const m=FXM[name],img=fxImg(name);if(!okI(img)||a<=.01)return;const s=scale*dpr,i=fxFr(name,row,t),r=m.rows[row],tw=m.cw*scl*s,th=m.ch*scl*s,cw=cv.width;
  let x=-(((camX*par*s)%tw)+tw)%tw;ctx.save();ctx.globalAlpha=Math.min(1,a);for(;x<cw;x+=tw-1)ctx.drawImage(img,i*m.cw,r.r*m.ch,m.cw,m.ch,x,y-th,tw,th);ctx.restore()}
function fxDrawWeather(){const p=player;if(!p||mode!=='play'||!LV||!WX.t||G.inBase)return;const c=ctx,s=scale*dpr,cw=cv.width,ch=cv.height,ph=phase(),dim=1-.55*ph,k=WX.k*WX.in*dim,hy=(F[0]-camY)*s;
  c.save();c.setTransform(1,0,0,1,0,0);
  if(WX.t==='fog'){c.fillStyle=`rgba(150,160,162,${.17*WX.k*dim*WX.in})`;c.fillRect(0,0,cw,ch);
    wxTile(WX.fog,'drift',time*.45,hy-60*s,2.6,.2,.5*WX.in*dim);wxTile(WX.fog,'drift',time*.55+3,hy+40*s,2.2,.35,.8*WX.in*dim);
    wxTile('fog_ground','roll',time*.5,hy+30*s,2.4,.6,.7*WX.in*dim)}
  else{
    if(WX.t==='storm'){c.fillStyle=`rgba(8,12,22,${.26*WX.in})`;c.fillRect(0,0,cw,ch);
      const cl=fxImg('storm_clouds_black');if(okI(cl)){const tw=cl.naturalWidth*3*s*.5,th=cl.naturalHeight*3*s*.5;let x=-(((camX*.1*s)%tw)+tw)%tw;c.save();c.globalAlpha=.55*WX.in;for(;x<cw;x+=tw-1)c.drawImage(cl,x,0,tw,th);c.restore()}}
    wxTile('rain_far','fall',time,ch,.9,.3,.5*WX.k*WX.in);wxTile('rain_near','fall',time*1.1,ch,1.3,.5,.55*WX.k*WX.in);
    /* wyższy rząd kafelków, gdy kafelek nie sięga góry */
    wxTile('rain_far','fall',time,ch-512*.9*s,.9,.3,.5*WX.k*WX.in);wxTile('rain_near','fall',time*1.1,ch-512*1.3*s,1.3,.5,.55*WX.k*WX.in);
    if(WX.t==='storm'){wxTile('wind_leaves','gust',time,hy+10*s,1.1,.8,.28*WX.in);
      if(WX.flash>0){const fi=Math.min(7,Math.floor((.7-WX.flash)*12)),img=fxImg('lightning_flash');if(okI(img)){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(1,WX.flash*1.4)*WX.in*.9;c.drawImage(img,fi*512,0,512,512,0,0,cw,ch);c.restore()}
        const bi=fxImg('bolt'+WX.bolt);if(okI(bi)&&WX.flash>.35){const bh=ch*.85,bw=bh*bi.naturalWidth/bi.naturalHeight;c.save();c.globalAlpha=Math.min(1,(WX.flash-.3)*3)*WX.in;c.drawImage(bi,(WX.bx-camX)*s-bw/2,0,bw,bh);c.restore()}}}}
  c.restore()}
/* ---------- podpięcia do silnika ---------- */
inView=(function(_f){return function(p){if(p.t==='fxo'&&p.o&&p.o.w)return p.o.x>camX-p.o.w/2-60&&p.o.x<camX+viewW+p.o.w/2+60;return _f(p)}})(inView);
const _dp0=drawProp;drawProp=function(p){if(p.t==='fxo'){fxDrawObj(p.o);return}return _dp0(p)};
drawSpitFx=(function(_f){return function(){_f();try{fxDrawWorld()}catch(e){if(!fxDrawWorld.err){fxDrawWorld.err=1;console.error('fxDrawWorld',e)}}}})(drawSpitFx);
drawForeground=(function(_f){return function(){_f();try{fxDrawWeather()}catch(e){if(!fxDrawWeather.err){fxDrawWeather.err=1;console.error('fxDrawWeather',e)}}}})(drawForeground);
updSpitFx=(function(_f){return function(dt){_f(dt);try{fxUpdate(dt)}catch(e){if(!fxUpdate.err){fxUpdate.err=1;console.error('fxUpdate',e)}}}})(updSpitFx);
interactTargets=(function(_f){return function(){let o=_f();const p=player;if(!p)return o;
  const bl=FIRES.filter(f=>f.f===p.f&&f.cont&&fireAct(f));
  if(bl.length)o=o.filter(t=>!(/^(Przeszukaj|Otwórz): /.test(t.label||'')&&bl.some(f=>Math.abs(t.x-f.x)<f.w*.5+30)));
  for(const fr of FIRES){if(!fireAct(fr)||fr.f!==p.f||Math.abs(fr.x-p.x)>fr.w*.5+60)continue;
    const big=fr.sz==='b'||fr.sz==='vb';
    if(gCount(p.bag,'water_bucket'))o.push({x:fr.x,pri:1,label:'Zalej ogień wodą',act:()=>useDouseItem(fr,'water_bucket')});
    if(gCount(p.bag,'fire_blanket'))o.push({x:fr.x,pri:1,label:big?'Przydus ogień kocem (słaby skutek)':'Przydus ogień kocem',act:()=>useDouseItem(fr,'fire_blanket')});
    if(fr.cont&&!gCount(p.bag,'water_bucket')&&!gCount(p.bag,'fire_blanket')&&!(p.weapon&&p.weapon.id==='gasnica'))aTip('fire','Ogień blokuje drogę. Ugaś go gaśnicą (atak), wiadrem wody albo kocem gaśniczym.',3600)}
  return o}})(interactTargets);
doAttack=(function(_a){return function(){const p=player;if(p&&!p.dead){const w=curW();if(w&&w.molo){if(p.stun>0||p.stair||p.kill||p.search||p.bandage>0||p.atk>0||p.hurt>.15)return;throwMolotov();return}}
  const was=p&&p.atk;_a();if(p&&p.atk>0&&!was){const w=curW();if(w&&w.melee!==false&&!w.gun&&!w.ext){const reach=(w.reach||60)+14;
    for(const o of FXO)if(o.k==='bar'&&o.f===p.f&&(o.x-p.x)*p.face>-10&&Math.abs(o.x-p.x)<reach+o.w*.5&&(o.st==='idle'||o.st==='fb'&&false))fxIgnite(o)}}}})(doAttack);
useExt=(function(_f){return function(w){const p=player,d0=p.weapon?p.weapon.dur:0;_f(w);if(p.weapon&&p.weapon.dur<d0){
  FXA.push({k:'foam',x:p.x,f:p.f,face:p.face,t:0});fxSnd('foam',p.x,.7);
  const n=fxDouse(p.x+p.face*120,p.f,130,95,p.face);if(n){aTip('foam','Piana dusi ogień. Kilka strzałów gasi duży pożar.',2800)}}}})(useExt);
canSee=(function(_f){return function(z){let v=_f(z);if(v&&WX.t==='fog'&&player){const d=Math.abs(player.x-z.x),lim=620-300*WX.k;if(d>lim)return 0;if(d>lim*.6)v*=.6}return v}})(canSee);
emitNoise=(function(_f){return function(x,f,r,kind){if(WX.t==='rain'||WX.t==='storm'){if(kind!=='distract'&&r<700)r*=1-.2*WX.k}if(WX.thunder>0&&kind!=='distract'&&r<700)r*=.65;return _f(x,f,r,kind)}})(emitNoise);
