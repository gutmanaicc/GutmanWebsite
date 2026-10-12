import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { CommerceError, config } from './commerce.mjs';

const bearer = req => /^Bearer (.+)$/.exec(String(req.headers.authorization ?? ''))?.[1] ?? '';
function tokenMatches(value,expected) {if(!expected||Buffer.byteLength(value)!==Buffer.byteLength(expected))return false;return timingSafeEqual(Buffer.from(value),Buffer.from(expected));}
function send(res,status,data) {res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));}
async function body(req) {
  let raw='';
  for await (const chunk of req) {raw+=chunk;if(Buffer.byteLength(raw)>16384)throw new CommerceError('BODY_TOO_LARGE','הבקשה גדולה מדי.',413);}
  if(!raw)return {raw:'{}',data:{}};
  try {const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw new Error();return {raw,data};}
  catch {throw new CommerceError('INVALID_JSON','הבקשה אינה תקינה.');}
}

export function createAcademyServer({store,checkout,adminToken,allowedOrigins=['http://localhost:5173','http://127.0.0.1:5173','http://localhost:5174','http://127.0.0.1:5174','http://localhost:4173','http://127.0.0.1:4173']}={}) {
  if(adminToken && adminToken.length<32)throw new Error('Admin token must contain at least 32 characters.');
  const allowed = new Set(allowedOrigins);
  const limits=new Map();
  function rateLimit(req,bucket,max=120) {const key=`${req.socket.remoteAddress}:${bucket}`;const now=Date.now();const entry=limits.get(key);if(!entry||now-entry.since>=60_000){limits.set(key,{since:now,count:1});}else{entry.count++;if(entry.count>max)throw new CommerceError('RATE_LIMITED','יותר מדי בקשות. נסו שוב בעוד דקה.',429);}if(limits.size>10000)for(const [id,value] of limits)if(now-value.since>=60_000)limits.delete(id);}
  return createServer(async(req,res)=>{
    try {
      const path = new URL(req.url,'http://localhost').pathname;
      if(!path.startsWith('/api/academy/')){send(res,404,{error:{code:'NOT_FOUND',message:'הכתובת לא נמצאה.'}});return;}
      const origin=req.headers.origin;
      // No cookies or ambient browser credentials: admin and order APIs require explicit scoped bearer tokens.
      if(origin&&!allowed.has(origin))throw new CommerceError('ORIGIN_REJECTED','מקור הבקשה אינו מורשה.',403);
      if(origin&&allowed.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
      if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, Idempotency-Key','Access-Control-Max-Age':'600'});res.end();return;}
      const admin=path.startsWith('/api/academy/admin/');
      if(admin&&!tokenMatches(bearer(req),adminToken)){rateLimit(req,'admin-auth',20);throw new CommerceError('UNAUTHORIZED','נדרש אימות מנהל.',401);}
      if(req.method!=='GET')rateLimit(req,'mutations');
      if(req.method==='GET'&&path==='/api/academy/catalog'){send(res,200,{dates:store.dates(),commerce:{...store.commerce,...(store.mode==='morning'?{ready:Boolean(checkout?.ready)}:{})},pricing:config});return;}
      const orderMatch=path.match(/^\/api\/academy\/orders\/([^/]+)$/);
      if(req.method==='GET'&&orderMatch){send(res,200,store.authorizedOrder(orderMatch[1],bearer(req)));return;}
      const notifyMatch=path.match(/^\/api\/academy\/payments\/morning\/notify\/([^/]+)$/);
      if(req.method==='POST'&&notifyMatch){
        rateLimit(req,'provider-notify',20);
        if(!checkout?.ready)throw new CommerceError('PAYMENT_UNAVAILABLE','החיבור לסליקה עדיין אינו זמין.',503);
        let size=0;for await(const chunk of req){size+=chunk.length;if(size>16384)throw new CommerceError('BODY_TOO_LARGE','הבקשה גדולה מדי.',413);}
        // The callback is a wakeup only. Its amount, status and signature fields never confirm payment.
        await checkout.refresh(notifyMatch[1]);send(res,200,{received:true});return;
      }
      if(req.method==='GET'&&admin){
        const routes={summary:()=>store.summary(),dates:()=>({dates:store.dates(true)}),coupons:()=>({coupons:store.coupons()}),registrations:()=>({registrations:store.all('registrations')}),orders:()=>({orders:store.summary().orders}),revenue:()=>store.revenue(),outbox:()=>({outbox:store.all('outbox')})};
        const endpoint=path.slice('/api/academy/admin/'.length);if(routes[endpoint]){send(res,200,routes[endpoint]());return;}
      }
      if(['POST','PATCH'].includes(req.method)){
        const {data,raw}=await body(req);
        if(req.method==='POST'&&path==='/api/academy/quote'){const {couponId,...publicQuote}=store.quote(data);send(res,200,publicQuote);return;}
        if(req.method==='POST'&&path==='/api/academy/orders'){
          if(store.mode==='morning'&&!checkout?.ready)throw new CommerceError('PAYMENT_UNAVAILABLE','החיבור לסליקה עדיין אינו זמין.',503);
          const created=store.createOrder(data,req.headers['idempotency-key']);
          send(res,201,store.mode==='morning'?await checkout.start(created):created);return;
        }
        const reconcileMatch=path.match(/^\/api\/academy\/orders\/([^/]+)\/reconcile$/);
        if(req.method==='POST'&&reconcileMatch){
          const id=reconcileMatch[1];store.authorizedOrder(id,bearer(req));
          if(!checkout?.ready)throw new CommerceError('PAYMENT_UNAVAILABLE','החיבור לסליקה עדיין אינו זמין.',503);
          await checkout.refresh(id);send(res,200,store.authorizedOrder(id,bearer(req)));return;
        }
        if(req.method==='POST'&&path==='/api/academy/simulation/pay'){send(res,200,store.simulationPay(data.orderId,bearer(req),data.outcome??'succeeded'));return;}
        if(req.method==='POST'&&path==='/api/academy/simulation/webhook'){send(res,200,store.processSignedEvent(raw,req.headers));return;}
        if(admin){
          if(path==='/api/academy/admin/dates'&&req.method==='POST'){send(res,201,{date:store.createDate(data)});return;}
          if(path==='/api/academy/admin/coupons'&&req.method==='POST'){send(res,201,{coupon:store.createCoupon(data)});return;}
          const dateMatch=path.match(/^\/api\/academy\/admin\/dates\/([^/]+)(?:\/(approve|reject))?$/);
          if(dateMatch){const [,id,action]=dateMatch;
            if(req.method==='PATCH'&&!action){send(res,200,{date:store.updateDate(id,data)});return;}
            if(req.method==='POST'&&action){send(res,200,{date:action==='approve'?store.approveDate(id,data):store.rejectDate(id,data)});return;}
          }
          const couponMatch=path.match(/^\/api\/academy\/admin\/coupons\/([^/]+)$/);
          if(couponMatch&&req.method==='PATCH'){send(res,200,{coupon:store.updateCoupon(couponMatch[1],data)});return;}
          const refundMatch=path.match(/^\/api\/academy\/admin\/orders\/([^/]+)\/refund$/);
          if(refundMatch&&req.method==='POST'){send(res,200,{order:store.refundOrder(refundMatch[1])});return;}
          const retryMatch=path.match(/^\/api\/academy\/admin\/outbox\/([^/]+)\/retry$/);
          if(retryMatch&&req.method==='POST'){send(res,200,{outbox:store.retryOutbox(retryMatch[1])});return;}
        }
      }
      send(res,404,{error:{code:'NOT_FOUND',message:'הפעולה לא נמצאה.'}});
    } catch(error) {
      if(error instanceof CommerceError)send(res,error.status,{error:{code:error.code,message:error.message}});
      else {console.error('Academy request failed:',error?.name??'Error');send(res,500,{error:{code:'SERVER_ERROR',message:'לא ניתן להשלים את הבקשה כרגע.'}});}
    }
  });
}
