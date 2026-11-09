import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const portIndex=process.argv.indexOf('--port');
const port=Number(portIndex>=0?process.argv[portIndex+1]:(process.env.PORT||3000));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.startsWith('/kobun_kyotsu/'))name=name.slice('/kobun_kyotsu'.length);if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+name);if(!file.startsWith(root)||!['.html','.css','.js','.mjs','.json','.svg'].includes(path.extname(file))||name.split('/').some(x=>x.startsWith('.'))){res.writeHead(403);return res.end('Forbidden');}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}}).listen(port,'0.0.0.0',()=>console.log('Local preview is ready.'));
