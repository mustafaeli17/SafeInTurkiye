// Operator-only local acceptance test. Never deployed. Secrets remain in process
// memory: no .env writes, console output, browser storage, or production access.
import {createServer} from 'node:http';
import {randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {createServer as createViteServer} from 'vite';
process.loadEnvFile('.env.foundation.local');
const target='https://qctltygvdxpzdaliczig.supabase.co',origin='http://127.0.0.1:5206';
if(process.env.VERCEL||process.env.SUPABASE_URL!==target||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Isolated test project required');
process.env.RESERVATION_ALLOWED_ORIGINS=origin;
process.env.RESERVATIONS_ENABLED='true';
process.env.RESERVATION_EMAIL_FROM='SafeInTurkiye test <onboarding@resend.dev>';
delete process.env.RESEND_API_KEY;
// Resolve production .js ESM specifiers against TypeScript sources in local QA.
const modules=await createViteServer({server:{middlewareMode:true},appType:'custom'});
const {default:handler}=await modules.ssrLoadModule('/api/reservations.ts');
const nonce=randomBytes(32).toString('hex');let receipt=null,result=null,running=false;
const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function response(res,body,code=200){res.writeHead(code,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'"});res.end(body);}
function page(){const form=(path,contents)=>`<form method="post" action="${path}"><input type="hidden" name="nonce" value="${nonce}">${contents}</form>`;return `<!doctype html><html lang="tr"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TEST ONLY — Gerçek rezervasyon API testi</title><style>body{font:16px system-ui;background:#eef6fc;color:#123451;max-width:740px;margin:40px auto;padding:20px}section{background:white;border-radius:20px;padding:24px;margin:20px 0}input,button{font:inherit;padding:12px;border:1px solid #bdd1e2;border-radius:10px}input{max-width:100%;box-sizing:border-box}button{background:#087fff;color:white;cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>TEST ONLY · Gerçek API kabul testi</h1><p>Yalnız qctltygvdxpzdaliczig test projesi. Canlıya dokunulmaz.</p><section><h2>E-posta göndericisi</h2><p>Anahtar yalnız bu yerel sürecin belleğinde tutulur; sunucu kapanınca silinir.</p>${process.env.RESEND_API_KEY?'<p>Gönderim anahtarı bellekte ayarlandı.</p>':form('/configure','<label>Resend gönderim anahtarı <input type="password" name="key" required autocomplete="off" spellcheck="false"></label><p><button>Yalnız test belleğine kaydet</button></p>')}</section><section><h2>Bir defalık test talebi</h2><p>Alıcı: elimust503@gmail.com. Yalnız TEST ONLY restoran adı ve talep numarası gönderilir; gerçek müşteri bilgisi yoktur.</p>${!receipt&&process.env.RESEND_API_KEY?form('/run-test','<button>Test talebi oluştur ve bildirim gönder</button>'):receipt?form('/check-status','<button>Talep durumunu kontrol et</button>'):'<p>Önce gönderim anahtarını ayarlayın.</p>'}${result?`<pre>${escape(JSON.stringify(result,null,2))}</pre>`:''}</section></html>`;}
async function call(body){let code=0,data;await handler({method:'POST',headers:{origin,'x-forwarded-for':'local-acceptance-test'},body},{setHeader(){},status(value){code=value;return this;},json(value){data=value;}});return {http:code,data};}
const server=createServer(async(req,res)=>{
 try{
  if(req.method==='GET'&&req.url==='/'){response(res,page());return;}
  if(req.method!=='POST'||req.headers.origin!==origin||req.headers.host!=='127.0.0.1:5206'){response(res,'Not allowed',403);return;}
  let raw='';for await(const part of req){raw+=part;if(raw.length>4096){response(res,'Too large',413);return;}}
  const input=new URLSearchParams(raw),token=input.get('nonce')??'';
  if(token.length!==nonce.length||!timingSafeEqual(Buffer.from(token),Buffer.from(nonce))){response(res,'Not allowed',403);return;}
  if(req.url==='/configure'){
   const key=input.get('key')?.trim();if(!key||!/^re_[A-Za-z0-9_-]{15,200}$/.test(key)){response(res,'Invalid key format',400);return;}
   process.env.RESEND_API_KEY=key;
  }else if(req.url==='/run-test'){
   if(running||receipt){response(res,'A test already exists; check status instead',409);return;}
   running=true;const credentials={requestId:randomUUID(),receiptToken:randomBytes(32).toString('hex')};
   try{result=await call({action:'create',...credentials,listing:'TEST ONLY — admin acceptance',source:'https://example.test/test-only',name:'TEST ONLY Guest',email:'guest@example.test',phone:'+90000000000',date:new Date(Date.now()+2*86400000).toISOString().slice(0,10),time:'19:00',guests:2,notes:'Isolated acceptance test; no real booking.'});if(result.http===200)receipt=credentials;}finally{running=false;}
  }else if(req.url==='/check-status'&&receipt){result=await call({action:'status',...receipt});}
  else {response(res,'Not found',404);return;}
  res.writeHead(303,{Location:'/', 'Cache-Control':'no-store'});res.end();
 }catch{response(res,'Test unavailable; no success claimed',503);}
});
server.listen(5206,'127.0.0.1',()=>console.log('Isolated acceptance test: '+origin));
