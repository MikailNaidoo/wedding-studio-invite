'use strict';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentView = 'intro';
let soundEnabled = false;
let transitionTimer;
const cities = [
  {name:'Chatsworth',place:'KwaZulu-Natal, South Africa',lat:-29.9214,lon:30.8922,side:'left',x:4,top:25},
  {name:'Durban',place:'KwaZulu-Natal, South Africa',lat:-29.85868,lon:31.02184,side:'left',x:8,top:40},
  {name:'Drakensberg',place:'KwaZulu-Natal, South Africa',lat:-29.4770,lon:29.2670,side:'left',x:4,top:55},
  {name:'Johannesburg',place:'Gauteng, South Africa',lat:-26.2041,lon:28.0473,side:'right',x:4,top:40},
  {name:'Port Shepstone',place:'KwaZulu-Natal, South Africa',lat:-30.74277,lon:30.45055,side:'right',x:4,top:55},
  {name:'Bali',place:'Indonesia',lat:-8.409518,lon:115.188919,side:'right',x:8,top:25}
];
const faq = [
  ["Where will we celebrate?","The Bell Inn, 208 Kenneth Kaunda Road, Durban North, 4051."],
  ["When should I arrive?","Please arrive at 10:00. The ceremony begins at 11:00 on 29 August 2027."],
  ["When should I RSVP?","Please reply by 15 December 2026. Include dietary needs with your response."],
];
const guests = [];
function renderTextContent(){
  $('#faq-list').replaceChildren(...faq.map((item,i)=>{
    const details=document.createElement('details');details.className='faq-item';
    const summary=document.createElement('summary');
    const title=document.createElement('span'); title.textContent=(i+1)+'. '+item[0];
    const arrow=document.createElement('span');arrow.className='icon';arrow.textContent='expand_more';
    const answer=document.createElement('p');answer.textContent=item[1];
    summary.append(title,arrow);details.append(summary,answer);return details;
  }));
  if (!guests.length) {
    $('#seat-list').textContent = 'Seating arrangements will be shared closer to the wedding.';
    return;
  }
  $('#seat-list').replaceChildren(...[['A – D','A','D'],['F – H','F','H'],['J – K','J','K'],['L – N','L','N'],['O – Z','O','Z']].map(([range,start,end])=>{
    const group=document.createElement('section');group.className='seat-group';
    const heading=document.createElement('h3');heading.textContent=range;group.append(heading);
    guests.filter(([name])=>{const letter=name.split(' ').at(-1)[0];return letter>=start&&letter<=end}).forEach(([name,table])=>{
      const row=document.createElement('div');row.className='seat-row';
      const a=document.createElement('span');a.textContent=name;
      const b=document.createElement('span');b.textContent=('Table ')+table;
      row.append(a,b);group.append(row);
    });return group;
  }));
}
renderTextContent();
function setView(view,animate=false){
  clearTimeout(transitionTimer);
  $('#transition').classList.remove('show');
  if(animate&&!reducedMotion&&view!==currentView){
    $('#transition p').textContent=(view==='journey'?'Spin the globe. Discover our memories.':'And now, a new chapter together.');
    $('#transition').classList.add('show');
    transitionTimer=setTimeout(()=>{activateView(view);$('#transition').classList.remove('show')},1000);
  }else activateView(view);
}
function updateSoundControl(){
  const button=$('#sound-toggle');
  const isIntro=currentView==='intro';
  button.querySelector('.icon').textContent=soundEnabled?'volume_up':'volume_off';
  button.setAttribute('aria-pressed',String(soundEnabled));
  button.setAttribute('aria-label',soundEnabled?(isIntro?'Mute video audio':'Mute background music'):(isIntro?'Play video audio':'Play background music'));
  button.title=soundEnabled?(isIntro?'Mute video audio':'Mute background music'):(isIntro?'Play video audio':'Play background music');
}
async function syncSoundToView(){
  const video=$('#intro-video'),music=$('#music');
  const playVideoAudio=currentView==='intro'&&soundEnabled;
  video.muted=!playVideoAudio;
  if(!soundEnabled||playVideoAudio){music.pause();return}
  try{await music.play()}
  catch{
    soundEnabled=false;
    music.pause();
    updateSoundControl();
  }
}
function activateView(view){
  currentView=view;document.body.dataset.view=view;
  ['intro','journey','wedding'].forEach(name=>{$('#'+name).hidden=name!==view});
  $$('#bottom-nav [data-view-link]').forEach(button=>{if(button.dataset.viewLink===view)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')});
  const index=['intro','journey','wedding'].indexOf(view);
  $('#nav-progress').style.transform='scaleX('+(index/2)+')';
  $$('.nav-track i').forEach((dot,i)=>dot.classList.toggle('active',i<=index));
  if(view==='intro'&&!reducedMotion)$('#intro-video').play().catch(()=>{});
  else $('#intro-video').pause();
  updateSoundControl();
  void syncSoundToView();
  if(view==='journey'){resizeCanvases();renderGlobe()}
}
$$('[data-view-link]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.viewLink)));
$('#explore').addEventListener('click',()=>setView('journey',true));
$$('[data-tab]').forEach(button=>button.addEventListener('click',()=>{
  $$('[data-tab]').forEach(tab=>tab.setAttribute('aria-selected',String(tab===button)));
  $$('.tab-panel').forEach(panel=>panel.hidden=panel.id!==button.dataset.tab);
  $('#wedding-scroll').scrollTop=0;
}));
$('.wedding-tabs').addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const tabs=$$('[data-tab]'),i=tabs.indexOf(document.activeElement);
  const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  event.preventDefault();tabs[next].focus();tabs[next].click();
});
$('#theme-toggle').addEventListener('click',()=>{
  const dark=document.body.classList.toggle('dark');
  $('#theme-toggle').setAttribute('aria-pressed',String(dark));
  $('#theme-toggle .icon').textContent=dark?'light_mode':'dark_mode';
  renderParticles();renderGlobe();
});
$('#sound-toggle').addEventListener('click',async()=>{
  soundEnabled=!soundEnabled;
  updateSoundControl();
  await syncSoundToView();
});
updateSoundControl();
let progress=0,loaded=false;
function finishLoading(){
  if(loaded)return;loaded=true;clearInterval(loadInterval);
  $('#load-progress').textContent='100%';
  $('#loader').classList.add('finished');
  setTimeout(()=>$('#loader').hidden=true,520);
  if(reducedMotion)$('#intro-video').pause();else $('#intro-video').play().catch(()=>{});
}
const loadInterval=setInterval(()=>{progress=Math.min(95,progress+9);$('#load-progress').textContent=progress+'%'},90);
Promise.all([document.fonts.ready,new Promise(resolve=>{
  if($('#intro-video').readyState>=2)resolve();
  else{$('#intro-video').addEventListener('loadeddata',resolve,{once:true});$('#intro-video').addEventListener('error',resolve,{once:true})}
})]).then(()=>setTimeout(finishLoading,350));
setTimeout(finishLoading,3500);
$('#skip-loader').addEventListener('click',finishLoading);

const target=new Date('2027-08-29T11:00:00+02:00').getTime();
function updateCountdown(){
  const remaining=Math.max(0,target-Date.now());
  const days=Math.floor(remaining/86400000);
  const values=[Math.floor(days/30),days%30,Math.floor(remaining/3600000)%24,Math.floor(remaining/60000)%60,Math.floor(remaining/1000)%60];
  $$('#countdown .number').forEach((el,i)=>el.textContent=String(values[i]).padStart(2,'0'));
}
updateCountdown();setInterval(updateCountdown,1000);

const globe=$('#globe'),ctx=globe.getContext('2d'),particles=$('#particles'),pctx=particles.getContext('2d');
let width=innerWidth,height=innerHeight,radius=0,rotation=-70*Math.PI/180,tilt=-.35,dragging=false,dragX=0,dragY=0,zoom=1,hoverCity=null;
const radians=Math.PI/180;
function unitPoint(lon,lat){const a=lon*radians,b=lat*radians;return [Math.cos(b)*Math.sin(a),Math.sin(b),Math.cos(b)*Math.cos(a)]}
const paths=(window.WORLD_RINGS||[]).map(ring=>ring.map(([lon,lat])=>unitPoint(lon,lat)));
const mesh=[];
for(let lat=-80;lat<=80;lat+=10)for(let lon=-180;lon<180;lon+=15){
  mesh.push([unitPoint(lon,lat),unitPoint(lon+15,lat)]);
  mesh.push([unitPoint(lon,lat),unitPoint(lon,lat+10)]);
  mesh.push([unitPoint(lon,lat),unitPoint(lon+15,lat+10)]);
}
function project(point){
  const [x,y,z]=point,c=Math.cos(rotation),s=Math.sin(rotation);
  const rx=x*c+z*s,rz=z*c-x*s;
  const py=y*Math.cos(tilt)-rz*Math.sin(tilt),pz=y*Math.sin(tilt)+rz*Math.cos(tilt);
  return [width/2+rx*radius,height/2-py*radius,pz];
}
cities.forEach(city=>{
  city.vector=unitPoint(city.lon,city.lat);
  const button=document.createElement('button');button.className='city-label '+city.side;button.textContent=city.name;
  button.style[city.side]=city.x+'%';button.style.top=city.top+'%';
  button.addEventListener('click',()=>openMemory(city));
  button.addEventListener('pointerenter',()=>{hoverCity=city});
  button.addEventListener('pointerleave',()=>{hoverCity=null});
  city.button=button;$('#city-labels').append(button);
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('stroke-width','.6');city.line=line;$('#connectors').append(line);
});
function resizeCanvases(){
  width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);
  [globe,particles].forEach(canvas=>{canvas.width=width*dpr;canvas.height=height*dpr;canvas.getContext('2d').setTransform(dpr,0,0,dpr,0,0)});
  radius=Math.min(height*(width<=768?.183:.211),width*.32)*zoom;
  $('#connectors').setAttribute('viewBox','0 0 '+width+' '+height);
  renderParticles();renderGlobe();
}
function renderParticles(){
  pctx.clearRect(0,0,width,height);
  pctx.fillStyle=document.body.classList.contains('dark')?'#999':'#888';
  for(let i=0;i<95;i++){
    const x=((Math.sin(i*127.1)*43758.5453)%1+1)%1*width;
    const y=((Math.sin(i*311.7)*15213.141)%1+1)%1*height;
    pctx.globalAlpha=.08+(i%5)*.024;pctx.beginPath();pctx.arc(x,y,i%7===0?1.4:.6,0,Math.PI*2);pctx.fill();
  }pctx.globalAlpha=1;
}
function renderGlobe(){
  if(currentView!=='journey')return;
  ctx.clearRect(0,0,width,height);
  const dark=document.body.classList.contains('dark');
  ctx.strokeStyle=dark?'rgba(200,200,200,.09)':'rgba(90,90,90,.065)';
  ctx.lineWidth=.6;ctx.beginPath();
  mesh.forEach(([a,b])=>{const pa=project(a),pb=project(b);ctx.moveTo(pa[0],pa[1]);ctx.lineTo(pb[0],pb[1])});ctx.stroke();
  // Both hemispheres remain visible through the wireframe, as in the reference.
  for(const front of [false,true]){
    ctx.strokeStyle=dark?(front?'rgba(230,230,230,.24)':'rgba(230,230,230,.08)'):(front?'rgba(40,40,40,.20)':'rgba(40,40,40,.065)');
    ctx.lineWidth=.65;ctx.beginPath();
    paths.forEach(ring=>{
      let previous=null;
      ring.forEach(point=>{
        const p=project(point);
        if(previous&&((previous[2]+p[2]>0)===front)){ctx.moveTo(previous[0],previous[1]);ctx.lineTo(p[0],p[1])}
        previous=p;
      });
    });ctx.stroke();
  }
  ctx.strokeStyle=dark?'#8883':'#7772';ctx.beginPath();ctx.arc(width/2,height/2,radius,0,Math.PI*2);ctx.stroke();
  const ink=dark?'#ddd':'#333';
  cities.forEach(city=>{
    const p=project(city.vector),visible=p[2]>-.12;
    city.button.style.opacity=visible?'1':'0';city.button.style.pointerEvents=visible?'auto':'none';city.button.tabIndex=visible?0:-1;city.button.setAttribute('aria-hidden',String(!visible));
    city.line.style.opacity=visible?'1':'0';
    if(!visible)return;
    ctx.fillStyle=ink;ctx.beginPath();ctx.arc(p[0],p[1],city===hoverCity?3:1.5,0,Math.PI*2);ctx.fill();
    const bounds=city.button.getBoundingClientRect();
    city.line.setAttribute('x1',String(p[0]));city.line.setAttribute('y1',String(p[1]));
    city.line.setAttribute('x2',String(city.side==='left'?bounds.right:bounds.left));
    city.line.setAttribute('y2',String(bounds.top+bounds.height/2));
    city.line.setAttribute('stroke',city===hoverCity?ink:(dark?'#aaa':'#999'));
  });
}
globe.addEventListener('pointerdown',e=>{dragging=true;dragX=e.clientX;dragY=e.clientY;globe.setPointerCapture(e.pointerId);globe.classList.add('dragging')});
globe.addEventListener('pointermove',e=>{if(!dragging)return;rotation+=(e.clientX-dragX)*.005;tilt=Math.max(-1.2,Math.min(1.2,tilt+(e.clientY-dragY)*.004));dragX=e.clientX;dragY=e.clientY;renderGlobe()});
function releaseGlobe(){dragging=false;globe.classList.remove('dragging')}
globe.addEventListener('pointerup',releaseGlobe);globe.addEventListener('pointercancel',releaseGlobe);
globe.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();rotation+=e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0;
  tilt=Math.max(-1.2,Math.min(1.2,tilt+(e.key==='ArrowUp'?.1:e.key==='ArrowDown'?-.1:0)));renderGlobe();
});
globe.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.7,Math.min(1.5,zoom-e.deltaY*.001));resizeCanvases()},{passive:false});
let lastTime=0;
function animate(time){
  if(currentView==='journey'&&!document.hidden&&!$('dialog[open]')&&time-lastTime>30){
    if(!dragging&&!hoverCity&&!reducedMotion)rotation+=.00008*Math.min(80,time-lastTime);
    renderGlobe();lastTime=time;
  }requestAnimationFrame(animate);
}
addEventListener('resize',resizeCanvases);resizeCanvases();requestAnimationFrame(animate);

let restoreMusic=false;
function openMemory(city){
  $('#memory-city').textContent=city.name;
  $('#memory-place').textContent=city.place;
  $('#memory-error').hidden=false;
  $('#memory-error').textContent='Memories from '+city.name+' are coming soon.';
  $('#memory-coordinates').textContent=Math.abs(city.lat).toFixed(4)+'° S, '+city.lon.toFixed(4)+'° E';
  const video=$('#memory-video');
  video.hidden=true;
  video.removeAttribute('src');
  restoreMusic=!$('#music').paused;$('#music').pause();
  $('#memory-dialog').showModal();
}

$('#memory-video').addEventListener('error',()=>$('#memory-error').hidden=false);
$('#memory-dialog').addEventListener('close',()=>{$('#memory-video').pause();$('#memory-video').removeAttribute('src');$('#memory-video').load();if(restoreMusic)$('#music').play().catch(()=>{});restoreMusic=false});
$('#memory-wedding').addEventListener('click',()=>{$('#memory-dialog').close();setView('wedding',true)});
$$('[data-close]').forEach(button=>button.addEventListener('click',()=>$('#'+button.dataset.close).close()));
$$('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close()}));
$('#rsvp-open').addEventListener('click',()=>{$('#rsvp-form').hidden=false;$('#rsvp-success').hidden=true;$('#rsvp-dialog').showModal()});
$('#guests')?.addEventListener('change',()=>{$('#guest-field').hidden=$('#guests').value==='0';$('#guest-field input').required=$('#guests').value==='1'});
$('#rsvp-form').addEventListener('submit',event=>{
  if (event.currentTarget.dataset.server === 'true') return;
  event.preventDefault();
  try{
    const response=Object.fromEntries(new FormData(event.currentTarget));response.savedAt=new Date().toISOString();
    localStorage.setItem('mikail-dershia-preview-rsvp',JSON.stringify(response));
    $('#rsvp-form').hidden=true;$('#rsvp-success').hidden=false;
  }catch{
    $('#rsvp-error').hidden=false;$('#rsvp-error').textContent='Your browser could not save this response. Please allow local storage and try again.';
  }
});

let photoDatabase;
function getPhotoDatabase(){
  if(photoDatabase)return photoDatabase;
  photoDatabase=new Promise((resolve,reject)=>{
    const request=indexedDB.open('mikail-dershia-gallery',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('photos',{keyPath:'id',autoIncrement:true});
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });return photoDatabase;
}
let photoUrls=[];
async function renderGallery(){
  try{
    const db=await getPhotoDatabase();
    const items=await new Promise((resolve,reject)=>{const req=db.transaction('photos').objectStore('photos').getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
    photoUrls.forEach(URL.revokeObjectURL);photoUrls=[];
    $('#gallery-grid').replaceChildren(...items.map(item=>{
      const url=URL.createObjectURL(item.file);photoUrls.push(url);
      const button=document.createElement('button');button.className='gallery-photo';button.setAttribute('aria-label','Open '+item.name);
      const image=new Image();image.src=url;image.alt=item.name;image.loading='lazy';button.append(image);
      button.addEventListener('click',()=>{$('#lightbox-image').src=url;$('#lightbox-image').alt=item.name;$('#lightbox').showModal()});
      return button;
    }));$('#gallery-empty').hidden=items.length>0;
  }catch{$('#gallery-status').textContent='Local photo storage is unavailable in this browser.'}
}
$('#gallery-open').addEventListener('click',()=>{$('#gallery-dialog').showModal();renderGallery()});
$('#upload-photos').addEventListener('click',()=>$('#photo-files').click());
$('#take-photo').addEventListener('click',()=>$('#photo-camera').click());
async function savePhotos(event){
  const files=[...event.target.files].filter(f=>f.type.startsWith('image/'));
  if(!files.length)return;
  $('#gallery-status').textContent='Saving photos…';
  try{
    const db=await getPhotoDatabase();
    await new Promise((resolve,reject)=>{
      const transaction=db.transaction('photos','readwrite');
      files.forEach(file=>transaction.objectStore('photos').add({name:file.name,file}));
      transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error);
    });
    $('#gallery-status').textContent='Photos saved on this device.';
    await renderGallery();
  }catch{$('#gallery-status').textContent='Could not save photos. Local storage may be full or unavailable.'}
  event.target.value='';
}
$('#photo-files').addEventListener('change',savePhotos);$('#photo-camera').addEventListener('change',savePhotos);


// Server-rendered form errors and confirmations reopen the RSVP dialog.
if (document.querySelector('[data-rsvp-feedback]') || location.hash === '#rsvp') {
  setView('wedding');
  $('#rsvp-dialog').showModal();
}
