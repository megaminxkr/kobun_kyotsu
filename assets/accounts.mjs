import {KEY,parseState} from './core.mjs';
export const PREFIX='kobun-kyotsu:account:v1:';
const SESSION='kobun-kyotsu:session:v1';
const enc=new TextEncoder(),dec=new TextDecoder();
const b64=a=>btoa(String.fromCharCode(...new Uint8Array(a)));
const bytes=s=>Uint8Array.from(atob(s),x=>x.charCodeAt(0));
export function validUID(uid){return /^[a-zA-Z0-9_-]{3,32}$/.test(uid);}
async function derive(password,salt){const raw=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(salt),iterations:600000,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},true,['encrypt','decrypt']);}
export async function seal(state,key){const iv=crypto.getRandomValues(new Uint8Array(12));return {iv:b64(iv),data:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(state))))};}
export async function unseal(record,key){return parseState(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(record.iv)},key,bytes(record.data))));}
export class Accounts{
 constructor(local,session){this.local=local;this.session=session;this.user=null;this.key=null;this.queue=Promise.resolve();}
 async restore(){try{const s=JSON.parse(this.session.getItem(SESSION));if(!s||!validUID(s.uid))return null;this.key=await crypto.subtle.importKey('raw',bytes(s.key),'AES-GCM',true,['encrypt','decrypt']);const record=JSON.parse(this.local.getItem(PREFIX+s.uid));const state=await unseal(record,this.key);this.user=s.uid;return state;}catch{this.user=null;this.key=null;try{this.session.removeItem(SESSION);}catch{}return null;}}
 async enter(uid,password,register,initial){if(!validUID(uid))throw new Error('UIDは半角英数字・_・-の3〜32文字で入力してください。');if(password.length<8||password.length>128)throw new Error('パスワードは8〜128文字で入力してください。');if(!crypto.subtle)throw new Error('このブラウザでは暗号化を利用できません。HTTPSで開いてください。');await this.queue;const name=PREFIX+uid;let record;try{record=JSON.parse(this.local.getItem(name));}catch{throw new Error('保存データが破損しています。上書きせず処理を中止しました。');}
 if(register&&record)throw new Error('このUIDはこのブラウザで登録済みです。');if(!register&&!record)throw new Error('UIDまたはパスワードが違います。このブラウザで登録したUIDを使用してください。');
 const salt=register?b64(crypto.getRandomValues(new Uint8Array(16))):record.salt;
 let key,state;try{key=await derive(password,salt);state=register?parseState(JSON.stringify(initial)):await unseal(record,key);}catch{throw new Error('UIDまたはパスワードが違うか、保存データが破損しています。');}
 const session=JSON.stringify({uid,key:b64(await crypto.subtle.exportKey('raw',key))});
 // Verify session storage before creating an account; do not leave a phantom account on failure.
 this.session.setItem(SESSION,session);
 try{if(register){if(this.local.getItem(name)!==null)throw new Error('このUIDは登録済みです。');this.local.setItem(name,JSON.stringify({version:1,salt,...await seal(state,key)}));}}catch(error){this.session.removeItem(SESSION);throw error;}
 this.user=uid;this.key=key;return state;
 }
 save(state){const uid=this.user,key=this.key,snapshot=parseState(JSON.stringify(state));if(!uid){this.local.setItem(KEY,JSON.stringify(snapshot));return Promise.resolve();}const job=this.queue.catch(()=>{}).then(async()=>{const record=JSON.parse(this.local.getItem(PREFIX+uid));if(!record)throw new Error('ユーザーデータが削除されています。');const next={version:1,salt:record.salt,...await seal(snapshot,key)};this.local.setItem(PREFIX+uid,JSON.stringify(next));});this.queue=job;return job;}
 async logout(){await this.queue;this.session.removeItem(SESSION);this.user=null;this.key=null;}
}
