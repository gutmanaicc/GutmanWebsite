import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { CommerceError, config } from './commerce.mjs';
import { DurableCommerceError } from './durable-commerce.mjs';
import { renderOrderDocument } from './legal-documents.mjs';

const bearer = req => /^Bearer (.+)$/.exec(String(req.headers.authorization ?? ''))?.[1] ?? '';
function tokenMatches(value,expected) {if(!expected||Buffer.byteLength(value)!==Buffer.byteLength(expected))return false;return timingSafeEqual(Buffer.from(value),Buffer.from(expected));}
function send(res,status,data) {res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));}
async function body(req) {
  const chunks=[];let size=0;
  // Hosting runtimes may consume JSON before invoking the Node handler. It is
  // useful for ordinary requests, but can never be reconstructed as signed bytes.
  if(req.body !== undefined && typeof req.body==='object' && !Buffer.isBuffer(req.body)) {
    const data=req.body;
    if(!data||Array.isArray(data))throw new CommerceError('INVALID_JSON','הבקשה אינה תקינה.');
    if(Buffer.byteLength(JSON.stringify(data))>16384)throw new CommerceError('BODY_TOO_LARGE','הבקשה גדולה מדי.',413);
    return {raw:null,data};
  }
  if(typeof req.body==='string'||Buffer.isBuffer(req.body)) {
    const bytes=Buffer.from(req.body);size=bytes.length;chunks.push(bytes);
  } else for await (const chunk of req) {
    const bytes=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=bytes.length;if(size>16384)throw new CommerceError('BODY_TOO_LARGE','הבקשה גדולה מדי.',413);
    chunks.push(bytes);
  }
  if(size>16384)throw new CommerceError('BODY_TOO_LARGE','הבקשה גדולה מדי.',413);
  const raw=Buffer.concat(chunks).toString('utf8');
  if(!raw)return {raw:'{}',data:{}};
  try {const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw new Error();return {raw,data};}
  catch {throw new CommerceError('INVALID_JSON','הבקשה אינה תקינה.');}
}

export function createAcademyHandler({store,checkout,deliveryWorker,leadIntake,legalInbox,legalDisclosure,publicOrigin,adminToken,allowedOrigins=['http://localhost:5173','http://127.0.0.1:5173','http://localhost:5174','http://127.0.0.1:5174','http://localhost:4173','http://127.0.0.1:4173']}={}) {
  if(adminToken && adminToken.length<32)throw new Error('Admin token must contain at least 32 characters.');
  const allowed = new Set(allowedOrigins);
  const limits=new Map();
  function rateLimit(req,bucket,max=120) {const key=`${req.socket.remoteAddress}:${bucket}`;const now=Date.now();const entry=limits.get(key);if(!entry||now-entry.since>=60_000){limits.set(key,{since:now,count:1});}else{entry.count++;if(entry.count>max)throw new CommerceError('RATE_LIMITED','יותר מדי בקשות. נסו שוב בעוד דקה.',429);}if(limits.size>10000)for(const [id,value] of limits)if(now-value.since>=60_000)limits.delete(id);}
  return async(req,res)=>{
    try {
      const url = new URL(req.url,'http://localhost');
      const override = req.query?.academyPath ?? url.searchParams.get('academyPath');
      let path = url.pathname;
      if (override !== null && override !== undefined) {
        if (typeof override !== 'string' || !/^[a-zA-Z0-9_/-]{1,300}$/.test(override)
          || override.includes('//') || override.endsWith('/')) {
          throw new CommerceError('INVALID_PATH','הכתובת אינה תקינה.');
        }
        const suffix = override.startsWith('/') ? override.slice(1) : override;
        if (!suffix) throw new CommerceError('INVALID_PATH','הכתובת אינה תקינה.');
        path = `/api/academy/${suffix}`;
      }
      if(!path.startsWith('/api/academy/')){send(res,404,{error:{code:'NOT_FOUND',message:'הכתובת לא נמצאה.'}});return;}
      const origin=req.headers.origin;
      // No cookies or ambient browser credentials: admin and order APIs require explicit scoped bearer tokens.
      if(origin&&!allowed.has(origin))throw new CommerceError('ORIGIN_REJECTED','מקור הבקשה אינו מורשה.',403);
      if(origin&&allowed.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
      if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, Idempotency-Key','Access-Control-Max-Age':'600'});res.end();return;}
      const admin=path.startsWith('/api/academy/admin/');
      if(admin&&!tokenMatches(bearer(req),adminToken)){rateLimit(req,'admin-auth',20);throw new CommerceError('UNAUTHORIZED','נדרש אימות מנהל.',401);}
      if(req.method!=='GET')rateLimit(req,'mutations');
      if(req.method==='GET'&&path==='/api/academy/catalog'){send(res,200,{dates:await store.dates(),commerce:{...store.commerce,...(store.mode==='morning'?{ready:Boolean(checkout?.ready)}:{})},pricing:config,leads:{ready:Boolean(leadIntake?.ready)},legalNotices:{ready:Boolean(legalInbox?.ready)},...(legalDisclosure?{legal:legalDisclosure}:{})});return;}
      if(req.method==='GET'&&path==='/api/academy/legal-disclosure'){
        if(!legalDisclosure)throw new CommerceError('LEGAL_DISCLOSURE_UNAVAILABLE','פרטי העסק אינם זמינים כרגע.',503);
        send(res,200,legalDisclosure);return;
      }
      const documentMatch=path.match(/^\/api\/academy\/orders\/([^/]+)\/document$/);
      if(req.method==='GET'&&documentMatch){
        await store.authorizedOrder(documentMatch[1],bearer(req));
        const order=await store.get('orders',documentMatch[1]);
        if(!order?.legalSnapshot)throw new CommerceError('DOCUMENT_UNAVAILABLE','לא נשמר מסמך תנאים בזמן יצירת הזמנה זו. אפשר לפנות לעסק לקבלת פרטים.',404);
        const html=renderOrderDocument(order.legalSnapshot,{origin:publicOrigin});
        res.once('finish',()=>{if(typeof store.markDocumentServed==='function')Promise.resolve().then(()=>store.markDocumentServed(order.id)).catch(()=>{});});
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Disposition':'attachment; filename="gutman-order.html"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"});res.end(html);return;
      }
      const orderMatch=path.match(/^\/api\/academy\/orders\/([^/]+)$/);
      if(req.method==='GET'&&orderMatch){send(res,200,await store.authorizedOrder(orderMatch[1],bearer(req)));return;}
      const notifyMatch=path.match(/^\/api\/academy\/payments\/morning\/notify\/([^/]+)$/);
      if(req.method==='POST'&&notifyMatch){
        rateLimit(req,'provider-notify',20);
        if(!checkout?.ready)throw new CommerceError('PAYMENT_UNAVAILABLE','החיבור לסליקה עדיין אינו זמין.',503);
        let size=0;for await(const chunk of req){size+=chunk.length;if(size>16384)throw new CommerceError('BODY_TOO_LARGE','הבקשה גדולה מדי.',413);}
        // The callback is a wakeup only. Its amount, status and signature fields never confirm payment.
        await checkout.refresh(notifyMatch[1]);send(res,200,{received:true});return;
      }
      if(req.method==='GET'&&admin){
        if(path==='/api/academy/admin/legal-notices'){send(res,200,{notices:legalInbox?.list()??[]});return;}
        if(path==='/api/academy/admin/delivery-readiness'){send(res,200,deliveryWorker?.getReadiness()??{ready:false,durableClaims:false});return;}
        const routes={summary:async()=>await store.summary(),dates:async()=>({dates:await store.dates(true)}),coupons:async()=>({coupons:await store.coupons()}),registrations:async()=>({registrations:await store.all('registrations')}),orders:async()=>({orders:(await store.summary()).orders}),revenue:async()=>await store.revenue(),outbox:async()=>({outbox:await store.all('outbox')})};
        const endpoint=path.slice('/api/academy/admin/'.length);if(routes[endpoint]){send(res,200,await routes[endpoint]());return;}
      }
      if(['POST','PATCH'].includes(req.method)){
        const {data,raw}=await body(req);
        if(req.method==='POST'&&path==='/api/academy/legal-notices'){
          rateLimit(req,'legal-notice',15);
          if(!legalInbox?.ready)throw new CommerceError('LEGAL_NOTICES_UNAVAILABLE','הטופס אינו זמין כרגע. אפשר למסור הודעה באימייל או בטלפון.',503);
          send(res,200,legalInbox.receive(data,req.headers['idempotency-key']));return;
        }
        if(req.method==='POST'&&path==='/api/academy/leads'){rateLimit(req,'lead-intake',10);if(!leadIntake?.ready)throw new CommerceError('LEADS_UNAVAILABLE','קליטת הפניות אינה זמינה כרגע.',503);send(res,200,await leadIntake.submit(data,req.headers['idempotency-key']));return;}
        if(req.method==='POST'&&path==='/api/academy/quote'){const {couponId,...publicQuote}=await store.quote(data);send(res,200,publicQuote);return;}
        if(req.method==='POST'&&path==='/api/academy/orders'){
          if(store.mode==='morning'&&!checkout?.ready)throw new CommerceError('PAYMENT_UNAVAILABLE','החיבור לסליקה עדיין אינו זמין.',503);
          const created=await store.createOrder(data,req.headers['idempotency-key']);
          if(leadIntake?.ready){
            const order=await store.get('orders',created.orderId);
            if(order?.status==='pending'){
              const date=await store.get('dates',order.dateId);
              try { await leadIntake.submit({fullName:order.customer.name,email:order.customer.email,phone:order.customer.phone,seminarId:date.seminarId,requestedDate:date.date,marketingConsent:order.marketingConsent===true,note:`פתיחת הרשמה באתר. התשלום טרם אושר. מספר הזמנה: ${order.id}`},`checkout-${order.id}`); }
              catch { /* Private intake retains uncertain sends; checkout must not retry CRM or fabricate acceptance. */ }
            }
          }
          send(res,201,store.mode==='morning'?await checkout.start(created):created);return;
        }
        const reconcileMatch=path.match(/^\/api\/academy\/orders\/([^/]+)\/reconcile$/);
        if(req.method==='POST'&&reconcileMatch){
          const id=reconcileMatch[1];await store.authorizedOrder(id,bearer(req));
          if(!checkout?.ready)throw new CommerceError('PAYMENT_UNAVAILABLE','החיבור לסליקה עדיין אינו זמין.',503);
          await checkout.refresh(id);send(res,200,await store.authorizedOrder(id,bearer(req)));return;
        }
        if(req.method==='POST'&&path==='/api/academy/simulation/pay'){send(res,200,await store.simulationPay(data.orderId,bearer(req),data.outcome??'succeeded'));return;}
        if(req.method==='POST'&&path==='/api/academy/simulation/webhook'){
          if(raw===null)throw new CommerceError('RAW_BODY_REQUIRED','אימות התשלום דורש גוף בקשה מקורי.');
          send(res,200,await store.processSignedEvent(raw,req.headers));return;
        }
        if(admin){
          const noticeMatch=path.match(/^\/api\/academy\/admin\/legal-notices\/([^/]+)$/);
          if(noticeMatch&&req.method==='PATCH'){
            if(!legalInbox?.ready)throw new CommerceError('LEGAL_NOTICES_UNAVAILABLE','תיבת הפניות אינה זמינה.',503);
            send(res,200,legalInbox.setStatus(noticeMatch[1],data.status));return;
          }
          if(req.method==='POST'&&path==='/api/academy/admin/outbox/drain'){
            if(!deliveryWorker?.ready)throw new CommerceError('DELIVERY_UNAVAILABLE','שליחת הודעות השירות עדיין אינה זמינה.',503);
            const limit=data.limit??20;
            if(!Number.isSafeInteger(limit)||limit<1||limit>20)throw new CommerceError('INVALID_LIMIT','מספר ההודעות אינו תקין.');
            send(res,200,await deliveryWorker.drain(limit));return;
          }
          if(path==='/api/academy/admin/dates'&&req.method==='POST'){send(res,201,{date:await store.createDate(data)});return;}
          if(path==='/api/academy/admin/coupons'&&req.method==='POST'){send(res,201,{coupon:await store.createCoupon(data)});return;}
          const dateMatch=path.match(/^\/api\/academy\/admin\/dates\/([^/]+)(?:\/(approve|reject))?$/);
          if(dateMatch){const [,id,action]=dateMatch;
            if(req.method==='PATCH'&&!action){send(res,200,{date:await store.updateDate(id,data)});return;}
            if(req.method==='POST'&&action){send(res,200,{date:action==='approve'?await store.approveDate(id,data):await store.rejectDate(id,data)});return;}
          }
          const couponMatch=path.match(/^\/api\/academy\/admin\/coupons\/([^/]+)$/);
          if(couponMatch&&req.method==='PATCH'){send(res,200,{coupon:await store.updateCoupon(couponMatch[1],data)});return;}
          const refundMatch=path.match(/^\/api\/academy\/admin\/orders\/([^/]+)\/refund$/);
          if(refundMatch&&req.method==='POST'){send(res,200,{order:await store.refundOrder(refundMatch[1])});return;}
          const retryMatch=path.match(/^\/api\/academy\/admin\/outbox\/([^/]+)\/retry$/);
          if(retryMatch&&req.method==='POST'){send(res,200,{outbox:await store.retryOutbox(retryMatch[1])});return;}
        }
      }
      send(res,404,{error:{code:'NOT_FOUND',message:'הפעולה לא נמצאה.'}});
    } catch(error) {
      if(error instanceof CommerceError)send(res,error.status,{error:{code:error.code,message:error.message}});
      else if(error instanceof DurableCommerceError)send(res,503,{error:{code:'STORAGE_UNAVAILABLE',message:'מערכת ההרשמה אינה זמינה כרגע. נסו שוב בהמשך.'}});
      else {console.error('Academy request failed:',error?.name??'Error');send(res,500,{error:{code:'SERVER_ERROR',message:'לא ניתן להשלים את הבקשה כרגע.'}});}
    }
  };
}

export function createAcademyServer(configuration) {
  return createServer(createAcademyHandler(configuration));
}
