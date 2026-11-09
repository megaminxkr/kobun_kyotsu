import {KEY,parseState,searchIndex,excerpt} from './core.mjs';
import {Accounts,PREFIX} from './accounts.mjs';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const base=document.body.dataset.base, chapter=document.body.dataset.chapter;
const accounts=new Accounts({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},{getItem:k=>sessionStorage.getItem(k),setItem:(k,v)=>sessionStorage.setItem(k,v),removeItem:k=>sessionStorage.removeItem(k)});
let state=await accounts.restore();if(!state)try{state=parseState(localStorage.getItem(KEY));}catch{state=parseState(null);}
let storageWarned=false,toastTimer;
function toast(message){const el=$('.toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3500);}
function save(){try{accounts.save(state).catch(reportSaveError);}catch{reportSaveError();}}
function reportSaveError(){if(!storageWarned){toast('進捗を保存できませんでした。ページを移動する前にブラウザの保存設定を確認してください。');storageWarned=true;}}

function paint(){
 if($('.account-open'))$('.account-open').textContent=accounts.user?'UID: '+accounts.user:'ユーザー';
 if($('#continue-link')){$('#continue-link').href=base+'lessons/01.html';$('#continue-link span').textContent='はじめから学ぶ';}
 document.documentElement.dataset.theme=state.theme;
 $('.theme-toggle').setAttribute('aria-label',state.theme==='dark'?'ライトモードに切り替える':'ダークモードに切り替える');
 $$('[data-nav]').forEach(x=>x.classList.toggle('done',state.completed.includes(x.dataset.nav)));
 $$('[data-status]').forEach(x=>{const id=x.dataset.status;x.textContent=state.completed.includes(id)?'✓ 学習済み':state.bookmarks.includes(id)?'しおり':'';});
 if($('#progress-count')){$('#progress-count').textContent=state.completed.length;$('#progress-bar').value=state.completed.length;$('#progress-message').textContent=state.completed.length===16?'全16章を学習済みです。気になる章を復習しましょう。':'小さな理解を、ひとつずつ積み重ねよう。';if(state.last){$('#continue-link').href=`${base}lessons/${state.last}.html`;$('#continue-link span').textContent=`第${Number(state.last)}章のつづきを読む`;}}
 $$('.complete-btn').forEach(b=>{const done=state.completed.includes(chapter);b.setAttribute('aria-pressed',String(done));b.querySelector('span').textContent=done?'学習済みを解除':'学習済みにする';});
 if($('.bookmark-btn')){const yes=state.bookmarks.includes(chapter);$('.bookmark-btn').setAttribute('aria-pressed',String(yes));$('.bookmark-btn span').textContent=yes?'しおりを解除':'しおりに保存';}
 $$('[data-check]').forEach(el=>el.checked=state.checks.includes(Number(el.dataset.check)));
 if($('.filter.selected'))applyFilter($('.filter.selected').dataset.filter);
}
function toggle(key,id){state[key]=state[key].includes(id)?state[key].filter(x=>x!==id):[...state[key],id];save();paint();}
if(chapter){state.last=chapter;save();}paint();
$('.theme-toggle').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';save();paint();});
$$('.complete-btn').forEach(b=>b.addEventListener('click',()=>{toggle('completed',chapter);toast(state.completed.includes(chapter)?'この章を学習済みにしました。':'学習済みを解除しました。');}));
$('.bookmark-btn')?.addEventListener('click',()=>toggle('bookmarks',chapter));
$('.print-btn')?.addEventListener('click',()=>window.print());
$$('[data-check]').forEach(el=>el.addEventListener('change',()=>toggle('checks',Number(el.dataset.check))));
window.addEventListener('storage',async ev=>{if(accounts.user){if(ev.key===PREFIX+accounts.user||ev.key===null){const restored=await accounts.restore();if(restored){state=restored;paint();}else location.reload();}}else if(ev.key===KEY||ev.key===null){state=parseState(ev.newValue);paint();}});
function applyFilter(filter){let count=0;$$('[data-card]').forEach(card=>{const show=filter==='すべて'||(filter==='しおり'?state.bookmarks.includes(card.dataset.card):card.dataset.category===filter);card.hidden=!show;if(show)count++;});$('.empty-state').hidden=count>0;$('.filter-count').textContent=`${count}章を表示しています。`;}
$$('.filter').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter').forEach(x=>{const yes=x===btn;x.classList.toggle('selected',yes);x.setAttribute('aria-pressed',String(yes));});applyFilter(btn.dataset.filter);}));
// Mobile drawer: Escape, focus containment, backdrop and breakpoint reset.
const menu=$('.mobile-menu'), sidebar=$('.sidebar'), backdrop=$('.mobile-backdrop');
function setMenu(open){sidebar.inert=matchMedia('(max-width: 850px)').matches&&!open;$('.workspace').inert=open;document.body.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open));backdrop.hidden=!open;if(open)sidebar.querySelector('a').focus();}
menu.addEventListener('click',()=>setMenu(!document.body.classList.contains('menu-open')));
backdrop.addEventListener('click',()=>{setMenu(false);menu.focus();});
matchMedia('(max-width: 850px)').addEventListener('change',()=>setMenu(false));
setMenu(false);
// Search renders text nodes only; query input is never interpreted as HTML.
const dialog=$('#search-dialog'),input=$('#search-input'),results=$('#search-results'),status=$('#search-status');
let entries=null,pending=null,queryVersion=0,returnFocus;
async function loadIndex(){if(entries)return entries;if(!pending)pending=fetch(`${base}assets/search-index.json`).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(data=>{if(!Array.isArray(data))throw new Error('Invalid search index');return entries=data;}).finally(()=>pending=null);return pending;}
async function search(){const current=++queryVersion,query=input.value.trim();results.replaceChildren();if(!query){status.textContent='調べたい言葉を入力してください。';return;}status.textContent='検索しています…';try{const data=await loadIndex();if(current!==queryVersion)return;const matches=searchIndex(data,query);status.textContent=matches.length?`${matches.length}件見つかりました${matches.length>40?'（先頭40件を表示）':''}。`:'見つかりませんでした。短い語や別の表記で検索してください。';for(const item of matches.slice(0,40)){const a=document.createElement('a');a.className='search-result';a.href=base+item.url;const title=document.createElement('strong');title.textContent=item.title;const desc=document.createElement('span');desc.textContent=excerpt(item.text,query);a.append(title,desc);a.addEventListener('click',()=>dialog.close());results.append(a);}}catch{if(current===queryVersion)status.textContent='検索データを読み込めませんでした。接続を確認して、もう一度入力してください。';}}
function openSearch(){returnFocus=document.activeElement;setMenu(false);dialog.showModal();input.focus();search();}
$('.search-open').addEventListener('click',openSearch);
$('.search-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>returnFocus?.focus());
dialog.addEventListener('click',ev=>{if(ev.target===dialog){const r=dialog.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)dialog.close();}});
input.addEventListener('input',search);
input.addEventListener('keydown',ev=>{if(ev.key==='ArrowDown'){$('.search-result')?.focus();ev.preventDefault();}});
document.addEventListener('keydown',ev=>{
 if(ev.key==='Escape'&&dialog.open){ev.preventDefault();dialog.close();return;}
 if(ev.key==='/'&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey&&!dialog.open&&!document.querySelector('#account-dialog[open]')&&!ev.target.closest('input,textarea,[contenteditable="true"]')){ev.preventDefault();openSearch();}
 if(document.body.classList.contains('menu-open')){if(ev.key==='Escape'){setMenu(false);menu.focus();}if(ev.key==='Tab'){const links=[...sidebar.querySelectorAll('a')];const first=links[0],last=links.at(-1);if(ev.shiftKey&&document.activeElement===first){last.focus();ev.preventDefault();}else if(!ev.shiftKey&&document.activeElement===last){first.focus();ev.preventDefault();}}}
});
if('IntersectionObserver' in window){const observer=new IntersectionObserver(items=>{for(const item of items){if(item.isIntersecting){$$('.page-toc a').forEach(a=>a.classList.toggle('current',a.hash==='#'+item.target.id));}}},{rootMargin:'-90px 0px -60% 0px'});$$('.lesson-section').forEach(el=>observer.observe(el));}

// Account dialog: local encrypted profiles, no remote account service.
const accountDialog=document.createElement('dialog');accountDialog.id='account-dialog';accountDialog.setAttribute('aria-labelledby','account-title');
accountDialog.innerHTML=`<div class="dialog-head"><h2 id="account-title">ユーザー管理</h2><button class="icon-btn account-close" aria-label="ユーザー管理を閉じる">×</button></div><p class="account-description">このブラウザ内でユーザーごとに進捗を保存します。別の端末・ブラウザとの同期はありません。サイトデータを消すと登録情報と進捗も消えます。パスワードの再発行はできません。</p><p id="account-current"></p><form id="account-form"><label>UID（大文字・小文字を区別）<input name="uid" autocomplete="username" required pattern="[a-zA-Z0-9_-]{3,32}" minlength="3" maxlength="32"></label><label>パスワード<input name="password" type="password" autocomplete="current-password" required minlength="8" maxlength="128"></label><label class="account-import"><input type="checkbox" name="import"> 新規登録時にゲストの進捗を引き継ぐ</label><div class="account-actions"><button class="button primary" type="submit" value="login">ログイン</button><button class="button" type="submit" value="register">新規登録</button></div></form><button class="button" id="account-logout" hidden>ログアウト</button><p id="account-status" role="status"></p>`;
document.body.append(accountDialog);
const accountButton=document.createElement('button');accountButton.className='button account-open js-only';accountButton.type='button';$('.tools').prepend(accountButton);paint();
function refreshAccount(){const yes=!!accounts.user;$('#account-current').textContent=yes?'ログイン中：'+accounts.user:'現在：ゲスト（従来の進捗）';$('#account-form').hidden=yes;$('#account-logout').hidden=!yes;$('#account-status').textContent='';}
accountButton.addEventListener('click',()=>{refreshAccount();accountDialog.showModal();});
$('.account-close').addEventListener('click',()=>accountDialog.close());
accountDialog.addEventListener('close',()=>{$('#account-form').reset();accountButton.focus();});
$('#account-form').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget;const register=event.submitter.value==='register';const uid=form.elements.uid.value.trim(),password=form.elements.password.value;const initial=form.elements.import.checked?parseState(localStorage.getItem(KEY)):parseState(null);form.querySelectorAll('button').forEach(b=>b.disabled=true);$('#account-status').textContent='確認しています…';try{const next=await accounts.enter(uid,password,register,initial);state=next;storageWarned=false;paint();form.reset();refreshAccount();$('#account-status').textContent=register?'登録しました。':'ログインしました。';}catch(error){$('#account-status').textContent=error.message||'保存を利用できません。ブラウザの設定を確認してください。';}finally{form.querySelectorAll('button').forEach(b=>b.disabled=false);}});
$('#account-logout').addEventListener('click',async()=>{try{await accounts.logout();state=parseState(localStorage.getItem(KEY));paint();refreshAccount();}catch{reportSaveError();}});
// Finish encrypted writes before ordinary internal navigation.
document.addEventListener('click',async event=>{const a=event.target.closest('a[href]');if(!accounts.user||!a||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0||a.target==='_blank')return;const target=new URL(a.href,location.href);if(target.origin!==location.origin||target.pathname===location.pathname)return;event.preventDefault();try{await accounts.queue;location.href=target.href;}catch{reportSaveError();}});
