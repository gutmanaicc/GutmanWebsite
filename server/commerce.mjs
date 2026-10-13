import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { SimulationAdapter, MorningGrowAdapter } from './payment-adapters.mjs';
import { buildMessage } from './message-templates.mjs';

export const config = JSON.parse(readFileSync(new URL('../shared/commerce-config.json', import.meta.url), 'utf8'));
if(config.currency!=='ILS'||config.startTime!=='15:00'||config.endTime!=='20:00'||config.timezone!=='Asia/Jerusalem'||config.durationHours!==5||config.minimumParticipants!==8||config.maximumParticipants!==12||!['launch','regular'].includes(config.activePrice)||![config.launchPriceAgorot,config.regularPriceAgorot].every(value=>Number.isSafeInteger(value)&&value>0)||config.tax.calculationMode!=='none'||config.tax.status!=='exempt')throw new Error('Commerce configuration requires explicit implementation review before changing capacity, hours, currency or tax calculation.');
export const seminarIds = ['social-media-ai', 'ai-video-content', 'ai-business-owners'];
export const statuses = ['draft', 'awaiting_approval', 'scheduled', 'open_for_registration', 'fully_booked', 'registration_closed', 'cancelled', 'completed'];
const digest = value => createHash('sha256').update(value).digest('hex');
const iso = value => new Date(value).toISOString();
const cleanCode = value => String(value ?? '').trim().toUpperCase();
export class CommerceError extends Error {
  constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}
const fail = (code, message, status) => { throw new CommerceError(code, message, status); };
function requiredString(value, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\x00-\x1f]/.test(value)) fail('INVALID_INPUT', 'יש לבדוק את פרטי הטופס.');
  return value.trim();
}
function integer(value, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail('INVALID_INPUT', 'הערך המספרי אינו תקין.');
  return value;
}
export function jerusalemStart(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('INVALID_DATE', 'תאריך לא תקין.');
  const noon = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(+noon) || noon.toISOString().slice(0, 10) !== date) fail('INVALID_DATE', 'תאריך לא תקין.');
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: config.timezone, hour: '2-digit', hourCycle: 'h23' }).format(noon));
  return new Date(`${date}T${String(15 - (hour - 12)).padStart(2, '0')}:00:00Z`).getTime();
}

export class CommerceStore {
  constructor({ path = ':memory:', clock = Date.now, mode = 'disabled', development = false, simulationSecret, orderSecret, adapter, bookingTermsApproved = false, legalDocumentFactory, requiredDisclosureVersion, merchantDisclosureReady = true, publicOrigin = 'https://gutmanai.com' } = {}) {
    if (!['disabled','simulation','morning'].includes(mode)) throw new Error('Unsupported payment mode.');
    if(mode==='morning'&&(typeof orderSecret!=='string'||orderSecret.length<32))throw new Error('Morning checkout requires a separate orderSecret of at least 32 characters.');
    this.orderSecret=orderSecret??simulationSecret;
    this.clock = clock;
    this.publicOrigin = publicOrigin;
    this.mode = mode;
    this.bookingTermsApproved = bookingTermsApproved;
    this.legalDocumentFactory = legalDocumentFactory;
    this.requiredDisclosureVersion = requiredDisclosureVersion;
    this.merchantDisclosureReady = merchantDisclosureReady;
    this.adapter = mode === 'simulation' ? new SimulationAdapter({secret: simulationSecret, development}) : mode==='morning' ? (adapter??new MorningGrowAdapter()) : null;
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS dates (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS coupons (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, idempotency_key TEXT UNIQUE NOT NULL, request_hash TEXT NOT NULL, access_hash TEXT NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS payment_events (id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, transaction_id TEXT, data TEXT NOT NULL);
      CREATE UNIQUE INDEX IF NOT EXISTS unique_payment_transaction ON payment_events(transaction_id) WHERE transaction_id IS NOT NULL;
      CREATE TABLE IF NOT EXISTS registrations (id TEXT PRIMARY KEY, order_id TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, dedupe_key TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    `);
  }
  close() { this.db.close(); }
  get commerce() { return { mode: this.mode, ready: this.bookingTermsApproved && this.merchantDisclosureReady && ((this.mode==='simulation'&&!!this.adapter)||(this.mode==='morning'&&this.adapter?.ready===true)), bookingTermsApproved: this.bookingTermsApproved }; }
  transaction(fn) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  all(table) { return this.db.prepare(`SELECT data FROM ${table}`).all().map(row => JSON.parse(row.data)); }
  get(table, id) { const row = this.db.prepare(`SELECT data FROM ${table} WHERE id=?`).get(id); return row ? JSON.parse(row.data) : null; }
  save(table, data) { this.db.prepare(`UPDATE ${table} SET data=? WHERE id=?`).run(JSON.stringify(data), data.id); }
  seedDrafts() {
    this.transaction(() => {
      ['2026-10-20','2026-10-22','2026-10-27','2026-10-29','2026-11-03','2026-11-05','2026-11-10','2026-11-12','2026-11-17','2026-11-19'].forEach((date,index)=>{
        const id=`proposal-${date}`;
        if(jerusalemStart(date)<=this.clock()||this.get('dates',id))return;
        const fashion=index%2===0;
        const source=fashion?'https://drive.google.com/file/d/1wWNIhX9TUAD0uLXujQS0UqH2mgbAPPlo/view?usp=drivesdk':'https://drive.google.com/file/d/16tXD4kwtdv_5mQxpOGqWiPa9pLIev4xU/view?usp=drivesdk';
        const record=this.validateDate({id,seminarId:seminarIds[index%3],date,venue:'SOK, ראשון לציון — מקום מוצע, טעון אישור',status:'draft',approvalStatus:'pending',published:false,source,sourceNote:`Former ${fashion?'fashion':'social-media'} course slot; venue availability, holidays and paid obligations not verified.`});
        this.db.prepare('INSERT INTO dates(id,data) VALUES (?,?)').run(record.id,JSON.stringify(record));
        this.audit('date.proposed',record.id,{source});
      });
    });
  }
  validateDate(input, previous = {}) {
    const record = { ...previous, ...input };
    record.id = previous.id ?? input.id ?? randomUUID();
    if (!seminarIds.includes(record.seminarId)) fail('INVALID_SEMINAR', 'יש לבחור סמינר פעיל.');
    jerusalemStart(record.date);
    if (jerusalemStart(record.date) <= this.clock() && !['cancelled', 'completed'].includes(record.status)) fail('PAST_DATE', 'אין לפתוח הרשמה לתאריך שעבר.');
    record.venue = requiredString(record.venue);
    record.capacity = integer(record.capacity ?? config.maximumParticipants, config.minimumParticipants, config.maximumParticipants);
    record.minimumParticipants = config.minimumParticipants;
    record.status ??= 'draft';
    if (!statuses.includes(record.status)) fail('INVALID_STATUS', 'סטטוס המועד אינו תקין.');
    record.approvalStatus ??= 'pending';
    record.published = record.published === true;
    record.startTime = config.startTime;
    record.endTime = config.endTime;
    record.timezone = config.timezone;
    if (record.approvalStatus !== 'approved' && (record.published || record.status === 'open_for_registration')) fail('DATE_NOT_APPROVED', 'המועד ממתין לאישור מנהל.');
    const duplicate = this.all('dates').find(other => other.id !== record.id && other.date === record.date && !['cancelled', 'completed'].includes(other.status) && !['cancelled', 'completed'].includes(record.status));
    if (duplicate) fail('DATE_CONFLICT', 'קיים מועד נוסף באותו חלון זמן.');
    if (previous.id && this.dateView(previous).paidCount + this.dateView(previous).pendingCount > record.capacity) fail('CAPACITY_CONFLICT', 'לא ניתן להפחית קיבולת מתחת להרשמות ולמושבים השמורים.');
    return record;
  }
  audit(action,entityId,detail={}) {const event={id:randomUUID(),action,entityId,detail,actor:action==='date.proposed'?'system-source-import':'authenticated-local-admin',createdAt:iso(this.clock())};this.db.prepare('INSERT INTO audit_events(id,data) VALUES(?,?)').run(event.id,JSON.stringify(event));}
  dates(admin = false) {
    return this.all('dates').filter(date => admin || (date.approvalStatus === 'approved' && date.published && jerusalemStart(date.date) > this.clock() && !['cancelled', 'completed', 'draft', 'awaiting_approval'].includes(date.status))).map(date => admin?this.dateView(date):this.publicDate(date)).sort((a, b) => a.date.localeCompare(b.date));
  }
  publicDate(date) {const {source,sourceNote,approvedAt,rejectionReason,minimumEnrollmentReviewAt,requiresMinimumEnrollmentDecision,...publicFields}=this.dateView(date);return publicFields;}
  dateView(date) {
    const orders = this.all('orders').filter(order => order.dateId === date.id);
    const paidCount = orders.filter(order => order.status === 'paid').length;
    const pendingCount = orders.filter(order => order.status === 'pending' && Date.parse(order.holdExpiresAt) > this.clock()).length;
    const remainingCapacity = Math.max(0, date.capacity - paidCount - pendingCount);
    const minimumEnrollmentReviewAt=iso(jerusalemStart(date.date)-48*3_600_000);
    return { ...date, paidCount, pendingCount, remainingCapacity, minimumEnrollmentReviewAt,requiresMinimumEnrollmentDecision:date.approvalStatus==='approved'&&!['cancelled','completed'].includes(date.status)&&paidCount<config.minimumParticipants&&this.clock()>=Date.parse(minimumEnrollmentReviewAt),minimumEnrollmentMet: paidCount >= config.minimumParticipants, status: date.status === 'open_for_registration' && remainingCapacity === 0 ? 'fully_booked' : date.status };
  }
  createDate(body) {
    return this.transaction(() => {
      const date = this.validateDate({...body, approvalStatus:'pending',published:false,status:body.status === 'awaiting_approval' ? 'awaiting_approval' : 'draft'});
      this.db.prepare('INSERT INTO dates(id,data) VALUES(?,?)').run(date.id, JSON.stringify(date));this.audit('date.created',date.id); return this.dateView(date);
    });
  }
  updateDate(id, body) {
    return this.transaction(() => {
      const before = this.get('dates', id); if (!before) fail('NOT_FOUND', 'המועד לא נמצא.', 404);
      // Approval may only be changed by the explicit approval/rejection actions.
      const allowed = Object.fromEntries(Object.entries(body).filter(([key]) => ['seminarId','date','venue','capacity','status','published'].includes(key)));
      const materialChange = ['seminarId','date','venue'].some(key => key in allowed && allowed[key] !== before[key]);
      const enrollment = this.dateView(before);
      if (materialChange && enrollment.paidCount + enrollment.pendingCount > 0) fail('EXISTING_OBLIGATIONS', 'יש הרשמות או הזמנות פעילות. שינוי מהותי דורש טיפול פרטני והודעה למשתתפים.', 409);
      const date = this.validateDate({...allowed, ...(materialChange ? {approvalStatus:'pending',published:false,status:'draft'} : {})}, before);
      if (date.status==='cancelled' && enrollment.paidCount + enrollment.pendingCount > 0) fail('EXISTING_OBLIGATIONS', 'ביטול מועד עם הרשמות מחייב ביטולים והחזרים פרטניים.', 409);
      if(date.status==='completed'&&(jerusalemStart(date.date)+config.durationHours*3_600_000>this.clock()||enrollment.pendingCount>0))fail('SEMINAR_NOT_ENDED','ניתן לסמן השלמה רק לאחר סיום הסמינר וללא הזמנות ממתינות.',409);
      this.save('dates', date);this.audit('date.updated',date.id,{status:date.status,published:date.published,approvalStatus:date.approvalStatus}); return this.dateView(date);
    });
  }
  approveDate(id, body) {
    return this.transaction(() => {
      const before = this.get('dates', id); if (!before) fail('NOT_FOUND', 'המועד לא נמצא.', 404);
      if (body.checksConfirmed !== true) fail('APPROVAL_CHECKS_REQUIRED', 'נדרש אישור שבוצעו בדיקות מקום, חגים והתחייבויות קודמות.');
      const date = this.validateDate({approvalStatus:'approved',approvedAt:iso(this.clock()),published:body.publish === true,status:body.openRegistration === true ? 'open_for_registration' : 'scheduled'}, before);
      this.save('dates', date);this.audit('date.approved',date.id,{checksConfirmed:true,published:date.published,status:date.status}); return this.dateView(date);
    });
  }
  rejectDate(id, body = {}) {
    return this.transaction(() => {
      const before = this.get('dates', id); if (!before) fail('NOT_FOUND', 'המועד לא נמצא.', 404);
      const view = this.dateView(before);
      if (view.paidCount + view.pendingCount > 0) fail('EXISTING_OBLIGATIONS', 'לא ניתן לדחות מועד עם הרשמות פעילות.', 409);
      const date = {...before,approvalStatus:'rejected',published:false,status:'cancelled',rejectionReason:String(body.reason ?? '').slice(0,1000)};
      this.save('dates',date);this.audit('date.rejected',date.id);return this.dateView(date);
    });
  }
  purchasableDate(id) {
    const date = this.get('dates',id);
    if (!date || date.approvalStatus !== 'approved' || !date.published || date.status !== 'open_for_registration' || jerusalemStart(date.date) <= this.clock()) fail('DATE_UNAVAILABLE', 'המועד אינו פתוח להרשמה.', 409);
    return date;
  }
  validateCoupon(body, previous = {}) {
    const coupon = {...previous,...body,id:previous.id ?? randomUUID()};
    coupon.code = cleanCode(coupon.code);
    if (!/^[A-Z0-9_-]{3,40}$/.test(coupon.code)) fail('INVALID_COUPON_CODE', 'הקוד צריך להכיל 3–40 אותיות באנגלית, ספרות, מקף או קו תחתון.');
    if (!['fixed','percentage'].includes(coupon.type)) fail('INVALID_COUPON', 'סוג ההנחה אינו תקין.');
    coupon.value = integer(coupon.value,1,coupon.type === 'percentage' ? 100 : 10_000_000);
    coupon.maxRedemptions = integer(coupon.maxRedemptions ?? 1,1,1_000_000);
    coupon.perCustomerLimit = coupon.perCustomerLimit == null ? null : integer(coupon.perCustomerLimit,1,1_000_000);
    for (const field of ['seminarIds','dateIds']) {
      coupon[field] ??= [];
      if (!Array.isArray(coupon[field]) || coupon[field].some(value => typeof value !== 'string')) fail('INVALID_COUPON', 'הגבלת הקופון אינה תקינה.');
    }
    if (coupon.seminarIds.some(value => !seminarIds.includes(value)) || coupon.dateIds.some(value => !this.get('dates',value))) fail('INVALID_COUPON', 'הסמינר או המועד לא נמצאו.');
    for (const field of ['startsAt','expiresAt']) {
      coupon[field] ??= null;
      if (coupon[field] !== null && !Number.isFinite(Date.parse(coupon[field]))) fail('INVALID_COUPON', 'תוקף הקופון אינו תקין.');
    }
    if (coupon.startsAt && coupon.expiresAt && Date.parse(coupon.startsAt) >= Date.parse(coupon.expiresAt)) fail('INVALID_COUPON', 'תאריך הסיום צריך להיות אחרי תחילת התוקף.');
    coupon.active = coupon.active === true;
    coupon.notes = String(coupon.notes ?? '').slice(0,1000);
    delete coupon.totalRedemptions;
    return coupon;
  }
  createCoupon(body) {
    return this.transaction(() => {
      const coupon = this.validateCoupon(body);
      if (this.db.prepare('SELECT id FROM coupons WHERE code=?').get(coupon.code)) fail('COUPON_EXISTS','קוד הקופון כבר קיים.',409);
      this.db.prepare('INSERT INTO coupons(id,code,data) VALUES(?,?,?)').run(coupon.id,coupon.code,JSON.stringify(coupon));this.audit('coupon.created',coupon.id); return coupon;
    });
  }
  updateCoupon(id, body) {
    return this.transaction(() => {
      const before = this.get('coupons',id); if (!before) fail('NOT_FOUND','הקופון לא נמצא.',404);
      const coupon = this.validateCoupon(body,before);
      const duplicate = this.db.prepare('SELECT id FROM coupons WHERE code=? AND id<>?').get(coupon.code,id);
      if (duplicate) fail('COUPON_EXISTS','קוד הקופון כבר קיים.',409);
      this.db.prepare('UPDATE coupons SET code=?,data=? WHERE id=?').run(coupon.code,JSON.stringify(coupon),id);this.audit('coupon.updated',coupon.id,{active:coupon.active});return coupon;
    });
  }
  coupons() { return this.all('coupons').map(coupon => ({...coupon,totalRedemptions:this.all('orders').filter(order => order.couponId === coupon.id && ['paid','refunded'].includes(order.status)).length})); }
  quote({dateId,couponCode,email,customer}, excludeOrderId) {
    const date = this.purchasableDate(dateId);
    const subtotalAgorot = config.activePrice === 'regular' ? config.regularPriceAgorot : config.launchPriceAgorot;
    const code = cleanCode(couponCode);
    let discountAgorot = 0;let couponId = null;
    if (code) {
      const row = this.db.prepare('SELECT data FROM coupons WHERE code=?').get(code);
      const coupon = row ? JSON.parse(row.data) : null;
      const now = this.clock();
      const unavailable = !coupon || !coupon.active || (coupon.startsAt && Date.parse(coupon.startsAt) > now) || (coupon.expiresAt && Date.parse(coupon.expiresAt) <= now) || (coupon.seminarIds.length && !coupon.seminarIds.includes(date.seminarId)) || (coupon.dateIds.length && !coupon.dateIds.includes(date.id));
      if (unavailable) fail('COUPON_INVALID','הקופון אינו בתוקף או אינו מתאים למועד שנבחר.');
      // Hold coupon availability atomically with seats. Refunds never replenish usage automatically.
      const uses = this.all('orders').filter(order => order.id !== excludeOrderId && order.couponId === coupon.id && (['paid','refunded'].includes(order.status) || (order.status === 'pending' && Date.parse(order.holdExpiresAt) > now)));
      if (uses.length >= coupon.maxRedemptions) fail('COUPON_LIMIT','הקופון הגיע למגבלת המימושים.');
      const emailKey = String(email ?? customer?.email ?? '').trim().toLowerCase();
      if (coupon.perCustomerLimit && !emailKey) fail('COUPON_EMAIL_REQUIRED','יש להזין אימייל כדי לבדוק את הקופון.');
      if (coupon.perCustomerLimit && uses.filter(order => order.customer.email === emailKey).length >= coupon.perCustomerLimit) fail('COUPON_CUSTOMER_LIMIT','מגבלת המימושים לאימייל זה הושגה.');
      discountAgorot = Math.min(subtotalAgorot,coupon.type === 'percentage' ? Math.round(subtotalAgorot*coupon.value/100) : coupon.value);
      couponId = coupon.id;
    }
    return {subtotalAgorot,discountAgorot,totalAgorot:subtotalAgorot-discountAgorot,currency:config.currency,couponId,couponCode:code || null};
  }
  validateCustomer(input) {
    const customer = {name:requiredString(input?.name,100),email:requiredString(input?.email,254).toLowerCase(),phone:requiredString(input?.phone,30)};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) || !/^[+\d ()-]{7,30}$/.test(customer.phone)) fail('INVALID_CUSTOMER','יש לבדוק את כתובת האימייל ומספר הטלפון.');
    return customer;
  }
  createOrder(body, idempotencyKey) {
    if (!this.commerce.ready) fail('PAYMENT_UNAVAILABLE','הרכישה אינה פעילה. נדרש ספק תשלום מאומת ואישור תנאי הרשמה.',503);
    const key = requiredString(idempotencyKey,128);
    const customer = this.validateCustomer(body.customer);
    if (body.termsAccepted !== true) fail('TERMS_REQUIRED','נדרש אישור תנאי ההרשמה.');
    if ((body.installments ?? 1) !== 1) fail('INSTALLMENTS_UNAVAILABLE','תשלומים טרם אומתו מול הספק.');
    const canonical = {dateId:requiredString(body.dateId),customer,couponCode:cleanCode(body.couponCode),termsAccepted:true,marketingConsent:body.marketingConsent === true,installments:1};
    const requestHash = digest(JSON.stringify(canonical));
    return this.transaction(() => {
      const existing = this.db.prepare('SELECT * FROM orders WHERE idempotency_key=?').get(key);
      if (existing) {
        if (existing.request_hash !== requestHash) fail('IDEMPOTENCY_CONFLICT','מפתח הבקשה כבר משויך לפרטים אחרים.',409);
        const order = JSON.parse(existing.data);
        if((order.provider??'simulation')!==this.mode)fail('ORDER_PROVIDER_CONFLICT','ההזמנה נוצרה במצב תשלום אחר.',409);
        if(existing.access_hash!==digest(this.accessToken(order.id,key)))fail('ORDER_SECRET_CHANGED','הגדרת הרשאת ההזמנה השתנתה. יש לפנות לתמיכה.',503);
        if(order.status==='pending'&&Date.parse(order.holdExpiresAt)<=this.clock()){order.status='expired';this.save('orders',order);}
        // Stable scoped token is keyed by secret, never derivable from public order IDs.
        return this.orderResult(order,this.accessToken(order.id,key));
      }
      if(this.requiredDisclosureVersion && body.disclosureVersion !== this.requiredDisclosureVersion) fail('DISCLOSURE_CHANGED','יש לרענן את מסך ההרשמה ולקרוא את פרטי העסק והעלויות המעודכנים לפני המשך.',409);
      const date = this.purchasableDate(canonical.dateId);
      if (this.dateView(date).remainingCapacity <= 0) fail('FULLY_BOOKED','כל המקומות במועד זה תפוסים או שמורים.',409);
      const price = this.quote(canonical);
      const id = randomUUID();const accessToken = this.accessToken(id,key);
      const order = {...canonical,...price,id,status:'pending',createdAt:iso(this.clock()),holdExpiresAt:iso(Math.min(this.clock()+config.holdMinutes*60_000,jerusalemStart(date.date))),simulation:this.mode==='simulation',provider:this.mode,checkoutUrl:null,checkoutState:this.mode==='morning'?'not_created':'not_required',transactionId:null,termsVersion:this.mode==='simulation'?'preview-owner-approval-required':'owner-approved-booking-terms'};
      if(typeof this.legalDocumentFactory==='function') {
        order.legalSnapshot=this.legalDocumentFactory(order,date,order.createdAt);
        order.termsVersion=order.legalSnapshot.policy.version;
      }
      this.db.prepare('INSERT INTO orders(id,idempotency_key,request_hash,access_hash,data) VALUES(?,?,?,?,?)').run(id,key,requestHash,digest(accessToken),JSON.stringify(order));
      return this.orderResult(order,accessToken);
    });
  }
  accessToken(id,key) { return createHmac('sha256',this.orderSecret).update(`${id}:${key}`).digest('hex'); }
  orderResult(order,accessToken) { return {orderId:order.id,status:order.status,totalAgorot:order.totalAgorot,currency:order.currency,holdExpiresAt:order.holdExpiresAt,simulation:order.simulation===true,provider:order.provider??'simulation',checkoutUrl:order.checkoutUrl??null,checkoutState:order.checkoutState??'not_required',checkoutExpiresAt:order.checkoutExpiresAt??null,transactionId:order.transactionId,...(accessToken ? {orderAccessToken:accessToken} : {})}; }
  authorizedOrder(id,token) {
    const row = this.db.prepare('SELECT * FROM orders WHERE id=?').get(id);
    if (!row || typeof token !== 'string' || !timingSafeEqual(Buffer.from(row.access_hash,'hex'),Buffer.from(digest(token),'hex'))) fail('UNAUTHORIZED','אין הרשאה לצפות בהזמנה.',401);
    const order = JSON.parse(row.data);
    if(order.status==='pending'&&Date.parse(order.holdExpiresAt)<=this.clock())order.status='expired';
    return {...this.orderResult(order),transactionId:order.transactionId,customer:order.customer,dateId:order.dateId,discountAgorot:order.discountAgorot,date:this.publicDate(this.get('dates',order.dateId)),documentAvailable:!!order.legalSnapshot,preparation:'הביאו מחשב נייד, מטען וגישה לחשבונות הכלים. דרישות מדויקות יפורסמו לאחר אישור צוות ההדרכה.'};
  }
  markDocumentServed(id) {
    return this.transaction(()=>{const order=this.get('orders',id);if(order?.legalSnapshot&&!order.documentFirstServedAt){order.documentFirstServedAt=iso(this.clock());this.save('orders',order);}return {recorded:!!order?.documentFirstServedAt};});
  }
  simulationPay(id,token,outcome='succeeded') {
    if (this.mode!=='simulation'||!this.commerce.ready || !this.adapter) fail('PAYMENT_UNAVAILABLE','הדגמת תשלום אינה פעילה.',503);
    this.authorizedOrder(id,token);
    const order = this.get('orders',id);
    if (order.status === 'paid') return this.orderResult(order);
    if (!['succeeded','failed'].includes(outcome)) fail('INVALID_PAYMENT','תוצאת תשלום לא תקינה.');
    const event = {id:randomUUID(),orderId:id,type:outcome,transactionId:`sim-${randomUUID()}`,amountAgorot:order.totalAgorot,currency:'ILS'};
    const raw = JSON.stringify(event);const timestamp = String(this.clock());
    return this.processSignedEvent(raw,{'x-academy-timestamp':timestamp,'x-academy-signature':this.adapter.sign(raw,timestamp)});
  }
  /** Claim once before any remote create call. A crashed/ambiguous claim is never retried automatically. */
  claimCheckout(orderId) {
    if(this.mode!=='morning'||!this.commerce.ready)fail('PAYMENT_UNAVAILABLE','ספק התשלום אינו פעיל.',503);
    return this.transaction(()=>{
      const order=this.get('orders',orderId);
      if(!order)fail('ORDER_NOT_FOUND','ההזמנה לא נמצאה.',404);
      if(order.provider!=='morning')fail('ORDER_PROVIDER_CONFLICT','ספק התשלום אינו תואם להזמנה.',409);
      if(order.status!=='pending'||Date.parse(order.holdExpiresAt)<=this.clock())fail('ORDER_UNAVAILABLE','ההזמנה אינה זמינה לתשלום.',409);
      if(order.checkoutState!=='not_created')return {claimed:false,order,checkoutState:order.checkoutState};
      this.purchasableDate(order.dateId);
      const price=this.quote(order,order.id);
      if(price.totalAgorot!==order.totalAgorot||price.couponId!==order.couponId)fail('ORDER_PRICE_CHANGED','פרטי ההנחה השתנו. יש להתחיל הזמנה חדשה.',409);
      order.checkoutState='creating';
      order.checkoutClaimedAt=iso(this.clock());
      order.checkoutLeaseExpiresAt=iso(Math.min(this.clock()+120_000,Date.parse(order.holdExpiresAt)));
      this.save('orders',order);
      return {claimed:true,order,checkoutState:'creating'};
    });
  }
  /** Caller must also verify the URL against the actual provider's canonical host allowlist. */
  completeCheckout(orderId,{providerLinkId,checkoutUrl,expiresAt,expiryEnforced=true}) {
    if(this.mode!=='morning')fail('PAYMENT_UNAVAILABLE','ספק התשלום אינו פעיל.',503);
    const linkId=requiredString(providerLinkId,200);
    const url=requiredString(checkoutUrl,2000);
    let parsed;try{parsed=new URL(url);}catch{fail('INVALID_CHECKOUT_URL','קישור התשלום אינו תקין.');}
    if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.hash)fail('INVALID_CHECKOUT_URL','נדרש קישור HTTPS מאובטח של ספק התשלום.');
    const providerExpiry=Date.parse(expiresAt);
    if(!Number.isFinite(providerExpiry))fail('INVALID_CHECKOUT_EXPIRY','תוקף קישור התשלום אינו תקין.');
    return this.transaction(()=>{
      const order=this.get('orders',orderId);if(!order)fail('ORDER_NOT_FOUND','ההזמנה לא נמצאה.',404);
      if(order.provider!=='morning')fail('ORDER_PROVIDER_CONFLICT','ספק התשלום אינו תואם להזמנה.',409);
      if(order.checkoutState==='ready'){
        if(order.providerLinkId!==linkId||order.checkoutUrl!==url)fail('CHECKOUT_CONFLICT','להזמנה כבר קיים קישור תשלום אחר.',409);
        return this.orderResult(order);
      }
      if(!['creating','unknown'].includes(order.checkoutState))fail('CHECKOUT_NOT_CLAIMED','יצירת קישור התשלום לא הוזמנה.',409);
      order.providerLinkId=linkId;
      order.providerExpiryEnforced=expiryEnforced===true;
      order.checkoutExpiresAt=iso(Math.min(providerExpiry,Date.parse(order.holdExpiresAt)));
      if(order.status!=='pending'||Date.parse(order.checkoutExpiresAt)<=this.clock()){
        order.checkoutState='unknown';order.checkoutFailureCode='LINK_AFTER_HOLD_EXPIRY';order.checkoutUrl=null;
        this.save('orders',order);this.enqueue('checkout_review',order,{reason:'A provider link was created after the hold expired; suppress link and reconcile provider state.',providerLinkId:linkId},this.clock());
        return this.orderResult(order);
      }
      order.checkoutState='ready';order.checkoutUrl=url;this.save('orders',order);return this.orderResult(order);
    });
  }
  checkoutFailed(orderId,{unknown=false,reasonCode='PROVIDER_CHECKOUT_FAILED'}={}) {
    if(this.mode!=='morning')fail('PAYMENT_UNAVAILABLE','ספק התשלום אינו פעיל.',503);
    return this.transaction(()=>{
      const order=this.get('orders',orderId);if(!order)fail('ORDER_NOT_FOUND','ההזמנה לא נמצאה.',404);
      if(order.provider!=='morning')fail('ORDER_PROVIDER_CONFLICT','ספק התשלום אינו תואם להזמנה.',409);
      if(order.checkoutState==='ready')return this.orderResult(order);
      if(!['creating','unknown','failed'].includes(order.checkoutState))fail('CHECKOUT_NOT_CLAIMED','יצירת קישור התשלום לא הוזמנה.',409);
      // Never release the held seat on an ambiguous transport result; eventual verified success can still arrive.
      order.checkoutState=unknown?'unknown':'failed';
      order.checkoutFailureCode=/^[A-Z0-9_]{1,80}$/.test(reasonCode)?reasonCode:'PROVIDER_CHECKOUT_FAILED';
      this.save('orders',order);
      if(unknown)this.enqueue('checkout_review',order,{reason:'Provider checkout outcome is unknown; reconcile before taking further action.'},this.clock());
      return this.orderResult(order);
    });
  }
  expireHolds() {
    return this.transaction(() => {
      let count = 0;
      for (const order of this.all('orders')) if (order.status === 'pending' && Date.parse(order.holdExpiresAt) <= this.clock()) {order.status='expired';this.save('orders',order);count++;}
      return count;
    });
  }
  processSignedEvent(raw,headers) {
    if(this.mode!=='simulation')fail('PAYMENT_UNAVAILABLE','הדגמת תשלום אינה פעילה במצב זה.',503);
    const event = this.adapter?.verifyWebhook(raw,headers,this.clock());
    if (!event) fail('INVALID_SIGNATURE','אימות הודעת התשלום נכשל.',401);
    return this.processVerifiedEvent(event,{fingerprint:digest(raw)});
  }
  /** Internal trust boundary: only call after provider authentication AND normalized server reconciliation.
   * Never wire arbitrary browser JSON directly to this method.
   */
  processVerifiedEvent(input,{fingerprint}={}) {
    if(!['morning','simulation'].includes(this.mode))fail('PAYMENT_UNAVAILABLE','ספק התשלום אינו פעיל.',503);
    if(!input||typeof input!=='object')fail('INVALID_PAYMENT','הודעת התשלום אינה תקינה.');
    const event={id:input.id,orderId:input.orderId,type:input.type,transactionId:input.transactionId,amountAgorot:input.amountAgorot,currency:input.currency,provider:input.provider??this.mode};
    if (typeof event.id !== 'string' || typeof event.orderId !== 'string' || typeof event.transactionId !== 'string' || !event.id || !event.transactionId || event.id.length>200 || event.transactionId.length>200 || !['succeeded','failed'].includes(event.type)||event.provider!==this.mode) fail('INVALID_PAYMENT','הודעת התשלום אינה תקינה.');
    fingerprint??=digest(JSON.stringify(event));
    return this.transaction(() => {
      const prior = this.db.prepare('SELECT * FROM payment_events WHERE id=?').get(event.id);
      if (prior) {
        if (prior.fingerprint !== fingerprint) fail('EVENT_CONFLICT','מזהה אירוע התשלום כבר קיים עם פרטים אחרים.',409);
        return {...this.orderResult(this.get('orders',event.orderId)),duplicate:true};
      }
      const order = this.get('orders',event.orderId);if (!order) fail('ORDER_NOT_FOUND','ההזמנה לא נמצאה.',404);
      if(event.provider!==(order.provider??'simulation'))fail('ORDER_PROVIDER_CONFLICT','ספק התשלום אינו תואם להזמנה.',409);
      if (event.currency !== order.currency || !Number.isSafeInteger(event.amountAgorot) || event.amountAgorot !== order.totalAgorot) fail('PAYMENT_AMOUNT_MISMATCH','סכום התשלום אינו תואם להזמנה.',409);
      const priorTransaction=this.db.prepare('SELECT data FROM payment_events WHERE transaction_id=?').get(event.transactionId);
      if(priorTransaction){const previous=JSON.parse(priorTransaction.data);if(previous.orderId!==event.orderId||previous.type!==event.type||previous.amountAgorot!==event.amountAgorot||previous.currency!==event.currency)fail('TRANSACTION_CONFLICT','אסמכתת התשלום כבר שויכה.',409);this.db.prepare('INSERT INTO payment_events(id,fingerprint,transaction_id,data) VALUES(?,?,NULL,?)').run(event.id,fingerprint,JSON.stringify(event));return {...this.orderResult(order),duplicate:true};}
      this.db.prepare('INSERT INTO payment_events(id,fingerprint,transaction_id,data) VALUES(?,?,?,?)').run(event.id,fingerprint,event.transactionId,JSON.stringify(event));
      if (order.status === 'paid' || order.status === 'refunded') {if(event.type==='succeeded')this.enqueue('duplicate_capture_review',order,{transactionId:event.transactionId,reason:'Additional distinct verified capture received for a settled order; no extra enrollment.'},this.clock(),`duplicate-capture:${event.transactionId}`);return {...this.orderResult(order),duplicate:true};}
      if (event.type === 'failed') {
        if (order.status === 'pending') {order.status='failed';this.save('orders',order);}
        return this.orderResult(order);
      }
      let valid = order.status === 'pending' && Date.parse(order.holdExpiresAt) > this.clock();
      try {
        this.purchasableDate(order.dateId);
        const price = this.quote(order,order.id);
        valid = valid && price.totalAgorot === order.totalAgorot && price.couponId === order.couponId;
      } catch { valid = false; }
      const date = this.get('dates',order.dateId);
      if (!valid || this.dateView(date).paidCount >= date.capacity) {
        order.status='refund_required';order.transactionId=event.transactionId;this.save('orders',order);
        this.enqueue('payment_review',order,{reason:'Verified success arrived after hold expiry, state change, or coupon change; no seat or enrollment granted.'},this.clock());
        return this.orderResult(order);
      }
      order.status='paid';order.paidAt=iso(this.clock());order.transactionId=event.transactionId;this.save('orders',order);
      const registration = {id:randomUUID(),orderId:order.id,dateId:date.id,seminarId:date.seminarId,customer:order.customer,status:'confirmed',totalAgorot:order.totalAgorot,couponCode:order.couponCode,transactionId:order.transactionId,createdAt:iso(this.clock()),simulation:order.simulation===true,provider:order.provider??'simulation'};
      this.db.prepare('INSERT INTO registrations(id,order_id,data) VALUES(?,?,?)').run(registration.id,order.id,JSON.stringify(registration));
      for (const [kind,time] of [['confirmation',this.clock()],['preparation',this.clock()],['reminder',Math.max(this.clock(),jerusalemStart(date.date)-86_400_000)],['followup',jerusalemStart(date.date)+5*3_600_000+86_400_000]]) this.enqueue(kind,order,buildMessage(kind,order,date,{publicOrigin:this.publicOrigin}),time);
      if(this.dateView(date).paidCount===config.minimumParticipants)this.enqueue('minimum_reached',order,{dateId:date.id,paidCount:config.minimumParticipants,simulation:order.simulation===true},this.clock(),`date:${date.id}:minimum-reached`);
      this.enqueue('crm_registration',order,{externalId:order.id,registration,marketingConsent:order.marketingConsent,simulation:order.simulation===true},this.clock());
      return {...this.orderResult(order),transactionId:order.transactionId};
    });
  }
  refundOrder(id) {
    if (this.mode !== 'simulation') fail('PAYMENT_UNAVAILABLE','החזר אמיתי אינו מוגדר.',503);
    return this.transaction(() => {
      const order = this.get('orders',id);if (!order) fail('NOT_FOUND','ההזמנה לא נמצאה.',404);
      if (order.status === 'refunded') return this.orderResult(order);
      if (!['paid','refund_required'].includes(order.status)) fail('REFUND_UNAVAILABLE','אין תשלום מאומת להחזר.',409);
      order.status='refunded';order.refundedAt=iso(this.clock());this.save('orders',order);
      const registration = this.all('registrations').find(record => record.orderId === id);
      if (registration) {registration.status='cancelled';this.save('registrations',registration);}
      for (const message of this.all('outbox')) if (message.orderId === id && message.status !== 'sent') {message.status='cancelled';this.save('outbox',message);}
      this.audit('order.refunded',order.id,{totalAgorot:order.totalAgorot,simulation:true});
      this.enqueue('cancellation',order,buildMessage('cancellation',order,this.get('dates',order.dateId)),this.clock());
      return this.orderResult(order);
    });
  }
  enqueue(kind,order,payload,at,dedupeKey) {
    const item = {id:randomUUID(),kind,orderId:order.id,status:'pending',attempts:0,nextAttemptAt:iso(at),payload,lastError:null,createdAt:iso(this.clock())};
    this.db.prepare('INSERT OR IGNORE INTO outbox(id,dedupe_key,data) VALUES(?,?,?)').run(item.id,dedupeKey??`${order.id}:${kind}`,JSON.stringify(item));return item;
  }
  retryOutbox(id) {
    return this.transaction(() => {const item=this.get('outbox',id);if(!item)fail('NOT_FOUND','ההודעה לא נמצאה.',404);if (['sent','cancelled'].includes(item.status)) fail('MESSAGE_NOT_RETRYABLE','ההודעה אינה ניתנת לניסיון חוזר.',409);item.status='pending';item.attempts=0;item.nextAttemptAt=iso(this.clock());this.save('outbox',item);return item;});
  }
  /** Worker boundary. Caller must provide an approved delivery adapter; server never calls this automatically. */
  async drainOutbox(deliver,limit=20) {
    if (typeof deliver !== 'function') throw new Error('Explicit delivery adapter required.');
    this.transaction(()=>{for(const item of this.all('outbox'))if(item.status==='processing'&&Date.parse(item.nextAttemptAt)<=this.clock()){item.status='failed';item.lastError='Worker lease expired; retry uses the same delivery idempotency key.';this.save('outbox',item);}});
    const due=this.all('outbox').filter(item=>['pending','failed'].includes(item.status)&&Date.parse(item.nextAttemptAt)<=this.clock()).slice(0,limit);
    for (const snapshot of due) {
      const item=this.transaction(()=>{const current=this.get('outbox',snapshot.id);if (!['pending','failed'].includes(current.status))return null;current.status='processing';current.attempts++;current.nextAttemptAt=iso(this.clock()+300_000);this.save('outbox',current);return current;});
      if(!item)continue;
      try {await deliver(item.payload,{kind:item.kind,idempotencyKey:item.id});this.transaction(()=>{const current=this.get('outbox',item.id);if(current.status==='processing'){current.status='sent';current.sentAt=iso(this.clock());current.lastError=null;this.save('outbox',current);}});}
      catch {this.transaction(()=>{const current=this.get('outbox',item.id);if(current.status==='processing'){current.status='failed';current.lastError='Delivery adapter failed; details withheld to protect participant data.';current.nextAttemptAt=current.attempts>=8?null:iso(this.clock()+Math.min(86_400_000,60_000*2**Math.min(current.attempts,10)));this.save('outbox',current);}});}
    }
    return due.length;
  }
  revenue() {
    const orders=this.all('orders');
    const paid=orders.filter(order=>['paid','refunded'].includes(order.status));
    const grossAgorot=paid.reduce((sum,order)=>sum+order.totalAgorot,0);
    const refundedAgorot=paid.filter(order=>order.status==='refunded').reduce((sum,order)=>sum+order.totalAgorot,0);
    const group=key=>{const rows=new Map();for(const order of orders.filter(value=>value.status==='paid')){const date=this.get('dates',order.dateId);const id=key==='dateId'?date.id:date.seminarId;const row=rows.get(id)??{[key]:id,totalAgorot:0,paidCount:0};row.totalAgorot+=order.totalAgorot;row.paidCount++;rows.set(id,row);}return [...rows.values()];};
    return {grossAgorot,refundedAgorot,netAgorot:grossAgorot-refundedAgorot,bySeminar:group('seminarId'),byDate:group('dateId'),simulation:this.mode==='simulation'};
  }
  summary() {return {dates:this.dates(true),coupons:this.coupons(),registrations:this.all('registrations'),revenue:this.revenue(),outbox:this.all('outbox'),orders:this.all('orders').map(order=>({...order,...(order.status==='pending'&&Date.parse(order.holdExpiresAt)<=this.clock()?{status:'expired'}:{})})),auditEvents:this.all('audit_events'),commerce:this.commerce};}
}
