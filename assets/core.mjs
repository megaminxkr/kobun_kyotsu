export const IDS = Array.from({length:16},(_,i)=>String(i+1).padStart(2,'0'));
export const KEY = 'kobun-kyotsu:v1';
export const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function normalize(value) {return String(value).normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/\s+/g,' ').trim();}
export function parseState(raw) {
  let v; try {v=JSON.parse(raw);} catch {v={};}
  if(!v || typeof v!=='object') v={};
  const ids = x => [...new Set(Array.isArray(x)?x.filter(y=>IDS.includes(y)):[])];
  return {completed:ids(v.completed), bookmarks:ids(v.bookmarks), last:IDS.includes(v.last)?v.last:null,
    checks:[...new Set(Array.isArray(v.checks)?v.checks.filter(x=>Number.isInteger(x)&&x>=0&&x<13):[])],
    theme:['light','dark'].includes(v.theme)?v.theme:'light'};
}
export function searchIndex(entries, query) {
  const words=normalize(query).split(' ').filter(Boolean);
  if(!words.length) return [];
  return entries.filter(e=>words.every(w=>normalize(e.title+' '+e.text).includes(w))).map(e=>({...e, score:words.reduce((s,w)=>s+(normalize(e.title).includes(w)?5:1),0)})).sort((a,b)=>b.score-a.score);
}
export function excerpt(text, query, length=110) {
  const term=normalize(query).split(' ')[0]; const index=normalize(text).indexOf(term);
  const start=Math.max(0,index-24);
  return (start?'…':'')+text.slice(start,start+length)+(text.length>start+length?'…':'');
}
