/** Production stays closed until durable storage, provider verification and auth are implemented.
 * Local development commerce runs only in scripts/academy-server.mjs, never ephemeral serverless SQLite.
 */
export default function handler(_req: unknown, res: {setHeader(name:string,value:string):void;status(code:number):{json(value:unknown):void}}) {
  res.setHeader('Cache-Control','no-store');
  res.status(503).json({error:{code:'PAYMENT_UNAVAILABLE',message:'הרכישה אינה פעילה כרגע. אפשר לפנות אלינו לקבלת מידע.'}});
}
