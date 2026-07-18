const audio=document.querySelector('#audio');
const padsEl=document.querySelector('#pads');
const colors=['#e8ff55','#ff9ab8','#96ddff','#9ee0bd','#ffd36f','#c6b7ff','#ffb477','#8fe1dc'];
let clips=[],shown=[],current=null,period='week';
const favorites=new Set(JSON.parse(localStorage.getItem('saihate-favorites')||'[]'));
const heartDates=JSON.parse(localStorage.getItem('saihate-heart-dates')||'{}');
const $=s=>document.querySelector(s);
const time=s=>`${Math.floor(s/60)||0}:${String(Math.floor(s%60)||0).padStart(2,'0')}`;

fetch('./clips.json').then(r=>r.json()).then(data=>{clips=data;shuffle();renderFavorites();renderRanking()}).catch(()=>{$('#clipTitle').textContent='データを読み込めませんでした'});

function sample(items,n){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,n)}
function shuffle(){shown=sample(clips,8);renderPads()}
function renderPads(){padsEl.innerHTML=shown.map((c,i)=>`<button class="pad ${current?.id===c.id&&!audio.paused?'playing':''}" style="--pad-color:${colors[i]}" data-id="${c.id}"><span class="pad-number">PAD ${String(i+1).padStart(2,'0')}</span><span class="pad-title">${escapeHtml(c.title)}</span><span class="pad-episode">第${c.episode}回</span></button>`).join('');padsEl.querySelectorAll('.pad').forEach(b=>b.onclick=()=>play(b.dataset.id))}
function play(id){const clip=clips.find(c=>c.id===id);if(!clip)return;if(current?.id===id){audio.paused?audio.play():audio.pause();return}current=clip;audio.src=clip.audio;audio.play();updateCurrent();renderPads()}
function updateCurrent(){if(!current)return;$('#clipTitle').textContent=current.title;$('#episodeTitle').textContent=`第${current.episode}回「${current.episodeTitle}」`;$('#episodeLink').href=current.appleUrl;$('#episodeLink').classList.remove('disabled');$('#togglePlay').disabled=false;$('#favoriteCurrent').disabled=false;setHeart();}
function toggleFavorite(id){favorites.has(id)?favorites.delete(id):(favorites.add(id),heartDates[id]=Date.now());localStorage.setItem('saihate-favorites',JSON.stringify([...favorites]));localStorage.setItem('saihate-heart-dates',JSON.stringify(heartDates));setHeart();renderFavorites();renderRanking()}
function setHeart(){if(!current)return;$('#favoriteCurrent').textContent=favorites.has(current.id)?'♥':'♡';$('#favoriteCurrent').classList.toggle('active',favorites.has(current.id))}
function listItem(c,rank=''){return `<article class="list-item"><button class="list-play" data-play="${c.id}">${rank||'▶'}</button><div><div class="list-title">${escapeHtml(c.title)}</div><div class="list-episode">第${c.episode}回 ${escapeHtml(c.episodeTitle)}</div></div><button class="list-heart" data-heart="${c.id}">${favorites.has(c.id)?'♥':'♡'}</button></article>`}
function bindList(root){root.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{play(b.dataset.play);showView('sampler')});root.querySelectorAll('[data-heart]').forEach(b=>b.onclick=()=>toggleFavorite(b.dataset.heart))}
function renderFavorites(){const root=$('#favoritesList');const list=clips.filter(c=>favorites.has(c.id));root.innerHTML=list.length?list.map(c=>listItem(c)).join(''):'<div class="empty">お気に入りはまだありません。<br>気になる切り抜きに♡をつけてみてね！</div>';bindList(root)}
function renderRanking(){const root=$('#rankingList');const weekAgo=Date.now()-7*864e5;let ids=[...favorites].filter(id=>period==='all'||(heartDates[id]||0)>=weekAgo);const list=clips.filter(c=>ids.includes(c.id)).sort((a,b)=>(heartDates[b.id]||0)-(heartDates[a.id]||0));root.innerHTML=list.length?list.map((c,i)=>listItem(c,`#${i+1}`)).join(''):'<div class="empty">この期間のランキングはまだありません。</div>';bindList(root)}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`${name}View`));document.querySelectorAll('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='favorites')renderFavorites();if(name==='ranking')renderRanking()}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}

$('#shuffle').onclick=shuffle;$('#togglePlay').onclick=()=>current&&(audio.paused?audio.play():audio.pause());$('#favoriteCurrent').onclick=()=>current&&toggleFavorite(current.id);$('#seek').oninput=e=>{if(audio.duration)audio.currentTime=audio.duration*e.target.value/100};
document.querySelectorAll('.nav-button').forEach(b=>b.onclick=()=>showView(b.dataset.view));document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{period=b.dataset.period;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));renderRanking()});
audio.addEventListener('play',()=>{$('#status').textContent='再生中';$('#togglePlay').textContent='Ⅱ';renderPads()});audio.addEventListener('pause',()=>{$('#status').textContent='スタンバイ';$('#togglePlay').textContent='▶';renderPads()});audio.addEventListener('ended',()=>{$('#status').textContent='スタンバイ';$('#togglePlay').textContent='▶';renderPads()});audio.addEventListener('loadedmetadata',()=>{$('#duration').textContent=time(audio.duration)});audio.addEventListener('timeupdate',()=>{$('#currentTime').textContent=time(audio.currentTime);$('#seek').value=audio.duration?audio.currentTime/audio.duration*100:0});
